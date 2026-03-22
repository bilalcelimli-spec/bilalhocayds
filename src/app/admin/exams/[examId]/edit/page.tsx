import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { getMockExamWorkspaceById } from "@/src/lib/mock-exam-workspace";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamEditPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;
  const exam = getMockExamWorkspaceById(examId);

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="Mock Exam Configuration" subtitle="Metadata, erişim ve attempt kuralları" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="edit" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">Catalog Metadata</h2>
            <div className="mt-4 grid gap-3">
              {[["Title", exam.title], ["Subtitle", exam.subtitle], ["Source", exam.sourceLabel], ["Level", exam.level]].map(([label, value]) => (
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
              <li>Zamanlayıcı server-authoritative olacak.</li>
              <li>Timeout durumunda auto-submit devreye girecek.</li>
              <li>Pause kapalı, OMR mode varsayılan açık.</li>
              <li>AI explanation yalnızca submission sonrası açılacak.</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}