import { Button } from "@/src/components/common/button";
import { GrammarPracticePanel } from "@/src/components/grammar/grammar-practice-panel";
import { authOptions } from "@/src/auth";
import { getOrCreateStudentDailyContent } from "@/src/lib/student-daily-content";
import { DailyContentModule } from "@prisma/client";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export default async function GrammarPage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return null;
	}

	const grammar = await getOrCreateStudentDailyContent(session.user.id, DailyContentModule.GRAMMAR);

	const activityGroups = [
		{ label: "Multiple Choice", items: grammar.activitySet.multipleChoice },
		{ label: "Fill in the Blanks", items: grammar.activitySet.fillInTheBlanks },
		{ label: "Error Correction", items: grammar.activitySet.errorCorrection },
		{ label: "Sentence Transformation", items: grammar.activitySet.sentenceTransformation },
		{ label: "Rule Application", items: grammar.activitySet.ruleApplication },
		{ label: "Mini Production", items: grammar.activitySet.miniProduction },
	];

	return (
		<div className="mx-auto max-w-6xl px-6 py-10">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
						AI Grammar Coach
					</span>
					<h1 className="mt-4 text-3xl font-black text-white md:text-4xl">
						Daha minimal gunluk grammar calisma ekrani
					</h1>
					<p className="mt-3 max-w-2xl text-slate-300">{grammar.studentGoalSnapshot}</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<Button href="/dashboard" variant="outline">
						Dashboard&apos;a Don
					</Button>
					<Button href="/pricing">Tam Konu Paketi</Button>
				</div>
			</div>

			<div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
					<p className="text-sm text-slate-400">Bugunku Konu</p>
					<h2 className="mt-2 text-3xl font-black text-white">{grammar.focusTopic}</h2>
					<p className="mt-2 text-sm text-slate-300">{grammar.dailyGoal}</p>
				</div>
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
					<p className="text-sm text-slate-400">Activity Set</p>
					<h2 className="mt-2 text-3xl font-black text-white">6 format</h2>
					<p className="mt-2 text-sm text-slate-300">Sinav tipi soru, donusum, hata tespiti ve mini production ayni oturumda.</p>
				</div>
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
					<p className="text-sm text-slate-400">AI Modeli</p>
					<h2 className="mt-2 text-3xl font-black text-white">{grammar.model}</h2>
					<p className="mt-2 text-sm text-slate-300">Modul tarihi: {new Date(grammar.generatedAt).toLocaleDateString("tr-TR")}</p>
				</div>
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
					<p className="text-sm text-slate-400">Sonraki Adim</p>
					<h2 className="mt-2 text-3xl font-black text-white">Net</h2>
					<p className="mt-2 text-sm text-slate-300">{grammar.personalizedNextStep}</p>
				</div>
			</div>

			<div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
					<div>
						<h2 className="text-xl font-bold text-white">Concept Explanation</h2>
						<p className="mt-1 text-sm text-slate-300">{grammar.topicReason}</p>
					</div>

					<div className="mt-6 rounded-3xl bg-white/[0.04] p-6">
						<h3 className="text-lg font-bold text-white">Gunluk Hedef ve Warm-Up</h3>
						<p className="mt-3 text-sm leading-7 text-slate-300">{grammar.conceptExplanation}</p>
						<div className="mt-4 space-y-3">
							{grammar.warmUp.map((item) => (
								<div key={item} className="rounded-2xl border border-white/10 p-4 text-sm text-slate-200">
									{item}
								</div>
							))}
						</div>
					</div>

					<div className="mt-6 rounded-3xl bg-white/[0.04] p-6">
						<h3 className="text-lg font-bold text-white">Model Examples</h3>
						<p className="mt-3 text-sm leading-7 text-slate-300">Kolaydan daha sinav odakli kullanima giden ornekler:</p>
						<div className="mt-4 space-y-3">
							{grammar.modelExamples.map((example) => (
								<div key={example.en} className="rounded-2xl border border-white/10 p-4">
									<p className="text-sm font-medium text-slate-100">EN: {example.en}</p>
									<p className="mt-1 text-sm text-slate-300">TR: {example.tr}</p>
									<p className="mt-2 text-xs text-slate-500">{example.note}</p>
								</div>
							))}
						</div>
					</div>

					<div className="mt-6">
						<GrammarPracticePanel groups={activityGroups} />
					</div>
				</div>

				<div className="space-y-6">
					<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
						<h2 className="text-xl font-bold text-white">Strategy Notes</h2>
						<div className="mt-5 space-y-3">
							{grammar.strategyNotes.map((item, index) => (
								<div key={item} className="flex items-start gap-3 rounded-2xl border border-white/15 px-4 py-4">
									<span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
										{index + 1}
									</span>
									<p className="text-sm font-medium text-slate-200">{item}</p>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
						<p className="text-sm font-semibold text-slate-300">Performance Evaluation</p>
						<h3 className="mt-2 text-xl font-black text-white">Hedef puana gore durum</h3>
						<p className="mt-3 text-sm leading-7 text-slate-300">{grammar.performanceEvaluation.summary}</p>
						<div className="mt-4 border-t border-white/10 pt-4">
							<p className="text-xs text-slate-500">Target Comment</p>
							<p className="mt-2 text-sm text-slate-300">{grammar.performanceEvaluation.targetScoreComment}</p>
							<div className="mt-4 space-y-3">
								{grammar.performanceEvaluation.rubric.map((item) => (
									<div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
										<div className="flex items-center justify-between gap-3">
											<p className="text-sm font-semibold text-white">{item.label}</p>
											<p className="text-sm font-black text-amber-200">{item.score}/10</p>
										</div>
										<p className="mt-2 text-xs text-slate-300">{item.comment}</p>
										<p className="mt-2 text-xs text-slate-500">{item.recommendation}</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
