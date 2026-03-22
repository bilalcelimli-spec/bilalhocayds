import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
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

  return (
    <DashboardShell navItems={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sınav", href: "/exam" }]} roleLabel="Öğrenci Paneli" title="Result Screen" subtitle="Instant scoring, review and upsell surface" userName={session.user.name ?? undefined} userRole={session.user.role}>
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