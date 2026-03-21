import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  Languages,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { prisma } from "@/src/lib/prisma";
import AdminPlans from "@/src/components/admin/plan-management";
import AdminLeads from "@/src/components/admin/leads";

const adminNavItems = [
  { label: "Admin Dashboard", href: "/admin" },
  { label: "Kullanıcılar", href: "/admin/users" },
  { label: "Reading Yönetimi", href: "/admin/readings" },
  { label: "Grammar Yönetimi", href: "/admin/grammar" },
  { label: "Vocabulary Yönetimi", href: "/admin/vocabulary" },
  { label: "Sınav Yönetimi", href: "/admin/exams" },
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

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();

  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    activePlans,
    totalVocabulary,
    totalReadings,
    totalGrammarTopics,
    totalExams,
    upcomingLiveClasses,
    recentUsers,
    initialPlans,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.plan.count({ where: { isActive: true } }),
    prisma.vocabularyWord.count(),
    prisma.reading.count({ where: { isActive: true } }),
    prisma.grammarTopic.count({ where: { isActive: true } }),
    prisma.examModule.count({ where: { isActive: true, isPublished: true } }),
    prisma.liveClass.count({ where: { scheduledAt: { gte: now } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
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
        includesExam: true,
        isStandaloneExamProduct: true,
        isActive: true,
      },
    }),
  ]);

  const roleBadge: Record<string, string> = {
    STUDENT: "bg-blue-500/15 text-blue-300",
    TEACHER: "bg-emerald-500/15 text-emerald-300",
    ADMIN: "bg-violet-500/15 text-violet-300",
  };

  const roleLabel: Record<string, string> = {
    STUDENT: "Öğrenci",
    TEACHER: "Öğretmen",
    ADMIN: "Admin",
  };

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="Yönetim Merkezi"
      subtitle="Kullanıcı, içerik ve platform yönetimi."
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Toplam Kullanıcı",
            value: totalUsers,
            sub: `${totalStudents} öğrenci · ${totalTeachers} öğretmen`,
            Icon: Users,
            color: "text-violet-400",
          },
          {
            label: "Aktif Plan",
            value: activePlans,
            sub: "Yayında olan abonelik planları",
            Icon: TrendingUp,
            color: "text-emerald-400",
          },
          {
            label: "İçerik Hacmi",
            value: totalReadings + totalGrammarTopics + totalVocabulary + totalExams,
            sub: `${totalReadings} reading · ${totalGrammarTopics} grammar · ${totalVocabulary} kelime · ${totalExams} sınav`,
            Icon: BookOpen,
            color: "text-blue-400",
          },
          {
            label: "Yaklaşan Canlı Ders",
            value: upcomingLiveClasses,
            sub: "Takvime ekli ileri tarihli oturumlar",
            Icon: Video,
            color: "text-teal-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                {s.label}
              </p>
              <s.Icon size={16} className={s.color} />
            </div>
            <p className="mt-3 text-3xl font-black text-white">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.22)] lg:col-span-2">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-white">Hızlı Yönetim</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Tüm modüllere doğrudan erişim
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Kullanıcılar",
                desc: `${totalStudents} öğrenci · ${totalTeachers} öğretmen`,
                href: "/admin/users",
                Icon: Users,
                color: "text-violet-400",
                bg: "border-violet-500/20 bg-violet-500/8",
              },
              {
                title: "Reading İçerikleri",
                desc: `${totalReadings} aktif metin`,
                href: "/admin/readings",
                Icon: BookOpen,
                color: "text-blue-400",
                bg: "border-blue-500/20 bg-blue-500/8",
              },
              {
                title: "Grammar Konuları",
                desc: `${totalGrammarTopics} aktif konu`,
                href: "/admin/grammar",
                Icon: GraduationCap,
                color: "text-indigo-400",
                bg: "border-indigo-500/20 bg-indigo-500/8",
              },
              {
                title: "Kelime Havuzu",
                desc: `${totalVocabulary} kelime`,
                href: "/admin/vocabulary",
                Icon: Languages,
                color: "text-cyan-400",
                bg: "border-cyan-500/20 bg-cyan-500/8",
              },
              {
                title: "Sınav Modülü",
                desc: `${totalExams} aktif yayınlı sınav`,
                href: "/admin/exams",
                Icon: FileText,
                color: "text-emerald-400",
                bg: "border-emerald-500/20 bg-emerald-500/8",
              },
              {
                title: "Canlı Dersler",
                desc: `${upcomingLiveClasses} yaklaşan ders`,
                href: "/admin/live-classes",
                Icon: CalendarDays,
                color: "text-teal-400",
                bg: "border-teal-500/20 bg-teal-500/8",
              },
              {
                title: "Canlı Ders Kayıtları",
                desc: "Zoom/Meet ders arşivini yönet",
                href: "/admin/live-recordings",
                Icon: Video,
                color: "text-sky-400",
                bg: "border-sky-500/20 bg-sky-500/8",
              },
              {
                title: "Plan Yönetimi",
                desc: "Fiyat, içerik ve satış bağlantıları",
                href: "/admin/plans",
                Icon: TrendingUp,
                color: "text-fuchsia-400",
                bg: "border-fuchsia-500/20 bg-fuchsia-500/8",
              },
              {
                title: "CRM & Lead",
                desc: "Lead havuzu, takip ve dönüşüm",
                href: "/admin/crm",
                Icon: Users,
                color: "text-amber-400",
                bg: "border-amber-500/20 bg-amber-500/8",
              },
              {
                title: "Content Engine",
                desc: "PDF, video ve web kaynaklarından özgün içerik üret",
                href: "/admin/content-engine",
                Icon: Sparkles,
                color: "text-amber-300",
                bg: "border-amber-500/20 bg-amber-500/8",
              },
              {
                title: "Muhasebe",
                desc: "Abonelik gelir ve durum analizi",
                href: "/admin/accounting",
                Icon: TrendingUp,
                color: "text-lime-400",
                bg: "border-lime-500/20 bg-lime-500/8",
              },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`group flex items-start gap-3 rounded-[24px] border p-4 shadow-[0_14px_40px_rgba(0,0,0,0.14)] transition-all hover:-translate-y-0.5 ${a.bg}`}
              >
                <div className="mt-0.5">
                  <a.Icon size={16} className={`shrink-0 ${a.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{a.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{a.desc}</p>
                </div>
                <ArrowRight
                  size={14}
                  className="mt-0.5 shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-400"
                />
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
            <h3 className="mb-4 text-sm font-bold text-white">İçerik Dağılımı</h3>
            <div className="space-y-3">
              {[
                { label: "Kelime Havuzu", value: totalVocabulary, color: "bg-cyan-500", max: Math.max(totalVocabulary, totalReadings, totalGrammarTopics) || 1 },
                { label: "Reading", value: totalReadings, color: "bg-blue-500", max: Math.max(totalVocabulary, totalReadings, totalGrammarTopics) || 1 },
                { label: "Grammar", value: totalGrammarTopics, color: "bg-indigo-500", max: Math.max(totalVocabulary, totalReadings, totalGrammarTopics) || 1 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-zinc-400">{item.label}</span>
                    <span className="font-semibold text-white">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: `${Math.round((item.value / item.max) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-violet-500/20 bg-violet-500/8 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="mb-2 flex items-center gap-2">
              <Shield size={14} className="text-violet-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
                Platform Notu
              </p>
            </div>
            <h3 className="text-sm font-bold text-white">Yayın temposunu dengede tut</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Vocabulary, reading ve grammar yayın temposunu canlı ders akışıyla
              eşleştirmek platformun toplam verimini artırır.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.22)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Son Kayıtlar</h2>
            <p className="mt-0.5 text-xs text-zinc-400">En son üye olan kullanıcılar</p>
          </div>
          <Link
            href="/admin/users"
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            Tümünü Gör
            <ArrowRight size={12} />
          </Link>
        </div>
        <div className="space-y-2">
          {recentUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                {u.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200">
                  {u.name ?? "—"}
                </p>
                <p className="truncate text-xs text-zinc-500">{u.email}</p>
              </div>
              <span
                className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium ${roleBadge[u.role] ?? ""}`}
              >
                {roleLabel[u.role] ?? u.role}
              </span>
            </div>
          ))}
          {recentUsers.length === 0 && (
            <p className="py-4 text-center text-sm text-zinc-500">
              Henüz kayıtlı kullanıcı yok.
            </p>
          )}
        </div>
      </div>

      {/* Plan & Lead management */}
      <div className="space-y-5">
        <AdminPlans initialPlans={initialPlans} />
        <AdminLeads />
      </div>
    </DashboardShell>
  );
}
