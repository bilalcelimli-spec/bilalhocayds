import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileText, LibraryBig } from "lucide-react";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { ExamMarketplacePurchase } from "@/src/components/payment/exam-marketplace-purchase";
import { getStudentNavItems, getTeacherNavItems } from "@/src/lib/panel-nav";
import { examPurchase, prisma } from "@/src/lib/prisma";

type ExamQuestion = {
  prompt: string;
  choices: string[];
  answer?: string;
};

type NormalizedExamContent = {
  sections: Array<{ title: string; questions: ExamQuestion[] }>;
  questions: ExamQuestion[];
};


function parseQuestions(value: unknown): ExamQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<ExamQuestion[]>((questions, item) => {
      if (!item || typeof item !== "object") {
        return questions;
      }

      const record = item as Record<string, unknown>;
      const prompt = String(record.prompt ?? record.question ?? "").trim();
      if (!prompt) {
        return questions;
      }

      const rawChoices = Array.isArray(record.choices)
        ? record.choices
        : Array.isArray(record.options)
          ? record.options
          : [];

      const choices = rawChoices
        .map((choice) => String(choice ?? "").trim())
        .filter((choice) => Boolean(choice));

      questions.push({
        prompt,
        choices,
        answer: String(record.answer ?? record.correctAnswer ?? "").trim() || undefined,
      });

      return questions;
    }, []);
}

function normalizeExamContent(value: unknown): NormalizedExamContent {
  if (!value || typeof value !== "object") {
    return { sections: [], questions: [] };
  }

  const record = value as Record<string, unknown>;
  const questions = parseQuestions(record.questions);
  const sections = Array.isArray(record.sections)
    ? record.sections
        .map((section, index) => {
          if (!section || typeof section !== "object") {
            return null;
          }

          const sectionRecord = section as Record<string, unknown>;
          const sectionQuestions = parseQuestions(sectionRecord.questions);
          if (sectionQuestions.length === 0) {
            return null;
          }

          return {
            title: String(sectionRecord.title ?? sectionRecord.name ?? "").trim() || `#${index + 1}`,
            questions: sectionQuestions,
          };
        })
        .filter((item): item is { title: string; questions: ExamQuestion[] } => Boolean(item))
    : [];

  return { sections, questions };
}

export default async function ExamPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  const [t, tNav] = await Promise.all([getTranslations("examPage"), getTranslations("panelNav")]);

  const exams = await prisma.examModule.findMany({
    where: { isActive: true, isPublished: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      examType: true,
      cefrLevel: true,
      questionCount: true,
      durationMinutes: true,
      description: true,
      price: true,
      isForSale: true,
      marketplaceTitle: true,
      marketplaceDescription: true,
      coverImageUrl: true,
      instructions: true,
    },
  });
  const paidPurchases = session.user.email || session.user.id
    ? await examPurchase.findMany({
        where: {
          status: "PAID",
          OR: [
            ...(session.user.id ? [{ userId: session.user.id }] : []),
            ...(session.user.email ? [{ email: session.user.email.toLowerCase() }] : []),
          ],
        },
        select: { examModuleId: true },
      })
    : [];
  const purchasedExamIds = new Set(paidPurchases.map((purchase) => purchase.examModuleId));
  const bundledExamIds = new Set(session.user.accessibleExamIds ?? []);
  const fullExamAccess = session.user.hasExamAccess || session.user.role === "TEACHER";
  const accessibleExamIds = fullExamAccess
    ? exams.map((exam) => exam.id)
    : exams
        .filter((exam) => bundledExamIds.has(exam.id) || purchasedExamIds.has(exam.id))
        .map((exam) => exam.id);
  const accessibleExamDetails = accessibleExamIds.length
    ? await prisma.examModule.findMany({
        where: { id: { in: accessibleExamIds } },
        select: {
          id: true,
          instructions: true,
          contentJson: true,
        },
      })
    : [];
  const accessibleExamDetailsMap = new Map(
    accessibleExamDetails.map((exam) => [exam.id, exam]),
  );
  const [studentNavItems, teacherNavItems] = await Promise.all([
    getStudentNavItems(session.user),
    getTeacherNavItems(),
  ]);
  const accessibleExamCount = fullExamAccess
    ? exams.length
    : accessibleExamIds.length;

  return (
    <DashboardShell
      navItems={session.user.role === "TEACHER" ? teacherNavItems : studentNavItems}
      roleLabel={session.user.role === "TEACHER" ? tNav("teacherRole") : tNav("studentRole")}
      title={t("title")}
      subtitle={t("subtitle")}
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("statPublished"), value: exams.length, Icon: FileText, tone: "border-emerald-500/20 bg-emerald-500/8", color: "text-emerald-300" },
          { label: t("statQuestions"), value: exams.reduce((sum, exam) => sum + exam.questionCount, 0), Icon: LibraryBig, tone: "border-blue-500/20 bg-blue-500/8", color: "text-blue-300" },
          { label: t("statLongest"), value: t("minutes", { count: Math.max(...exams.map((exam) => exam.durationMinutes), 0) }), Icon: Clock3, tone: "border-violet-500/20 bg-violet-500/8", color: "text-violet-300" },
          { label: t("statAccess"), value: fullExamAccess ? t("accessFull") : accessibleExamCount > 0 ? t("accessCount", { count: accessibleExamCount }) : t("locked"), Icon: CheckCircle2, tone: "border-amber-500/20 bg-amber-500/8", color: "text-amber-300" },
        ].map((item) => (
          <div key={item.label} className={`rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl ${item.tone}`}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">{item.label}</p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                <item.Icon size={16} className={item.color} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Exam Access</p>
            <h2 className="mt-2 text-2xl font-black text-white">{t("listTitle")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
              {t("listText")}
            </p>
          </div>
          {!fullExamAccess ? (
            <Link href="/pricing" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200">
              {t("unlockFull")}
              <ArrowRight size={14} />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {exams.map((exam) => {
          const hasAccess = fullExamAccess || bundledExamIds.has(exam.id) || purchasedExamIds.has(exam.id);
          const examDetail = hasAccess ? accessibleExamDetailsMap.get(exam.id) : null;
          const content = examDetail ? normalizeExamContent(examDetail.contentJson) : { sections: [], questions: [] };
          const previewQuestions = content.questions.length > 0
            ? content.questions.slice(0, 3)
            : content.sections.flatMap((section) => section.questions).slice(0, 3);

          return (
            <article key={exam.id} className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">{exam.examType}</p>
                  <h3 className="mt-2 text-xl font-black text-white">{exam.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-zinc-400">{exam.description ?? t("defaultDescription")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {exam.cefrLevel ? <span className="rounded-xl bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300">{exam.cefrLevel}</span> : null}
                  <span className="rounded-xl bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">{t("questions", { count: exam.questionCount })}</span>
                  <span className="rounded-xl bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">{t("minutes", { count: exam.durationMinutes })}</span>
                  <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${hasAccess ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{hasAccess ? t("accessOpen") : t("purchasable")}</span>
                </div>
              </div>

              {hasAccess && examDetail?.instructions ? (
                <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{t("instructions")}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-300">{examDetail.instructions}</p>
                </div>
              ) : null}

              {hasAccess && content.sections.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {content.sections.slice(0, 2).map((section, index) => (
                    <div key={`${exam.id}-section-${index}`} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <p className="text-sm font-semibold text-white">{section.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{t("questions", { count: section.questions.length })}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {hasAccess && previewQuestions.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {previewQuestions.map((question, index) => (
                    <div key={`${exam.id}-question-${index}`} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                      <p className="text-sm font-semibold text-zinc-200">{index + 1}. {question.prompt}</p>
                      {question.choices.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {question.choices.map((choice) => (
                            <span key={choice} className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-zinc-400">
                              {choice}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : !hasAccess && exam.isForSale && exam.price && exam.price > 0 ? (
                <div className="mt-4">
                  <ExamMarketplacePurchase
                    examModuleId={exam.id}
                    title={exam.marketplaceTitle ?? exam.title}
                    examType={exam.examType}
                    description={exam.marketplaceDescription ?? exam.description}
                    coverImageUrl={exam.coverImageUrl}
                    questionCount={exam.questionCount}
                    durationMinutes={exam.durationMinutes}
                    price={exam.price}
                    defaultFullName={session.user.name ?? ""}
                    defaultEmail={session.user.email ?? ""}
                    compact
                  />
                </div>
              ) : !hasAccess ? (
                <div className="mt-4 rounded-2xl border border-dashed border-amber-400/20 bg-amber-500/5 px-4 py-6 text-sm text-amber-100/80">
                  {t("needsPurchase")}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-zinc-500">
                  {t("noPreview")}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {exams.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-white/10 px-6 py-12 text-center text-zinc-500">
          {t("empty")}
        </div>
      ) : null}
    </DashboardShell>
  );
}
