import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BrainCircuit } from "lucide-react";

import { authOptions } from "@/src/auth";
import { AdaptiveLab } from "@/src/components/admin/adaptive-lab";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { getAdaptiveAdminDashboardData } from "@/src/lib/adaptive-audit";

const adminNavItems = [
  { label: "Admin Dashboard", href: "/admin" },
  { label: "Kullanıcılar", href: "/admin/users" },
  { label: "Reading Yönetimi", href: "/admin/readings" },
  { label: "Grammar Yönetimi", href: "/admin/grammar" },
  { label: "Vocabulary Yönetimi", href: "/admin/vocabulary" },
  { label: "Sınav Yönetimi", href: "/admin/exams" },
  { label: "Adaptive Lab", href: "/admin/adaptive-lab" },
  { label: "Sınav Satışları", href: "/admin/exam-sales" },
  { label: "Canlı Ders Yönetimi", href: "/admin/live-classes" },
  { label: "Canlı Ders Kayıtları", href: "/admin/live-recordings" },
  { label: "Plan Yönetimi", href: "/admin/plans" },
  { label: "CRM & Lead", href: "/admin/crm" },
  { label: "Muhasebe", href: "/admin/accounting" },
  { label: "SEO Yönetimi", href: "/admin/seo" },
  { label: "Content Engine", href: "/admin/content-engine" },
  { label: "Öğrenci Modülleri", href: "/dashboard" },
  { label: "Öğretmen Paneli", href: "/teacher" },
];

export default async function AdminAdaptiveLabPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const analytics = await getAdaptiveAdminDashboardData();

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="Adaptive Lab"
      subtitle="Prompt playground, adaptive session analytics ve audit stream tek yerde."
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin" className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white">
          <ArrowLeft size={14} />
          Geri
        </Link>
        <div className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200">
          <BrainCircuit size={15} />
          Adaptive orchestration kontrol merkezi
        </div>
      </div>

      <AdaptiveLab {...analytics} />
    </DashboardShell>
  );
}