import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { getAdminExamWorkspace } from "@/src/lib/exam-workspace";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamEditPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;
  const workspace = await getAdminExamWorkspace(examId);
  if (!workspace) notFound();

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="Mock Exam Configuration" subtitle="Metadata, erişim ve attempt kuralları" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="edit" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">Catalog Metadata</h2>
            <div className="mt-4 grid gap-3">
              {[["Title", workspace.exam.title], ["Subtitle", workspace.exam.subtitle ?? "-"], ["Source", workspace.exam.sourceLabel ?? "-"], ["Level", workspace.exam.cefrLevel ?? "-"], ["Series", workspace.exam.examSeries ?? "-"], ["Year", workspace.exam.yearLabel ?? "-"]].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                  <p className="mt-2 text-sm text-zinc-200">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">Attempt Rules</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
              <li>Taking mode: {workspace.exam.isPublished ? "Canlı" : "Hazırlık"}</li>
              <li>Publication status: {workspace.exam.publicationStatus}</li>
              <li>Question bank: {workspace.activeVersion?.questions.length ?? 0} normalize soru</li>
              <li>Difficulty label: {workspace.exam.estimatedDifficulty ?? "Belirtilmedi"}</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}