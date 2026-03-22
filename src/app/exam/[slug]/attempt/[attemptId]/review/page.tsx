import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { ensureAttemptExplanationsForUser } from "@/src/lib/exam-explanations";
import { getExamAttemptResult } from "@/src/lib/exam-attempts";

type PageProps = { params: Promise<{ slug: string; attemptId: string }> };

export default async function MockExamReviewPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { slug, attemptId } = await params;
  const [result, explanations] = await Promise.all([
    getExamAttemptResult(session.user.id, attemptId).catch(() => null),
    ensureAttemptExplanationsForUser(session.user.id, attemptId).catch(() => new Map()),
  ]);
  if (!result || result.exam.slug !== slug) notFound();

  return (
    <DashboardShell navItems={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sınav", href: "/exam" }]} roleLabel="Öğrenci Paneli" title="Detailed Review" subtitle="AI explanations and wrong-answer analysis" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-4">
        {result.answers.map((question) => (
          (() => {
            const explanation = explanations.get(question.id);
            return (
          <div key={question.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Soru {question.number} · {question.section}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${question.selectedAnswer === question.correctAnswer ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                {question.selectedAnswer === question.correctAnswer ? "Doğru" : `Yanlış / ${question.correctAnswer}`}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-zinc-300">{question.prompt}</p>
            <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">AI Explanation</p>
              <p className="mt-3 text-sm font-semibold text-white">{explanation?.shortReason ?? `Doğru cevap: ${question.correctAnswer}`}</p>
              <p className="mt-2 text-sm leading-7 text-zinc-200">{explanation?.detailed ?? question.explanation ?? "Bu soru için henüz kayıtlı bir açıklama yok."}</p>
              <p className="mt-3 text-sm text-cyan-100">Exam tip: {explanation?.examTip ?? "Şık seçmeden önce bağlam, anahtar bağlaçlar ve soru kökünü birlikte oku."}</p>
            </div>
          </div>
            );
          })()
        ))}
      </div>
    </DashboardShell>
  );
}