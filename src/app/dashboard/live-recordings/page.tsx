import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { CalendarDays, Clock3, ExternalLink, ShieldCheck, Video } from "lucide-react";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { getLiveRecordingAccessSubscription } from "@/src/lib/live-recordings-access";
import { detectMeetingPlatform } from "@/src/lib/meeting-platform";
import { getPanelRoleLabel, getStudentNavItems } from "@/src/lib/panel-nav";
import { prisma } from "@/src/lib/prisma";


export default async function DashboardLiveRecordingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/live-recordings");
  if (session.user.role === "TEACHER") redirect("/teacher");

  const now = new Date();
  const [t, formatter, studentNavItems, roleLabel] = await Promise.all([
    getTranslations("recordings"),
    getFormatter(),
    getStudentNavItems(session.user),
    getPanelRoleLabel(session.user.role),
  ]);
  const platformLabel = (url: string | null) => {
    const platform = detectMeetingPlatform(url);
    return platform === "zoom" ? "Zoom" : platform === "google-meet" ? "Google Meet" : t("externalLink");
  };

  const [accessSubscription, recordingCount, recordings] = await Promise.all([
    getLiveRecordingAccessSubscription(session.user.id),
    prisma.liveClass.count({
      where: {
        scheduledAt: { lt: now },
        NOT: [{ recordingUrl: null }, { recordingUrl: "" }],
      },
    }),
    prisma.liveClass.findMany({
      where: {
        scheduledAt: { lt: now },
        NOT: [{ recordingUrl: null }, { recordingUrl: "" }],
      },
      orderBy: { scheduledAt: "desc" },
      select: {
        id: true,
        title: true,
        topicOutline: true,
        description: true,
        scheduledAt: true,
        durationMinutes: true,
        meetingLink: true,
        recordingUrl: true,
      },
      take: 60,
    }),
  ]);

  const hasLiveRecordingsAccess =
    session.user.hasLiveRecordingsAccess === true || Boolean(accessSubscription);

  return (
    <DashboardShell
      navItems={studentNavItems}
      roleLabel={roleLabel}
      title={t("title")}
      subtitle={t("subtitle")}
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-sky-500/20 bg-sky-500/8 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">{t("total")}</p>
          <p className="mt-2 text-3xl font-black text-white">{recordingCount}</p>
        </div>
        <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/8 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{t("accessStatus")}</p>
          <p className="mt-2 text-sm font-semibold text-white">
            {hasLiveRecordingsAccess ? t("active") : t("inactive")}
          </p>
          <p className="mt-1 text-xs text-zinc-300">
            {accessSubscription
              ? t("accessPlan", { plan: accessSubscription.plan.name })
              : session.user.hasLiveRecordingsAccess
                ? t("accessManual")
              : t("accessNone")}
          </p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("membershipEnd")}</p>
          <p className="mt-2 text-sm font-semibold text-white">
            {accessSubscription?.endDate
              ? formatter.dateTime(accessSubscription.endDate, { dateStyle: "long" })
              : session.user.hasLiveRecordingsAccess
                ? t("manualAccess")
              : accessSubscription
                ? t("noLimit")
                : t("noMembership")}
          </p>
        </div>
      </div>

      {!hasLiveRecordingsAccess ? (
        <div className="rounded-[30px] border border-amber-400/30 bg-amber-400/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">{t("lockedBadge")}</p>
              <h2 className="mt-1 text-lg font-bold text-white">{t("lockedTitle")}</h2>
              <p className="mt-2 text-sm text-zinc-200">
                {t("lockedText")}
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              {t("viewPlans")}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {hasLiveRecordingsAccess && recordings.map((item) => (
          <div key={item.id} className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={12} />
                    {formatter.dateTime(item.scheduledAt, { dateStyle: "long", timeStyle: "short" })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={12} />
                    {t("minutes", { count: item.durationMinutes })}
                  </span>
                  <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-sky-200">
                    {platformLabel(item.meetingLink ?? item.recordingUrl)}
                  </span>
                </div>
                {item.topicOutline ? (
                  <p className="mt-2 text-sm text-zinc-300">{t("topic", { topic: item.topicOutline })}</p>
                ) : null}
                {item.description ? (
                  <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
                ) : null}
              </div>
              <Link
                href={item.recordingUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
              >
                {t("watch")}
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        ))}

        {hasLiveRecordingsAccess && recordings.length === 0 ? (
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
            <Video size={28} className="mx-auto text-zinc-500" />
            <p className="mt-3 text-sm text-zinc-400">{t("empty")}</p>
          </div>
        ) : null}
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-white">{t("policyTitle")}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {t("policyText")}
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
