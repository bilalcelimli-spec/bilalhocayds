"use client";

import { useMemo, useState } from "react";

type ReaderQuestion = {
  prompt: string;
  options: string[];
  answer: string;
};

type ReaderPassage = {
  source: string;
  category: string;
  title: string;
  passage: string;
  keyVocabulary: string[];
};

type AiArticleReaderProps = {
  passage: ReaderPassage;
  generatedAt: string;
  wordMeanings: Record<string, string>;
};

type TabId = "activities" | "words" | "notes";

function normalizeWord(value: string) {
  return value.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
}

function getWordCount(text: string) {
  return text
    .split(/\s+/)
    .map((part) => normalizeWord(part))
    .filter(Boolean).length;
}

function createGapFillQuestions(passage: string, keyVocabulary: string[]) {
  const sentences = passage
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const selectedSentences = sentences.slice(0, Math.min(3, sentences.length));

  return selectedSentences.map((sentence, index) => {
    const answer = keyVocabulary[index % keyVocabulary.length] ?? "";
    const pattern = new RegExp(`\\b${answer}\\b`, "i");
    const prompt = answer ? sentence.replace(pattern, "________") : sentence;

    const distractors = keyVocabulary
      .filter((word) => word !== answer)
      .slice(0, 3);

    return {
      prompt,
      options: [answer, ...distractors].filter(Boolean),
      answer,
    } satisfies ReaderQuestion;
  });
}

export function AiArticleReader({ passage, generatedAt, wordMeanings }: AiArticleReaderProps) {
  const [activeTab, setActiveTab] = useState<TabId>("activities");
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [note, setNote] = useState("");

  const highlightedWords = useMemo(() => {
    return new Set(passage.keyVocabulary.map((item) => normalizeWord(item)));
  }, [passage.keyVocabulary]);

  const tokens = useMemo(() => passage.passage.split(/(\s+)/), [passage.passage]);
  const questionSet = useMemo(
    () => createGapFillQuestions(passage.passage, passage.keyVocabulary),
    [passage.passage, passage.keyVocabulary]
  );

  const wordCount = useMemo(() => getWordCount(passage.passage), [passage.passage]);

  const onWordClick = (value: string) => {
    const normalized = normalizeWord(value);
    if (!normalized) {
      return;
    }

    setSavedWords((current) => {
      if (current.includes(normalized)) {
        return current;
      }
      return [...current, normalized];
    });
  };

  const onAnswerSelect = (questionIndex: number, option: string) => {
    setSelectedAnswers((current) => ({
      ...current,
      [questionIndex]: option,
    }));
  };

  return (
    <div className="grid gap-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(0,2fr)_360px]">
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1">{passage.category}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{passage.source}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">~{Math.max(3, Math.round(wordCount / 110))} dk okuma</span>
        </div>

        <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950">{passage.title}</h2>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <p>{new Date(generatedAt).toLocaleDateString("tr-TR")}</p>
          <p>{wordCount} kelime</p>
          <p>{highlightedWords.size} hedef kelime</p>
        </div>

        <div className="mt-6 border-y border-slate-200 py-6">
          <p className="text-lg leading-9 text-slate-800">
            {tokens.map((token, index) => {
              if (/^\s+$/.test(token)) {
                return <span key={`${token}-${index}`}>{token}</span>;
              }

              const normalized = normalizeWord(token);
              const isHighlighted = normalized && highlightedWords.has(normalized);

              if (!isHighlighted) {
                return <span key={`${token}-${index}`}>{token}</span>;
              }

              return (
                <button
                  key={`${token}-${index}`}
                  type="button"
                  onClick={() => onWordClick(token)}
                  className="mx-0.5 rounded-md border-b border-dashed border-fuchsia-500/60 bg-fuchsia-50 px-1 text-fuchsia-800 transition hover:bg-fuchsia-100"
                  title="Add to my words"
                >
                  {token}
                </button>
              );
            })}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-fuchsia-500" /> Highlighted target word
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Track it in My Words
          </span>
        </div>
      </div>

      <aside className="border-l border-slate-200 bg-slate-50 p-5">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-1 text-xs font-semibold text-slate-500">
          <button
            type="button"
            onClick={() => setActiveTab("activities")}
            className={`rounded-xl px-2 py-2 transition ${activeTab === "activities" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
          >
            Activities
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("words")}
            className={`rounded-xl px-2 py-2 transition ${activeTab === "words" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
          >
            My Words
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`rounded-xl px-2 py-2 transition ${activeTab === "notes" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
          >
            Notes
          </button>
        </div>

        {activeTab === "activities" && (
          <div className="mt-4 space-y-4">
            {questionSet.map((question, index) => {
              const selected = selectedAnswers[index];
              const isCorrect = selected === question.answer;

              return (
                <div key={`${question.prompt}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">Gap Fill</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{question.prompt}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => onAnswerSelect(index, option)}
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${selected === option ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {selected && (
                    <p className={`mt-2 text-xs font-semibold ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                      {isCorrect ? "Correct" : `Correct answer: ${question.answer}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "words" && (
          <div className="mt-4 space-y-3">
            {savedWords.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                Click the highlighted words in the passage to build your personal word list.
              </div>
            )}

            {savedWords.map((word) => (
              <div key={word} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-bold uppercase tracking-wide text-slate-800">{word}</p>
                <p className="mt-1 text-xs text-slate-600">{wordMeanings[word] ?? "Meaning not available in today's list"}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">Reading Notes</p>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-3 h-48 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-fuchsia-400"
              placeholder="Write the main idea, supporting details, and useful new vocabulary here..."
            />
            <p className="mt-2 text-xs text-slate-500">Note length: {note.trim().length} characters</p>
          </div>
        )}
      </aside>
    </div>
  );
}