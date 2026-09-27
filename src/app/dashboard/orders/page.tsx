import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Receipt, XCircle } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { getPanelRoleLabel, getStudentNavItems } from "@/src/lib/panel-nav";
import { examPurchase } from "@/src/lib/prisma";



export default async function DashboardOrdersPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");
	if (session.user.role === "ADMIN") redirect("/admin");
	if (session.user.role === "TEACHER") redirect("/teacher");
	const [t, formatter, studentNavItems, roleLabel] = await Promise.all([
		getTranslations("orders"),
		getFormatter(),
		getStudentNavItems(session.user),
		getPanelRoleLabel(session.user.role),
	]);
	const formatCurrency = (value: number) =>
		formatter.number(value, { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
	const formatDate = (value: Date) => formatter.dateTime(value, { dateStyle: "long", timeStyle: "short" });

	const purchases = session.user.id || session.user.email
		? await examPurchase.findMany({
			where: {
				OR: [
					...(session.user.id ? [{ userId: session.user.id }] : []),
					...(session.user.email ? [{ email: session.user.email.toLowerCase() }] : []),
				],
			},
			orderBy: { createdAt: "desc" },
			include: { examModule: true },
		})
		: [];

	const paidPurchases = purchases.filter((purchase) => purchase.status === "PAID");
	const pendingPurchases = purchases.filter((purchase) => purchase.status === "PENDING");
	const failedPurchases = purchases.filter((purchase) => purchase.status === "FAILED");
	const totalSpent = paidPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);

	return (
		<DashboardShell
			navItems={studentNavItems}
			roleLabel={roleLabel}
			title={t("title")}
			subtitle={t("subtitle", { total: purchases.length, paid: paidPurchases.length })}
			userName={session.user.name ?? undefined}
			userRole={session.user.role}
		>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/8 p-5"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">{t("totalSpent")}</p><Receipt size={16} className="text-emerald-300" /></div><p className="mt-4 text-3xl font-black text-white">{formatCurrency(totalSpent)}</p></div>
				<div className="rounded-[28px] border border-blue-500/20 bg-blue-500/8 p-5"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300">{t("successful")}</p><CheckCircle2 size={16} className="text-blue-300" /></div><p className="mt-4 text-3xl font-black text-white">{paidPurchases.length}</p></div>
				<div className="rounded-[28px] border border-amber-500/20 bg-amber-500/8 p-5"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">{t("pending")}</p><Clock3 size={16} className="text-amber-300" /></div><p className="mt-4 text-3xl font-black text-white">{pendingPurchases.length}</p></div>
				<div className="rounded-[28px] border border-red-500/20 bg-red-500/8 p-5"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-300">{t("failed")}</p><XCircle size={16} className="text-red-300" /></div><p className="mt-4 text-3xl font-black text-white">{failedPurchases.length}</p></div>
			</div>

			<div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">{t("historyBadge")}</p>
						<h2 className="mt-2 text-2xl font-black text-white">{t("historyTitle")}</h2>
						<p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">{t("historyText")}</p>
					</div>
					<Link href="/exam" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200">{t("backToExams")} <ArrowRight size={14} /></Link>
				</div>
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				{purchases.map((purchase) => (
					<article key={purchase.id} className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">{purchase.examModule?.examType ?? "Exam"}</p>
								<h3 className="mt-2 text-xl font-black text-white">{purchase.examModule?.marketplaceTitle ?? purchase.examModule?.title ?? t("deletedExam")}</h3>
								<p className="mt-2 text-sm text-zinc-400">{formatCurrency(purchase.amount)} · {formatDate(purchase.createdAt)}</p>
							</div>
							<span className={`rounded-xl px-3 py-1 text-xs font-semibold ${purchase.status === "PAID" ? "bg-emerald-500/15 text-emerald-300" : purchase.status === "FAILED" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}>{purchase.status === "PAID" ? t("statusPaid") : purchase.status === "FAILED" ? t("statusFailed") : t("statusPending")}</span>
						</div>

						<div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
							<p>{t("reference")} <span className="font-semibold text-white">{purchase.referenceId}</span></p>
							{purchase.paidAt ? <p className="mt-1">{t("paidAt")} <span className="font-semibold text-white">{formatDate(purchase.paidAt)}</span></p> : null}
							{purchase.providerMessage ? <p className="mt-1 text-zinc-400">{t("providerNote", { note: purchase.providerMessage })}</p> : null}
						</div>

						<div className="mt-4 flex items-center justify-between">
							<div className="text-xs text-zinc-500">{t("meta", { count: purchase.examModule?.questionCount ?? 0, minutes: purchase.examModule?.durationMinutes ?? 0 })}</div>
							{purchase.status === "PAID" ? <Link href="/exam" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10">{t("goToExam")} <ArrowRight size={14} /></Link> : null}
						</div>
					</article>
				))}
			</div>

			{purchases.length === 0 ? (
				<div className="rounded-[30px] border border-dashed border-white/10 px-6 py-12 text-center text-zinc-500">{t("empty")}</div>
			) : null}
		</DashboardShell>
	);
}