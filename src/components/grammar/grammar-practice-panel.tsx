"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from "lucide-react";

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

const GROUP_ACCENT: Record<string, { badge: string; dot: string; header: string }> = {
	"Multiple Choice": {
		badge: "border-sky-500/25 bg-sky-500/10 text-sky-400",
		dot: "bg-sky-500",
		header: "text-sky-400",
	},
	"Fill in the Blanks": {
		badge: "border-blue-500/25 bg-blue-500/10 text-blue-400",
		dot: "bg-blue-500",
		header: "text-blue-400",
	},
	"Error Correction": {
		badge: "border-rose-500/25 bg-rose-500/10 text-rose-400",
		dot: "bg-rose-500",
		header: "text-rose-400",
	},
	"Sentence Transformation": {
		badge: "border-violet-500/25 bg-violet-500/10 text-violet-400",
		dot: "bg-violet-500",
		header: "text-violet-400",
	},
	"Rule Application": {
		badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
		dot: "bg-emerald-500",
		header: "text-emerald-400",
	},
	"Mini Production": {
		badge: "border-amber-500/25 bg-amber-500/10 text-amber-400",
		dot: "bg-amber-500",
		header: "text-amber-400",
	},
};

const DEFAULT_ACCENT = {
	badge: "border-slate-500/25 bg-slate-500/10 text-slate-400",
	dot: "bg-slate-500",
	header: "text-slate-400",
};

export function GrammarPracticePanel({ groups }: GrammarPracticePanelProps) {
	const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
	const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
	const [revealedItems, setRevealedItems] = useState<Record<string, boolean>>({});
	const [activeGroup, setActiveGroup] = useState(0);

	const totalActivities = groups.reduce((sum, g) => sum + g.items.length, 0);
	const answeredCount = groups.reduce((sum, g) => {
		return sum + g.items.filter((item) => {
			const hasOptions = Array.isArray(item.options) && (item.options?.length ?? 0) > 0;
			return hasOptions ? Boolean(selectedAnswers[item.id]) : Boolean(textAnswers[item.id]?.trim());
		}).length;
	}, 0);

	return (
		<div className="space-y-4">
			{/* progress */}
			<div className="flex items-center justify-between mb-1">
				<p className="text-xs font-semibold text-slate-500">{answeredCount}/{totalActivities} tamamlandı</p>
				<div className="flex-1 mx-4 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
					<div
						className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500"
						style={{ width: `${totalActivities > 0 ? (answeredCount / totalActivities) * 100 : 0}%` }}
					/>
				</div>
				<p className="text-xs font-semibold text-violet-400">{totalActivities > 0 ? Math.round((answeredCount / totalActivities) * 100) : 0}%</p>
			</div>

			{/* group tab pills */}
			<div className="flex flex-wrap gap-2">
				{groups.map((group, i) => {
					const accent = GROUP_ACCENT[group.label] ?? DEFAULT_ACCENT;
					const isActive = activeGroup === i;
					return (
						<button
							key={group.label}
							type="button"
							onClick={() => setActiveGroup(i)}
							className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
								isActive
									? `${accent.badge}`
									: "border-white/[0.07] bg-transparent text-slate-500 hover:border-white/[0.14] hover:text-slate-300"
							}`}
						>
							<span className={`inline-block h-1.5 w-1.5 rounded-full ${isActive ? accent.dot : "bg-slate-600"}`} />
							{group.label}
							<span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${isActive ? "bg-white/10" : "bg-white/[0.04]"}`}>
								{group.items.length}
							</span>
						</button>
					);
				})}
			</div>

			{/* active group activities */}
			{groups[activeGroup] && (() => {
				const group = groups[activeGroup];
				const accent = GROUP_ACCENT[group.label] ?? DEFAULT_ACCENT;

				return (
					<div className="space-y-3">
						{group.items.map((item) => {
							const hasOptions = Array.isArray(item.options) && (item.options?.length ?? 0) > 0;
							const selectedAnswer = selectedAnswers[item.id] ?? "";
							const isRevealed = Boolean(revealedItems[item.id]);
							const isCorrect = hasOptions
								? selectedAnswer.trim().toLowerCase() === item.answer.trim().toLowerCase()
								: false;

							return (
								<div
									key={item.id}
									className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
										isRevealed && isCorrect && hasOptions
											? "border-emerald-500/20 bg-emerald-950/20"
											: "border-white/[0.09] bg-[#0e1117] hover:border-white/[0.14]"
									}`}
								>
									<div className="p-5">
										{/* header */}
										<div className="flex flex-wrap items-start justify-between gap-2 mb-3">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${accent.badge}`}>
														{group.label}
													</span>
													<span className="text-[11px] text-slate-500">{item.testedPoint}</span>
												</div>
												<p className="text-sm font-bold text-white">{item.title}</p>
											</div>
										</div>

										{/* prompt */}
										<p className="text-sm leading-7 text-slate-300">{item.prompt}</p>

										{/* input */}
										{hasOptions ? (
											<div className="mt-4 grid gap-2 sm:grid-cols-2">
												{item.options?.map((option, optIdx) => {
													const isSelected = selectedAnswer === option;
													const showCorrect = isRevealed && option.trim().toLowerCase() === item.answer.trim().toLowerCase();
													const showWrong = isRevealed && isSelected && !showCorrect;

													return (
														<button
															key={`${item.id}-${optIdx}`}
															type="button"
															onClick={() =>
																!isRevealed &&
																setSelectedAnswers((s) => ({ ...s, [item.id]: option }))
															}
															className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
																showCorrect
																	? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
																	: showWrong
																		? "border-rose-500/40 bg-rose-500/10 text-rose-200"
																		: isSelected
																			? "border-violet-500/40 bg-violet-500/10 text-violet-100"
																			: "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-violet-500/20 hover:bg-violet-500/[0.05] hover:text-white"
															} ${isRevealed ? "cursor-default" : "cursor-pointer"}`}
														>
															<span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
																showCorrect ? "border-emerald-400 text-emerald-400" : showWrong ? "border-rose-400 text-rose-400" : isSelected ? "border-violet-400 text-violet-400" : "border-slate-600 text-slate-500"
															}`}>
																{String.fromCharCode(65 + optIdx)}
															</span>
															{option}
														</button>
													);
												})}
											</div>
										) : (
											<textarea
												value={textAnswers[item.id] ?? ""}
												onChange={(e) =>
													!isRevealed &&
													setTextAnswers((s) => ({ ...s, [item.id]: e.target.value }))
												}
												rows={3}
												placeholder="Cevabını buraya yaz..."
												className="mt-4 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-500/40 focus:bg-violet-500/[0.04]"
												readOnly={isRevealed}
											/>
										)}

										{/* action row */}
										<div className="mt-4 flex flex-wrap items-center gap-3">
											<button
												type="button"
												onClick={() =>
													setRevealedItems((s) => ({ ...s, [item.id]: !s[item.id] }))
												}
												className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
													isRevealed
														? "border border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]"
														: "bg-violet-600 text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)] hover:bg-violet-500 active:scale-95"
												}`}
											>
												{isRevealed ? (
													<><ChevronUp size={13} /> Gizle</>
												) : (
													<><ChevronDown size={13} /> {hasOptions ? "Cevabı Kontrol Et" : "Referans Cevabı Gör"}</>
												)}
											</button>
											{hasOptions && isRevealed && (
												<span className={`flex items-center gap-1.5 text-sm font-bold ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
													{isCorrect ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
													{isCorrect ? "Doğru!" : "Referans cevabı incele"}
												</span>
											)}
										</div>
									</div>

									{/* feedback */}
									{isRevealed && (
										<div className={`border-t px-5 py-4 ${isCorrect && hasOptions ? "border-emerald-500/20 bg-emerald-950/30" : "border-white/[0.07] bg-white/[0.02]"}`}>
											<p className="text-sm font-bold text-white mb-1">Referans Cevap</p>
											<p className="text-sm leading-6 text-slate-300">{item.answer}</p>
											<p className="mt-2 text-xs leading-5 text-slate-500">{item.explanation}</p>
											{item.sampleResponse && (
												<div className="mt-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.07] px-3 py-2">
													<p className="text-xs font-semibold text-amber-400">Örnek üretim:</p>
													<p className="mt-1 text-xs text-amber-200">{item.sampleResponse}</p>
												</div>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				);
			})()}
		</div>
	);
}
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