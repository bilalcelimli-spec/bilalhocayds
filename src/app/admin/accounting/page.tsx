import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarRange, CreditCard, Receipt, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { prisma } from "@/src/lib/prisma";

const adminNavItems = [
  { label: "Admin Dashboard", href: "/admin" },
  { label: "Kullanıcılar", href: "/admin/users" },
  { label: "Reading Yönetimi", href: "/admin/readings" },
  { label: "Grammar Yönetimi", href: "/admin/grammar" },
  { label: "Vocabulary Yönetimi", href: "/admin/vocabulary" },
  { label: "Sınav Satışları", href: "/admin/exam-sales" },
  { label: "Canlı Ders Yönetimi", href: "/admin/live-classes" },
  { label: "Canlı Ders Kayıtları", href: "/admin/live-recordings" },
  { label: "Plan Yönetimi", href: "/admin/plans" },
  { label: "CRM & Lead", href: "/admin/crm" },
  { label: "Muhasebe", href: "/admin/accounting" },
  { label: "Öğrenci Modülleri", href: "/dashboard" },
  { label: "Öğretmen Paneli", href: "/teacher" },
];

const statusBadge: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-300",
  TRIALING: "bg-sky-500/15 text-sky-300",
  CANCELLED: "bg-zinc-500/15 text-zinc-300",
  EXPIRED: "bg-zinc-700/20 text-zinc-400",
  PAST_DUE: "bg-red-500/15 text-red-300",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Aktif",
  TRIALING: "Deneme",
  CANCELLED: "İptal",
  EXPIRED: "Süresi Doldu",
  PAST_DUE: "Gecikmiş",
};

async function assertAdmin() {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

async function updateSubscriptionStatusAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !status) {
    return;
  }

  if (!["ACTIVE", "TRIALING", "CANCELLED", "EXPIRED", "PAST_DUE"].includes(status)) {
    return;
  }

  await prisma.subscription.update({
    where: { id },
    data: {
      status: status as "ACTIVE" | "TRIALING" | "CANCELLED" | "EXPIRED" | "PAST_DUE",
      ...(status === "CANCELLED" || status === "EXPIRED" ? { endDate: new Date() } : {}),
    },
  });

  revalidatePath("/admin/accounting");
  revalidatePath("/admin");
}

export default async function AdminAccountingPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const subscriptions = await prisma.subscription
    .findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        plan: {
          select: {
            name: true,
            monthlyPrice: true,
            yearlyPrice: true,
          },
        },
      },
    })
    .catch(() => []);

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === "ACTIVE" || sub.status === "TRIALING",
  );
  const delayedSubscriptions = subscriptions.filter((sub) => sub.status === "PAST_DUE");

  const monthlyRecurring = activeSubscriptions.reduce((acc, sub) => {
    if (sub.billingCycle === "MONTHLY") {
      return acc + (sub.plan.monthlyPrice ?? 0);
    }
    return acc + (sub.plan.yearlyPrice ?? 0) / 12;
  }, 0);

  const yearlyProjection = activeSubscriptions.reduce((acc, sub) => {
    if (sub.billingCycle === "YEARLY") {
      return acc + (sub.plan.yearlyPrice ?? 0);
    }
    return acc + (sub.plan.monthlyPrice ?? 0) * 12;
  }, 0);

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="Muhasebe Modülü"
      subtitle={`${subscriptions.length} abonelik kaydı · ${activeSubscriptions.length} aktif/deneme`}
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          Geri
        </Link>
        <Link
          href="/admin/plans"
          className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-2 text-sm font-semibold text-fuchsia-300 hover:bg-fuchsia-500/20"
        >
          Plan modulu ile yonet
        </Link>
        <Link
          href="/admin/exam-sales"
          className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
        >
          Sınav satışlarını aç
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Aylık Tekrarlayan Gelir</p>
            <TrendingUp size={16} className="text-emerald-300" />
          </div>
          <p className="mt-3 text-3xl font-black text-white">₺{monthlyRecurring.toFixed(0)}</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/8 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Yıllık Projeksiyon</p>
            <CalendarRange size={16} className="text-cyan-300" />
          </div>
          <p className="mt-3 text-3xl font-black text-white">₺{yearlyProjection.toFixed(0)}</p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/8 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Aktif / Deneme</p>
            <CreditCard size={16} className="text-blue-300" />
          </div>
          <p className="mt-3 text-3xl font-black text-white">{activeSubscriptions.length}</p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-300">Gecikmiş Ödeme</p>
            <Receipt size={16} className="text-red-300" />
          </div>
          <p className="mt-3 text-3xl font-black text-white">{delayedSubscriptions.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/8 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[1fr_140px_140px_120px_170px]">
          <span>Abonelik</span>
          <span className="hidden md:block">Döngü</span>
          <span className="hidden md:block">Fiyat</span>
          <span className="hidden md:block">Durum</span>
          <span>İşlem</span>
        </div>

        <div className="divide-y divide-white/5">
          {subscriptions.map((sub) => {
            const unitPrice =
              sub.billingCycle === "MONTHLY"
                ? sub.plan.monthlyPrice ?? 0
                : sub.plan.yearlyPrice ?? 0;

            return (
              <div
                key={sub.id}
                className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4 transition hover:bg-white/[0.03] md:grid-cols-[1fr_140px_140px_120px_170px]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {sub.user.name ?? "İsimsiz Kullanıcı"}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{sub.user.email}</p>
                  <p className="mt-1 truncate text-xs text-zinc-400">Plan: {sub.plan.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Başlangıç: {format(sub.startDate, "d MMM yyyy", { locale: tr })}
                  </p>
                </div>

                <div className="hidden md:flex md:items-center">
                  <span className="rounded-lg bg-white/10 px-2 py-1 text-xs text-zinc-300">
                    {sub.billingCycle === "MONTHLY" ? "Aylık" : "Yıllık"}
                  </span>
                </div>

                <div className="hidden md:flex md:items-center">
                  <p className="text-sm font-semibold text-zinc-200">₺{unitPrice.toFixed(0)}</p>
                </div>

                <div className="hidden md:flex md:items-center">
                  <span
                    className={`rounded-lg px-2 py-1 text-xs font-medium ${
                      statusBadge[sub.status] ?? "bg-white/10 text-zinc-300"
                    }`}
                  >
                    {statusLabel[sub.status] ?? sub.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <form action={updateSubscriptionStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={sub.id} />
                    <select
                      name="status"
                      defaultValue={sub.status}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
                    >
                      <option value="ACTIVE">Aktif</option>
                      <option value="TRIALING">Deneme</option>
                      <option value="PAST_DUE">Gecikmiş</option>
                      <option value="CANCELLED">İptal</option>
                      <option value="EXPIRED">Süresi Doldu</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10"
                    >
                      Kaydet
                    </button>
                  </form>
                </div>
              </div>
            );
          })}

          {subscriptions.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-zinc-500">
              <Receipt size={32} className="opacity-50" />
              <p className="text-sm">Henüz abonelik kaydı bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
