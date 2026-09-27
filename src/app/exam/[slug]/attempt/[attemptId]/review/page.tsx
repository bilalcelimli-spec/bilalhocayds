import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { getExamFlowNavItems, getPanelRoleLabel } from "@/src/lib/panel-nav";
import { getExamAttemptResult } from "@/src/lib/exam-attempts";
import { getSectionStrategy } from "@/src/lib/exam-recommendation";

type PageProps = { params: Promise<{ slug: string; attemptId: string }> };

export default async function MockExamReviewPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { slug, attemptId } = await params;
  const result = await getExamAttemptResult(session.user.id, attemptId).catch(() => null);
  if (!result || result.exam.slug !== slug) notFound();

  const [t, tStrategy, examNav, roleLabel] = await Promise.all([
    getTranslations("examFlow"),
    getTranslations("examStrategy"),
    getExamFlowNavItems(),
    getPanelRoleLabel(session.user.role),
  ]);

  return (
    <DashboardShell navItems={examNav} roleLabel={roleLabel} title={t("review.title")} subtitle={t("review.subtitle")} userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-4">
        {result.answers.map((question) => {
          const explanation = question.explanationDetail;

          return (
          <div key={question.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{t("review.question", { number: question.number, section: question.section })}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${question.selectedAnswer === question.correctAnswer ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                {question.selectedAnswer === question.correctAnswer ? t("review.correct") : t("review.wrong", { answer: question.correctAnswer })}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">{question.prompt}</p>
            <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">{t("review.aiExplanation")}</p>
              <p className="mt-3 text-sm font-semibold text-white">{explanation?.shortReason ?? t("review.correctAnswer", { answer: question.correctAnswer })}</p>
              <p className="mt-2 text-sm leading-7 text-zinc-200">{explanation?.detailed ?? question.explanation ?? t("review.noExplanation")}</p>
              <p className="mt-3 text-sm text-cyan-100">{t("review.examTip", { tip: explanation?.examTip ?? tStrategy(getSectionStrategy(question.sectionType)) })}</p>
            </div>
          </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}