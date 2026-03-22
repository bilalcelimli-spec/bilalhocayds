import { Button } from "@/src/components/common/button";
import { AiArticleReader } from "@/src/components/reading/ai-article-reader";
import { ReadingExamPanel } from "@/src/components/reading/reading-exam-panel";
import { authOptions } from "@/src/auth";
import { getOrCreateStudentDailyContent } from "@/src/lib/student-daily-content";
import { DailyContentModule } from "@prisma/client";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

function getWordCount(text: string) {
	return text.split(/\s+/).filter(Boolean).length;
}

export default async function ReadingPage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return null;
	}

	const [reading, vocabulary] = await Promise.all([
		getOrCreateStudentDailyContent(session.user.id, DailyContentModule.READING),
		getOrCreateStudentDailyContent(session.user.id, DailyContentModule.VOCABULARY),
	]);

	const mainPassage = reading.passages[0];
	const totalQuestionCount = reading.passages.reduce((sum, passage) => sum + passage.questions.length, 0);
	const averageWordCount = Math.round(
		reading.passages.reduce((sum, passage) => sum + getWordCount(passage.passage), 0) /
			Math.max(reading.passages.length, 1),
	);
	const wordMeanings = Object.fromEntries(vocabulary.items.map((item) => [item.word.toLowerCase(), item.trMeaning]));

	return (
		<div className="mx-auto max-w-6xl px-6 py-10">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<span className="inline-flex rounded-full border border-sky-300/40 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
						Daily Reading Practice
					</span>
					<h1 className="mt-4 text-3xl font-black text-white md:text-4xl">
						AI tarafından üretilen günlük sınav reading seti
					</h1>
					<p className="mt-3 max-w-2xl text-slate-300">
						Her gün YDS, YDT ve IELTS tarzına uygun 3 özgün pasaj üretilir. Her pasaj 200-300 kelime aralığında tutulur ve sınav tipi sorularla birlikte gelir.
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<Button href="/dashboard" variant="outline">
						Dashboard&apos;a Dön
					</Button>
					<Button href="/live-classes">Canlı Ders Takvimi</Button>
				</div>
			</div>

			<div className="mt-8 grid gap-4 md:grid-cols-3">
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)] md:col-span-2">
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">{reading.sessionTitle}</p>
					<p className="mt-3 text-sm leading-7 text-slate-200">{reading.studentProfileSummary}</p>
					<p className="mt-3 text-sm font-semibold text-white">Gunluk hedef: {reading.dailyGoal}</p>
				</div>
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
					<p className="text-sm text-slate-400">Today</p>
					<p className="mt-2 text-3xl font-black text-white">{reading.passages.length} passages</p>
					<p className="mt-2 text-sm text-slate-300">Average length: {averageWordCount} words</p>
					<p className="mt-2 text-sm text-slate-300">Questions: {totalQuestionCount}</p>
				</div>
			</div>

			<div className="mt-10 space-y-6">
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
						<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
							<h2 className="text-xl font-bold text-white">Reading plan</h2>
							<div className="mt-5 space-y-3">
								{mainPassage.studyPlan.map((item, index) => (
									<div key={item} className="flex items-start gap-3 rounded-2xl border border-white/15 px-4 py-4">
										<span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
											{index + 1}
										</span>
										<p className="text-sm font-medium text-slate-200">{item}</p>
									</div>
								))}
							</div>
						</div>

						<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
							<p className="text-sm font-semibold text-slate-300">Strategy Notes</p>
							<h3 className="mt-2 text-xl font-black text-white">Stay exam-focused</h3>
							<div className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
								{reading.strategyNotes.map((item) => (
									<p key={item}>{item}</p>
								))}
							</div>
							<p className="mt-3 text-xs text-slate-500">Updated: {new Date(reading.generatedAt).toLocaleDateString("tr-TR")}</p>
						</div>

						<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
							<h2 className="text-xl font-bold text-white">Performance snapshot</h2>
							<p className="mt-3 text-sm text-slate-300">{reading.performanceEvaluation.summary}</p>
							<div className="mt-4 space-y-3">
								{reading.performanceEvaluation.rubric.map((item) => (
									<div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
										<div className="flex items-center justify-between gap-4">
											<p className="text-sm font-semibold text-white">{item.label}</p>
											<p className="text-sm font-black text-sky-300">{item.score}/10</p>
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
