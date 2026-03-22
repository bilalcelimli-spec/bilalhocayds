import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ExplanationSourceType, QuestionStatus } from "@prisma/client";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { getAdminExamWorkspace } from "@/src/lib/exam-workspace";
import { prisma } from "@/src/lib/prisma";

type PageProps = { params: Promise<{ examId: string }> };

function normalizeAnswer(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "A";
  }

  const normalized = value.trim().toUpperCase();
  return ["A", "B", "C", "D", "E"].includes(normalized) ? normalized : "A";
}

function normalizeFloat(value: FormDataEntryValue | null, fallback: number | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : fallback;
}

function parseTags(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export default async function AdminExamQuestionsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const adminUserId = session.user.id;
  const { examId } = await params;
  const workspace = await getAdminExamWorkspace(examId);
  if (!workspace) notFound();

  async function saveQuestionAction(formData: FormData) {
    "use server";

    const questionId = String(formData.get("questionId") ?? "").trim();
    const mode = String(formData.get("mode") ?? "save").trim();
    if (!questionId) {
      return;
    }

    const questionText = String(formData.get("questionText") ?? "").trim();
    const optionA = String(formData.get("optionA") ?? "").trim();
    const optionB = String(formData.get("optionB") ?? "").trim();
    const optionC = String(formData.get("optionC") ?? "").trim();
    const optionD = String(formData.get("optionD") ?? "").trim();
    const optionE = String(formData.get("optionE") ?? "").trim();
    const manualExplanation = String(formData.get("manualExplanation") ?? "").trim();

    if (!questionText || !optionA || !optionB || !optionC || !optionD || !optionE) {
      throw new Error("Question text ve tum secenekler zorunlu.");
    }

    await prisma.examQuestion.update({
      where: { id: questionId },
      data: {
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        optionE,
        correctAnswer: normalizeAnswer(formData.get("correctAnswer")),
        difficultyLabel: String(formData.get("difficultyLabel") ?? "").trim() || null,
        parseConfidence: normalizeFloat(formData.get("parseConfidence"), null),
        topicTags: parseTags(formData.get("topicTags")),
        manualExplanation: manualExplanation || null,
        explanationSourceType: manualExplanation ? ExplanationSourceType.MANUAL : ExplanationSourceType.AI,
        status: mode === "verify" ? QuestionStatus.VERIFIED : QuestionStatus.DRAFT,
        isVerified: mode === "verify",
        updatedById: adminUserId,
      },
    });

    revalidatePath(`/admin/exams/${examId}/questions`);
    revalidatePath(`/admin/exams/${examId}/mapping`);
    revalidatePath(`/admin/exams/${examId}/parse`);
    revalidatePath(`/admin/exams/${examId}`);
  }

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="Question Editor" subtitle="Normalized question bank editor" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="questions" />
        <div className="space-y-4">
          {(workspace.activeVersion?.questions ?? []).map((question) => (
            <form key={question.id} action={saveQuestionAction} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <input type="hidden" name="questionId" value={question.id} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Soru {question.questionNumber} · {question.section.title}</p>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-400">{question.status} · {question.isVerified ? "verified" : "review"}</span>
              </div>
              <textarea name="questionText" defaultValue={question.questionText} rows={3} className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-7 text-zinc-200" />
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  ["optionA", question.optionA],
                  ["optionB", question.optionB],
                  ["optionC", question.optionC],
                  ["optionD", question.optionD],
                  ["optionE", question.optionE],
                ].map(([fieldName, optionValue]) => (
                  <input
                    key={fieldName}
                    name={fieldName}
                    defaultValue={optionValue}
                    className={`rounded-2xl border px-3 py-2 text-sm ${String(optionValue).startsWith(question.correctAnswer) ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-black/20 text-zinc-300"}`}
                  />
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <label className="space-y-2 text-xs text-zinc-400">
                  <span>Correct answer</span>
                  <select name="correctAnswer" defaultValue={question.correctAnswer} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
                    {["A", "B", "C", "D", "E"].map((letter) => (
                      <option key={letter} value={letter}>{letter}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-xs text-zinc-400">
                  <span>Confidence</span>
                  <input name="parseConfidence" defaultValue={question.parseConfidence ?? 0} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200" />
                </label>
                <label className="space-y-2 text-xs text-zinc-400 md:col-span-2">
                  <span>Difficulty</span>
                  <input name="difficultyLabel" defaultValue={question.difficultyLabel ?? ""} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200" />
                </label>
              </div>
              <label className="mt-4 block space-y-2 text-xs text-zinc-400">
                <span>Tags</span>
                <input name="topicTags" defaultValue={question.topicTags.join(", ")} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200" />
              </label>
              <label className="mt-4 block space-y-2 text-xs text-zinc-400">
                <span>Manual explanation</span>
                <textarea name="manualExplanation" defaultValue={question.manualExplanation ?? ""} rows={3} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-7 text-zinc-200" />
              </label>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span>confidence: {(question.parseConfidence ?? 0).toFixed(2)}</span>
                {question.difficultyLabel ? <span>· difficulty: {question.difficultyLabel}</span> : null}
                {question.topicTags.length ? <span>· tags: {question.topicTags.join(", ")}</span> : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="submit" name="mode" value="save" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10">
                  Taslak kaydet
                </button>
                <button type="submit" name="mode" value="verify" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15">
                  Verify et
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}