import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamMappingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="PDF Preview + Question Mapping" subtitle="Sol panel PDF, sağ panel structured question form" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="mapping" />
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">PDF Preview Pane</h2>
            <div className="mt-4 rounded-3xl border border-dashed border-white/10 bg-black/20 p-10 text-sm text-zinc-400">Page thumbnails, zoom controls, OCR overlay ve source bounding-box preview burada yer alacak.</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">Structured Question Form</h2>
            <div className="mt-4 space-y-3">
              {[
                "Question number ve display order",
                "Section tag + passage group ilişkilendirme",
                "A/B/C/D/E seçenek düzenleme",
                "Answer key ve parse confidence review",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}