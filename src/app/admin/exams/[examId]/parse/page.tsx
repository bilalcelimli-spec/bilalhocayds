import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { getAdminExamWorkspace } from "@/src/lib/exam-workspace";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamParsePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;
  const workspace = await getAdminExamWorkspace(examId);
  if (!workspace) notFound();

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="PDF Parse Workspace" subtitle="Upload, OCR fallback ve parse queue ekranı" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="parse" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ["Upload", `${workspace.activeVersion?.assets.length ?? 0} asset kaydı`],
            ["Parse", `${workspace.activeVersion?.parseJobs.length ?? 0} parse job`],
            ["Review", `${workspace.activeVersion?.questions.filter((question) => !question.isVerified).length ?? 0} doğrulanmamış soru`],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold text-white">Son parse job kayıtları</h2>
          <div className="mt-4 space-y-3">
            {workspace.activeVersion?.parseJobs.length ? workspace.activeVersion.parseJobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                {job.status} · low confidence: {job.lowConfidenceCount} · provider: {job.provider ?? "-"}
              </div>
            )) : <div className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-zinc-500">Henüz parse job oluşmadı.</div>}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}