import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { getMockExamWorkspaceById } from "@/src/lib/mock-exam-workspace";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamPricingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;
  const exam = getMockExamWorkspaceById(examId);

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="Pricing and Access" subtitle="Lesson review ücreti ve visibility kuralları" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="pricing" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">Review Lesson Price</h2>
            <p className="mt-3 text-3xl font-black text-white">{exam.lessonPrice}</p>
            <p className="mt-2 text-sm text-zinc-400">30 dakikalık birebir exam review, attempt sonrası upsell yüzeylerinde kullanılacak.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">Visibility Rules</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
              <li>AI explanation: {exam.aiExplanationEnabled ? "aktif" : "kapalı"}</li>
              <li>Score visibility: anında açık</li>
              <li>Booking visibility: submission sonrası</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}