"use client";

import { useMemo, useState } from "react";
import { BookMarked, FileText, Highlighter, NotebookPen, Star, X } from "lucide-react";

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

const TAB_CONFIG: { id: TabId; icon: typeof FileText; label: string }[] = [
	{ id: "activities", icon: FileText, label: "Aktiviteler" },
	{ id: "words", icon: BookMarked, label: "Kelimelerim" },
	{ id: "notes", icon: NotebookPen, label: "Notlarım" },
];

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
		[passage.passage, passage.keyVocabulary],
	);

	const wordCount = useMemo(() => getWordCount(passage.passage), [passage.passage]);
	const readingMinutes = Math.max(1, Math.round(wordCount / 200));

	const onWordClick = (value: string) => {
		const normalized = normalizeWord(value);
		if (!normalized) return;
		setSavedWords((current) => current.includes(normalized) ? current : [...current, normalized]);
	};

	const onAnswerSelect = (questionIndex: number, option: string) => {
		setSelectedAnswers((current) => ({ ...current, [questionIndex]: option }));
	};

	return (
		<div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.5)] lg:grid lg:grid-cols-[minmax(0,2.2fr)_340px]">
			{/* ── left: article ── */}
			<div className="p-7 md:p-10">
				{/* meta badges */}
				<div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
					<span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">{passage.category}</span>
					<span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{passage.source}</span>
					<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
						<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
						~{readingMinutes} dk okuma
					</span>
				</div>

				<h2 className="mt-4 text-3xl font-black leading-tight text-slate-950">{passage.title}</h2>

				<div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-400">
					<span>{new Date(generatedAt).toLocaleDateString("tr-TR")}</span>
					<span>{wordCount} kelime</span>
					<span className="flex items-center gap-1.5 text-fuchsia-600">
						<Highlighter size={13} />
						{highlightedWords.size} hedef kelime işaretlendi
					</span>
				</div>

				<div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-sky-700">
					<strong>İpucu:</strong> Mor ile vurgulanan kelimelere tıklayarak &ldquo;Kelimelerim&rdquo; listenize ekleyebilirsiniz.
				</div>

				{/* passage text */}
				<div className="mt-6 border-y border-slate-100 py-6">
					<p className="text-[1.05rem] leading-[2] tracking-[0.01em] text-slate-800">
						{tokens.map((token, index) => {
							if (/^\s+$/.test(token)) {
								return <span key={`ws-${index}`}>{token}</span>;
							}

							const normalized = normalizeWord(token);
							const isHighlighted = normalized && highlightedWords.has(normalized);

							if (!isHighlighted) {
								return <span key={`t-${index}`}>{token}</span>;
							}

							return (
								<button
									key={`h-${index}`}
									type="button"
									onClick={() => onWordClick(token)}
									className="mx-0.5 cursor-pointer rounded-md border-b-2 border-fuchsia-400 bg-fuchsia-50 px-1 py-0.5 font-semibold text-fuchsia-800 transition-all hover:bg-fuchsia-100 hover:shadow-[0_0_0_2px_rgba(192,38,211,0.15)]"
									title="Kelime listeme ekle"
								>
									{token}
								</button>
							);
						})}
					</p>
				</div>

				{/* legend */}
				<div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-500">
					<span className="flex items-center gap-1.5">
						<span className="inline-block h-3 w-3 rounded-sm bg-fuchsia-200" />
						Vurgulanan hedef kelime
					</span>
					<span className="flex items-center gap-1.5">
						<Star size={12} className="text-amber-500" />
						Tıkla &rarr; Kelimelerim listesine ekle
					</span>
				</div>
			</div>

			{/* ── right: toolbar ── */}
			<div className="border-t border-slate-100 bg-slate-50 p-5 lg:border-l lg:border-t-0">
				{/* tab bar */}
				<div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1">
					{TAB_CONFIG.map(({ id, icon: Icon, label }) => (
						<button
							key={id}
							type="button"
							onClick={() => setActiveTab(id)}
							className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-all ${
								activeTab === id
									? "bg-slate-900 text-white shadow-sm"
									: "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
							}`}
						>
							<Icon size={12} />
							{label}
						</button>
					))}
				</div>

				{/* tab: activities */}
				{activeTab === "activities" && (
					<div className="mt-4 space-y-4">
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Gap-Fill Aktiviteleri</p>
						{questionSet.map((question, index) => {
							const selected = selectedAnswers[index];
							const isCorrect = selected === question.answer;

							return (
								<div key={`q-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
									<div className="flex items-center justify-between gap-2">
										<span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
											{index + 1}
										</span>
										<span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
											Gap Fill
										</span>
									</div>
									<p className="mt-2.5 text-sm leading-6 text-slate-700">{question.prompt}</p>
									<div className="mt-3 grid grid-cols-2 gap-2">
										{question.options.map((option) => (
											<button
												key={option}
												type="button"
												onClick={() => onAnswerSelect(index, option)}
												className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-all ${
													selected === option
														? isCorrect
															? "border-emerald-400 bg-emerald-50 text-emerald-800"
															: "border-rose-400 bg-rose-50 text-rose-800"
														: "border-slate-200 bg-slate-50 text-slate-600 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-800"
												}`}
											>
												{option}
											</button>
										))}
									</div>
									{selected && (
										<div className={`mt-2.5 rounded-xl px-3 py-2 text-xs font-semibold ${isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
											{isCorrect ? "✓ Doğru!" : `✗ Doğru cevap: ${question.answer}`}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}

				{/* tab: my words */}
				{activeTab === "words" && (
					<div className="mt-4 space-y-3">
						<div className="flex items-center justify-between">
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
								Kelimelerim ({savedWords.length})
							</p>
							{savedWords.length > 0 && (
								<button
									type="button"
									onClick={() => setSavedWords([])}
									className="text-xs text-slate-400 transition hover:text-red-500"
								>
									Temizle
								</button>
							)}
						</div>
						{savedWords.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-400">
								Pasajdaki mor kelimelerden birini tıklayın ve buraya ekleyin.
							</div>
						) : (
							savedWords.map((word) => (
								<div key={word} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
									<div className="flex-1 min-w-0">
										<p className="text-sm font-black uppercase tracking-wide text-slate-900">{word}</p>
										<p className="mt-1 text-xs leading-5 text-slate-500">
											{wordMeanings[word] ?? "Anlam bugünün listesinde bulunamadı"}
										</p>
									</div>
									<button
										type="button"
										onClick={() => setSavedWords((s) => s.filter((w) => w !== word))}
										className="mt-0.5 flex-shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
									>
										<X size={12} />
									</button>
								</div>
							))
						)}
					</div>
				)}

				{/* tab: notes */}
				{activeTab === "notes" && (
					<div className="mt-4">
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">Okuma Notlarım</p>
						<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
							<textarea
								value={note}
								onChange={(e) => setNote(e.target.value)}
								className="h-52 w-full resize-none rounded-2xl px-4 py-3 text-sm leading-7 text-slate-700 outline-none focus:ring-2 focus:ring-sky-300"
								placeholder="Ana fikri, destekleyici detayları ve dikkatini çeken yeni kelimeleri buraya yaz..."
							/>
						</div>
						<div className="mt-2 flex items-center justify-between px-1">
							<p className="text-xs text-slate-400">{note.trim().length} karakter</p>
							{note.trim().length > 0 && (
								<button
									type="button"
									onClick={() => setNote("")}
									className="text-xs text-slate-400 hover:text-red-500 transition"
								>
									Temizle
								</button>
							)}
						</div>
						<div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
							<p className="text-xs font-semibold text-sky-700">Not alma ipuçları</p>
							<ul className="mt-2 space-y-1 text-xs text-sky-600">
								<li>→ Ana fikri 1-2 cümleyle özetle</li>
								<li>→ Öğrendiğin yeni kelimeleri yaz</li>
								<li>→ Sınav sorusu gelebilecek noktaları işaretle</li>
							</ul>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}


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