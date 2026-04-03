import { AiArticleReader } from "@/src/components/reading/ai-article-reader";
import { ReadingExamPanel } from "@/src/components/reading/reading-exam-panel";
import { authOptions } from "@/src/auth";
import { getOrCreateStudentDailyContent, regenerateStudentDailyContent } from "@/src/lib/student-daily-content";
import { DailyContentModule } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { ArrowLeft, BookOpen, Brain, Clock, FileText, RotateCcw, Target, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

function getWordCount(text: string) {
	return text.split(/\s+/).filter(Boolean).length;
}

export default async function ReadingPage() {
	async function refreshTodayContentAction() {
		"use server";

		const actionSession = await getServerSession(authOptions);
		if (!actionSession?.user?.id) return;

		await Promise.all([
			regenerateStudentDailyContent(actionSession.user.id, DailyContentModule.READING),
			regenerateStudentDailyContent(actionSession.user.id, DailyContentModule.VOCABULARY),
		]);

		revalidatePath("/reading");
		revalidatePath("/vocabulary");
		revalidatePath("/dashboard");
	}

	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return null;

	const [reading, vocabulary] = await Promise.all([
		getOrCreateStudentDailyContent(session.user.id, DailyContentModule.READING),
		getOrCreateStudentDailyContent(session.user.id, DailyContentModule.VOCABULARY),
	]);

	const mainPassage = reading.passages[0];
	const examPassages = reading.passages.slice(1);
	const totalQuestionCount = reading.passages.reduce((sum, p) => sum + p.questions.length, 0);
	const totalWordCount = reading.passages.reduce((sum, p) => sum + getWordCount(p.passage), 0);
	const avgWordCount = Math.round(totalWordCount / Math.max(reading.passages.length, 1));
	const estMinutes = Math.max(5, Math.round(totalWordCount / 200));
	const wordMeanings = Object.fromEntries(vocabulary.items.map((item) => [item.word.toLowerCase(), item.trMeaning]));

	return (
		<div className="min-h-screen">
			{/* ── sticky session nav ── */}
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
						<BookOpen size={13} className="text-sky-400" />
						Reading
					</span>
					<div className="ml-auto flex items-center gap-3">
						<span className="hidden rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-sky-400 sm:inline-flex">
							{new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
						</span>
						<form action={refreshTodayContentAction}>
							<button
								type="submit"
								className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
							>
								<RotateCcw size={11} />
								Yenile
							</button>
						</form>
						<Link
							href="/live-classes"
							className="hidden rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20 sm:inline-flex"
						>
							Canlı Dersler
						</Link>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-5 py-8 space-y-6">
				{/* ── hero session card ── */}
				<div className="relative overflow-hidden rounded-[28px] border border-sky-500/15 bg-gradient-to-br from-[#091522] via-[#0b0f1a] to-[#0a0b0f] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
					<div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-500/8 blur-3xl" />
					<div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-blue-600/6 blur-3xl" />

					<div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex-1 min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
									<BookOpen size={10} />
									Daily Reading Practice
								</span>
								<span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-slate-500">
									YDS &middot; YDT &middot; IELTS
								</span>
							</div>
							<h1 className="mt-3 text-2xl font-black leading-snug text-white md:text-3xl">
								{reading.sessionTitle}
							</h1>
							<p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
								{reading.studentProfileSummary}
							</p>
							<div className="mt-4 flex items-center gap-2">
								<Target size={13} className="text-sky-400" />
								<span className="text-sm font-semibold text-sky-300">{reading.dailyGoal}</span>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 shrink-0">
							{[
								{ Icon: FileText, label: "Pasaj", value: String(reading.passages.length), color: "text-sky-400" },
								{ Icon: BookOpen, label: "Ort. Kelime", value: String(avgWordCount), color: "text-blue-400" },
								{ Icon: Brain, label: "Soru", value: String(totalQuestionCount), color: "text-indigo-400" },
								{ Icon: Clock, label: "Süre", value: `~${estMinutes}dk`, color: "text-cyan-400" },
							].map(({ Icon, label, value, color }) => (
								<div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-center">
									<Icon size={14} className={`mx-auto ${color}`} />
									<p className="mt-1.5 text-2xl font-black text-white">{value}</p>
									<p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</p>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* ── main immersive reader ── */}
				{mainPassage ? (
					<AiArticleReader
						passage={mainPassage}
						generatedAt={reading.generatedAt}
						wordMeanings={wordMeanings}
					/>
				) : null}

				{/* ── reading plan / strategy / performance row ── */}
				{mainPassage ? (
					<div className="grid gap-5 lg:grid-cols-3">
						{/* Reading Plan */}
						<div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
							<div className="flex items-center gap-2 mb-4">
								<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10">
									<BookOpen size={13} className="text-sky-400" />
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500">Bu Oturum</p>
									<p className="text-sm font-bold text-white">Reading Plan</p>
								</div>
							</div>
							<div className="space-y-2">
								{mainPassage.studyPlan.map((item, i) => (
									<div key={item} className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
										<span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
											{i + 1}
										</span>
										<p className="text-sm leading-6 text-slate-300">{item}</p>
									</div>
								))}
							</div>
						</div>

						{/* Strategy */}
						<div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
							<div className="flex items-center gap-2 mb-4">
								<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
									<Target size={13} className="text-amber-400" />
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Sınav Stratejisi</p>
									<p className="text-sm font-bold text-white">Odak Notları</p>
								</div>
							</div>
							<div className="space-y-2.5">
								{reading.strategyNotes.map((item) => (
									<p key={item} className="border-b border-white/[0.06] pb-2.5 text-sm leading-7 text-slate-300 last:border-0 last:pb-0">
										{item}
									</p>
								))}
							</div>
							<p className="mt-4 text-[10px] text-slate-600">
								{new Date(reading.generatedAt).toLocaleDateString("tr-TR")} tarihinde üretildi
							</p>
						</div>

						{/* Performance */}
						<div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
							<div className="flex items-center gap-2 mb-4">
								<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
									<TrendingUp size={13} className="text-emerald-400" />
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Performans</p>
									<p className="text-sm font-bold text-white">Anlık Değerlendirme</p>
								</div>
							</div>
							<p className="text-sm leading-6 text-slate-400 mb-4">{reading.performanceEvaluation.summary}</p>
							<div className="space-y-2">
								{reading.performanceEvaluation.rubric.map((item) => (
									<div key={item.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
										<div className="flex items-center justify-between mb-1">
											<p className="text-sm font-semibold text-white">{item.label}</p>
											<span className="text-sm font-black tabular-nums text-sky-300">{item.score}<span className="text-slate-600 font-normal">/10</span></span>
										</div>
										<div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
											<div
												className="h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-400"
												style={{ width: `${(item.score / 10) * 100}%` }}
											/>
										</div>
										<p className="mt-2 text-xs text-slate-500">{item.comment}</p>
									</div>
								))}
							</div>
							<p className="mt-4 text-xs font-semibold text-emerald-400">
								→ {reading.personalizedNextStep}
							</p>
						</div>
					</div>
				) : null}

				{/* ── exam passages ── */}
				<ReadingExamPanel passages={examPassages} />
			</div>
		</div>
	);
}
