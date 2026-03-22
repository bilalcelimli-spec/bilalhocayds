"use client";

import { useState } from "react";

type GrammarActivity = {
  id: string;
  title: string;
  prompt: string;
  answer: string;
  explanation: string;
  testedPoint: string;
  options?: string[];
  sampleResponse?: string;
};

type GrammarActivityGroup = {
  label: string;
  items: GrammarActivity[];
};

type GrammarPracticePanelProps = {
  groups: GrammarActivityGroup[];
};

export function GrammarPracticePanel({ groups }: GrammarPracticePanelProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [revealedItems, setRevealedItems] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.label} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-stone-950">{group.label}</h3>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {group.items.length} tasks
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {group.items.map((item) => {
              const hasOptions = Array.isArray(item.options) && item.options.length > 0;
              const selectedAnswer = selectedAnswers[item.id] ?? "";
              const isRevealed = Boolean(revealedItems[item.id]);
              const isCorrect = hasOptions
                ? selectedAnswer.trim().toLowerCase() === item.answer.trim().toLowerCase()
                : false;

              return (
                <div key={item.id} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-stone-900">{item.title}</p>
                    <span className="text-xs text-stone-500">{item.testedPoint}</span>
                  </div>

                  <p className="mt-2 text-sm leading-7 text-stone-700">{item.prompt}</p>

                  {hasOptions ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {item.options?.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSelectedAnswers((current) => ({ ...current, [item.id]: option }))}
                          className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                            selectedAnswer === option
                              ? "border-sky-400 bg-sky-50 text-sky-950"
                              : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={textAnswers[item.id] ?? ""}
                      onChange={(event) => setTextAnswers((current) => ({ ...current, [item.id]: event.target.value }))}
                      rows={3}
                      placeholder="Write your answer here"
                      className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-sky-400"
                    />
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRevealedItems((current) => ({ ...current, [item.id]: !current[item.id] }))}
                      className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
                    >
                      {isRevealed ? "Hide Feedback" : hasOptions ? "Check Answer" : "Reveal Reference"}
                    </button>
                    {hasOptions && isRevealed ? (
                      <span className={`text-sm font-semibold ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                        {isCorrect ? "Correct" : "Review the reference answer."}
                      </span>
                    ) : null}
                  </div>

                  {isRevealed ? (
                    <div className="mt-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-stone-900">Reference Answer</p>
                      <p className="mt-2 text-sm leading-7 text-stone-700">{item.answer}</p>
                      <p className="mt-2 text-xs leading-6 text-stone-500">{item.explanation}</p>
                      {item.sampleResponse ? (
                        <p className="mt-2 text-xs leading-6 text-amber-700">Sample response: {item.sampleResponse}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}