"use client";

import { useState } from "react";

type VocabularyActivity = {
  type:
    | "fill-in-the-blanks"
    | "match-definition"
    | "synonym-selection"
    | "context-meaning"
    | "collocation-completion"
    | "rewrite"
    | "word-formation"
    | "multiple-choice"
    | "mini-translation";
  title: string;
  prompt: string;
  answer: string;
  explanation: string;
  options?: string[];
};

type VocabularyPracticePanelProps = {
  activities: VocabularyActivity[];
};

export function VocabularyPracticePanel({ activities }: VocabularyPracticePanelProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [revealedItems, setRevealedItems] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const hasOptions = Array.isArray(activity.options) && activity.options.length > 0;
        const selectedAnswer = selectedAnswers[index] ?? "";
        const textAnswer = textAnswers[index] ?? "";
        const isRevealed = Boolean(revealedItems[index]);
        const isCorrect = hasOptions
          ? selectedAnswer.trim().toLowerCase() === activity.answer.trim().toLowerCase()
          : false;

        return (
          <div key={`${activity.type}-${activity.prompt}`} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{activity.title}</p>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                {activity.type.replace(/-/g, " ")}
              </span>
            </div>

            <p className="mt-3 text-sm leading-7 text-stone-800">{activity.prompt}</p>

            {hasOptions ? (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {activity.options?.map((option) => {
                  const isSelected = selectedAnswer === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedAnswers((current) => ({ ...current, [index]: option }))}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                        isSelected
                          ? "border-amber-400 bg-amber-50 text-amber-950"
                          : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={textAnswer}
                onChange={(event) => setTextAnswers((current) => ({ ...current, [index]: event.target.value }))}
                rows={3}
                placeholder="Write your answer here"
                className="mt-4 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none focus:border-amber-400"
              />
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setRevealedItems((current) => ({ ...current, [index]: !current[index] }))}
                className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
              >
                {isRevealed ? "Hide Feedback" : hasOptions ? "Check Answer" : "Compare With Sample"}
              </button>
              {hasOptions && isRevealed ? (
                <span className={`text-sm font-semibold ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                  {isCorrect ? "Correct" : "Try again after reviewing the feedback."}
                </span>
              ) : null}
            </div>

            {isRevealed ? (
              <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="text-sm font-semibold text-stone-900">Reference Answer</p>
                <p className="mt-2 text-sm leading-7 text-stone-700">{activity.answer}</p>
                <p className="mt-3 text-xs leading-6 text-stone-500">{activity.explanation}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}