import { getServerSession } from "next-auth";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { ClassroomRoom } from "@/src/components/classroom/classroom-room";
import { resolveClassroomAccess, STUDENT_EARLY_JOIN_MINUTES } from "@/src/lib/live-class-access";
import { isLiveKitConfigured } from "@/src/lib/livekit";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClassroomPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/classroom/${classId}`)}`);
  }

  const liveClass = await prisma.liveClass.findUnique({ where: { id: classId } });
  if (!liveClass) {
    notFound();
  }

  const [t, formatter, access] = await Promise.all([
    getTranslations("classroom"),
    getFormatter(),
    resolveClassroomAccess({ id: session.user.id, role: session.user.role }, liveClass),
  ]);
  const liveKitReady = isLiveKitConfigured();
  const displayName = session.user.name?.trim() || session.user.email?.split("@")[0] || t("defaultName");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">
            {t("badge")}
            {liveClass.status === "LIVE" ? <span className="ml-2 text-red-400">{t("live")}</span> : null}
          </p>
          <h1 className="mt-2 break-words text-2xl font-black text-white sm:text-3xl">{liveClass.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {t("schedule", {
              date: formatter.dateTime(liveClass.scheduledAt, {
                dateStyle: "full",
                timeStyle: "short",
              }),
              minutes: liveClass.durationMinutes,
            })}
          </p>
        </div>
        <Link href="/live-classes" className="text-sm text-slate-300 underline-offset-4 hover:underline">
          {t("back")}
        </Link>
      </div>

      {!liveKitReady ? (
        <Notice text={t("notConfigured")} backLabel={t("liveClasses")} />
      ) : access.allowed ? (
        <ClassroomRoom
          classId={liveClass.id}
          title={liveClass.title}
          displayName={displayName}
          isWebinarViewer={access.role === "viewer"}
        />
      ) : (
        <Notice
          text={t(`denied.${access.reason}`, { minutes: STUDENT_EARLY_JOIN_MINUTES })}
          detail={
            access.opensAt
              ? t("opensAt", {
                  date: formatter.dateTime(access.opensAt, { dateStyle: "medium", timeStyle: "short" }),
                })
              : undefined
          }
          backLabel={t("liveClasses")}
          pricingLabel={access.reason === "no-access" ? t("viewPlans") : undefined}
        />
      )}
    </div>
  );
}

function Notice({
  text,
  detail,
  backLabel,
  pricingLabel,
}: {
  text: string;
  detail?: string;
  backLabel: string;
  pricingLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white">
      <p className="text-base font-semibold">{text}</p>
      {detail ? <p className="mt-2 text-sm text-slate-400">{detail}</p> : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/live-classes"
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        >
          {backLabel}
        </Link>
        {pricingLabel ? (
          <Link
            href="/pricing"
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
          >
            {pricingLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
