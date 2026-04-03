"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from "lucide-react";

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

const TYPE_BADGE: Record<string, string> = {
	"fill-in-the-blanks": "border-sky-500/25 bg-sky-500/10 text-sky-400",
	"match-definition": "border-blue-500/25 bg-blue-500/10 text-blue-400",
	"synonym-selection": "border-violet-500/25 bg-violet-500/10 text-violet-400",
	"context-meaning": "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
	"collocation-completion": "border-teal-500/25 bg-teal-500/10 text-teal-400",
	"rewrite": "border-orange-500/25 bg-orange-500/10 text-orange-400",
	"word-formation": "border-rose-500/25 bg-rose-500/10 text-rose-400",
	"multiple-choice": "border-amber-500/25 bg-amber-500/10 text-amber-400",
	"mini-translation": "border-pink-500/25 bg-pink-500/10 text-pink-400",
};

export function VocabularyPracticePanel({ activities }: VocabularyPracticePanelProps) {
	const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
	const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
	const [revealedItems, setRevealedItems] = useState<Record<number, boolean>>({});

	const answeredCount = activities.filter((_, i) => {
		const hasOptions = Array.isArray(activities[i].options) && (activities[i].options?.length ?? 0) > 0;
		return hasOptions ? Boolean(selectedAnswers[i]) : Boolean(textAnswers[i]?.trim());
	}).length;

	return (
		<div className="space-y-3">
			{/* progress bar */}
			<div className="flex items-center justify-between mb-2">
				<p className="text-xs font-semibold text-slate-500">{answeredCount}/{activities.length} tamamlandı</p>
				<div className="flex-1 mx-4 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
					<div
						className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
						style={{ width: `${activities.length > 0 ? (answeredCount / activities.length) * 100 : 0}%` }}
					/>
				</div>
				<p className="text-xs font-semibold text-amber-400">{activities.length > 0 ? Math.round((answeredCount / activities.length) * 100) : 0}%</p>
			</div>

			{activities.map((activity, index) => {
				const hasOptions = Array.isArray(activity.options) && (activity.options?.length ?? 0) > 0;
				const selectedAnswer = selectedAnswers[index] ?? "";
				const textAnswer = textAnswers[index] ?? "";
				const isRevealed = Boolean(revealedItems[index]);
				const isCorrect = hasOptions
					? selectedAnswer.trim().toLowerCase() === activity.answer.trim().toLowerCase()
					: false;
				const badgeClass = TYPE_BADGE[activity.type] ?? TYPE_BADGE["multiple-choice"];

				return (
					<div
						key={`${activity.type}-${index}`}
						className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
							isRevealed
								? isCorrect
									? "border-emerald-500/20 bg-emerald-950/20"
									: "border-white/[0.09] bg-[#0e1117]"
								: "border-white/[0.09] bg-[#0e1117] hover:border-white/[0.14]"
						}`}
					>
						<div className="p-5">
							{/* header */}
							<div className="flex flex-wrap items-start justify-between gap-2 mb-3">
								<div className="flex items-center gap-2">
									<span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-[11px] font-black text-amber-400">
										{index + 1}
									</span>
									<p className="text-sm font-bold text-white">{activity.title}</p>
								</div>
								<span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${badgeClass}`}>
									{activity.type.replace(/-/g, " ")}
								</span>
							</div>

							{/* prompt */}
							<p className="text-sm leading-7 text-slate-300">{activity.prompt}</p>

							{/* input */}
							{hasOptions ? (
								<div className="mt-4 grid gap-2 sm:grid-cols-2">
									{activity.options?.map((option) => {
										const isSelected = selectedAnswer === option;
										const showCorrect = isRevealed && option.trim().toLowerCase() === activity.answer.trim().toLowerCase();
										const showWrong = isRevealed && isSelected && !showCorrect;

										return (
											<button
												key={option}
												type="button"
												onClick={() => !isRevealed && setSelectedAnswers((s) => ({ ...s, [index]: option }))}
												className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
													showCorrect
														? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
														: showWrong
															? "border-rose-500/40 bg-rose-500/10 text-rose-200"
															: isSelected
																? "border-amber-500/40 bg-amber-500/10 text-amber-100"
																: "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-amber-500/20 hover:bg-amber-500/[0.06] hover:text-white"
												} ${isRevealed ? "cursor-default" : "cursor-pointer"}`}
											>
												<span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
													showCorrect ? "border-emerald-400 text-emerald-400" : showWrong ? "border-rose-400 text-rose-400" : isSelected ? "border-amber-400 text-amber-400" : "border-slate-600 text-slate-500"
												}`}>
													{showCorrect ? "✓" : showWrong ? "✗" : "·"}
												</span>
												{option}
											</button>
										);
									})}
								</div>
							) : (
								<textarea
									value={textAnswer}
									onChange={(e) => !isRevealed && setTextAnswers((s) => ({ ...s, [index]: e.target.value }))}
									rows={3}
									placeholder="Cevabını buraya yaz..."
									className="mt-4 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-amber-500/40 focus:bg-amber-500/[0.04]"
									readOnly={isRevealed}
								/>
							)}

							{/* action row */}
							<div className="mt-4 flex flex-wrap items-center gap-3">
								<button
									type="button"
									onClick={() => setRevealedItems((s) => ({ ...s, [index]: !s[index] }))}
									className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
										isRevealed
											? "border border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]"
											: "bg-amber-500 text-white shadow-[0_4px_14px_rgba(212,168,67,0.3)] hover:bg-amber-400 active:scale-95"
									}`}
								>
									{isRevealed ? (
										<>
											<ChevronUp size={13} />
											Gizle
										</>
									) : (
										<>
											<ChevronDown size={13} />
											{hasOptions ? "Cevabı Kontrol Et" : "Örnek Cevabı Gör"}
										</>
									)}
								</button>
								{hasOptions && isRevealed && (
									<span className={`flex items-center gap-1.5 text-sm font-bold ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
										{isCorrect ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
										{isCorrect ? "Doğru!" : "Tekrar dene"}
									</span>
								)}
							</div>
						</div>

						{/* feedback panel */}
						{isRevealed && (
							<div className={`border-t px-5 py-4 ${isCorrect && hasOptions ? "border-emerald-500/20 bg-emerald-950/30" : "border-white/[0.07] bg-white/[0.02]"}`}>
								<p className="text-sm font-bold text-white mb-1">Referans Cevap</p>
								<p className="text-sm leading-6 text-slate-300">{activity.answer}</p>
								<p className="mt-2.5 text-xs leading-5 text-slate-500">{activity.explanation}</p>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

