import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Receipt, TrendingUp } from "lucide-react";

import { authOptions } from "@/src/auth";
import AdminPlans from "@/src/components/admin/plan-management";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { prisma } from "@/src/lib/prisma";

const adminNavItems = [
  { label: "Admin Dashboard", href: "/admin" },
  { label: "Kullanıcılar", href: "/admin/users" },
  { label: "Reading Yönetimi", href: "/admin/readings" },
  { label: "Grammar Yönetimi", href: "/admin/grammar" },
  { label: "Vocabulary Yönetimi", href: "/admin/vocabulary" },
  { label: "Canlı Ders Yönetimi", href: "/admin/live-classes" },
  { label: "Canlı Ders Kayıtları", href: "/admin/live-recordings" },
  { label: "Plan Yönetimi", href: "/admin/plans" },
  { label: "CRM & Lead", href: "/admin/crm" },
  { label: "Muhasebe", href: "/admin/accounting" },
  { label: "Öğrenci Modülleri", href: "/dashboard" },
  { label: "Öğretmen Paneli", href: "/teacher" },
];

export default async function AdminPlansPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [plans, subscriptions] = await Promise.all([
    prisma.plan.findMany({
      orderBy: { createdAt: "desc" },
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
        isActive: true,
      },
    }),
    prisma.subscription.findMany({
      include: {
        plan: {
          select: { id: true, name: true, monthlyPrice: true, yearlyPrice: true },
        },
      },
    }),
  ]);

  const activePlansCount = plans.filter((plan) => plan.isActive).length;

  const planStats = plans.map((plan) => {
    const related = subscriptions.filter((sub) => sub.planId === plan.id);
    const activeCount = related.filter(
      (sub) => sub.status === "ACTIVE" || sub.status === "TRIALING",
    ).length;

    const monthlyEquivalent = related.reduce((sum, sub) => {
      if (sub.billingCycle === "MONTHLY") {
        return sum + (plan.monthlyPrice ?? 0);
      }
      return sum + (plan.yearlyPrice ?? 0) / 12;
    }, 0);

    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      activeCount,
      totalSubscriptions: related.length,
      monthlyEquivalent,
      isActive: plan.isActive,
    };
  });

  const totalMonthlyEquivalent = planStats.reduce(
    (sum, item) => sum + item.monthlyEquivalent,
    0,
  );

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="Plan, Satış ve Abonelik Modülü"
      subtitle="Fiyat ve içerik düzenlemelerini satış ve abonelik verileri ile birlikte yönet."
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
          href="/admin/accounting"
          className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
        >
          Muhasebe ile birlikte görüntüle
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">Toplam Plan</p>
            <CreditCard size={16} className="text-violet-300" />
          </div>
          <p className="mt-3 text-3xl font-black text-white">{plans.length}</p>
          <p className="mt-1 text-xs text-zinc-400">{activePlansCount} aktif plan</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Toplam Abonelik</p>
            <Receipt size={16} className="text-emerald-300" />
          </div>
          <p className="mt-3 text-3xl font-black text-white">{subscriptions.length}</p>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">Aktif/Deneme</p>
            <TrendingUp size={16} className="text-sky-300" />
          </div>
          <p className="mt-3 text-3xl font-black text-white">
            {
              subscriptions.filter(
                (sub) => sub.status === "ACTIVE" || sub.status === "TRIALING",
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Aylık Karşılık</p>
            <TrendingUp size={16} className="text-amber-300" />
          </div>
          <p className="mt-3 text-3xl font-black text-white">₺{totalMonthlyEquivalent.toFixed(0)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-bold text-white">Plan Fiyat ve İçerik Düzenleyici</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Bu alandaki değişiklikler pricing, ödeme ve muhasebe ekranlarında aynı plan verisiyle çalışır.
        </p>
        <div className="mt-4">
          <AdminPlans initialPlans={plans} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/8 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[1fr_140px_140px_140px_120px]">
          <span>Plan</span>
          <span className="hidden md:block">Abonelik</span>
          <span className="hidden md:block">Aktif/Deneme</span>
          <span className="hidden md:block">Aylık Karşılık</span>
          <span>Durum</span>
        </div>
        <div className="divide-y divide-white/5">
          {planStats.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4 transition hover:bg-white/[0.03] md:grid-cols-[1fr_140px_140px_140px_120px]"
            >
              <div>
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-xs text-zinc-500">/{item.slug}</p>
              </div>
              <p className="hidden text-sm text-zinc-300 md:block">{item.totalSubscriptions}</p>
              <p className="hidden text-sm text-zinc-300 md:block">{item.activeCount}</p>
              <p className="hidden text-sm text-zinc-300 md:block">₺{item.monthlyEquivalent.toFixed(0)}</p>
              <span
                className={`rounded-lg px-2 py-1 text-xs font-medium ${
                  item.isActive
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-zinc-500/15 text-zinc-300"
                }`}
              >
                {item.isActive ? "Aktif" : "Pasif"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
