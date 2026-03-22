import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { LiveExamShell } from "@/src/components/exam/live-exam-shell";
import { getMockExamAttempt } from "@/src/lib/mock-exam-workspace";

type PageProps = { params: Promise<{ slug: string; attemptId: string }> };

export default async function MockExamAttemptPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { attemptId } = await params;
  const attempt = getMockExamAttempt(attemptId);

  return (
    <DashboardShell navItems={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sınav", href: "/exam" }]} roleLabel="Öğrenci Paneli" title="Live Mock Exam" subtitle="OMR-style timed test shell" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <LiveExamShell workspace={attempt.workspace} remainingTimeLabel={attempt.remainingTimeLabel} attemptId={attemptId} />
    </DashboardShell>
  );
}