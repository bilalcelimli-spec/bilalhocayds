import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { MockExamResult } from "@/src/components/exam/mock-exam-result";
import { formatCurrency, getAdminExamWorkspace } from "@/src/lib/exam-workspace";

type PageProps = { params: Promise<{ examId: string }> };

export default async function AdminExamPreviewPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;
  const workspace = await getAdminExamWorkspace(examId);
  if (!workspace) notFound();

  const previewResult = workspace.latestSubmittedAttempt
    ? {
        correctCount: workspace.latestSubmittedAttempt.correctCount,
        incorrectCount: workspace.latestSubmittedAttempt.incorrectCount,
        blankCount: workspace.latestSubmittedAttempt.blankCount,
        netScore: workspace.latestSubmittedAttempt.netScore,
        accuracyPercentage: workspace.latestSubmittedAttempt.accuracyPercentage,
        strongestSection: workspace.latestSubmittedAttempt.strongestSection,
        weakestSection: workspace.latestSubmittedAttempt.weakestSection,
        answers: workspace.latestSubmittedAttempt.answers.map((answer) => ({
          id: answer.question.id,
          number: answer.question.questionNumber,
          section: answer.question.section.title,
          prompt: answer.question.questionText,
          correctAnswer: answer.question.correctAnswer,
          selectedAnswer: answer.selectedAnswer,
          isCorrect: answer.isCorrect,
        })),
      }
    : {
        correctCount: 0,
        incorrectCount: 0,
        blankCount: workspace.activeVersion?.questions.length ?? 0,
        netScore: 0,
        accuracyPercentage: 0,
        strongestSection: null,
        weakestSection: null,
        answers: (workspace.activeVersion?.questions ?? []).slice(0, 8).map((question) => ({
          id: question.id,
          number: question.questionNumber,
          section: question.section.title,
          prompt: question.questionText,
          correctAnswer: question.correctAnswer,
          selectedAnswer: null,
          isCorrect: null,
        })),
      };

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="Student Preview" subtitle="Submission sonrası result yüzeyinin önizlemesi" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="preview" />
        <MockExamResult
          attemptId={workspace.latestSubmittedAttempt?.id ?? "preview-attempt"}
          examSlug={workspace.exam.slug}
          lessonPriceLabel={formatCurrency(workspace.exam.lessonReviewPrice, workspace.exam.lessonCurrency)}
          aiExplanationEnabled={workspace.exam.aiExplanationEnabled}
          result={previewResult}
          previewMode
        />
      </div>
    </DashboardShell>
  );
}