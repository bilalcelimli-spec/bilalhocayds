import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { getExamFlowNavItems, getPanelRoleLabel } from "@/src/lib/panel-nav";
import { MockExamResult } from "@/src/components/exam/mock-exam-result";
import { getExamAttemptResult } from "@/src/lib/exam-attempts";
import { formatCurrency } from "@/src/lib/exam-workspace";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ slug: string; attemptId: string }> };

export default async function MockExamResultPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { slug, attemptId } = await params;
  const result = await getExamAttemptResult(session.user.id, attemptId).catch(() => null);
  if (!result || result.exam.slug !== slug) notFound();

  const exam = await prisma.examModule.findUnique({
    where: { id: result.exam.id },
    select: {
      aiExplanationEnabled: true,
      lessonReviewPrice: true,
      lessonCurrency: true,
    },
  });
  if (!exam) notFound();

  const [t, examNav, roleLabel] = await Promise.all([
    getTranslations("examFlow"),
    getExamFlowNavItems(),
    getPanelRoleLabel(session.user.role),
  ]);

  return (
    <DashboardShell navItems={examNav} roleLabel={roleLabel} title={t("result.title")} subtitle={t("result.subtitle")} userName={session.user.name ?? undefined} userRole={session.user.role}>
      <MockExamResult
        attemptId={attemptId}
        examSlug={slug}
        lessonPriceLabel={formatCurrency(exam.lessonReviewPrice, exam.lessonCurrency)}
        aiExplanationEnabled={exam.aiExplanationEnabled}
        result={result}
      />
    </DashboardShell>
  );
}