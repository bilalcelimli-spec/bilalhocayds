import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { getExamFlowNavItems, getPanelRoleLabel } from "@/src/lib/panel-nav";
import { LiveExamShell } from "@/src/components/exam/live-exam-shell";
import { getExamAttemptPayload } from "@/src/lib/exam-attempts";

type PageProps = { params: Promise<{ slug: string; attemptId: string }> };

export default async function MockExamAttemptPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { slug, attemptId } = await params;
  const attempt = await getExamAttemptPayload(session.user.id, attemptId).catch(() => null);
  if (!attempt || attempt.exam.slug !== slug) notFound();

  const [t, examNav, roleLabel] = await Promise.all([
    getTranslations("examFlow"),
    getExamFlowNavItems(),
    getPanelRoleLabel(session.user.role),
  ]);

  return (
    <DashboardShell navItems={examNav} roleLabel={roleLabel} title={t("attempt.title")} subtitle={t("attempt.subtitle")} userName={session.user.name ?? undefined} userRole={session.user.role}>
      <LiveExamShell
        attemptId={attemptId}
        examSlug={slug}
        title={attempt.exam.title}
        totalQuestions={attempt.questions.length}
        remainingSeconds={attempt.remainingSeconds}
        deliveryMode={attempt.deliveryMode}
        adaptive={attempt.adaptive}
        questions={attempt.questions}
      />
    </DashboardShell>
  );
}