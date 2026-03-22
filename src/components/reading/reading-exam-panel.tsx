"use client";

import { useMemo, useState } from "react";

type ReadingExamQuestion = {
  id: string;
  type: "main-idea" | "detail" | "inference" | "vocabulary" | "tone";
  question: string;
  skillMeasured: string;
  answer: string;
  explanation: string;
  whyOthersWrong: string[];
  options: string[];
};

type ReadingExamPassage = {
  source: string;
  category: string;
  title: string;
  passage: string;
  summary: string;
  questions: ReadingExamQuestion[];
};

type ReadingExamPanelProps = {
  passages: ReadingExamPassage[];
};

function getWordCount(text: string) {
  return text
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function getOptionLabel(index: number) {
  return String.fromCharCode(65 + index);
}

export function ReadingExamPanel({ passages }: ReadingExamPanelProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const questionList = useMemo(
    () => passages.flatMap((passage) => passage.questions.map((question) => ({ passage, question }))),
    [passages],
  );

  const answeredCount = questionList.filter(({ question }) => Boolean(selectedAnswers[question.id])).length;
  const correctCount = submitted
    ? questionList.filter(({ question }) => selectedAnswers[question.id] === question.answer).length
    : 0;

  const score = questionList.length > 0 ? Math.round((correctCount / questionList.length) * 100) : 0;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Reading Exam Lab</p>
          <h2 className="mt-2 text-2xl font-black text-white">3 pasaj, 15 çoktan seçmeli soru</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
            Her pasaj farklı bir konuya odaklanır. Sorular ana fikir, detay, çıkarım, kelime ve ton analizi dengesini koruyacak şekilde tasarlandı.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
            {answeredCount}/{questionList.length} işaretlendi
          </div>
          {submitted ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
              Skor: %{score}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setSubmitted((current) => !current)}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            {submitted ? "Yanıtları Gizle" : "Cevapları Değerlendir"}
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {passages.map((passage, passageIndex) => (
          <article key={`${passage.title}-${passageIndex}`} className="rounded-3xl border border-white/10 bg-zinc-950/30 p-5">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>{passage.source}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{passage.category}</span>
              <span>{getWordCount(passage.passage)} words</span>
            </div>

            <h3 className="mt-3 text-xl font-black text-white">Passage {passageIndex + 1}: {passage.title}</h3>
            <p className="mt-3 text-sm leading-8 text-slate-200">{passage.passage}</p>
            <p className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              Summary: {passage.summary}
            </p>

            <div className="mt-5 space-y-4">
              {passage.questions.map((question, questionIndex) => {
                const selectedAnswer = selectedAnswers[question.id];
                const isCorrect = submitted && selectedAnswer === question.answer;
                const isWrong = submitted && Boolean(selectedAnswer) && selectedAnswer !== question.answer;

                return (
                  <div key={question.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
                        Soru {questionIndex + 1} · {question.type}
                      </p>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {question.skillMeasured}
                      </span>
                    </div>

                    <p className="mt-3 text-base font-semibold leading-7 text-white">{question.question}</p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = selectedAnswer === option;
                        const isAnswer = submitted && question.answer === option;

                        return (
                          <button
                            key={`${question.id}-${option}`}
                            type="button"
                            onClick={() =>
                              setSelectedAnswers((current) => ({
                                ...current,
                                [question.id]: option,
                              }))
                            }
                            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                              isAnswer
                                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                                : isSelected
                                  ? "border-blue-400/40 bg-blue-500/10 text-blue-100"
                                  : "border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]"
                            }`}
                          >
                            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs font-bold">
                              {getOptionLabel(optionIndex)}
                            </span>
                            {option}
                          </button>
                        );
                      })}
                    </div>

                    {submitted ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className={`text-sm font-semibold ${isCorrect ? "text-emerald-300" : isWrong ? "text-rose-300" : "text-amber-300"}`}>
                          {isCorrect
                            ? "Doğru işaretlendi"
                            : isWrong
                              ? `Yanlış. Doğru cevap: ${question.answer}`
                              : `Doğru cevap: ${question.answer}`}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-300">{question.explanation}</p>
                        {question.whyOthersWrong.length > 0 ? (
                          <div className="mt-3 space-y-2 text-xs text-slate-400">
                            {question.whyOthersWrong.map((item) => (
                              <p key={item}>{item}</p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}