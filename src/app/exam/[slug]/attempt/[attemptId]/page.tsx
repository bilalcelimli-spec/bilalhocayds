import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { LiveExamShell } from "@/src/components/exam/live-exam-shell";
import { getExamAttemptPayload } from "@/src/lib/exam-attempts";

type PageProps = { params: Promise<{ slug: string; attemptId: string }> };

export default async function MockExamAttemptPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { slug, attemptId } = await params;
  const attempt = await getExamAttemptPayload(session.user.id, attemptId).catch(() => null);
  if (!attempt || attempt.exam.slug !== slug) notFound();

  return (
    <DashboardShell navItems={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sınav", href: "/exam" }]} roleLabel="Öğrenci Paneli" title="Live Mock Exam" subtitle="OMR-style timed test shell" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <LiveExamShell
        attemptId={attemptId}
        examSlug={slug}
        title={attempt.exam.title}
        totalQuestions={attempt.questions.length}
        remainingSeconds={attempt.remainingSeconds}
        questions={attempt.questions}
      />
    </DashboardShell>
  );
}