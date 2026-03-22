import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { ReviewBookingCheckout } from "@/src/components/exam/review-booking-checkout";
import { getExamAttemptResult } from "@/src/lib/exam-attempts";
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
  const canSellReview = Boolean(exam.lessonReviewPrice && exam.lessonReviewPrice > 0);

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
            </div>
          ) : null}
        </section>

        {canSellReview ? (
          <ReviewBookingCheckout
            attemptId={attemptId}
            examTitle={exam.title}
            amount={exam.lessonReviewPrice ?? 0}
            currency={exam.lessonCurrency ?? "TRY"}
            incorrectCount={result.incorrectCount + result.blankCount}
            initialFullName={session.user.name ?? ""}
            initialEmail={session.user.email ?? ""}
          />
        ) : (
          <aside className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] text-sm leading-7 text-zinc-300">
            Bu sınav için lesson review satışı henüz aktif değil.
          </aside>
        )}
      </div>
    </DashboardShell>
  );
}