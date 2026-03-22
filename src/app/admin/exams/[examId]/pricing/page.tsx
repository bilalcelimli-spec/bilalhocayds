import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { formatCurrency, getAdminExamWorkspace } from "@/src/lib/exam-workspace";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamPricingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;
  const workspace = await getAdminExamWorkspace(examId);
  if (!workspace) notFound();

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="Pricing and Access" subtitle="Lesson review ücreti ve visibility kuralları" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="pricing" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">Review Lesson Price</h2>
            <p className="mt-3 text-3xl font-black text-white">{formatCurrency(workspace.exam.lessonReviewPrice, workspace.exam.lessonCurrency)}</p>
            <p className="mt-2 text-sm text-zinc-400">30 dakikalık birebir exam review, attempt sonrası upsell yüzeylerinde kullanılacak.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">Visibility Rules</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
              <li>AI explanation: {workspace.exam.aiExplanationEnabled ? "aktif" : "kapalı"}</li>
              <li>Marketplace: {workspace.exam.isForSale ? "açık" : "kapalı"}</li>
              <li>Aktif pricing rule: {workspace.pricingRules.length}</li>
            </ul>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold text-white">Pricing Rules</h2>
          <div className="mt-4 space-y-3">
            {workspace.pricingRules.length ? workspace.pricingRules.map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                {rule.ruleType} · {formatCurrency(rule.amount, rule.currency)} · {rule.label ?? "etiketsiz"}
              </div>
            )) : <div className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-zinc-500">Aktif pricing rule bulunmuyor.</div>}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}