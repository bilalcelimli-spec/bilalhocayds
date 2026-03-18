import { getServerSession } from "next-auth";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import { authOptions } from "@/src/auth";
import PricingCheckout from "@/src/components/payment/pricing-checkout";
import { SessionBanner } from "@/src/components/common/session-banner";

function reorderPopularToMiddle<T extends { slug: string }>(items: T[]): T[] {
	if (items.length !== 3) return items;
	const idx = items.findIndex((p) => p.slug === "premium");
	if (idx === 1 || idx === -1) return items;
	const reordered = [...items];
	const [popular] = reordered.splice(idx, 1);
	reordered.splice(1, 0, popular);
	return reordered;
}

export default async function PricingPage() {
	const [session, rawPlans] = await Promise.all([
		getServerSession(authOptions),
		prisma.plan.findMany({
			where: { isActive: true },
			orderBy: { monthlyPrice: "asc" },
			select: {
				id: true,
				name: true,
				slug: true,
				description: true,
				monthlyPrice: true,
				yearlyPrice: true,
				includesLiveClass: true,
				includesAIPlanner: true,
				includesReading: true,
				includesGrammar: true,
				includesVocab: true,
			},
		}),
	]);

	const plans = reorderPopularToMiddle(rawPlans);
	const isLoggedInStudent = session?.user?.role === "STUDENT";
	const premiumPlan = plans.find((plan) => plan.slug === "premium") ?? plans[0] ?? null;
	const liveClassPlanCount = plans.filter((plan) => plan.includesLiveClass).length;

	return (
		<div className="mx-auto max-w-7xl px-6 py-10">
			{isLoggedInStudent && (
				<SessionBanner
					userName={session.user.name ?? ""}
					userEmail={session.user.email ?? ""}
				/>
			)}
			<section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(135deg,rgba(18,20,28,0.98),rgba(10,11,15,0.95)_45%,rgba(31,24,12,0.92))] px-6 py-10 shadow-[0_30px_120px_rgba(0,0,0,0.42)] md:px-10 md:py-14 xl:px-14 xl:py-16">
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)] opacity-40" />
				<div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-amber-300/10" />
				<div className="pointer-events-none absolute right-16 top-16 h-24 w-24 rounded-full border border-white/10" />

				<div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.12fr)_360px] xl:items-center">
					<div>
						<div className="inline-flex max-w-full flex-wrap items-center gap-2.5 rounded-full border border-amber-400/35 bg-amber-400/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300 shadow-[0_0_24px_rgba(212,168,67,0.12)] sm:text-xs sm:tracking-[0.28em]">
							<span className="h-2 w-2 rounded-full bg-amber-400" />
							Üyelik Planları
						</div>

						<div className="mt-7 flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
							<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">AI Planlama</span>
							<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Haftada 4 Saat Canlı Ders</span>
							<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Esnek Paket Yapısı</span>
						</div>

						<h1 className="mt-8 max-w-4xl text-4xl font-black leading-[0.96] text-white sm:text-5xl md:text-6xl xl:text-7xl">
							<span className="block">Hedefine uygun</span>
							<span className="mt-2 block bg-gradient-to-r from-[#fff2b8] via-[#f7d96b] to-[#d4a843] bg-clip-text text-transparent">
								premium planı seç
							</span>
						</h1>

						<p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 md:text-xl md:leading-9">
							Vocabulary, reading, grammar, AI planner ve canlı ders erişimini ihtiyacına göre şekillendir. Her paket daha net bir çalışma ritmi ve daha güçlü bir takip sistemi için hazırlandı.
						</p>

						<p className="mt-4 max-w-2xl text-sm leading-7 text-amber-300/90 md:text-base">
							Canlı ders içeren paketlerde program haftada 4 saat olarak planlanır. Dilersen tek tek canlı ders satın alma seçeneğini de kullanabilirsin.
						</p>
					</div>

					<div className="relative">
						<div className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
							<div className="rounded-[26px] border border-white/10 bg-[#0d1017]/90 p-5">
								<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<div className="min-w-0">
										<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">Plan Özeti</p>
										<h2 className="mt-3 break-words text-2xl font-black text-white">Hızlı karar için net çerçeve</h2>
									</div>
									<div className="w-fit rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
										<Sparkles size={18} />
									</div>
								</div>

								<div className="mt-6 space-y-3">
									<div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
										<div className="flex items-center gap-3">
											<div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
												<ShieldCheck size={16} />
											</div>
											<div>
												<p className="text-sm font-semibold text-white">Başlangıç fiyatı</p>
												<p className="mt-1 text-xs leading-6 text-slate-400">
													{premiumPlan
														? `${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(premiumPlan.monthlyPrice ?? 0)} seviyesinden başlayan planlar`
														: "Farklı ihtiyaç seviyeleri için plan seçenekleri"}
												</p>
											</div>
										</div>
									</div>

									<div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
										<div className="flex items-center gap-3">
											<div className="rounded-xl bg-sky-500/10 p-2 text-sky-300">
												<CalendarDays size={16} />
											</div>
											<div>
												<p className="text-sm font-semibold text-white">Canlı ders erişimi</p>
												<p className="mt-1 text-xs leading-6 text-slate-400">{liveClassPlanCount} plan içinde haftada 4 saat canlı ders programı yer alıyor.</p>
											</div>
										</div>
									</div>

									<div className="rounded-2xl border border-amber-400/18 bg-[linear-gradient(135deg,rgba(212,168,67,0.14),rgba(255,255,255,0.03))] p-4">
										<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
											<div className="min-w-0">
												<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">Detaylı İnceleme</p>
												<p className="mt-2 break-words text-base font-bold text-white">Paketleri tek tek aç, kapsamı karşılaştır, en doğru ritmi seç.</p>
											</div>
											<Link href="#pricing-cards" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white transition hover:bg-white/14">
												<ArrowUpRight size={18} />
											</Link>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<div id="pricing-cards">
				<PricingCheckout plans={plans} />
			</div>

			<div className="mt-12 rounded-3xl border border-white/8 bg-zinc-900/60 p-8 backdrop-blur-xl">
				<div className="grid gap-6 md:grid-cols-3">
					<div>
						<div className="mb-3 h-0.5 w-8 rounded-full bg-amber-400/60" />
						<h3 className="text-lg font-bold text-white">Tüm planlarda</h3>
						<p className="mt-2 text-sm leading-7 text-slate-400">
							Sınav odaklı içerik yapısı, panel takibi ve düzenli güncellenen çalışma
							akışı bulunur.
						</p>
					</div>
					<div>
						<div className="mb-3 h-0.5 w-8 rounded-full bg-amber-400/60" />
						<h3 className="text-lg font-bold text-white">Esnek geçiş</h3>
						<p className="mt-2 text-sm leading-7 text-slate-400">
							İhtiyacın değiştikçe planını daha kapsamlı bir pakete taşıyabilirsin.
						</p>
					</div>
					<div>
						<div className="mb-3 h-0.5 w-8 rounded-full bg-amber-400/60" />
						<h3 className="text-lg font-bold text-white">Bilal Hoca desteği</h3>
						<p className="mt-2 text-sm leading-7 text-slate-400">
							Özellikle Pro ve Premium paketlerde strateji ve süreç takibi daha güçlü.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
