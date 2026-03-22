import { Button } from "@/src/components/common/button";
import { VocabularyPracticePanel } from "@/src/components/vocabulary/vocabulary-practice-panel";
import { authOptions } from "@/src/auth";
import { getOrCreateStudentDailyContent } from "@/src/lib/student-daily-content";
import { DailyContentModule } from "@prisma/client";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

const studySteps = [
	"Read the 10 target words aloud and notice stress patterns.",
	"Find at least one context clue for each word before checking the meaning.",
	"Study the AI example sentence and write one new sentence of your own.",
	"Finish with a short retrieval quiz at the end of the session.",
];

export default async function VocabularyPage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return null;
	}

	const vocab = await getOrCreateStudentDailyContent(session.user.id, DailyContentModule.VOCABULARY);
	const todayWords = vocab.items;
	const reading = vocab.reading;

	return (
		<div className="mx-auto max-w-6xl px-6 py-10">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<span className="inline-flex rounded-full border border-amber-400/35 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
						AI Vocabulary Lab
					</span>
					<h1 className="mt-4 text-3xl font-black text-white md:text-4xl">
						Minimal gunluk vocabulary calisma alani
					</h1>
					<p className="mt-3 max-w-2xl text-slate-300">
						Bugunun kelime seti, kisa reading parcasi ve cevaplanabilir etkinliklerle birlikte gelir. Cevaplar artik dogrudan gosterilmez; sistem icinde cozulur.
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<Button href="/dashboard" variant="outline">
						Dashboard&apos;a Don
					</Button>
					<Button href="/pricing">Premium Kelime Setleri</Button>
				</div>
			</div>

			<div className="mt-8 grid gap-4 md:grid-cols-3">
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)] md:col-span-2">
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">{vocab.sessionTitle}</p>
					<p className="mt-3 text-sm leading-7 text-slate-200">{vocab.studentProfileSummary}</p>
					<p className="mt-3 text-sm font-semibold text-white">Gunluk hedef: {vocab.dailyGoal}</p>
				</div>
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
					<h2 className="text-lg font-bold text-white">Warm-Up</h2>
					<div className="mt-4 space-y-3">
						{vocab.warmUp.map((item) => (
							<div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
								{item}
							</div>
						))}
					</div>
				</div>
			</div>

			<div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
					<p className="text-sm text-slate-400">Bugunku Hedef</p>
					<h2 className="mt-2 text-3xl font-black text-white">10 kelime</h2>
					<p className="mt-2 text-sm text-slate-300">AI secimiyle bugun odaklanilacak akademik set.</p>
				</div>
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
					<p className="text-sm text-slate-400">AI Modeli</p>
					<h2 className="mt-2 text-3xl font-black text-white">{vocab.model}</h2>
					<p className="mt-2 text-sm text-slate-300">Gorevler gunluk tarih ve seviye odagina gore uretilir.</p>
				</div>
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
					<p className="text-sm text-slate-400">Practice</p>
					<h2 className="mt-2 text-3xl font-black text-white">{vocab.activities.length} tasks</h2>
					<p className="mt-2 text-sm text-slate-300">Multiple choice ve short answer etkinlikleriyle ilerler.</p>
				</div>
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
					<p className="text-sm text-slate-400">Guncelleme</p>
					<h2 className="mt-2 text-3xl font-black text-white">Gunluk</h2>
					<p className="mt-2 text-sm text-slate-300">Liste her gun farkli bir akademik odakla yenilenir.</p>
				</div>
			</div>

			<div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
				<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
					<div>
						<h2 className="text-xl font-bold text-white">Bugunun 10 akademik kelimesi</h2>
						<p className="mt-1 text-sm text-slate-300">Her kartta temel anlam, kisa tanim ve bir kullanim ornegi gosterilir.</p>
					</div>

					<div className="mt-6 grid gap-4 md:grid-cols-2">
						{todayWords.map((item) => (
							<div key={item.word} className="rounded-2xl border border-white/15 bg-zinc-900/40 px-5 py-4">
								<div className="flex items-center gap-3">
									<h3 className="text-lg font-bold text-white">{item.word}</h3>
									<span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
										{item.level}
									</span>
								</div>
								<p className="mt-2 text-sm text-slate-300">Anlam: {item.trMeaning}</p>
								<p className="mt-2 text-sm text-slate-400">Definition: {item.englishDefinition}</p>
								<div className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-2">
									<p><span className="font-semibold text-white">Synonym:</span> {item.synonym}</p>
									<p><span className="font-semibold text-white">Collocation:</span> {item.collocation}</p>
								</div>
								<div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
									<p className="text-sm text-slate-100">Example: {item.examples[0]?.en}</p>
									<p className="mt-1 text-sm text-slate-300">TR: {item.examples[0]?.tr}</p>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="space-y-6">
					<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
						<h2 className="text-xl font-bold text-white">Study Flow</h2>
						<div className="mt-5 space-y-3">
							{studySteps.map((step, index) => (
								<div key={step} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-4">
									<span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-zinc-900">
										{index + 1}
									</span>
									<p className="text-sm font-medium text-slate-200">{step}</p>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
						<p className="text-sm font-semibold text-amber-200">Strategy Notes</p>
						<h3 className="mt-2 text-xl font-black">Turn vocabulary into exam reflex</h3>
						<div className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
							{vocab.strategyNotes.map((item) => (
								<p key={item}>{item}</p>
							))}
						</div>
					</div>
				</div>
			</div>

			{reading ? (
				<div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 className="text-xl font-bold text-white">Daily AI Reading</h2>
						<span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
							Today&apos;s target words appear inside this passage
						</span>
					</div>
					<h3 className="mt-3 text-lg font-semibold text-slate-100">{reading.title}</h3>
					<p className="mt-3 text-sm leading-8 text-slate-200">{reading.passage}</p>
					<div className="mt-5 flex flex-wrap gap-2">
						{reading.words.map((word) => (
							<span key={word} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
								{word}
							</span>
						))}
					</div>
				</div>
			) : null}

			<div className="mt-8 grid gap-6 lg:grid-cols-2">
				<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
					<h2 className="text-xl font-bold text-white">Exam Activities</h2>
					<div className="mt-5">
						<VocabularyPracticePanel activities={vocab.activities} />
					</div>
				</div>

				<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
					<h2 className="text-xl font-bold text-white">Performance Evaluation</h2>
					<p className="mt-3 text-sm text-slate-300">{vocab.performanceEvaluation.summary}</p>
					<div className="mt-5 space-y-3">
						{vocab.performanceEvaluation.rubric.map((item) => (
							<div key={item.label} className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
								<div className="flex items-center justify-between gap-4">
									<p className="text-sm font-semibold text-white">{item.label}</p>
									<p className="text-sm font-black text-amber-300">{item.score}/10</p>
								</div>
								<p className="mt-2 text-xs text-slate-300">{item.comment}</p>
								<p className="mt-2 text-xs text-slate-500">{item.recommendation}</p>
							</div>
						))}
					</div>
					<p className="mt-4 text-sm font-semibold text-emerald-300">Next Step: {vocab.personalizedNextStep}</p>
				</div>
			</div>
		</div>
	);
}
