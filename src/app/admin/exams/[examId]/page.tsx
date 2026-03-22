import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { formatCurrency, getAdminExamWorkspace } from "@/src/lib/exam-workspace";

type PageProps = {
  params: Promise<{ examId: string }>;
};

const adminNavItems = [
  { label: "Admin Dashboard", href: "/admin" },
  { label: "Sınav Yönetimi", href: "/admin/exams" },
  { label: "Plan Yönetimi", href: "/admin/plans" },
];

export default async function AdminExamWorkspacePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const { examId } = await params;
  const workspace = await getAdminExamWorkspace(examId);
  if (!workspace) notFound();

  return (
    <DashboardShell navItems={adminNavItems} roleLabel="Admin Paneli" title={workspace.exam.title} subtitle={workspace.exam.subtitle ?? "Gerçek version, parse, attempt ve booking görünümü"} userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="overview" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Süre", `${workspace.exam.durationMinutes} dk`],
            ["Toplam Soru", String(workspace.activeVersion?.questions.length ?? workspace.exam.questionCount)],
            ["AI Açıklama", workspace.exam.aiExplanationEnabled ? "Açık" : "Kapalı"],
            ["Lesson Review", formatCurrency(workspace.exam.lessonReviewPrice, workspace.exam.lessonCurrency)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Workspace Status</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h2 className="text-lg font-bold text-white">Version ve parse görünümü</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-300">Aktif version: v{workspace.activeVersion?.versionNumber ?? 0} · Parse jobs: {workspace.activeVersion?.parseJobs.length ?? 0} · Assets: {workspace.activeVersion?.assets.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h2 className="text-lg font-bold text-white">Student delivery</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-300">Submitted attempt: {workspace.submittedAttemptCount} · In-progress: {workspace.inProgressAttemptCount} · Ortalama net: {workspace.averageNet.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-300">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Publication</p>
              <p className="mt-2 text-white">{workspace.exam.publicationStatus}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-300">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Marketplace</p>
              <p className="mt-2 text-white">{workspace.exam.isForSale ? formatCurrency(workspace.exam.price, "TRY") : "Kapalı"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-300">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Bookingler</p>
              <p className="mt-2 text-white">{workspace.recentBookings.length} son kayıt</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}