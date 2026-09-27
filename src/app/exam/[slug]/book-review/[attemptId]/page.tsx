import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { ReviewBookingCheckout } from "@/src/components/exam/review-booking-checkout";
import { getExamAttemptResult } from "@/src/lib/exam-attempts";
import { getExamFlowNavItems, getPanelRoleLabel } from "@/src/lib/panel-nav";
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
  const [t, formatter, examNav, roleLabel] = await Promise.all([
    getTranslations("bookReview"),
    getFormatter(),
    getExamFlowNavItems(),
    getPanelRoleLabel(session.user.role),
  ]);
  const formatSlot = (date: Date) =>
    formatter.dateTime(date, { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const slotOptions = getReviewSlotOptions(new Date(), formatSlot);
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
    <DashboardShell navItems={examNav} roleLabel={roleLabel} title={t("title")} subtitle={t("subtitle")} userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">{t("valueBadge")}</p>
          <h2 className="mt-2 text-2xl font-black text-white">{t("valueTitle")}</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
            <li>{t("value1")}</li>
            <li>{t("value2")}</li>
            <li>{t("value3")}</li>
          </ul>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              [t("duration"), t("durationValue")],
              [t("wrongQuestions"), String(result.incorrectCount + result.blankCount)],
              [t("price"), reviewPriceLabel],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                <p className="mt-2 text-lg font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          {latestBooking ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <p className="font-semibold text-white">{t("bookingStatus", { status: latestBooking.status })}</p>
              <p className="mt-2">{t("lastPayment", { status: latestBooking.payments[0]?.status ?? t("none") })}</p>
              {latestBooking.scheduledStartAt ? <p className="mt-2">{t("plannedSlot", { slot: formatSlot(latestBooking.scheduledStartAt) })}</p> : null}
              {latestBooking.teacher ? <p className="mt-2">{t("teacher", { name: latestBooking.teacher.name ?? latestBooking.teacher.email })}</p> : null}
              {parsedNotes.studentNote ? <p className="mt-2">{t("bookingNote", { note: parsedNotes.studentNote })}</p> : null}
              {latestBooking.status === "COMPLETED" && parsedNotes.lessonSummary ? <p className="mt-2">{t("lessonSummary", { summary: parsedNotes.lessonSummary })}</p> : null}
              {latestBooking.status === "COMPLETED" && parsedNotes.followUpAction ? <p className="mt-2">{t("followUp", { action: getReviewFollowUpActionLabel(parsedNotes.followUpAction) })}</p> : null}
            </div>
          ) : null}
        </section>

        {canUpdatePreference && latestBooking ? (
          <form action={updatePreferenceAction} className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <input type="hidden" name="bookingId" value={latestBooking.id} />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">{t("prefBadge")}</p>
            <h3 className="mt-3 text-2xl font-black text-white">{t("prefTitle")}</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-300">{t("prefText")}</p>
            <div className="mt-5 grid gap-3">
              <select
                name="scheduledStartAt"
                defaultValue={latestBooking.scheduledStartAt ? latestBooking.scheduledStartAt.toISOString() : ""}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              >
                <option value="">{t("pickSlot")}</option>
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
                placeholder={t("notePlaceholder")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </div>
            <button type="submit" className="mt-5 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
              {t("updatePref")}
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
            initialPreferredSlot={latestBooking?.scheduledStartAt ? latestBooking.scheduledStartAt.toISOString() : ""}
            initialBookingNote={parsedNotes.studentNote ?? ""}
          />
        ) : latestBooking ? (
          <aside className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] text-sm leading-7 text-zinc-300">
            {t("pending")}
          </aside>
        ) : (
          <aside className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] text-sm leading-7 text-zinc-300">
            {t("notAvailable")}
          </aside>
        )}
      </div>
    </DashboardShell>
  );
}