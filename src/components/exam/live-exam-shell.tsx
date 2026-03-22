"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { formatDurationLabel } from "@/src/lib/exam-workspace";

type LiveExamShellProps = {
  attemptId: string;
  examSlug: string;
  title: string;
  totalQuestions: number;
  remainingSeconds: number;
  questions: Array<{
    id: string;
    number: number;
    section: string;
    prompt: string;
    options: string[];
    selectedAnswer: string | null;
    isFlaggedForReview: boolean;
  }>;
};

export function LiveExamShell({
  attemptId,
  examSlug,
  title,
  totalQuestions,
  remainingSeconds: initialRemainingSeconds,
  questions,
}: LiveExamShellProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    Object.fromEntries(questions.map((question) => [question.id, question.selectedAnswer ?? ""])),
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>(
    Object.fromEntries(questions.map((question) => [question.id, question.isFlaggedForReview])),
  );
  const [submitPending, setSubmitPending] = useState(false);
  const [savePendingQuestionId, setSavePendingQuestionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const hasAutoSubmittedRef = useRef(false);

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = useMemo(() => Object.values(selectedAnswers).filter(Boolean).length, [selectedAnswers]);

  async function persistAnswer(questionId: string, payload: { selectedAnswer?: string | null; isFlaggedForReview?: boolean }) {
    setSavePendingQuestionId(questionId);
    setError("");

    const response = await fetch(`/api/exam-attempts/${attemptId}/answers`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answers: [{ questionId, ...payload }],
      }),
    });

    setSavePendingQuestionId(null);

    if (response.ok) {
      return;
    }

    const data = (await response.json()) as { error?: string };
    if (response.status === 409) {
      router.push(`/exam/${examSlug}/attempt/${attemptId}/result`);
      return;
    }

    setError(data.error ?? "Cevap kaydedilemedi.");
  }

  async function submitAttempt(auto = false) {
    if (submitPending) {
      return;
    }

    setSubmitPending(true);
    setError("");

    const response = await fetch(`/api/exam-attempts/${attemptId}/submit`, {
      method: "POST",
    });

    setSubmitPending(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? (auto ? "Sinav otomatik gonderilemedi." : "Sinav gonderilemedi."));
      return;
    }

    router.push(`/exam/${examSlug}/attempt/${attemptId}/result`);
  }

  useEffect(() => {
    if (remainingSeconds <= 0) {
      if (!hasAutoSubmittedRef.current) {
        hasAutoSubmittedRef.current = true;
        void submitAttempt(true);
      }

      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remainingSeconds]);

  return (
    <div className="space-y-6">
      <header className="sticky top-4 z-20 rounded-[28px] border border-white/10 bg-[rgba(18,20,28,0.95)] px-6 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Live Attempt</p>
            <h1 className="mt-2 text-2xl font-black text-white">{title}</h1>
            <p className="mt-1 text-sm text-zinc-400">Attempt ID: {attemptId} · Autosave aktif · OMR paneli sağda sabit</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200">{answeredCount}/{totalQuestions} işaretlendi</div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">Kalan süre: {formatDurationLabel(remainingSeconds)}</div>
            <button
              type="button"
              onClick={() => void submitAttempt(false)}
              disabled={submitPending}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitPending ? "Gönderiliyor..." : "Sınavı Gönder"}
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{currentQuestion.section}</p>
              <h2 className="mt-2 text-xl font-black text-white">Soru {currentQuestion.number}</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextFlagState = !flaggedQuestions[currentQuestion.id];
                setFlaggedQuestions((current) => ({
                  ...current,
                  [currentQuestion.id]: nextFlagState,
                }));
                void persistAnswer(currentQuestion.id, { isFlaggedForReview: nextFlagState });
              }}
              className={`rounded-2xl border px-4 py-2 text-sm transition ${
                flaggedQuestions[currentQuestion.id]
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              {flaggedQuestions[currentQuestion.id] ? "Review işaretli" : "Review için işaretle"}
            </button>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-6">
            <p className="text-base leading-8 text-zinc-100">{currentQuestion.prompt}</p>

            <div className="mt-6 grid gap-3">
              {currentQuestion.options.map((option) => {
                const letter = option.charAt(0);
                const isSelected = selectedAnswers[currentQuestion.id] === letter;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedAnswers((current) => ({
                        ...current,
                        [currentQuestion.id]: letter,
                      }));
                      void persistAnswer(currentQuestion.id, { selectedAnswer: letter });
                    }}
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                        : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                      {letter}
                    </span>
                    <span className="text-sm leading-7">{option.slice(3)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex((current) => Math.max(current - 1, 0))}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
            >
              Önceki
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedAnswers((current) => ({
                    ...current,
                    [currentQuestion.id]: "",
                  }));
                  void persistAnswer(currentQuestion.id, { selectedAnswer: null });
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
              >
                Cevabı temizle
              </button>
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((current) => Math.min(current + 1, questions.length - 1))}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Sonraki
              </button>
            </div>
          </div>
        </div>

        <aside className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Optical Sheet</p>
          <p className="mt-2 text-sm text-zinc-400">Tıkla ve soruya atla. Cevaplanan, boş ve review işaretli sorular ayrı görünür.</p>

          <div className="mt-5 grid grid-cols-5 gap-2">
            {Array.from({ length: totalQuestions }, (_, index) => {
              const number = index + 1;
              const question = questions.find((item) => item.number === number);
              const answer = question ? selectedAnswers[question.id] : "";
              const flagged = question ? flaggedQuestions[question.id] : false;
              const isCurrent = currentQuestion.number === number;

              return (
                <button
                  key={number}
                  type="button"
                  onClick={() => {
                    const targetIndex = questions.findIndex((item) => item.number === number);
                    if (targetIndex >= 0) {
                      setCurrentQuestionIndex(targetIndex);
                    }
                  }}
                  className={`relative rounded-xl border px-0 py-2 text-xs transition ${
                    isCurrent
                      ? "border-white bg-white text-black"
                      : answer
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08]"
                  }`}
                >
                  {number}
                  {flagged ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400" /> : null}
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {savePendingQuestionId ? (
        <p className="text-right text-xs text-zinc-500">Soru kaydediliyor: {savePendingQuestionId}</p>
      ) : null}
    </div>
  );
}
