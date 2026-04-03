import { VocabularyPracticePanel } from "@/src/components/vocabulary/vocabulary-practice-panel";
import { authOptions } from "@/src/auth";
import { getOrCreateStudentDailyContent, regenerateStudentDailyContent } from "@/src/lib/student-daily-content";
import { DailyContentModule } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { ArrowLeft, BookMarked, CheckCircle2, Layers, RotateCcw, Sparkles, Target, TrendingUp, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

const LEVEL_COLOR: Record<string, string> = {
	B1: "border-sky-500/25 bg-sky-500/10 text-sky-300",
	B2: "border-blue-500/25 bg-blue-500/10 text-blue-300",
	C1: "border-violet-500/25 bg-violet-500/10 text-violet-300",
	C2: "border-amber-500/25 bg-amber-500/10 text-amber-300",
};

export default async function VocabularyPage() {
	async function refreshTodayContentAction() {
		"use server";

		const actionSession = await getServerSession(authOptions);
		if (!actionSession?.user?.id) return;

		await Promise.all([
			regenerateStudentDailyContent(actionSession.user.id, DailyContentModule.VOCABULARY),
			regenerateStudentDailyContent(actionSession.user.id, DailyContentModule.READING),
		]);

		revalidatePath("/vocabulary");
		revalidatePath("/reading");
		revalidatePath("/dashboard");
	}

	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return null;

	const vocab = await getOrCreateStudentDailyContent(session.user.id, DailyContentModule.VOCABULARY);
	const todayWords = vocab.items;
	const reading = vocab.reading;

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
						<BookMarked size={13} className="text-amber-400" />
						Vocabulary
					</span>
					<div className="ml-auto flex items-center gap-3">
						<span className="hidden rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-amber-400 sm:inline-flex">
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
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-5 py-8 space-y-6">
				{/* ── hero card ── */}
				<div className="relative overflow-hidden rounded-[28px] border border-amber-500/15 bg-gradient-to-br from-[#1a1408] via-[#100f0a] to-[#0a0b0f] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
					<div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/8 blur-3xl" />
					<div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-yellow-600/6 blur-3xl" />

					<div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex-1 min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
									<Sparkles size={10} />
									AI Vocabulary Lab
								</span>
							</div>
							<h1 className="mt-3 text-2xl font-black leading-snug text-white md:text-3xl">
								{vocab.sessionTitle}
							</h1>
							<p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
								{vocab.studentProfileSummary}
							</p>
							<div className="mt-4 flex items-center gap-2">
								<Target size={13} className="text-amber-400" />
								<span className="text-sm font-semibold text-amber-300">{vocab.dailyGoal}</span>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 shrink-0">
							{[
								{ Icon: BookMarked, label: "Kelime", value: String(todayWords.length), color: "text-amber-400" },
								{ Icon: Layers, label: "Aktivite", value: String(vocab.activities.length), color: "text-yellow-400" },
								{ Icon: Zap, label: "Model", value: vocab.model, color: "text-orange-400" },
								{ Icon: TrendingUp, label: "Güncelleme", value: "Günlük", color: "text-red-400" },
							].map(({ Icon, label, value, color }) => (
								<div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-center">
									<Icon size={14} className={`mx-auto ${color}`} />
									<p className="mt-1.5 text-xl font-black text-white leading-tight">{value}</p>
									<p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</p>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* ── warm-up + study flow ── */}
				<div className="grid gap-5 lg:grid-cols-2">
					<div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
						<div className="flex items-center gap-2 mb-4">
							<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
								<Zap size={13} className="text-amber-400" />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Oturum Başlangıcı</p>
								<p className="text-sm font-bold text-white">Warm-Up</p>
							</div>
						</div>
						<div className="space-y-2">
							{vocab.warmUp.map((item) => (
								<div key={item} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300">
									{item}
								</div>
							))}
						</div>
					</div>

					<div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
						<div className="flex items-center gap-2 mb-4">
							<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
								<CheckCircle2 size={13} className="text-emerald-400" />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Çalışma Yöntemi</p>
								<p className="text-sm font-bold text-white">Study Flow</p>
							</div>
						</div>
						<div className="space-y-2">
							{[
								"Kelimeleri sesli oku ve vurgu düzenini fark et.",
								"Her kelime için bağlam ipuçları bulmaya çalış.",
								"AI örnek cümlesini oku ve kendi cümleni yaz.",
								"Oturumun sonunda kısa bir retrieval quiz yap.",
							].map((step, i) => (
								<div key={step} className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
									<span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-zinc-900">
										{i + 1}
									</span>
									<p className="text-sm leading-6 text-slate-300">{step}</p>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* ── word cards grid ── */}
				<div>
					<div className="mb-5 flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
							<BookMarked size={15} className="text-amber-400" />
						</div>
						<div>
							<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Günün Seti</p>
							<h2 className="text-lg font-black text-white">Bugünün {todayWords.length} Akademik Kelimesi</h2>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{todayWords.map((item, idx) => {
							const levelClass = LEVEL_COLOR[item.level] ?? "border-white/10 bg-white/5 text-slate-300";
							return (
								<div
									key={item.word}
									className="group relative overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#0e1117] p-5 transition-all duration-300 hover:border-amber-500/20 hover:shadow-[0_8px_30px_rgba(212,168,67,0.08)]"
								>
									<div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/[0.04] blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />

									{/* header row */}
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2.5">
											<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-[11px] font-black text-amber-400">
												{idx + 1}
											</span>
											<h3 className="text-lg font-black tracking-tight text-white">{item.word}</h3>
										</div>
										<span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] ${levelClass}`}>
											{item.level}
										</span>
									</div>

									{/* meanings */}
									<div className="mt-3 space-y-1">
										<p className="text-sm font-semibold text-amber-300">{item.trMeaning}</p>
										<p className="text-xs leading-5 text-slate-400">{item.englishDefinition}</p>
									</div>

									{/* synonym + collocation */}
									<div className="mt-3 grid grid-cols-2 gap-2">
										<div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2">
											<p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">Synonym</p>
											<p className="mt-0.5 text-xs font-semibold text-slate-300">{item.synonym}</p>
										</div>
										<div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2">
											<p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">Collocation</p>
											<p className="mt-0.5 text-xs font-semibold text-slate-300">{item.collocation}</p>
										</div>
									</div>

									{/* example sentence */}
									{item.examples[0] && (
										<div className="mt-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-3 py-2.5">
											<p className="text-xs leading-5 text-amber-100 font-medium">&ldquo;{item.examples[0].en}&rdquo;</p>
											<p className="mt-1 text-xs text-slate-500">{item.examples[0].tr}</p>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* ── daily vocab reading ── */}
				{reading ? (
					<div className="rounded-[24px] border border-amber-500/15 bg-white/[0.02] p-6">
						<div className="flex flex-wrap items-start justify-between gap-3 mb-4">
							<div className="flex items-center gap-2">
								<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
									<Sparkles size={13} className="text-amber-400" />
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Bağlam Okuma</p>
									<h2 className="text-base font-bold text-white">Günlük AI Reading Parçası</h2>
								</div>
							</div>
							<span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
								Bugünkü hedef kelimeler bu parçada geçiyor
							</span>
						</div>
						<h3 className="text-lg font-bold text-slate-100 mb-3">{reading.title}</h3>
						<p className="text-sm leading-8 text-slate-300">{reading.passage}</p>
						<div className="mt-4 flex flex-wrap gap-2">
							{reading.words.map((word) => (
								<span key={word} className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1 text-xs font-semibold text-amber-300">
									{word}
								</span>
							))}
						</div>
					</div>
				) : null}

				{/* ── practice activities + performance ── */}
				<div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
					<div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6">
						<div className="flex items-center gap-2 mb-5">
							<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
								<Target size={13} className="text-amber-400" />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Pratik</p>
								<h2 className="text-base font-bold text-white">Sınav Aktiviteleri</h2>
							</div>
						</div>
						<VocabularyPracticePanel activities={vocab.activities} />
					</div>

					<div className="space-y-5">
						{/* strategy notes */}
						<div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
							<div className="flex items-center gap-2 mb-4">
								<div className="flex h-7 w-7 items-center justify-center rounded-xl border border-yellow-500/25 bg-yellow-500/10">
									<Zap size={13} className="text-yellow-400" />
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-500">Strateji</p>
									<p className="text-sm font-bold text-white">Sınav Refleksi</p>
								</div>
							</div>
							<div className="space-y-2.5">
								{vocab.strategyNotes.map((item) => (
									<p key={item} className="border-b border-white/[0.06] pb-2.5 text-sm leading-6 text-slate-300 last:border-0 last:pb-0">
										{item}
									</p>
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
									<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Gelişim</p>
									<p className="text-sm font-bold text-white">Performans</p>
								</div>
							</div>
							<p className="text-sm leading-6 text-slate-400 mb-4">{vocab.performanceEvaluation.summary}</p>
							<div className="space-y-2">
								{vocab.performanceEvaluation.rubric.map((item) => (
									<div key={item.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
										<div className="flex items-center justify-between mb-1">
											<p className="text-sm font-semibold text-white">{item.label}</p>
											<span className="text-sm font-black tabular-nums text-amber-300">
												{item.score}<span className="text-slate-600 font-normal">/10</span>
											</span>
										</div>
										<div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
											<div
												className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
												style={{ width: `${(item.score / 10) * 100}%` }}
											/>
										</div>
										<p className="mt-2 text-xs text-slate-500">{item.comment}</p>
									</div>
								))}
							</div>
							<p className="mt-4 text-xs font-semibold text-emerald-400">→ {vocab.personalizedNextStep}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}


