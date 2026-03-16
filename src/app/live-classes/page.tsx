import { Button } from "@/src/components/common/button";
import { prisma } from "@/src/lib/prisma";
import { LiveClassSinglePurchase } from "@/src/components/payment/live-class-single-purchase";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/auth";

const classBenefits = [
	"Canli soru-cevap imkani",
	"Ders kayitlarina sonradan erisim",
	"Haftalik odak konu planlamasi",
	"Sinav formatina uygun cozum teknikleri",
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
	const classes = await prisma.liveClass.findMany({
		orderBy: { scheduledAt: "asc" },
	});

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

	return (
		<div className="mx-auto max-w-7xl px-6 py-10">
			<section className="relative overflow-hidden rounded-[34px] border border-white/15 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-amber-950/20 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-10">
				<div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />
				<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-300">
							BILAL HOCA LIVE SESSIONS
						</span>
						<h1 className="mt-4 max-w-3xl text-3xl font-black text-white md:text-5xl">
							Canli ders takvimi ile haftalik ritmini koru
						</h1>
						<p className="mt-3 max-w-2xl text-slate-300 md:text-lg">
							Haftalik grup dersleri, soru cozum oturumlari ve strateji anlatimlariyla
							sinava hazirligini sistemli, olculebilir ve surekli hale getir.
						</p>
					</div>

					<div className="flex flex-wrap gap-3">
						<Button href="/dashboard" variant="outline">
							Dashboard&apos;a Don
						</Button>
						<Button href="/pricing">Canli Ders Planini Ac</Button>
					</div>
				</div>
			</section>

			<div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">Bu Hafta Ders</p>
					<h2 className="mt-2 text-3xl font-black text-white">{weeklyCount} oturum</h2>
					<p className="mt-2 text-sm text-slate-300">
						YDS odakli haftalik canli program aktif.
					</p>
				</div>

				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">Sonraki Ders</p>
					<h2 className="mt-2 text-3xl font-black text-white">
						{nextClass ? format(nextClass.scheduledAt, "HH:mm", { locale: tr }) : "--:--"}
					</h2>
					<p className="mt-2 text-sm text-slate-300">
						{nextClass
							? format(nextClass.scheduledAt, "d MMMM EEEE", { locale: tr })
							: "Yeni ders takvimi yakinda eklenecek."}
					</p>
				</div>

				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
					<p className="text-sm text-slate-400">Kayit Arsivi</p>
					<h2 className="mt-2 text-3xl font-black text-white">{pastClasses.length} ders</h2>
					<p className="mt-2 text-sm text-slate-300">
						Gecmis oturumlar tekrar izleme icin hazir.
					</p>
				</div>

				<div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/15 to-zinc-900/70 p-6 shadow-[0_14px_40px_rgba(212,168,67,0.16)]">
					<p className="text-sm text-amber-200">Tek Ders Satin Alim</p>
					<h2 className="mt-2 text-3xl font-black text-white">{purchasableCount} oturum</h2>
					<p className="mt-2 text-sm text-slate-200">
						Yillik uyelikten bagimsiz tek ders katilim satin alimi acik.
					</p>
				</div>
			</div>

			<div className="mt-10 grid gap-6 lg:grid-cols-3">
				{/* Yaklaşan ders spotlight */}
				{nextClass && !purchasedClassIds.has(nextClass.id) && (nextClass.singlePrice ?? 0) > 0 ? (
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
								<LiveClassSinglePurchase
									liveClassId={nextClass.id}
									title={nextClass.title}
									description={nextClass.description}
									topicOutline={nextClass.topicOutline}
									scheduledAt={nextClass.scheduledAt}
									durationMinutes={nextClass.durationMinutes}
									singlePrice={nextClass.singlePrice}
								/>
							</div>
						</div>
					</div>
				) : null}

				<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:col-span-2">
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
										{alreadyPurchased
											? "SATIN ALINDI"
											: (item.singlePrice ?? 0) > 0
												? `TEK DERS ${formatPrice(item.singlePrice)}`
												: "SADECE UYELIK"}
									</span>
								</div>
								<div className="mt-4">
									{alreadyPurchased ? (
										<div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-200">
											Bu derse tek ders satin alim ile erisim hakkin var.
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

					<div className="mt-6 rounded-3xl border border-white/10 bg-zinc-900/50 p-6">
						<h3 className="text-lg font-bold text-white">Bu haftanin odak konusu</h3>
						<p className="mt-3 text-sm leading-7 text-slate-300">
							Bu hafta canli derslerde cloze test stratejileri, advanced vocabulary ve
							reading hiz yonetimi uzerinde yogunlasiliyor. Derse girmeden once ilgili
							vocabulary ve reading modullerini tamamlaman tavsiye edilir.
						</p>
					</div>
				</div>

				<div className="space-y-6">
					<div className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
						<h2 className="text-xl font-bold text-white">Canli ders avantajlari</h2>
						<div className="mt-5 space-y-3">
							{classBenefits.map((item, index) => (
								<div
									key={item}
									className="flex items-start gap-3 rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-4"
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
						<h3 className="mt-2 text-xl font-black">Tek ders satin alim bagimsizdir</h3>
						<p className="mt-3 text-sm leading-7 text-slate-200">
							Yillik uyeligin olmasa bile tek ders satin alip ilgili oturuma katilabilirsin.
							Yillik plan ise tum derslere devamli erisim avantajini korur.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
