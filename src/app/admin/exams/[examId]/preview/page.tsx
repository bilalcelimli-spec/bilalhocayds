import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { MockExamResult } from "@/src/components/exam/mock-exam-result";
import { getMockExamWorkspaceById } from "@/src/lib/mock-exam-workspace";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamPreviewPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;
  const exam = getMockExamWorkspaceById(examId);

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="Student Preview" subtitle="Submission sonrası result yüzeyinin önizlemesi" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="preview" />
        <MockExamResult workspace={exam} attemptId="preview-attempt" />
      </div>
    </DashboardShell>
  );
}