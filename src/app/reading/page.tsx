import { Button } from "@/src/components/common/button";
import { AiArticleReader } from "@/src/components/reading/ai-article-reader";
import { ReadingExamPanel } from "@/src/components/reading/reading-exam-panel";
import { authOptions } from "@/src/auth";
import { getPublishedContentByModule } from "@/src/lib/content-creator-engine";
import { getOrCreateStudentDailyContent } from "@/src/lib/student-daily-content";
import { DailyContentModule } from "@prisma/client";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export default async function ReadingPage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return null;
	}

	const [reading, vocabulary, publishedReadingRuns] = await Promise.all([
		getOrCreateStudentDailyContent(session.user.id, DailyContentModule.READING),
		getOrCreateStudentDailyContent(session.user.id, DailyContentModule.VOCABULARY),
		getPublishedContentByModule("reading", 3),
	]);
	const mainPassage = reading.passages[0];
	const wordMeanings = Object.fromEntries(
		vocabulary.items.map((item) => [item.word.toLowerCase(), item.trMeaning])
	);
	const totalQuestionCount = reading.passages.reduce((sum, passage) => sum + passage.questions.length, 0);

	return (
		<div className="mx-auto max-w-7xl px-6 py-10">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
						AI Reading Studio
					</span>
					<h1 className="mt-4 text-3xl font-black text-white md:text-4xl">
						Günlük çok kaynaklı AI reading modülü
					</h1>
					<p className="mt-3 max-w-2xl text-slate-300">
						Her gün farklı kaynaklardan seçilen metinlerle ana fikir, bağlam, çıkarım,
						kelime ve ton sorularını birlikte çalış.
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<Button href="/dashboard" variant="outline">
						Dashboard&apos;a Dön
					</Button>
					<Button href="/live-classes">Canlı Ders Takvimi</Button>
				</div>
			</div>

			<div className="mt-8 grid gap-6 lg:grid-cols-3">
				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:col-span-2">
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">{reading.sessionTitle}</p>
					<p className="mt-3 text-sm leading-7 text-slate-200">{reading.studentProfileSummary}</p>
					<p className="mt-3 text-sm font-semibold text-white">Gunluk hedef: {reading.dailyGoal}</p>
				</div>
				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<h2 className="text-lg font-bold text-white">Warm-Up</h2>
					<div className="mt-4 space-y-3">
						{reading.warmUp.map((item) => (
							<div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
								{item}
							</div>
						))}
					</div>
				</div>
			</div>

			<div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">Kaynak Sayısı</p>
					<h2 className="mt-2 text-3xl font-black text-white">{reading.passages.length}</h2>
					<p className="mt-2 text-sm text-slate-300">
						Her gün 3 farklı konuda, İngilizce pasaj seti hazırlanır.
					</p>
				</div>

				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">Tahmini Süre</p>
					<h2 className="mt-2 text-3xl font-black text-white">30 dk</h2>
					<p className="mt-2 text-sm text-slate-300">
						3 pasaj, çoktan seçmeli sınav ve analiz dahil hedef süre.
					</p>
				</div>

				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">Soru Tipi</p>
					<h2 className="mt-2 text-3xl font-black text-white">{totalQuestionCount} soru</h2>
					<p className="mt-2 text-sm text-slate-300">
						Her pasaj için 5 çoktan seçmeli soru ve tek doğru cevap yapısı.
					</p>
				</div>

				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">AI Modeli</p>
					<h2 className="mt-2 text-3xl font-black text-white">{reading.model}</h2>
					<p className="mt-2 text-sm text-slate-300">
						Günlük içerikler AI destekli olarak oluşturulur.
					</p>
				</div>
			</div>

			<div className="mt-10 space-y-6">
				{publishedReadingRuns.length ? (
					<div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Published From Content Engine</p>
								<h2 className="mt-2 text-xl font-bold text-white">Admin onaylı ek reading içerikleri</h2>
							</div>
							{session.user.hasContentLibraryAccess ? (
								<Button href="/dashboard/content-library" variant="secondary" size="sm">
									Tümünü Gör
								</Button>
							) : null}
						</div>
						<div className="mt-5 grid gap-4 lg:grid-cols-3">
							{publishedReadingRuns.map((run) => (
								<div key={run.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{run.itemType}</p>
									<h3 className="mt-2 text-base font-bold text-white">{run.title}</h3>
									<p className="mt-2 text-sm leading-7 text-slate-300">{run.generatedText?.slice(0, 240) ?? run.styleAnalysis ?? ""}</p>
									<p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">{run.items.length} içerik · {run.publishedAt ? new Date(run.publishedAt).toLocaleDateString("tr-TR") : ""}</p>
								</div>
							))}
						</div>
					</div>
				) : null}

				<AiArticleReader
					passage={mainPassage}
					generatedAt={reading.generatedAt}
					wordMeanings={wordMeanings}
				/>

				<div className="grid gap-6 lg:grid-cols-3">
					<div className="lg:col-span-2">
						<ReadingExamPanel passages={reading.passages} />
					</div>

					<div className="space-y-6">
					<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
						<h2 className="text-xl font-bold text-white">AI okuma planı</h2>
						<div className="mt-5 space-y-3">
							{mainPassage.studyPlan.map((item, index) => (
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
						<p className="text-sm font-semibold text-blue-100">Strategy Notes</p>
						<h3 className="mt-2 text-xl font-black">Okuma verimini sistemli artır</h3>
						<div className="mt-3 space-y-2 text-sm leading-7 text-blue-100">
							{reading.strategyNotes.map((item) => (
								<p key={item}>{item}</p>
							))}
						</div>
						<p className="mt-3 text-xs text-blue-100">Güncellendi: {new Date(reading.generatedAt).toLocaleDateString("tr-TR")}</p>
					</div>

					<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
						<h2 className="text-xl font-bold text-white">Performance Evaluation</h2>
						<p className="mt-3 text-sm text-slate-300">{reading.performanceEvaluation.summary}</p>
						<div className="mt-4 space-y-3">
							{reading.performanceEvaluation.rubric.map((item) => (
								<div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
									<div className="flex items-center justify-between gap-4">
										<p className="text-sm font-semibold text-white">{item.label}</p>
										<p className="text-sm font-black text-blue-300">{item.score}/10</p>
									</div>
									<p className="mt-2 text-xs text-slate-300">{item.comment}</p>
									<p className="mt-2 text-xs text-slate-500">{item.recommendation}</p>
								</div>
							))}
						</div>
						<p className="mt-4 text-sm font-semibold text-emerald-300">Next Step: {reading.personalizedNextStep}</p>
					</div>
					</div>
				</div>
			</div>
		</div>
	);
}
