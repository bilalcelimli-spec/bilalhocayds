import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { getAdminExamWorkspace } from "@/src/lib/exam-workspace";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamMappingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;
  const workspace = await getAdminExamWorkspace(examId);
  if (!workspace) notFound();

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="PDF Preview + Question Mapping" subtitle="Sol panel PDF, sağ panel structured question form" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="mapping" />
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">Section Mapping</h2>
            <div className="mt-4 space-y-3">
              {workspace.activeVersion?.sections.length ? workspace.activeVersion.sections.map((section) => (
                <div key={section.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                  {section.displayOrder}. {section.title} · {section._count.questions} soru · {section._count.passageGroups} passage group
                </div>
              )) : <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-10 text-sm text-zinc-400">Henüz normalize section oluşmadı.</div>}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">Structured Question Form</h2>
            <div className="mt-4 space-y-3">
              {(workspace.activeVersion?.questions.slice(0, 8) ?? []).map((question) => (
                <div key={question.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                  #{question.questionNumber} · {question.section.title} · confidence: {question.parseConfidence ?? 0}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}