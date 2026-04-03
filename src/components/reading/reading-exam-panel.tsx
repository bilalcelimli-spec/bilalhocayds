"use client";

import { useMemo, useState } from "react";
import { Brain, CheckCircle2, ChevronDown, ChevronUp, Circle, XCircle } from "lucide-react";

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

const QUESTION_TYPE_COLOR: Record<string, string> = {
	"main-idea": "bg-sky-500/10 text-sky-400 border-sky-500/20",
	"detail": "bg-blue-500/10 text-blue-400 border-blue-500/20",
	"inference": "bg-violet-500/10 text-violet-400 border-violet-500/20",
	"vocabulary": "bg-amber-500/10 text-amber-400 border-amber-500/20",
	"tone": "bg-rose-500/10 text-rose-400 border-rose-500/20",
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
	const [expandedPassages, setExpandedPassages] = useState<Record<number, boolean>>({});

	const questionList = useMemo(
		() => passages.flatMap((passage) => passage.questions.map((question) => ({ passage, question }))),
		[passages],
	);

	const answeredCount = questionList.filter(({ question }) => Boolean(selectedAnswers[question.id])).length;
	const correctCount = submitted
		? questionList.filter(({ question }) => selectedAnswers[question.id] === question.answer).length
		: 0;
	const score = questionList.length > 0 ? Math.round((correctCount / questionList.length) * 100) : 0;

	const togglePassage = (i: number) =>
		setExpandedPassages((s) => ({ ...s, [i]: !s[i] }));

	if (passages.length === 0) return null;

	return (
		<section className="space-y-5">
			{/* ── header ── */}
			<div className="relative overflow-hidden rounded-[24px] border border-cyan-500/15 bg-gradient-to-br from-[#091820] via-[#0b0f1b] to-[#0a0b0f] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.4)]">
				<div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-500/6 blur-3xl" />
				<div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/10">
								<Brain size={15} className="text-cyan-400" />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">Reading Exam Lab</p>
								<h2 className="text-lg font-black text-white">
									{passages.length} pasaj &middot; {questionList.length} çoktan seçmeli soru
								</h2>
							</div>
						</div>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
							Her pasaj farklı bir konu alanını hedefler. Main idea, detail, inference, vocabulary in context ve tone soruları yer alır.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3 shrink-0">
						<div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300">
							{answeredCount}/{questionList.length} cevaplandı
						</div>
						{submitted && (
							<div className={`rounded-2xl border px-4 py-2.5 text-sm font-black ${score >= 70 ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-rose-500/25 bg-rose-500/10 text-rose-300"}`}>
								%{score} &mdash; {correctCount}/{questionList.length}
							</div>
						)}
						<button
							type="button"
							onClick={() => setSubmitted((s) => !s)}
							className="rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-slate-100 active:scale-95"
						>
							{submitted ? "Sonuçları Gizle" : "Cevapları Kontrol Et"}
						</button>
					</div>
				</div>
			</div>

			{/* ── passages ── */}
			{passages.map((passage, passageIndex) => {
				const isExpanded = Boolean(expandedPassages[passageIndex]);
				const passageCorrect = submitted
					? passage.questions.filter((q) => selectedAnswers[q.id] === q.answer).length
					: 0;
				const passageScore = passage.questions.length > 0 ? Math.round((passageCorrect / passage.questions.length) * 100) : 0;

				return (
					<article key={`${passage.title}-${passageIndex}`} className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0e1117]">
						{/* passage header (always visible) */}
						<div
							className="flex cursor-pointer items-start justify-between gap-4 p-6"
							onClick={() => togglePassage(passageIndex)}
						>
							<div className="flex-1 min-w-0">
								<div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
									<span>{passage.source}</span>
									<span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5">{passage.category}</span>
									<span>{getWordCount(passage.passage)} kelime</span>
								</div>
								<h3 className="mt-2 text-lg font-black text-white">
									Pasaj {passageIndex + 1}: {passage.title}
								</h3>
								{submitted && (
									<p className={`mt-1 text-xs font-semibold ${passageScore >= 70 ? "text-emerald-400" : "text-rose-400"}`}>
										{passageCorrect}/{passage.questions.length} doğru — %{passageScore}
									</p>
								)}
							</div>
							<button
								type="button"
								className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08]"
							>
								{isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
							</button>
						</div>

						{/* expandable content */}
						{isExpanded && (
							<div className="px-6 pb-6 space-y-5">
								{/* passage text */}
								<div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
									<p className="text-sm leading-8 text-slate-200">{passage.passage}</p>
								</div>
								{/* summary */}
								<div className="flex items-start gap-3 rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.06] px-4 py-3">
									<span className="mt-0.5 text-cyan-400 shrink-0">ℹ</span>
									<p className="text-sm leading-6 text-cyan-100"><strong>Özet:</strong> {passage.summary}</p>
								</div>

								{/* questions */}
								<div className="space-y-4">
									{passage.questions.map((question, questionIndex) => {
										const selectedAnswer = selectedAnswers[question.id];
										const isCorrect = submitted && selectedAnswer === question.answer;
										const isWrong = submitted && Boolean(selectedAnswer) && selectedAnswer !== question.answer;
										const typeColorClass = QUESTION_TYPE_COLOR[question.type] ?? QUESTION_TYPE_COLOR["detail"];

										return (
											<div key={question.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
												<div className="flex flex-wrap items-center justify-between gap-2 mb-3">
													<div className="flex items-center gap-2">
														<span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-700 text-[10px] font-bold text-white">
															{questionIndex + 1}
														</span>
														<span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] ${typeColorClass}`}>
															{question.type}
														</span>
													</div>
													<span className="text-[11px] font-semibold text-slate-500">{question.skillMeasured}</span>
												</div>

												<p className="text-[0.95rem] font-semibold leading-7 text-white">{question.question}</p>

												<div className="mt-4 grid gap-2 md:grid-cols-2">
													{question.options.map((option, optIndex) => {
														const isSelected = selectedAnswer === option;
														const isAnswer = submitted && question.answer === option;

														return (
															<button
																key={`${question.id}-opt-${optIndex}`}
																type="button"
																onClick={() =>
																	setSelectedAnswers((s) => ({ ...s, [question.id]: option }))
																}
																className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
																	isAnswer
																		? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
																		: isSelected && !submitted
																			? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100"
																			: isSelected && submitted
																				? "border-rose-500/40 bg-rose-500/10 text-rose-100"
																				: "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
																}`}
															>
																<span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-black">
																	{getOptionLabel(optIndex)}
																</span>
																<span className="leading-6">{option}</span>
															</button>
														);
													})}
												</div>

												{submitted && (
													<div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/30 p-4">
														<div className="flex items-center gap-2">
															{isCorrect ? (
																<CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
															) : isWrong ? (
																<XCircle size={15} className="shrink-0 text-rose-400" />
															) : (
																<Circle size={15} className="shrink-0 text-amber-400" />
															)}
															<p className={`text-sm font-bold ${isCorrect ? "text-emerald-300" : isWrong ? "text-rose-300" : "text-amber-300"}`}>
																{isCorrect
																	? "Doğru cevap!"
																	: isWrong
																		? `Yanlış. Doğru cevap: ${question.answer}`
																		: `Cevap verilmedi. Doğru cevap: ${question.answer}`}
															</p>
														</div>
														<p className="mt-2 text-sm leading-6 text-slate-300">{question.explanation}</p>
														{question.whyOthersWrong.length > 0 && (
															<div className="mt-3 space-y-1.5 border-t border-white/[0.07] pt-3">
																{question.whyOthersWrong.map((item) => (
																	<p key={item} className="text-xs leading-5 text-slate-500">{item}</p>
																))}
															</div>
														)}
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						)}
					</article>
				);
			})}
		</section>
	);
}
