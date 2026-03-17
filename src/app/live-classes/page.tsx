import Link from "next/link";
import { Button } from "@/src/components/common/button";
import { ArrowUpRight, CalendarDays, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import { LiveClassSinglePurchase } from "@/src/components/payment/live-class-single-purchase";
import { buildZoomDesktopLink, getMeetingPlatformLabel } from "@/src/lib/meeting-platform";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/auth";

const classBenefits = [
	"Haftada 4 saat planlanan canli ders programi",
	"Zoom uzerinden canli soru-cevap imkani",
	"Ders kayitlarina sonradan erisim",
	"Tek tek ders satin alma secenegi",
];

function formatPrice(price: number | null) {
	if (price === null || price <= 0) {
		return "Planlanmadi";
	}

	return new Intl.NumberFormat("tr-TR", {
		style: "currency",
		currency: "TRY",
		maximumFractionDigits: 0,
	}).format(price);
}

export default async function LiveClassesPage() {
	const now = new Date();
	const session = await getServerSession(authOptions);
	const [classes, activeLiveClassSubscription] = await Promise.all([
		prisma.liveClass.findMany({
			orderBy: { scheduledAt: "asc" },
		}),
		session?.user?.id
			? prisma.subscription.findFirst({
				where: {
					userId: session.user.id,
					status: { in: ["ACTIVE", "TRIALING"] },
					startDate: { lte: now },
					OR: [{ endDate: null }, { endDate: { gte: now } }],
					plan: { includesLiveClass: true },
				},
				include: { plan: { select: { name: true } } },
			})
			: Promise.resolve(null),
	]);

	const upcomingClasses = classes.filter((item) => item.scheduledAt >= now);
	const pastClasses = classes.filter((item) => item.scheduledAt < now);
	const nextClass = upcomingClasses[0];
	const purchasableCount = upcomingClasses.filter((item) => (item.singlePrice ?? 0) > 0).length;
	const startOfWeek = new Date(now);
	startOfWeek.setHours(0, 0, 0, 0);
	startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 7);
	const weeklyCount = upcomingClasses.filter(
		(item) => item.scheduledAt >= startOfWeek && item.scheduledAt < endOfWeek,
	).length;

	const purchasedClassIds = session?.user?.id
		? new Set(
				(
					await prisma.liveClassPurchase.findMany({
						where: { userId: session.user.id, status: "PAID" },
						select: { liveClassId: true },
					})
				).map((item) => item.liveClassId),
		  )
		: new Set<string>();
	const hasLiveClassPlan = Boolean(activeLiveClassSubscription);

	return (
		<div className="mx-auto max-w-7xl px-6 py-10">
			<section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(135deg,rgba(18,20,28,0.98),rgba(10,11,15,0.95)_45%,rgba(31,24,12,0.92))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl md:p-10 xl:p-12">
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)] opacity-40" />
				<div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-amber-300/10" />
				<div className="pointer-events-none absolute right-16 top-16 h-24 w-24 rounded-full border border-white/10" />

				<div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.12fr)_360px] xl:items-center">
					<div>
						<span className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/35 bg-amber-400/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300 shadow-[0_0_24px_rgba(212,168,67,0.12)]">
							<span className="h-2 w-2 rounded-full bg-amber-400" />
							Bilal Hoca Live Sessions
						</span>

						<div className="mt-7 flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
							<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Haftada 4 Saat</span>
							<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Zoom Oturumları</span>
							<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Tek Ders Satışı</span>
						</div>

						<h1 className="mt-8 max-w-4xl text-4xl font-black leading-[0.96] text-white md:text-6xl xl:text-7xl">
							<span className="block">Canlı ders takvimiyle</span>
							<span className="mt-2 block bg-gradient-to-r from-[#fff2b8] via-[#f7d96b] to-[#d4a843] bg-clip-text text-transparent">
								haftalık ritmini yükselt
							</span>
						</h1>
						<p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 md:text-xl md:leading-9">
							Haftada 4 saatlik Zoom grup dersleri, soru çözüm oturumları ve strateji anlatımlarıyla hazırlığını daha düzenli, daha görünür ve daha güçlü bir ritimde sürdür.
						</p>

						<div className="mt-10 flex flex-wrap gap-4">
							<Button href="/dashboard" variant="outline" size="lg" className="rounded-2xl border-white/20 bg-white/6 backdrop-blur-sm hover:bg-white/10">
								Dashboard&apos;a Dön
							</Button>
							<Button href="/pricing" size="lg" className="rounded-2xl bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] text-zinc-950 shadow-[0_20px_50px_rgba(212,168,67,0.28)] hover:brightness-105">
								Canlı Ders Planını Aç
							</Button>
						</div>
					</div>

					<div className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
						<div className="rounded-[26px] border border-white/10 bg-[#0d1017]/90 p-5">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">Canlı Program Özeti</p>
									<h2 className="mt-3 text-2xl font-black text-white">Katılım, kayıt ve esneklik tek sistemde</h2>
								</div>
								<div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
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
											<p className="text-sm font-semibold text-white">Canlı erişim modeli</p>
											<p className="mt-1 text-xs leading-6 text-slate-400">Üyelik içinde tam erişim, üyelik dışında tek ders satın alma özgürlüğü.</p>
										</div>
									</div>
								</div>
								<div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
									<div className="flex items-center gap-3">
										<div className="rounded-xl bg-sky-500/10 p-2 text-sky-300">
											<Clock3 size={16} />
										</div>
										<div>
											<p className="text-sm font-semibold text-white">Haftalık yoğunluk</p>
											<p className="mt-1 text-xs leading-6 text-slate-400">{weeklyCount} oturum bu hafta planlandı. Program 4 saatlik düzenli ritme göre akıyor.</p>
										</div>
									</div>
								</div>
								<div className="rounded-2xl border border-amber-400/18 bg-[linear-gradient(135deg,rgba(212,168,67,0.14),rgba(255,255,255,0.03))] p-4">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">Sıradaki Oturum</p>
											<p className="mt-2 text-base font-bold text-white">{nextClass ? nextClass.title : "Yeni oturum planlanıyor"}</p>
											<p className="mt-1 text-xs leading-6 text-amber-100/80">
												{nextClass ? `${format(nextClass.scheduledAt, "d MMMM yyyy · HH:mm", { locale: tr })} · ${nextClass.durationMinutes} dk` : "Takvim çok yakında güncellenecek."}
											</p>
										</div>
										<Link href="#live-class-list" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white transition hover:bg-white/14">
											<ArrowUpRight size={18} />
										</Link>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				{[
					{
						title: "Bu Hafta Ders",
						value: `${weeklyCount} oturum`,
						text: "Program haftada 4 saatlik canlı ders ritmine göre ilerler.",
						icon: <CalendarDays size={16} />,
						accent: "text-sky-300",
					},
					{
						title: "Sonraki Ders",
						value: nextClass ? format(nextClass.scheduledAt, "HH:mm", { locale: tr }) : "--:--",
						text: nextClass ? format(nextClass.scheduledAt, "d MMMM EEEE", { locale: tr }) : "Yeni ders takvimi yakında eklenecek.",
						icon: <Clock3 size={16} />,
						accent: "text-emerald-300",
					},
					{
						title: "Kayıt Arşivi",
						value: `${pastClasses.length} ders`,
						text: "Geçmiş oturumlar tekrar izleme için hazır.",
						icon: <ShieldCheck size={16} />,
						accent: "text-white",
					},
					{
						title: "Tek Ders Satın Alım",
						value: `${purchasableCount} oturum`,
						text: "Üyelikten bağımsız tek tek ders satın alımı açık.",
						icon: <Sparkles size={16} />,
						accent: "text-amber-300",
						featured: true,
					},
				].map((item) => (
					<div key={item.title} className={`rounded-3xl border p-6 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl ${item.featured ? "border-amber-400/30 bg-gradient-to-br from-amber-400/15 to-zinc-900/70" : "border-white/15 bg-white/5"}`}>
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm text-slate-400">{item.title}</p>
							<div className={`rounded-2xl border border-white/10 bg-white/5 p-2 ${item.accent}`}>{item.icon}</div>
						</div>
						<h2 className="mt-4 text-3xl font-black text-white">{item.value}</h2>
						<p className={`mt-2 text-sm ${item.featured ? "text-slate-200" : "text-slate-300"}`}>{item.text}</p>
					</div>
				))}
			</div>

			{hasLiveClassPlan ? (
				<div className="mt-6 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-white">
					<p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Aktif Canli Ders Erisimi</p>
					<p className="mt-2 text-lg font-bold">
						{activeLiveClassSubscription?.plan.name} planin ile tum canli derslere ekstra odeme olmadan katilabilirsin.
					</p>
					<p className="mt-2 text-sm text-emerald-100/80">
						Zoom baglantilari ders kartlarinda otomatik gorunur. Tek ders satin alma sadece uyeligi olmayanlar icin gerekir.
					</p>
				</div>
			) : null}

			<div id="live-class-list" className="mt-10 grid gap-6 lg:grid-cols-3">
				{/* Yaklaşan ders spotlight */}
				{nextClass ? (
					<div className="rounded-3xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-400/10 via-zinc-900/80 to-zinc-900/60 p-6 shadow-[0_20px_60px_rgba(212,168,67,0.20)] backdrop-blur-xl lg:col-span-3">
						<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex-1">
								<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
									<span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
									Yaklaşan Ders
								</div>
								<h2 className="text-2xl font-black text-white md:text-3xl">{nextClass.title}</h2>
								<p className="mt-2 text-amber-200 font-medium">
									{format(nextClass.scheduledAt, "d MMMM EEEE · HH:mm", { locale: tr })} · {nextClass.durationMinutes} dk
								</p>
								{nextClass.description ? (
									<p className="mt-3 text-sm leading-6 text-slate-300">{nextClass.description}</p>
								) : null}
								{nextClass.topicOutline ? (
									<p className="mt-2 text-sm text-zinc-400"><span className="text-zinc-300 font-medium">Konular:</span> {nextClass.topicOutline}</p>
								) : null}
							</div>
							<div className="w-full lg:w-80 shrink-0">
								{hasLiveClassPlan || purchasedClassIds.has(nextClass.id) ? (
									<div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
										<p className="text-sm font-bold text-emerald-200">
											{hasLiveClassPlan ? "Bu ders planina dahil" : "Bu dersi satin aldin"}
										</p>
										<p className="mt-2 text-xs leading-6 text-emerald-100/80">
											{nextClass.meetingLink
												? `${getMeetingPlatformLabel(nextClass.meetingLink)} baglantin hazir.`
												: "Ders baglantisi ders saatine yakin aktif edilir ve e-posta ile de paylasilir."}
										</p>
										<div className="mt-4 flex flex-wrap gap-3">
											{buildZoomDesktopLink(nextClass.meetingLink) ? (
												<a href={buildZoomDesktopLink(nextClass.meetingLink) ?? "#"} className="inline-flex items-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-300">
													Zoom&apos;da Ac
												</a>
											) : null}
											{nextClass.meetingLink ? (
												<a href={nextClass.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
													Tarayicida Katil
												</a>
											) : null}
										</div>
									</div>
								) : (
									<LiveClassSinglePurchase
										liveClassId={nextClass.id}
										title={nextClass.title}
										description={nextClass.description}
										topicOutline={nextClass.topicOutline}
										scheduledAt={nextClass.scheduledAt}
										durationMinutes={nextClass.durationMinutes}
										singlePrice={nextClass.singlePrice}
									/>
								)}
							</div>
						</div>
					</div>
				) : null}

				<div className="rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:col-span-2">
					<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
						<div>
							<h2 className="text-xl font-bold text-white">Canli ders takibi</h2>
							<p className="mt-1 text-sm text-slate-300">
								Ders tarihi, sure, konu basliklari ve satin alim durumu tek ekranda takip edilir.
							</p>
						</div>
						<Button variant="secondary" size="sm">
							Takvimi Senkronize Et
						</Button>
					</div>

					<div className="mt-6 space-y-4">
						{upcomingClasses.length === 0 ? (
							<div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-5 py-6 text-sm text-slate-400">
								Yaklasan canli ders bulunmuyor. Admin panelinden yeni ders eklenebilir.
							</div>
						) : null}

						{upcomingClasses.map((item, index) => {
							const alreadyPurchased = purchasedClassIds.has(item.id);
							const hasAccess = hasLiveClassPlan || alreadyPurchased;
							const zoomDesktopLink = buildZoomDesktopLink(item.meetingLink);
							return (
							<div
								key={item.id}
								className="rounded-2xl border border-white/10 bg-zinc-900/40 px-5 py-4"
							>
								<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
									<div className="flex items-start gap-4">
										<span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-zinc-900">
											{index + 1}
										</span>
										<div>
											<h3 className="text-lg font-bold text-white">{item.title}</h3>
											<p className="mt-2 text-sm text-slate-300">
												{format(item.scheduledAt, "d MMMM EEEE · HH:mm", { locale: tr })} · {item.durationMinutes} dk
											</p>
											{item.topicOutline ? (
												<p className="mt-2 text-xs text-zinc-400">Konu Basliklari: {item.topicOutline}</p>
											) : null}
											{item.description ? (
												<p className="mt-1 text-xs text-zinc-500">Not: {item.description}</p>
											) : null}
										</div>
									</div>
									<span className="inline-flex rounded-full border border-amber-400/35 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
										{hasLiveClassPlan
											? "UYELIKTE DAHIL"
											: alreadyPurchased
												? "SATIN ALINDI"
											: (item.singlePrice ?? 0) > 0
												? `TEK DERS ${formatPrice(item.singlePrice)}`
												: "SADECE UYELIK"}
									</span>
								</div>
								<div className="mt-4">
									{hasAccess ? (
										<div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
											<p className="font-semibold text-emerald-200">
												{hasLiveClassPlan ? "Planin ile bu derse dogrudan katilabilirsin." : "Bu derse tek ders satin alim ile erisim hakkin var."}
											</p>
											<p className="mt-2 text-xs text-emerald-100/80">
												{item.meetingLink
													? `${getMeetingPlatformLabel(item.meetingLink)} baglantisi aktif.`
													: "Baglanti ders saatine yakin aktif edilir ve e-posta ile de paylasilir."}
											</p>
											<div className="mt-3 flex flex-wrap gap-2">
												{zoomDesktopLink ? (
													<a href={zoomDesktopLink} className="inline-flex items-center rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-300">
														Zoom&apos;da Ac
													</a>
												) : null}
												{item.meetingLink ? (
													<a href={item.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10">
														Derse Katil
													</a>
												) : null}
											</div>
										</div>
									) : (
										<LiveClassSinglePurchase
											liveClassId={item.id}
											title={item.title}
											description={item.description}
											topicOutline={item.topicOutline}
											scheduledAt={item.scheduledAt}
											durationMinutes={item.durationMinutes}
											singlePrice={item.singlePrice}
										/>
									)}
								</div>
							</div>
							);
						})}
					</div>

					<div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
						<h3 className="text-lg font-bold text-white">Bu haftanin odak konusu</h3>
						<p className="mt-3 text-sm leading-7 text-slate-300">
							Bu hafta canli derslerde cloze test stratejileri, advanced vocabulary ve
							reading hiz yonetimi uzerinde yogunlasiliyor. Derse girmeden once ilgili
							vocabulary ve reading modullerini tamamlaman tavsiye edilir.
						</p>
					</div>
				</div>

				<div className="space-y-6">
					<div className="rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
						<h2 className="text-xl font-bold text-white">Canli ders avantajlari</h2>
						<div className="mt-5 space-y-3">
							{classBenefits.map((item, index) => (
								<div
									key={item}
									className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
								>
									<span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-zinc-900">
										{index + 1}
									</span>
									<p className="text-sm font-medium text-slate-200">{item}</p>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/15 to-zinc-900/70 p-6 text-white shadow-[0_14px_40px_rgba(212,168,67,0.16)]">
						<p className="text-sm font-semibold text-amber-200">Bilal Hoca notu</p>
						<h3 className="mt-2 text-xl font-black">Haftada 4 saat + tek ders secenegi</h3>
						<p className="mt-3 text-sm leading-7 text-slate-200">
							Canli ders paketleri haftada 4 saatlik duzenli programa gore planlanir.
							Uyelik istemezsen ilgili oturumu tek tek satin alip Zoom uzerinden katilim saglayabilirsin.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
