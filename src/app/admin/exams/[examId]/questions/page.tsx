import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { getAdminExamWorkspace } from "@/src/lib/exam-workspace";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamQuestionsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;
  const workspace = await getAdminExamWorkspace(examId);
  if (!workspace) notFound();

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="Question Editor" subtitle="Normalized question bank editor" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="questions" />
        <div className="space-y-4">
          {(workspace.activeVersion?.questions ?? []).map((question) => (
            <div key={question.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Soru {question.questionNumber} · {question.section.title}</p>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-400">{question.status} · {question.isVerified ? "verified" : "review"}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{question.questionText}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}