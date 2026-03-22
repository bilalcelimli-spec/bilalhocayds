import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { getMockExamWorkspaceById } from "@/src/lib/mock-exam-workspace";

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
  const exam = getMockExamWorkspaceById(examId);

  return (
    <DashboardShell navItems={adminNavItems} roleLabel="Admin Paneli" title={exam.title} subtitle={exam.subtitle} userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="overview" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Süre", `${exam.durationMinutes} dk`],
            ["Toplam Soru", String(exam.totalQuestions)],
            ["AI Açıklama", exam.aiExplanationEnabled ? "Açık" : "Kapalı"],
            ["Lesson Review", exam.lessonPrice],
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
              <h2 className="text-lg font-bold text-white">PDF to exam pipeline</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-300">Bu exam workspace, admin upload → parse → mapping → question verification → publish akışını tek yerden yönetmek için hazırlandı.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h2 className="text-lg font-bold text-white">Student delivery</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-300">Öğrenci tarafında live attempt, OMR-style navigation, result review, AI explanation ve lesson upsell ekranları scaffold olarak açıldı.</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}