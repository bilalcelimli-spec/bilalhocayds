import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, Receipt, TrendingUp, XCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { examModule, examPurchase } from "@/src/lib/prisma";

const adminNavItems = [
	{ label: "Admin Dashboard", href: "/admin" },
	{ label: "Kullanıcılar", href: "/admin/users" },
	{ label: "Reading Yönetimi", href: "/admin/readings" },
	{ label: "Grammar Yönetimi", href: "/admin/grammar" },
	{ label: "Vocabulary Yönetimi", href: "/admin/vocabulary" },
	{ label: "Sınav Yönetimi", href: "/admin/exams" },
	{ label: "Sınav Satışları", href: "/admin/exam-sales" },
	{ label: "Canlı Ders Yönetimi", href: "/admin/live-classes" },
	{ label: "Canlı Ders Kayıtları", href: "/admin/live-recordings" },
	{ label: "Plan Yönetimi", href: "/admin/plans" },
	{ label: "CRM & Lead", href: "/admin/crm" },
	{ label: "Muhasebe", href: "/admin/accounting" },
	{ label: "Öğrenci Modülleri", href: "/dashboard" },
	{ label: "Öğretmen Paneli", href: "/teacher" },
];

type PageProps = {
	searchParams?: Promise<{
		status?: string;
		examId?: string;
		from?: string;
		to?: string;
	}>;
};

function formatCurrency(value: number) {
	return new Intl.NumberFormat("tr-TR", {
		style: "currency",
		currency: "TRY",
		maximumFractionDigits: 0,
	}).format(value);
}

export default async function AdminExamSalesPage({ searchParams }: PageProps) {
	const session = await getServerSession(authOptions);
	if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
	const params = searchParams ? await searchParams : undefined;
	const selectedStatus = params?.status ?? "ALL";
	const selectedExamId = params?.examId ?? "ALL";
	const fromDate = params?.from ? new Date(`${params.from}T00:00:00`) : null;
	const toDate = params?.to ? new Date(`${params.to}T23:59:59.999`) : null;

	const [sales, exams] = await Promise.all([
		examPurchase.findMany({
			orderBy: { createdAt: "desc" },
			include: { examModule: true, user: true },
		}),
		examModule.findMany({ where: { isForSale: true }, orderBy: { updatedAt: "desc" } }),
	]);
	const filteredSales = sales.filter((sale) => {
		if (selectedStatus !== "ALL" && sale.status !== selectedStatus) return false;
		if (selectedExamId !== "ALL" && sale.examModuleId !== selectedExamId) return false;
		if (fromDate && sale.createdAt < fromDate) return false;
		if (toDate && sale.createdAt > toDate) return false;
		return true;
	});

	const paidSales = filteredSales.filter((sale) => sale.status === "PAID");
	const failedSales = filteredSales.filter((sale) => sale.status === "FAILED");
	const pendingSales = filteredSales.filter((sale) => sale.status === "PENDING");
	const totalRevenue = paidSales.reduce((sum, sale) => sum + sale.amount, 0);
	const examRevenue = exams.map((exam) => ({
		examId: exam.id,
		title: exam.marketplaceTitle ?? exam.title,
		units: paidSales.filter((sale) => sale.examModuleId === exam.id).length,
		revenue: paidSales.filter((sale) => sale.examModuleId === exam.id).reduce((sum, sale) => sum + sale.amount, 0),
		price: exam.price ?? 0,
	})).filter((item) => item.units > 0 || item.price > 0);
	const chartBuckets = Array.from({ length: 7 }, (_, index) => {
		const date = new Date();
		date.setHours(0, 0, 0, 0);
		date.setDate(date.getDate() - (6 - index));
		const nextDate = new Date(date);
		nextDate.setDate(nextDate.getDate() + 1);
		const revenue = paidSales.filter((sale) => sale.createdAt >= date && sale.createdAt < nextDate).reduce((sum, sale) => sum + sale.amount, 0);
		return {
			label: format(date, "d MMM", { locale: tr }),
			revenue,
		};
	});
	const maxRevenue = Math.max(...chartBuckets.map((bucket) => bucket.revenue), 1);
	const exportQuery = new URLSearchParams({
		status: selectedStatus,
		examId: selectedExamId,
		...(params?.from ? { from: params.from } : {}),
		...(params?.to ? { to: params.to } : {}),
	}).toString();

	return (
		<DashboardShell
			navItems={adminNavItems}
			roleLabel="Admin Paneli"
			title="Sınav Satışları"
			subtitle={`${filteredSales.length} işlem · ${paidSales.length} başarılı satış`}
			userName={session.user.name ?? undefined}
			userRole={session.user.role}
		>
			<div className="flex flex-wrap items-center gap-3">
				<Link href="/admin" className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white">
					<ArrowLeft size={14} />
					Geri
				</Link>
				<Link href="/admin/exams" className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20">
					Sınav konfigürasyonuna dön
				</Link>
				<Link href={`/api/admin/exam-sales/export?${exportQuery}`} className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20">
					<Download size={14} />
					CSV export
				</Link>
			</div>

			<form className="grid gap-3 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 md:grid-cols-2 xl:grid-cols-5">
				<select name="status" defaultValue={selectedStatus} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
					<option value="ALL">Tüm durumlar</option>
					<option value="PAID">PAID</option>
					<option value="PENDING">PENDING</option>
					<option value="FAILED">FAILED</option>
				</select>
				<select name="examId" defaultValue={selectedExamId} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
					<option value="ALL">Tüm sınavlar</option>
					{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.marketplaceTitle ?? exam.title}</option>)}
				</select>
				<input name="from" type="date" defaultValue={params?.from ?? ""} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
				<input name="to" type="date" defaultValue={params?.to ?? ""} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
				<button type="submit" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">Filtrele</button>
			</form>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5">
					<div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Toplam Gelir</p><TrendingUp size={16} className="text-emerald-300" /></div>
					<p className="mt-3 text-3xl font-black text-white">{formatCurrency(totalRevenue)}</p>
				</div>
				<div className="rounded-2xl border border-blue-500/20 bg-blue-500/8 p-5">
					<div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Başarılı Satış</p><CheckCircle2 size={16} className="text-blue-300" /></div>
					<p className="mt-3 text-3xl font-black text-white">{paidSales.length}</p>
				</div>
				<div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-5">
					<div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Bekleyen İşlem</p><Receipt size={16} className="text-amber-300" /></div>
					<p className="mt-3 text-3xl font-black text-white">{pendingSales.length}</p>
				</div>
				<div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-5">
					<div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-red-300">Başarısız İşlem</p><XCircle size={16} className="text-red-300" /></div>
					<p className="mt-3 text-3xl font-black text-white">{failedSales.length}</p>
				</div>
			</div>

			<div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
				<div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
					<div className="border-b border-white/8 px-5 py-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Gelir Grafiği</p>
						<div className="mt-4 grid h-44 grid-cols-7 items-end gap-3">
							{chartBuckets.map((bucket) => (
								<div key={bucket.label} className="flex h-full flex-col justify-end gap-2">
									<div className="rounded-t-2xl bg-[linear-gradient(180deg,rgba(110,231,183,0.95),rgba(16,185,129,0.65))]" style={{ height: `${Math.max((bucket.revenue / maxRevenue) * 100, bucket.revenue > 0 ? 12 : 4)}%` }} />
									<div>
										<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{bucket.label}</p>
										<p className="mt-1 text-xs text-zinc-300">{formatCurrency(bucket.revenue)}</p>
									</div>
								</div>
							))}
						</div>
					</div>
					<div className="border-b border-white/8 px-5 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Sınav Bazlı Performans</p></div>
					<div className="divide-y divide-white/5">
						{examRevenue.map((exam) => (
							<div key={exam.examId} className="px-5 py-4">
								<p className="text-sm font-semibold text-white">{exam.title}</p>
								<p className="mt-1 text-xs text-zinc-500">Liste fiyatı: {formatCurrency(exam.price)}</p>
								<div className="mt-3 flex items-center justify-between text-sm">
									<span className="text-zinc-400">Satış adedi: {exam.units}</span>
									<span className="font-semibold text-emerald-300">{formatCurrency(exam.revenue)}</span>
								</div>
							</div>
						))}
						{examRevenue.length === 0 ? <div className="px-5 py-10 text-sm text-zinc-500">Henüz sınav satışı oluşmadı.</div> : null}
					</div>
				</div>

				<div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
					<div className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/8 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[1fr_140px_120px_150px]">
						<span>Satış Kaydı</span>
						<span className="hidden md:block">Tutar</span>
						<span className="hidden md:block">Durum</span>
						<span>Tarih</span>
					</div>
					<div className="divide-y divide-white/5">
						{filteredSales.map((sale) => (
							<div key={sale.id} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4 md:grid-cols-[1fr_140px_120px_150px]">
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold text-white">{sale.examModule?.marketplaceTitle ?? sale.examModule?.title ?? "Silinmiş sınav"}</p>
									<p className="truncate text-xs text-zinc-500">{sale.fullName} · {sale.email}</p>
									<p className="mt-1 truncate text-xs text-zinc-500">Ref: {sale.referenceId}</p>
								</div>
								<div className="hidden md:flex md:items-center"><span className="text-sm font-semibold text-zinc-200">{formatCurrency(sale.amount)}</span></div>
								<div className="hidden md:flex md:items-center">
									<span className={`rounded-lg px-2 py-1 text-xs font-medium ${sale.status === "PAID" ? "bg-emerald-500/15 text-emerald-300" : sale.status === "FAILED" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}>{sale.status}</span>
								</div>
								<div className="flex items-center text-xs text-zinc-400">{format(sale.createdAt, "d MMM yyyy HH:mm", { locale: tr })}</div>
							</div>
						))}
						{filteredSales.length === 0 ? <div className="px-5 py-10 text-sm text-zinc-500">Filtreye uygun satış kaydı yok.</div> : null}
					</div>
				</div>
			</div>
		</DashboardShell>
	);
}