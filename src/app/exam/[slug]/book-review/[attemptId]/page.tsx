import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { ReviewBookingCheckout } from "@/src/components/exam/review-booking-checkout";
import { getExamAttemptResult } from "@/src/lib/exam-attempts";
import { getReviewFollowUpActionLabel, getReviewSlotOptions, parseReviewBookingNotes, updateStudentReviewBookingPreference } from "@/src/lib/exam-review-bookings";
import { formatCurrency } from "@/src/lib/exam-workspace";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ slug: string; attemptId: string }> };

export default async function MockExamBookReviewPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { slug, attemptId } = await params;
  const result = await getExamAttemptResult(session.user.id, attemptId).catch(() => null);
  if (!result || result.exam.slug !== slug) notFound();

  const [exam, latestBooking] = await Promise.all([
    prisma.examModule.findUnique({
      where: { id: result.exam.id },
      select: {
        title: true,
        lessonReviewPrice: true,
        lessonCurrency: true,
      },
    }),
    prisma.examReviewBooking.findFirst({
      where: {
        attemptId,
        studentId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        teacher: {
          select: {
            name: true,
            email: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  if (!exam) notFound();

  const reviewPriceLabel = formatCurrency(exam.lessonReviewPrice, exam.lessonCurrency);
  const examId = result.exam.id;
  const slotOptions = getReviewSlotOptions();
  const parsedNotes = parseReviewBookingNotes(latestBooking?.lessonNotes);
  const canSellReview = Boolean(exam.lessonReviewPrice && exam.lessonReviewPrice > 0);
  const latestPaymentStatus = latestBooking?.payments[0]?.status ?? null;
  const canUpdatePreference = Boolean(
    latestBooking &&
      latestPaymentStatus === "PAID" &&
      !latestBooking.teacher &&
      !["COMPLETED", "CANCELLED", "REFUNDED"].includes(latestBooking.status),
  );

  async function updatePreferenceAction(formData: FormData) {
    "use server";

    const actionSession = await getServerSession(authOptions);
    if (!actionSession?.user?.id) {
      redirect("/login");
    }

    const bookingId = String(formData.get("bookingId") ?? "").trim();
    const scheduledStartAt = String(formData.get("scheduledStartAt") ?? "").trim();
    const lessonNotes = String(formData.get("lessonNotes") ?? "").trim();

    if (!bookingId) {
      return;
    }

    await updateStudentReviewBookingPreference({
      bookingId,
      userId: actionSession.user.id,
      scheduledStartAt: scheduledStartAt || null,
      studentNote: lessonNotes || null,
    });

    revalidatePath(`/exam/${slug}/book-review/${attemptId}`);
    revalidatePath(`/admin/exams/${examId}/bookings`);
    revalidatePath("/teacher");
  }

  return (
    <DashboardShell navItems={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sınav", href: "/exam" }]} roleLabel="Öğrenci Paneli" title="30 Dakikalık Review Lesson" subtitle="Attempt-linked ödeme ve slot seçimi" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Lesson Value</p>
          <h2 className="mt-2 text-2xl font-black text-white">Yanlışlarını Bilal Hoca ile birebir incele</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
            <li>Bu denemedeki yanlışların ders öncesi otomatik olarak öğretmen paneline aktarılır.</li>
            <li>Reading inference, grammar trap ve vocabulary choice hataları odaklı analiz edilir.</li>
            <li>Ders sonrası kısa öğretmen notu bırakılabilir.</li>
          </ul>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["Duration", "30 dakika"],
              ["Wrong questions", String(result.incorrectCount + result.blankCount)],
              ["Price", reviewPriceLabel],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                <p className="mt-2 text-lg font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          {latestBooking ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <p className="font-semibold text-white">Mevcut booking durumu: {latestBooking.status}</p>
              <p className="mt-2">Son ödeme kaydı: {latestBooking.payments[0]?.status ?? "Henüz yok"}</p>
              {latestBooking.scheduledStartAt ? <p className="mt-2">Planlanan slot: {latestBooking.scheduledStartAt.toLocaleString("tr-TR")}</p> : null}
              {latestBooking.teacher ? <p className="mt-2">Öğretmen: {latestBooking.teacher.name ?? latestBooking.teacher.email}</p> : null}
              {parsedNotes.studentNote ? <p className="mt-2">Booking notu: {parsedNotes.studentNote}</p> : null}
              {latestBooking.status === "COMPLETED" && parsedNotes.lessonSummary ? <p className="mt-2">Ders özeti: {parsedNotes.lessonSummary}</p> : null}
              {latestBooking.status === "COMPLETED" && parsedNotes.followUpAction ? <p className="mt-2">Takip aksiyonu: {getReviewFollowUpActionLabel(parsedNotes.followUpAction)}</p> : null}
            </div>
          ) : null}
        </section>

        {canUpdatePreference && latestBooking ? (
          <form action={updatePreferenceAction} className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <input type="hidden" name="bookingId" value={latestBooking.id} />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Slot Tercihi</p>
            <h3 className="mt-3 text-2xl font-black text-white">Review randevunu guncelle</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-300">Odemen tamamlandigi icin tercih ettigin saati ve ek notunu admin tarafina iletebilirsin.</p>
            <div className="mt-5 grid gap-3">
              <select
                name="scheduledStartAt"
                defaultValue={latestBooking.scheduledStartAt ? latestBooking.scheduledStartAt.toISOString().slice(0, 16) : ""}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              >
                <option value="">Uygun slot sec...</option>
                {slotOptions.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
              <textarea
                name="lessonNotes"
                rows={4}
                defaultValue={parsedNotes.studentNote ?? ""}
                placeholder="Ek not veya odaklanilacak konu"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </div>
            <button type="submit" className="mt-5 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
              Tercihimi guncelle
            </button>
          </form>
        ) : canSellReview ? (
          <ReviewBookingCheckout
            attemptId={attemptId}
            examTitle={exam.title}
            amount={exam.lessonReviewPrice ?? 0}
            currency={exam.lessonCurrency ?? "TRY"}
            incorrectCount={result.incorrectCount + result.blankCount}
            initialFullName={session.user.name ?? ""}
            initialEmail={session.user.email ?? ""}
            slotOptions={slotOptions}
            initialPreferredSlot={latestBooking?.scheduledStartAt ? latestBooking.scheduledStartAt.toISOString().slice(0, 16) : ""}
            initialBookingNote={parsedNotes.studentNote ?? ""}
          />
        ) : latestBooking ? (
          <aside className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] text-sm leading-7 text-zinc-300">
            Booking talebin olusturulmus durumda. Ogretmen atamasi yapildiginda burada kesin slot bilgisini goreceksin.
          </aside>
        ) : (
          <aside className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] text-sm leading-7 text-zinc-300">
            Bu sınav için lesson review satışı henüz aktif değil.
          </aside>
        )}
      </div>
    </DashboardShell>
  );
}