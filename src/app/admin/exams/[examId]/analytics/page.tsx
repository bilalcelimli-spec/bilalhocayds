import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { getAdminExamWorkspace } from "@/src/lib/exam-workspace";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamAnalyticsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;
  const workspace = await getAdminExamWorkspace(examId);
  if (!workspace) notFound();

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="Attempt Analytics" subtitle="Exam bazlı performans ve item analizi" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="analytics" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Average Net", workspace.averageNet.toFixed(2)],
            ["Accuracy", `%${Math.round(workspace.averageAccuracy)}`],
            ["Submitted", String(workspace.submittedAttemptCount)],
            ["In Progress", String(workspace.inProgressAttemptCount)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
              <p className="mt-2 text-xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold text-white">Recent Attempts</h2>
          <div className="mt-4 space-y-3">
            {workspace.recentAttempts.map((attempt) => (
              <div key={attempt.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                {attempt.student.name ?? attempt.student.email} · {attempt.status} · net {attempt.netScore ?? 0} · accuracy %{Math.round(attempt.accuracyPercentage ?? 0)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}