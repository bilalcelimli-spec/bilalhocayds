import { GrammarPracticePanel } from "@/src/components/grammar/grammar-practice-panel";
import { authOptions } from "@/src/auth";
import { getOrCreateStudentDailyContent } from "@/src/lib/student-daily-content";
import { DailyContentModule } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { ArrowLeft, BookOpen, BrainCircuit, FlaskConical, GraduationCap, Lightbulb, RotateCcw, Target, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GrammarPage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return null;

	const grammar = await getOrCreateStudentDailyContent(session.user.id, DailyContentModule.GRAMMAR);

	const activityGroups = [
		{ label: "Multiple Choice", items: grammar.activitySet.multipleChoice },
		{ label: "Fill in the Blanks", items: grammar.activitySet.fillInTheBlanks },
		{ label: "Error Correction", items: grammar.activitySet.errorCorrection },
		{ label: "Sentence Transformation", items: grammar.activitySet.sentenceTransformation },
		{ label: "Rule Application", items: grammar.activitySet.ruleApplication },
		{ label: "Mini Production", items: grammar.activitySet.miniProduction },
	];

	const totalActivities = activityGroups.reduce((sum, g) => sum + g.items.length, 0);

	return (
		<div className="min-h-screen">
			{/* ── sticky nav ── */}
			<div className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#0a0b0f]/85 backdrop-blur-2xl">
				<div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3">
					<Link
						href="/dashboard"
						className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
					>
						<ArrowLeft size={12} />
						Dashboard
					</Link>
					<span className="text-slate-700">/</span>
					<span className="flex items-center gap-1.5 text-sm font-semibold text-white">
						<GraduationCap size={13} className="text-violet-400" />
						Grammar
					</span>
					<div className="ml-auto flex items-center gap-3">
						<span className="hidden rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-violet-400 sm:inline-flex">
							{new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
						</span>
						<Link
							href="/pricing"
							className="hidden rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20 sm:inline-flex"
						>
							Tam Konu Paketi
						</Link>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-5 py-8 space-y-6">
				{/* ── hero card ── */}
				<div className="relative overflow-hidden rounded-[28px] border border-violet-500/15 bg-gradient-to-br from-[#110e1c] via-[#0d0b18] to-[#0a0b0f] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
					<div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-violet-500/8 blur-3xl" />
					<div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-purple-600/6 blur-3xl" />

					<div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex-1 min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
									<BrainCircuit size={10} />
									AI Grammar Coach
								</span>
							</div>
							<h1 className="mt-3 text-2xl font-black leading-snug text-white md:text-3xl">
								{grammar.focusTopic}
							</h1>
							<p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
								{grammar.studentGoalSnapshot}
							</p>
							<div className="mt-4 flex items-center gap-2">
								<Target size={13} className="text-violet-400" />
								<span className="text-sm font-semibold text-violet-300">{grammar.dailyGoal}</span>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 shrink-0">
							{[
								{ Icon: GraduationCap, label: "Bugünkü Konu", value: grammar.focusTopic.split(" ").slice(0, 2).join(" "), color: "text-violet-400" },
								{ Icon: FlaskConical, label: "Format", value: "6 adet", color: "text-purple-400" },
								{ Icon: Target, label: "Aktivite", value: String(totalActivities), color: "text-indigo-400" },
								{ Icon: RotateCcw, label: "Model", value: grammar.model, color: "text-pink-400" },
							].map(({ Icon, label, value, color }) => (
								<div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-center">
									<Icon size={14} className={`mx-auto ${color}`} />
									<p className="mt-1.5 text-lg font-black text-white leading-tight">{value}</p>
									<p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</p>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* ── concept + model examples ── */}
				<div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
					{/* Concept explanation */}
					<div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
						<div className="flex items-center gap-2 mb-4">
							<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
								<Lightbulb size={13} className="text-violet-400" />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">Konu Anlatımı</p>
								<p className="text-sm font-bold text-white">Concept Explanation</p>
							</div>
						</div>
						<p className="text-xs text-slate-500 mb-3">{grammar.topicReason}</p>

						<div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-5 mb-4">
							<p className="text-sm leading-7 text-slate-200">{grammar.conceptExplanation}</p>
						</div>

						{/* Warm-up */}
						<div className="mt-1">
							<p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Warm-Up</p>
							<div className="space-y-2">
								{grammar.warmUp.map((item) => (
									<div key={item} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300">
										{item}
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Model examples */}
					<div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
						<div className="flex items-center gap-2 mb-4">
							<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10">
								<BookOpen size={13} className="text-blue-400" />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">Örnek Cümleler</p>
								<p className="text-sm font-bold text-white">Model Examples</p>
							</div>
						</div>
						<p className="text-xs text-slate-500 mb-3">Kolaydan sınav odaklı kullanıma doğru:</p>
						<div className="space-y-3">
							{grammar.modelExamples.map((example, i) => (
								<div key={example.en} className="rounded-2xl border border-white/[0.07] bg-[#0e1117] p-4">
									<div className="flex items-start gap-2.5 mb-2">
										<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[10px] font-black text-white">
											{i + 1}
										</span>
										<p className="text-sm font-semibold leading-6 text-slate-100">{example.en}</p>
									</div>
									<p className="ml-7 text-xs text-slate-500">{example.tr}</p>
									{example.note && (
										<div className="ml-7 mt-2 rounded-xl border border-violet-500/15 bg-violet-500/[0.06] px-3 py-2">
											<p className="text-xs text-violet-300">{example.note}</p>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>

				{/* ── activities + strategy/performance ── */}
				<div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
					{/* activities */}
					<div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6">
						<div className="flex items-center gap-2 mb-5">
							<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
								<FlaskConical size={13} className="text-violet-400" />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">Alıştırma</p>
								<h2 className="text-base font-bold text-white">Practice Activities</h2>
							</div>
						</div>
						<GrammarPracticePanel groups={activityGroups} />
					</div>

					{/* strategy + performance */}
					<div className="space-y-5">
						{/* strategy */}
						<div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
							<div className="flex items-center gap-2 mb-4">
								<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10">
									<Target size={13} className="text-blue-400" />
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">Strateji</p>
									<p className="text-sm font-bold text-white">Strategy Notes</p>
								</div>
							</div>
							<div className="space-y-2.5">
								{grammar.strategyNotes.map((item, i) => (
									<div key={item} className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
										<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
											{i + 1}
										</span>
										<p className="text-sm leading-6 text-slate-300">{item}</p>
									</div>
								))}
							</div>
						</div>

						{/* performance */}
						<div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
							<div className="flex items-center gap-2 mb-4">
								<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
									<TrendingUp size={13} className="text-emerald-400" />
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Performans</p>
									<p className="text-sm font-bold text-white">Değerlendirme</p>
								</div>
							</div>
							<p className="text-sm leading-6 text-slate-400 mb-2">{grammar.performanceEvaluation.summary}</p>
							<p className="text-xs text-slate-500 mb-4">{grammar.performanceEvaluation.targetScoreComment}</p>
							<div className="space-y-2">
								{grammar.performanceEvaluation.rubric.map((item) => (
									<div key={item.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
										<div className="flex items-center justify-between mb-1">
											<p className="text-sm font-semibold text-white">{item.label}</p>
											<span className="text-sm font-black tabular-nums text-amber-300">
												{item.score}<span className="text-slate-600 font-normal">/10</span>
											</span>
										</div>
										<div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
											<div
												className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
												style={{ width: `${(item.score / 10) * 100}%` }}
											/>
										</div>
										<p className="mt-2 text-xs text-slate-500">{item.comment}</p>
									</div>
								))}
							</div>
							<p className="mt-4 text-xs font-semibold text-emerald-400">→ {grammar.personalizedNextStep}</p>
							<p className="mt-2 text-[10px] text-slate-600">
								{new Date(grammar.generatedAt).toLocaleDateString("tr-TR")} tarihinde üretildi
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}


