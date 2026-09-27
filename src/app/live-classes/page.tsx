import Link from "next/link";
import { Button } from "@/src/components/common/button";
import { ArrowUpRight, CalendarDays, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import { LiveClassSinglePurchase } from "@/src/components/payment/live-class-single-purchase";
import { buildZoomDesktopLink, detectMeetingPlatform } from "@/src/lib/meeting-platform";
import { getJoinWindow } from "@/src/lib/live-class-access";
import { getServerSession } from "next-auth";
import { getFormatter, getTranslations } from "next-intl/server";
import { authOptions } from "@/src/auth";
import { buildPublicPageMetadata } from "@/src/lib/page-metadata";

const benefitKeys = ["benefit1", "benefit2", "benefit3", "benefit4"] as const;

async function PlatformJoinButton({
	liveClass,
	now,
	size = "md",
}: {
	liveClass: { id: string; scheduledAt: Date; durationMinutes: number; status: string };
	now: Date;
	size?: "sm" | "md";
}) {
	const [t, formatter] = await Promise.all([getTranslations("liveClasses"), getFormatter()]);
	const { opensAt } = getJoinWindow(liveClass);
	const isOpen = liveClass.status === "LIVE" || now >= opensAt;
	const sizeClass = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2 text-sm";

	if (!isOpen) {
		return (
			<span className={`inline-flex items-center rounded-xl border border-white/15 bg-white/5 font-semibold text-slate-300 ${sizeClass}`}>
				{t("opensAt", { date: formatter.dateTime(opensAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) })}
			</span>
		);
	}

	return (
		<Link
			href={`/classroom/${liveClass.id}`}
			className={`inline-flex items-center rounded-xl bg-emerald-400 font-semibold text-zinc-950 hover:bg-emerald-300 ${sizeClass}`}
		>
			{liveClass.status === "LIVE" ? t("liveJoin") : t("platformJoin")}
		</Link>
	);
}

export function generateMetadata() {
  return buildPublicPageMetadata({ pageKey: "live-classes", path: "/live-classes" });
}

export default async function LiveClassesPage() {
	const now = new Date();
	const [session, t, formatter] = await Promise.all([
		getServerSession(authOptions),
		getTranslations("liveClasses"),
		getFormatter(),
	]);
	const formatPrice = (price: number | null) =>
		price === null || price <= 0
			? t("notScheduled")
			: formatter.number(price, { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
	const formatClassDate = (date: Date) =>
		formatter.dateTime(date, { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
	const platformLabel = (url: string | null) => {
		const platform = detectMeetingPlatform(url);
		return platform === "zoom" ? "Zoom" : platform === "google-meet" ? "Google Meet" : t("externalLink");
	};
	const hasManualLiveClassAccess = session?.user?.hasLiveClassesAccess === true;
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
	const hasLiveClassPlan = Boolean(activeLiveClassSubscription) || hasManualLiveClassAccess;
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
			<section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(135deg,rgba(18,20,28,0.98),rgba(10,11,15,0.95)_45%,rgba(31,24,12,0.92))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl md:p-10 xl:p-12">
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)] opacity-40" />
				<div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-amber-300/10" />
				<div className="pointer-events-none absolute right-16 top-16 h-24 w-24 rounded-full border border-white/10" />

				<div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.12fr)_360px] xl:items-center">
					<div>
						<span className="inline-flex max-w-full flex-wrap items-center gap-2.5 rounded-full border border-amber-400/35 bg-amber-400/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300 shadow-[0_0_24px_rgba(212,168,67,0.12)] sm:text-xs sm:tracking-[0.28em]">
							<span className="h-2 w-2 rounded-full bg-amber-400" />
							{t("heroBadge")}
						</span>

						<div className="mt-7 flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
							<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{t("chipWeekly")}</span>
							<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{t("chipZoom")}</span>
							<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{t("chipSingle")}</span>
						</div>

						<h1 className="mt-8 max-w-4xl text-3xl font-black leading-[0.96] text-white sm:text-4xl md:text-6xl xl:text-7xl">
							<span className="block">{t("heroTitle1")}</span>
							<span className="mt-2 block bg-gradient-to-r from-[#fff2b8] via-[#f7d96b] to-[#d4a843] bg-clip-text text-transparent">
								{t("heroTitle2")}
							</span>
						</h1>
						<p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 md:text-xl md:leading-9">
							{t("heroText")}
						</p>

						<div className="mt-10 flex flex-wrap gap-4">
							<Button href="/dashboard" variant="outline" size="lg" className="w-full sm:w-auto rounded-2xl border-white/20 bg-white/6 backdrop-blur-sm hover:bg-white/10">
								{t("backToDashboard")}
							</Button>
							<Button href="/pricing" size="lg" className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] text-zinc-950 shadow-[0_20px_50px_rgba(212,168,67,0.28)] hover:brightness-105">
								{t("openPlan")}
							</Button>
						</div>
					</div>

					<div className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
						<div className="rounded-[26px] border border-white/10 bg-[#0d1017]/90 p-5">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div className="min-w-0">
									<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">{t("summaryBadge")}</p>
									<h2 className="mt-3 break-words text-2xl font-black text-white">{t("summaryTitle")}</h2>
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
											<p className="text-sm font-semibold text-white">{t("accessModelTitle")}</p>
											<p className="mt-1 text-xs leading-6 text-slate-400">{t("accessModelText")}</p>
										</div>
									</div>
								</div>
								<div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
									<div className="flex items-center gap-3">
										<div className="rounded-xl bg-sky-500/10 p-2 text-sky-300">
											<Clock3 size={16} />
										</div>
										<div>
											<p className="text-sm font-semibold text-white">{t("weeklyTitle")}</p>
											<p className="mt-1 text-xs leading-6 text-slate-400">{t("weeklyText", { count: weeklyCount })}</p>
										</div>
									</div>
								</div>
								<div className="rounded-2xl border border-amber-400/18 bg-[linear-gradient(135deg,rgba(212,168,67,0.14),rgba(255,255,255,0.03))] p-4">
									<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
										<div className="min-w-0">
											<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">{t("nextSessionBadge")}</p>
											<p className="mt-2 break-words text-base font-bold text-white">{nextClass ? nextClass.title : t("newSessionPlanned")}</p>
											<p className="mt-1 text-xs leading-6 text-amber-100/80">
												{nextClass ? t("schedule", { date: formatter.dateTime(nextClass.scheduledAt, { dateStyle: "long", timeStyle: "short" }), minutes: nextClass.durationMinutes }) : t("scheduleSoon")}
											</p>
										</div>
										<Link href="#live-class-list" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white transition hover:bg-white/14">
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
						title: t("statThisWeek"),
						value: t("statSessions", { count: weeklyCount }),
						text: t("statThisWeekText"),
						icon: <CalendarDays size={16} />,
						accent: "text-sky-300",
					},
					{
						title: t("statNext"),
						value: nextClass ? formatter.dateTime(nextClass.scheduledAt, { hour: "2-digit", minute: "2-digit" }) : "--:--",
						text: nextClass ? formatter.dateTime(nextClass.scheduledAt, { weekday: "long", month: "long", day: "numeric" }) : t("statNextEmpty"),
						icon: <Clock3 size={16} />,
						accent: "text-emerald-300",
					},
					{
						title: t("statArchive"),
						value: t("statArchiveValue", { count: pastClasses.length }),
						text: t("statArchiveText"),
						icon: <ShieldCheck size={16} />,
						accent: "text-white",
					},
					{
						title: t("statSingle"),
						value: t("statSessions", { count: purchasableCount }),
						text: t("statSingleText"),
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
				<p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{t("activeAccessBadge")}</p>
				<p className="mt-2 text-lg font-bold">
					{activeLiveClassSubscription?.plan.name
						? t("activeAccessPlan", { plan: activeLiveClassSubscription.plan.name })
						: t("activeAccessManual")}
				</p>
				<p className="mt-2 text-sm text-emerald-100/80">
					{t("activeAccessNote")}
					</p>
				</div>
			) : null}

			<div id="live-class-list" className="mt-10 grid gap-6 lg:grid-cols-3">
				{/* Yaklaşan ders spotlight */}
				{nextClass ? (
					<div className="rounded-3xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-400/10 via-zinc-900/80 to-zinc-900/60 p-6 shadow-[0_20px_60px_rgba(212,168,67,0.20)] backdrop-blur-xl lg:col-span-3">
						<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex-1">
								<div className="mb-3 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300 sm:text-xs sm:tracking-widest">
									<span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
									{t("upcomingBadge")}
								</div>
								<h2 className="break-words text-2xl font-black text-white md:text-3xl">{nextClass.title}</h2>
								<p className="mt-2 text-amber-200 font-medium">
									{t("schedule", { date: formatClassDate(nextClass.scheduledAt), minutes: nextClass.durationMinutes })}
								</p>
								{nextClass.description ? (
									<p className="mt-3 text-sm leading-6 text-slate-300">{nextClass.description}</p>
								) : null}
								{nextClass.topicOutline ? (
									<p className="mt-2 text-sm text-zinc-400"><span className="text-zinc-300 font-medium">{t("topics")}</span> {nextClass.topicOutline}</p>
								) : null}
							</div>
							<div className="w-full lg:w-80 shrink-0">
								{(hasLiveClassPlan && nextClass.type !== "ONE_ON_ONE") || purchasedClassIds.has(nextClass.id) ? (
									<div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
										<p className="text-sm font-bold text-emerald-200">
										{purchasedClassIds.has(nextClass.id) ? t("purchased") : t("includedInPlan")}
										</p>
										<p className="mt-2 text-xs leading-6 text-emerald-100/80">
											{nextClass.roomProvider === "LIVEKIT"
											? t("platformNote")
											: nextClass.meetingLink
											? t("linkReady", { platform: platformLabel(nextClass.meetingLink) })
											: t("linkLater")}
										</p>
										<div className="mt-4 flex flex-wrap gap-3">
											{nextClass.roomProvider === "LIVEKIT" ? (
												<PlatformJoinButton liveClass={nextClass} now={now} />
											) : null}
											{nextClass.roomProvider !== "LIVEKIT" && buildZoomDesktopLink(nextClass.meetingLink) ? (
												<a href={buildZoomDesktopLink(nextClass.meetingLink) ?? "#"} className="inline-flex items-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-300">
													{t("openInZoom")}
												</a>
											) : null}
											{nextClass.roomProvider !== "LIVEKIT" && nextClass.meetingLink ? (
												<a href={nextClass.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
													{t("joinInBrowser")}
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
						<div className="min-w-0">
							<h2 className="text-xl font-bold text-white">{t("trackerTitle")}</h2>
							<p className="mt-1 text-sm text-slate-300">
								{t("trackerText")}
							</p>
						</div>
						<Button variant="secondary" size="sm" className="w-full md:w-auto">
							{t("syncCalendar")}
						</Button>
					</div>

					<div className="mt-6 space-y-4">
						{upcomingClasses.length === 0 ? (
							<div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-5 py-6 text-sm text-slate-400">
								{t("noUpcoming")}
							</div>
						) : null}

						{upcomingClasses.map((item, index) => {
							const alreadyPurchased = purchasedClassIds.has(item.id);
							const planCoversClass = hasLiveClassPlan && item.type !== "ONE_ON_ONE";
							const hasAccess = planCoversClass || alreadyPurchased;
							const isPlatformClass = item.roomProvider === "LIVEKIT";
							const zoomDesktopLink = isPlatformClass ? null : buildZoomDesktopLink(item.meetingLink);
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
												{t("schedule", { date: formatClassDate(item.scheduledAt), minutes: item.durationMinutes })}
											</p>
											{item.topicOutline ? (
											<p className="mt-2 text-xs text-zinc-400">{t("topicHeadings", { topics: item.topicOutline })}</p>
											) : null}
											{item.description ? (
												<p className="mt-1 text-xs text-zinc-500">{t("note", { note: item.description })}</p>
											) : null}
										</div>
									</div>
									<span className="inline-flex max-w-full break-words rounded-full border border-amber-400/35 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
										{planCoversClass
											? t("tagIncluded")
											: alreadyPurchased
												? t("tagPurchased")
											: (item.singlePrice ?? 0) > 0
												? t("tagSingle", { price: formatPrice(item.singlePrice) })
												: t("tagMembersOnly")}
									</span>
								</div>
								<div className="mt-4">
									{hasAccess ? (
										<div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
											<p className="font-semibold text-emerald-200">
											{planCoversClass ? t("planAccess") : t("ticketAccess")}
										</p>
										<p className="mt-2 text-xs text-emerald-100/80">
											{isPlatformClass
												? t("platformNote")
												: item.meetingLink
												? t("linkActive", { platform: platformLabel(item.meetingLink) })
												: t("linkLater")}
											</p>
											<div className="mt-3 flex flex-wrap gap-2">
												{isPlatformClass ? <PlatformJoinButton liveClass={item} now={now} size="sm" /> : null}
												{zoomDesktopLink ? (
													<a href={zoomDesktopLink} className="inline-flex items-center rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-300">
														{t("openInZoom")}
													</a>
												) : null}
												{!isPlatformClass && item.meetingLink ? (
													<a href={item.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10">
														{t("joinClass")}
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
					<h3 className="text-lg font-bold text-white">{t("focusTitle")}</h3>
					<p className="mt-3 text-sm leading-7 text-slate-300">
						{t("focusText")}
						</p>
					</div>
				</div>

				<div className="space-y-6">
					<div className="rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
						<h2 className="text-xl font-bold text-white">{t("benefitsTitle")}</h2>
						<div className="mt-5 space-y-3">
							{benefitKeys.map((key) => t(key)).map((item, index) => (
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
						<p className="text-sm font-semibold text-amber-200">{t("teacherNoteBadge")}</p>
					<h3 className="mt-2 break-words text-xl font-black">{t("teacherNoteTitle")}</h3>
					<p className="mt-3 text-sm leading-7 text-slate-200">
						{t("teacherNoteText")}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
