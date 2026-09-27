import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { getExamFlowNavItems, getPanelRoleLabel } from "@/src/lib/panel-nav";
import { formatCurrency, getStudentExamWorkspace } from "@/src/lib/exam-workspace";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function MockExamLandingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  const { slug } = await params;
  const workspace = await getStudentExamWorkspace(slug, session.user.id);
  if (!workspace) notFound();

  const questionCount = workspace.activeVersion?.questions.length ?? workspace.exam.questionCount;
  
  const latestAttemptHref = workspace.latestAttempt
    ? workspace.latestAttempt.status === "IN_PROGRESS"
      ? `/exam/${workspace.exam.slug}/attempt/${workspace.latestAttempt.id}`
      : `/exam/${workspace.exam.slug}/attempt/${workspace.latestAttempt.id}/result`
    : null;

  const [t, examNav, roleLabel] = await Promise.all([
    getTranslations("examFlow"),
    getExamFlowNavItems(),
    getPanelRoleLabel(session.user.role),
  ]);
  const levelLabel = workspace.exam.cefrLevel ?? t("landing.general");
  const latestAttemptLabel = workspace.latestAttempt
    ? workspace.latestAttempt.status === "IN_PROGRESS"
      ? t("landing.continue")
      : t("landing.lastResult")
    : null;

  return (
    <DashboardShell navItems={examNav} roleLabel={roleLabel} title={workspace.exam.title} subtitle={workspace.exam.subtitle ?? t("landing.subtitle")} userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[[t("landing.duration"), t("landing.minutes", { count: workspace.exam.durationMinutes })], [t("landing.questions"), String(questionCount)], [t("landing.level"), levelLabel], [t("landing.source"), workspace.exam.sourceLabel ?? "Bilal Hoca"]].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                <p className="mt-2 text-xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-zinc-300">
              <p>{workspace.exam.description ?? t("landing.defaultDescription")}</p>
              {workspace.exam.instructions ? <p className="mt-4 text-zinc-400">{workspace.exam.instructions}</p> : null}
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-200">{t("landing.lessonReview")}</p>
              <p className="mt-3 text-3xl font-black text-white">{formatCurrency(workspace.exam.lessonReviewPrice, workspace.exam.lessonCurrency)}</p>
              <p className="mt-3 text-sm leading-7 text-amber-50/90">{t("landing.reviewText")}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/exam/${workspace.exam.slug}/start`} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">{t("landing.start")}</Link>
            {latestAttemptHref ? <Link href={latestAttemptHref} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/10">{latestAttemptLabel}</Link> : null}
            {workspace.latestPaidBooking ? <span className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{t("landing.activeBooking", { status: workspace.latestPaidBooking.status })}</span> : null}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}