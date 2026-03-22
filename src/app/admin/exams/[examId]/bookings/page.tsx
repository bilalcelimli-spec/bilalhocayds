import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamBookingsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="Lesson Review Bookings" subtitle="Attempt-linked live review scheduling workspace" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="bookings" />
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm leading-7 text-zinc-300">
          Bu ekran, sınav sonrası satın alınan 30 dakikalık birebir review oturumlarını, ödeme durumunu, slot planlamasını ve öğretmen notlarını yönetecek operasyon yüzeyi olarak scaffold edildi.
        </div>
      </div>
    </DashboardShell>
  );
}