import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamParsePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="PDF Parse Workspace" subtitle="Upload, OCR fallback ve parse queue ekranı" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="parse" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ["Upload", "PDF object storage upload + checksum doğrulama"],
            ["Parse", "Text layer parse, confidence score, OCR fallback"],
            ["Review", "Low confidence item queue ve re-run controls"],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}