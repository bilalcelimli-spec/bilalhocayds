import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { getMockExamWorkspaceById } from "@/src/lib/mock-exam-workspace";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamAnalyticsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;
  const exam = getMockExamWorkspaceById(examId);

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="Attempt Analytics" subtitle="Exam bazlı performans ve item analizi" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="analytics" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Average Net", String(exam.reviewMetrics.net)],
            ["Accuracy", `%${exam.reviewMetrics.accuracy}`],
            ["Strongest", exam.reviewMetrics.strongestSection],
            ["Weakest", exam.reviewMetrics.weakestSection],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
              <p className="mt-2 text-xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}