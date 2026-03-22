import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { MockExamResult } from "@/src/components/exam/mock-exam-result";
import { getMockExamAttempt } from "@/src/lib/mock-exam-workspace";

type PageProps = { params: Promise<{ slug: string; attemptId: string }> };

export default async function MockExamResultPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { attemptId } = await params;
  const attempt = getMockExamAttempt(attemptId);

  return (
    <DashboardShell navItems={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sınav", href: "/exam" }]} roleLabel="Öğrenci Paneli" title="Result Screen" subtitle="Instant scoring, review and upsell surface" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <MockExamResult workspace={attempt.workspace} attemptId={attemptId} />
    </DashboardShell>
  );
}