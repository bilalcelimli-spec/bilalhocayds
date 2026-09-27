import Link from "next/link";
import { useTranslations } from "next-intl";

type MockExamResultProps = {
  attemptId: string;
  examSlug: string;
  lessonPriceLabel: string;
  aiExplanationEnabled: boolean;
  result: {
    deliveryMode?: "STANDARD" | "ADAPTIVE";
    correctCount: number;
    incorrectCount: number;
    blankCount: number;
    netScore: number | null;
    accuracyPercentage: number | null;
    strongestSection: string | null;
    weakestSection: string | null;
    answers: Array<{
      id: string;
      number: number;
      section: string;
      prompt: string;
      correctAnswer: string;
      selectedAnswer: string | null;
      isCorrect: boolean | null;
    }>;
    adaptiveSummary?: {
      skillType: string;
      topicTheme: string;
      finalLevel: string;
      finalConfidence: number;
      history: Array<{ questionId: string; questionNumber: number; level: string; correct: boolean | null }>;
      lastDecision: Record<string, unknown> | null;
    } | null;
  };
  previewMode?: boolean;
};

export function MockExamResult({
  attemptId,
  examSlug,
  lessonPriceLabel,
  aiExplanationEnabled,
  result,
  previewMode = false,
}: MockExamResultProps) {
  const t = useTranslations("examResult");
  const incorrectQuestions = result.answers.filter((question) => question.selectedAnswer !== question.correctAnswer);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">{t("summary")}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[
            ["Net", String(result.netScore ?? 0)],
            [t("correct"), String(result.correctCount)],
            [t("wrong"), String(result.incorrectCount)],
            [t("blank"), String(result.blankCount)],
            [t("accuracy"), t("percent", { value: Math.round(result.accuracyPercentage ?? 0) })],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>
        {result.deliveryMode === "ADAPTIVE" && result.adaptiveSummary ? (
          <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-50">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{t("adaptiveJourney")}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <span>{t("skill", { skill: result.adaptiveSummary.skillType })}</span>
              <span>{t("finalLevel", { level: result.adaptiveSummary.finalLevel })}</span>
              <span>{t("confidence", { percent: Math.round(result.adaptiveSummary.finalConfidence * 100) })}</span>
              <span>{t("theme", { theme: result.adaptiveSummary.topicTheme })}</span>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">{t("wrongReview")}</p>
              <h2 className="mt-2 text-2xl font-black text-white">{t("wrongTitle")}</h2>
            </div>
            {previewMode ? null : (
              <Link href={`/exam/${examSlug}/attempt/${attemptId}/review`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10">
                {t("openReview")}
              </Link>
            )}
          </div>

          <div className="mt-5 space-y-4">
            {incorrectQuestions.length > 0 ? (
              incorrectQuestions.map((question) => (
                <div key={question.id} className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{t("question", { number: question.number, section: question.section })}</p>
                    <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
                      {question.selectedAnswer ?? t("blank")} → {question.correctAnswer}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">{question.prompt}</p>
                  {previewMode ? null : (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {aiExplanationEnabled ? (
                        <Link href={`/exam/${examSlug}/attempt/${attemptId}/review`} className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/15">
                          {t("seeAi")}
                        </Link>
                      ) : null}
                      <Link href={`/exam/${examSlug}/book-review/${attemptId}`} className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200">
                        {t("bookReview")}
                      </Link>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                {t("noMistakes")}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">{t("insight")}</p>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              <p><span className="font-semibold text-white">{t("strongest")}</span> {result.strongestSection ?? t("none")}</p>
              <p><span className="font-semibold text-white">{t("weakest")}</span> {result.weakestSection ?? t("none")}</p>
              <p>{t("genericTip")}</p>
              {result.deliveryMode === "ADAPTIVE" && result.adaptiveSummary ? (
                <p>{t("adaptiveClosed", { level: result.adaptiveSummary.finalLevel, percent: Math.round(result.adaptiveSummary.finalConfidence * 100) })}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[32px] border border-amber-500/20 bg-amber-500/10 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">{t("premiumReview")}</p>
            <h3 className="mt-2 text-2xl font-black text-white">{t("premiumTitle")}</h3>
            <p className="mt-3 text-sm leading-7 text-amber-50/90">{t("premiumText")}</p>
            <p className="mt-4 text-3xl font-black text-white">{lessonPriceLabel}</p>
            {previewMode ? null : (
              <Link href={`/exam/${examSlug}/book-review/${attemptId}`} className="mt-5 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
                {t("openBooking")}
              </Link>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
