import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, BookOpen, GraduationCap, Languages, Sparkles } from "lucide-react";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { getPanelRoleLabel, getStudentNavItems, getTeacherNavItems } from "@/src/lib/panel-nav";
import { prisma } from "@/src/lib/prisma";

type PublishedItem = {
  title: string;
  content: string;
  difficulty: string;
  tags: string[];
  sourceInspiration: string;
  answerKey?: string | null;
};



function inferIcon(itemType: string) {
  const normalized = itemType.toLowerCase();
  if (normalized.includes("reading")) return BookOpen;
  if (normalized.includes("grammar")) return GraduationCap;
  if (normalized.includes("vocab")) return Languages;
  return Sparkles;
}

function normalizeGeneratedItems(value: unknown): PublishedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): PublishedItem | null => {
      const title = typeof item?.title === "string" ? item.title.trim() : "";
      const content = typeof item?.content === "string" ? item.content.trim() : "";
      const difficulty = typeof item?.difficulty === "string" ? item.difficulty.trim() : "Mixed";
      const tags = Array.isArray(item?.tags)
        ? item.tags
            .map((tag: unknown) => (typeof tag === "string" ? tag.trim() : ""))
            .filter((tag: string) => tag.length > 0)
        : [];
      const sourceInspiration = typeof item?.sourceInspiration === "string" ? item.sourceInspiration.trim() : "Content engine";
      const answerKey = typeof item?.answerKey === "string" ? item.answerKey.trim() : null;

      if (!title || !content) {
        return null;
      }

      return { title, content, difficulty, tags, sourceInspiration, answerKey };
    })
    .filter((item: PublishedItem | null): item is PublishedItem => Boolean(item));
}

export default async function DashboardContentLibraryPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/content-engine");

  const [t, formatter, navItems, roleLabel] = await Promise.all([
    getTranslations("library"),
    getFormatter(),
    session.user.role === "TEACHER" ? getTeacherNavItems() : getStudentNavItems(session.user),
    getPanelRoleLabel(session.user.role),
  ]);
  const hasContentLibraryAccess =
    session.user.role === "TEACHER" || session.user.hasContentLibraryAccess === true;

  const publishedRuns = hasContentLibraryAccess
    ? await prisma.contentGenerationRun.findMany({
        where: {
          status: "COMPLETED",
          isApproved: true,
          isPublished: true,
        },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          itemType: true,
          outputFormat: true,
          itemCount: true,
          styleAnalysis: true,
          generatedItemsJson: true,
          generatedText: true,
          publishedAt: true,
        },
      })
    : [];

  return (
    <DashboardShell
      navItems={navItems}
      roleLabel={roleLabel}
      title={t("title")}
      subtitle={t("subtitle")}
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      {!hasContentLibraryAccess ? (
        <div className="rounded-[30px] border border-amber-400/30 bg-amber-400/10 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">{t("lockedBadge")}</p>
          <h2 className="mt-3 text-2xl font-black text-white">{t("lockedTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-200">
            {t("lockedText")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200">
              {t("backToDashboard")}
            </Link>
            <Link href="/pricing" className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/10">
              {t("viewPlans")}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={session.user.role === "TEACHER" ? "/teacher" : "/dashboard"}
          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          {t("back")}
        </Link>
        <div className="ml-auto rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
          {t("count", { count: publishedRuns.length })}
        </div>
      </div>

      <div className="space-y-5">
        {hasContentLibraryAccess && publishedRuns.length ? (
          publishedRuns.map((run) => {
            const Icon = inferIcon(run.itemType);
            const items = normalizeGeneratedItems(run.generatedItemsJson);

            return (
              <section
                key={run.id}
                className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05] text-emerald-300">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">{t("publishedBadge")}</p>
                      <h2 className="mt-2 text-xl font-black text-white">{run.title}</h2>
                      <p className="mt-1 text-sm text-zinc-400">{t("meta", { type: run.itemType, count: run.itemCount, format: run.outputFormat })}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{t("publishedAt")}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{run.publishedAt ? formatter.dateTime(new Date(run.publishedAt), { dateStyle: "medium", timeStyle: "short" }) : "-"}</p>
                  </div>
                </div>

                {run.styleAnalysis ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-white">{t("editorNote")}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">{run.styleAnalysis}</p>
                  </div>
                ) : null}

                <div className="mt-5 space-y-4">
                  {items.length ? items.map((item, index) => (
                    <article key={`${run.id}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-white">{index + 1}. {item.title}</h3>
                        <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold text-zinc-300">{item.difficulty}</span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-zinc-200">{item.content}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                        <span>{t("inspiration", { source: item.sourceInspiration })}</span>
                        {item.tags.length ? <span>· {item.tags.join(" · ")}</span> : null}
                      </div>
                      {item.answerKey ? <p className="mt-3 text-xs text-emerald-300">{t("answerKey", { key: item.answerKey })}</p> : null}
                    </article>
                  )) : run.generatedText ? (
                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">{run.generatedText}</pre>
                    </article>
                  ) : null}
                </div>
              </section>
            );
          })
        ) : hasContentLibraryAccess ? (
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <p className="text-lg font-bold text-white">{t("emptyTitle")}</p>
            <p className="mt-2 text-sm text-zinc-500">{t("emptyText")}</p>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}