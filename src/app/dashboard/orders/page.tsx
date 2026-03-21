import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Receipt, XCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { examPurchase } from "@/src/lib/prisma";

const studentNavItems = [
	{ label: "Dashboard", href: "/dashboard" },
	{ label: "Siparişlerim", href: "/dashboard/orders" },
	{ label: "Canlı Ders Kayıtları", href: "/dashboard/live-recordings" },
	{ label: "Paylaşılan İçerikler", href: "/dashboard/content-library" },
	{ label: "Vocabulary", href: "/vocabulary" },
	{ label: "Reading", href: "/reading" },
	{ label: "Grammar", href: "/grammar" },
	{ label: "Sınav", href: "/exam" },
	{ label: "Canlı Dersler", href: "/live-classes" },
	{ label: "Fiyatlandırma", href: "/pricing" },
];

function formatCurrency(value: number) {
	return new Intl.NumberFormat("tr-TR", {
		style: "currency",
		currency: "TRY",
		maximumFractionDigits: 0,
	}).format(value);
}

export default async function DashboardOrdersPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");
	if (session.user.role === "ADMIN") redirect("/admin");
	if (session.user.role === "TEACHER") redirect("/teacher");

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
			roleLabel="Öğrenci Paneli"
			title="Siparişlerim"
			subtitle={`${purchases.length} sınav işlemi · ${paidPurchases.length} tamamlanan satın alım`}
			userName={session.user.name ?? undefined}
			userRole={session.user.role}
		>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/8 p-5"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Toplam Harcama</p><Receipt size={16} className="text-emerald-300" /></div><p className="mt-4 text-3xl font-black text-white">{formatCurrency(totalSpent)}</p></div>
				<div className="rounded-[28px] border border-blue-500/20 bg-blue-500/8 p-5"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300">Başarılı</p><CheckCircle2 size={16} className="text-blue-300" /></div><p className="mt-4 text-3xl font-black text-white">{paidPurchases.length}</p></div>
				<div className="rounded-[28px] border border-amber-500/20 bg-amber-500/8 p-5"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">Bekleyen</p><Clock3 size={16} className="text-amber-300" /></div><p className="mt-4 text-3xl font-black text-white">{pendingPurchases.length}</p></div>
				<div className="rounded-[28px] border border-red-500/20 bg-red-500/8 p-5"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-300">Başarısız</p><XCircle size={16} className="text-red-300" /></div><p className="mt-4 text-3xl font-black text-white">{failedPurchases.length}</p></div>
			</div>

			<div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Purchase History</p>
						<h2 className="mt-2 text-2xl font-black text-white">Satın aldığın sınavlar ve işlem durumları</h2>
						<p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">Ödeme tamamlanan sınavlar doğrudan exam modülünde görünür. Bekleyen veya başarısız denemeler de burada izlenir.</p>
					</div>
					<Link href="/exam" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200">Exam marketplace'e dön <ArrowRight size={14} /></Link>
				</div>
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				{purchases.map((purchase) => (
					<article key={purchase.id} className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">{purchase.examModule?.examType ?? "Exam"}</p>
								<h3 className="mt-2 text-xl font-black text-white">{purchase.examModule?.marketplaceTitle ?? purchase.examModule?.title ?? "Silinmiş sınav"}</h3>
								<p className="mt-2 text-sm text-zinc-400">{formatCurrency(purchase.amount)} · {format(purchase.createdAt, "d MMMM yyyy HH:mm", { locale: tr })}</p>
							</div>
							<span className={`rounded-xl px-3 py-1 text-xs font-semibold ${purchase.status === "PAID" ? "bg-emerald-500/15 text-emerald-300" : purchase.status === "FAILED" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}>{purchase.status === "PAID" ? "Tamamlandı" : purchase.status === "FAILED" ? "Başarısız" : "Bekliyor"}</span>
						</div>

						<div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
							<p>Referans: <span className="font-semibold text-white">{purchase.referenceId}</span></p>
							{purchase.paidAt ? <p className="mt-1">Ödeme zamanı: <span className="font-semibold text-white">{format(purchase.paidAt, "d MMMM yyyy HH:mm", { locale: tr })}</span></p> : null}
							{purchase.providerMessage ? <p className="mt-1 text-zinc-400">Sağlayıcı notu: {purchase.providerMessage}</p> : null}
						</div>

						<div className="mt-4 flex items-center justify-between">
							<div className="text-xs text-zinc-500">{purchase.examModule?.questionCount ?? 0} soru · {purchase.examModule?.durationMinutes ?? 0} dk</div>
							{purchase.status === "PAID" ? <Link href="/exam" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10">Sınava git <ArrowRight size={14} /></Link> : null}
						</div>
					</article>
				))}
			</div>

			{purchases.length === 0 ? (
				<div className="rounded-[30px] border border-dashed border-white/10 px-6 py-12 text-center text-zinc-500">Henüz sınav satın alımı bulunmuyor. İlk işlemin burada görünecek.</div>
			) : null}
		</DashboardShell>
	);
}