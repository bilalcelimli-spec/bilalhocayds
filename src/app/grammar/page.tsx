import { Button } from "@/src/components/common/button";
import { createAiProfileOverridesFromStudentContext, getDailyGrammarModule } from "@/src/lib/ai-content";
import { authOptions } from "@/src/auth";
import { getPublishedContentByModule } from "@/src/lib/content-creator-engine";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export default async function GrammarPage() {
	const session = await getServerSession(authOptions);
	const profile = session?.user?.id
		? await prisma.studentProfile.findUnique({
				where: { userId: session.user.id },
				select: {
					interestTags: true,
					targetExam: true,
					targetScore: true,
					currentLevel: true,
					dailyGoalMinutes: true,
				},
		  })
		: null;

	const [grammar, publishedGrammarRuns] = await Promise.all([
		getDailyGrammarModule({
			profile: createAiProfileOverridesFromStudentContext({
				targetExam: profile?.targetExam,
				currentLevel: profile?.currentLevel,
				targetScore: profile?.targetScore,
				dailyGoalMinutes: profile?.dailyGoalMinutes,
				interestTags: profile?.interestTags,
			}),
		}),
		getPublishedContentByModule("grammar", 3),
	]);

	const activityGroups = [
		{ label: "Multiple Choice", items: grammar.activitySet.multipleChoice },
		{ label: "Fill in the Blanks", items: grammar.activitySet.fillInTheBlanks },
		{ label: "Error Correction", items: grammar.activitySet.errorCorrection },
		{ label: "Sentence Transformation", items: grammar.activitySet.sentenceTransformation },
		{ label: "Rule Application", items: grammar.activitySet.ruleApplication },
		{ label: "Mini Production", items: grammar.activitySet.miniProduction },
	];

	return (
		<div className="mx-auto max-w-7xl px-6 py-10">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
						AI Grammar Coach
					</span>
					<h1 className="mt-4 text-3xl font-black text-white md:text-4xl">
						Hedef odakli gunluk grammar oturumu hazir
					</h1>
					<p className="mt-3 max-w-2xl text-slate-300">
						{grammar.studentGoalSnapshot}
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<Button href="/dashboard" variant="outline">
						Dashboard&apos;a Dön
					</Button>
					<Button href="/pricing">Tam Konu Paketi</Button>
				</div>
			</div>

			<div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">Bugunku Konu</p>
					<h2 className="mt-2 text-3xl font-black text-white">{grammar.focusTopic}</h2>
					<p className="mt-2 text-sm text-slate-300">
						{grammar.dailyGoal}
					</p>
				</div>

				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">Activity Set</p>
					<h2 className="mt-2 text-3xl font-black text-white">6 format</h2>
					<p className="mt-2 text-sm text-slate-300">
						Sinav tipi soru, donusum, hata tespiti ve mini production ayni oturumda.
					</p>
				</div>

				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">AI Modeli</p>
					<h2 className="mt-2 text-3xl font-black text-white">{grammar.model}</h2>
					<p className="mt-2 text-sm text-slate-300">
						Modül tarihi: {new Date(grammar.generatedAt).toLocaleDateString("tr-TR")}
					</p>
				</div>

				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">Sonraki Adim</p>
					<h2 className="mt-2 text-3xl font-black text-white">Net</h2>
					<p className="mt-2 text-sm text-slate-300">
						{grammar.personalizedNextStep}
					</p>
				</div>
			</div>

			<div className="mt-10 grid gap-6 lg:grid-cols-3">
				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:col-span-2">
					{publishedGrammarRuns.length ? (
						<div className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Published From Content Engine</p>
									<h2 className="mt-2 text-lg font-bold text-white">Modüle dağıtılan ek grammar setleri</h2>
								</div>
								<Button href="/dashboard/content-library" variant="secondary" size="sm">
									Kütüphaneyi Aç
								</Button>
							</div>
							<div className="mt-4 space-y-3">
								{publishedGrammarRuns.map((run) => (
									<div key={run.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
										<p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{run.itemType}</p>
										<h3 className="mt-2 text-base font-bold text-white">{run.title}</h3>
										<p className="mt-2 text-sm leading-7 text-slate-300">{run.generatedText?.slice(0, 260) ?? run.styleAnalysis ?? ""}</p>
									</div>
								))}
							</div>
						</div>
					) : null}

					<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
						<div>
							<h2 className="text-xl font-bold text-white">Concept Explanation</h2>
							<p className="mt-1 text-sm text-slate-300">
								{grammar.topicReason}
							</p>
						</div>
						<Button variant="secondary" size="sm">
							Practice Baslat
						</Button>
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
						<p className="mt-3 text-sm leading-7 text-slate-300">
							Kolaydan daha sinav odakli kullanima giden ornekler:
						</p>
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

					<div className="mt-6 space-y-4">
						{activityGroups.map((group) => (
							<div key={group.label} className="rounded-2xl border border-white/10 px-5 py-4">
								<div className="flex items-center justify-between gap-3">
									<h3 className="text-lg font-bold text-white">{group.label}</h3>
									<span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
										{group.items.length} gorev
									</span>
								</div>
								<div className="mt-4 space-y-4">
									{group.items.map((item) => (
										<div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
											<p className="text-xs font-semibold uppercase tracking-wide text-blue-300">{item.title}</p>
											<p className="mt-2 text-sm text-slate-200">{item.prompt}</p>
											{item.options?.length ? (
												<p className="mt-2 text-xs text-slate-500">Secenekler: {item.options.join(" / ")}</p>
											) : null}
											<p className="mt-3 text-sm font-semibold text-emerald-300">Cevap: {item.answer}</p>
											<p className="mt-2 text-sm text-slate-300">{item.explanation}</p>
											<p className="mt-2 text-xs text-slate-500">Test edilen nokta: {item.testedPoint}</p>
											{item.sampleResponse ? (
												<p className="mt-2 text-xs text-amber-200">Ornek yanit: {item.sampleResponse}</p>
											) : null}
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="space-y-6">
					<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
						<h2 className="text-xl font-bold text-white">Strategy Notes</h2>
						<div className="mt-5 space-y-3">
							{grammar.strategyNotes.map((item, index) => (
								<div
									key={item}
									className="flex items-start gap-3 rounded-2xl border border-white/15 px-4 py-4"
								>
									<span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
										{index + 1}
									</span>
									<p className="text-sm font-medium text-slate-200">{item}</p>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-3xl bg-blue-600 p-6 text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
						<p className="text-sm font-semibold text-blue-100">Performance Evaluation</p>
						<h3 className="mt-2 text-xl font-black">Hedef puana gore durum</h3>
						<p className="mt-3 text-sm leading-7 text-blue-100">
							{grammar.performanceEvaluation.summary}
						</p>
						<div className="mt-4 border-t border-blue-300/40 pt-4">
							<p className="text-xs text-blue-100">Target Comment</p>
							<p className="mt-2 text-sm text-blue-100">{grammar.performanceEvaluation.targetScoreComment}</p>
							<div className="mt-4 space-y-3">
								{grammar.performanceEvaluation.rubric.map((item) => (
									<div key={item.label} className="rounded-2xl border border-blue-300/20 bg-blue-950/20 p-4">
										<div className="flex items-center justify-between gap-3">
											<p className="text-sm font-semibold text-white">{item.label}</p>
											<p className="text-sm font-black text-amber-200">{item.score}/10</p>
										</div>
										<p className="mt-2 text-xs text-blue-100">{item.comment}</p>
										<p className="mt-2 text-xs text-blue-200/80">{item.recommendation}</p>
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
