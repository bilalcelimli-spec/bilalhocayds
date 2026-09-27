import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getFormatter, getTimeZone, getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  Flame,
  GraduationCap,
  Languages,
  Video,
  Zap,
} from "lucide-react";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { getPanelRoleLabel, getStudentNavItems } from "@/src/lib/panel-nav";
import { prisma } from "@/src/lib/prisma";
import { getTodayStudentDailyContentSnapshot } from "@/src/lib/student-daily-content";
import { getStudentProgressSummary, PRACTICE_PERFORMANCE_WINDOW_DAYS } from "@/src/lib/student-progress";

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role === "TEACHER") redirect("/teacher");

  const [t, formatter, timeZone] = await Promise.all([
    getTranslations("dashboard"),
    getFormatter(),
    getTimeZone(),
  ]);
  // Selamlama, öğrencinin kendi saat dilimindeki saate göre seçilir.
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(new Date()),
  );
  const greeting =
    hour < 12 ? t("greetingMorning") : hour < 17 ? t("greetingDay") : t("greetingEvening");
  const nextLiveClass = session.user.hasLiveClassesAccess
    ? await prisma.liveClass.findFirst({
        where: { scheduledAt: { gte: new Date() }, status: { not: "CANCELLED" } },
        orderBy: { scheduledAt: "asc" },
        select: { title: true, scheduledAt: true },
      })
    : null;
  const nextLiveLabel = nextLiveClass
    ? formatter.dateTime(nextLiveClass.scheduledAt, { weekday: "long", hour: "2-digit", minute: "2-digit" })
    : null;
  const hasBundledExamAccess = (session.user.accessibleExamIds?.length ?? 0) > 0;
  const hasAnyExamAccess = session.user.hasExamAccess || hasBundledExamAccess;
  const [dailyContent, progress] = await Promise.all([
    session.user.id ? getTodayStudentDailyContentSnapshot(session.user.id, session.user) : Promise.resolve({} as Awaited<ReturnType<typeof getTodayStudentDailyContentSnapshot>>),
    getStudentProgressSummary(session.user.id, timeZone),
  ]);
  const todayTasks = [
    session.user.hasVocabAccess && dailyContent.vocabulary
      ? {
          id: 1,
          label: t("taskVocab", { count: dailyContent.vocabulary.items.length }),
          module: "Vocabulary",
          done: progress.practicedToday.has("VOCABULARY"),
        }
      : session.user.hasVocabAccess
        ? {
            id: 1,
            label: t("taskVocabStart"),
            module: "Vocabulary",
            done: progress.practicedToday.has("VOCABULARY"),
          }
      : null,
    session.user.hasReadingAccess && dailyContent.reading
      ? {
          id: 2,
          label: t("taskReading", { count: dailyContent.reading.passages[0]?.questions.length ?? 0 }),
          module: "Reading",
          done: progress.practicedToday.has("READING"),
        }
      : session.user.hasReadingAccess
        ? {
            id: 2,
            label: t("taskReadingStart"),
            module: "Reading",
            done: progress.practicedToday.has("READING"),
          }
      : null,
    session.user.hasGrammarAccess && dailyContent.grammar
      ? {
          id: 3,
          label: t("taskGrammar", { topic: dailyContent.grammar.focusTopic }),
          module: "Grammar",
          done: progress.practicedToday.has("GRAMMAR"),
        }
      : session.user.hasGrammarAccess
        ? {
            id: 3,
            label: t("taskGrammarStart"),
            module: "Grammar",
            done: progress.practicedToday.has("GRAMMAR"),
          }
      : null,
    hasAnyExamAccess
      ? {
          id: 4,
          label: t("taskExam"),
          module: "Exam",
          done: progress.examSubmittedToday,
        }
      : null,
  ].filter(isDefined);
  const [studentNavItems, roleLabel] = await Promise.all([
    getStudentNavItems(session.user),
    getPanelRoleLabel(session.user.role),
  ]);
  const moduleCards = [
    session.user.hasVocabAccess && dailyContent.vocabulary
      ? {
          title: "Vocabulary",
          desc: dailyContent.vocabulary.sessionTitle,
          href: "/vocabulary",
          Icon: Languages,
          gradient: "from-blue-600 to-blue-700",
          stat: t("cardVocabStat", { count: dailyContent.vocabulary.items.length }),
        }
      : session.user.hasVocabAccess
        ? {
            title: "Vocabulary",
            desc: t("cardVocabPrepare"),
            href: "/vocabulary",
            Icon: Languages,
            gradient: "from-blue-600 to-blue-700",
            stat: t("prepare"),
          }
      : null,
    session.user.hasReadingAccess && dailyContent.reading
      ? {
          title: "Reading",
          desc: dailyContent.reading.passages[0]?.title ?? t("cardReadingFallback"),
          href: "/reading",
          Icon: BookOpen,
          gradient: "from-indigo-600 to-indigo-700",
          stat: t("cardReadingStat", { count: dailyContent.reading.passages.length }),
        }
      : session.user.hasReadingAccess
        ? {
            title: "Reading",
            desc: t("cardReadingPrepare"),
            href: "/reading",
            Icon: BookOpen,
            gradient: "from-indigo-600 to-indigo-700",
            stat: t("prepare"),
          }
      : null,
    session.user.hasGrammarAccess && dailyContent.grammar
      ? {
          title: "Grammar",
          desc: dailyContent.grammar.focusTopic,
          href: "/grammar",
          Icon: GraduationCap,
          gradient: "from-violet-600 to-violet-700",
          stat: t("cardGrammarStat"),
        }
      : session.user.hasGrammarAccess
        ? {
            title: "Grammar",
            desc: t("cardGrammarPrepare"),
            href: "/grammar",
            Icon: GraduationCap,
            gradient: "from-violet-600 to-violet-700",
            stat: t("prepare"),
          }
      : null,
    {
      title: t("cardExam"),
      desc: hasAnyExamAccess ? t("cardExamOpen") : t("cardExamLocked"),
      href: "/exam",
      Icon: FileText,
      gradient: "from-emerald-600 to-emerald-700",
      stat: hasAnyExamAccess ? (hasBundledExamAccess && !session.user.hasExamAccess ? t("cardExamSets", { count: session.user.accessibleExamIds?.length ?? 0 }) : t("cardExamSet")) : t("locked"),
    },
    session.user.hasLiveClassesAccess
      ? {
          title: t("cardLive"),
          desc: nextLiveClass?.title ?? t("cardLiveText"),
          href: "/live-classes",
          Icon: Video,
          gradient: "from-teal-600 to-teal-700",
          stat: nextLiveLabel ?? t("cardLiveNone"),
        }
      : null,
  ].filter(isDefined);

  return (
    <DashboardShell
      navItems={studentNavItems}
      roleLabel={roleLabel}
      title={t("title", { greeting, name: session.user.name ?? t("defaultName") })}
      subtitle={t("subtitle")}
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("statWords"), value: session.user.hasVocabAccess ? (dailyContent.vocabulary ? String(dailyContent.vocabulary.items.length) : t("prepare")) : t("closed"), Icon: Languages, color: "text-blue-300", tone: "border-blue-500/20 bg-blue-500/8" },
          { label: t("statReading"), value: session.user.hasReadingAccess ? (dailyContent.reading ? String(dailyContent.reading.passages.length) : t("prepare")) : t("closed"), Icon: BookOpen, color: "text-indigo-300", tone: "border-indigo-500/20 bg-indigo-500/8" },
          { label: t("statGrammar"), value: session.user.hasGrammarAccess ? (dailyContent.grammar ? dailyContent.grammar.focusTopic : t("prepare")) : t("closed"), Icon: GraduationCap, color: "text-violet-300", tone: "border-violet-500/20 bg-violet-500/8" },
          { label: t("statExam"), value: hasAnyExamAccess ? hasBundledExamAccess && !session.user.hasExamAccess ? t("setsOpen", { count: session.user.accessibleExamIds?.length ?? 0 }) : t("open") : t("locked"), Icon: FileText, color: "text-emerald-300", tone: "border-emerald-500/20 bg-emerald-500/8" },
        ].map((s) => (
          <div
            key={s.label}
            className={"rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl " + s.tone}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                {s.label}
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                <s.Icon size={16} className={s.color} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{t("tasksTitle")}</h2>
              <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-zinc-500">{t("tasksMeta", { count: todayTasks.length })}</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-3 py-2">
              <Flame size={13} className="text-orange-400" />
              <span className="text-xs font-semibold text-orange-300">{t("streak", { count: progress.streakDays })}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4"
              >
                {task.done ? (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                ) : (
                  <Circle size={18} className="shrink-0 text-zinc-600" />
                )}
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">
                  {task.label}
                </p>
                <span className="shrink-0 rounded-xl border border-white/8 bg-black/20 px-2.5 py-1.5 text-xs text-zinc-400">
                  {task.module}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white">{t("performance")}</h2>
            <p className="mb-5 mt-0.5 text-xs uppercase tracking-[0.18em] text-zinc-500">
              {t("performanceMeta", { days: PRACTICE_PERFORMANCE_WINDOW_DAYS })}
            </p>
            <div className="space-y-4">
              {[
                { label: t("perfVocab"), stats: progress.performance.VOCABULARY, color: "bg-blue-500", enabled: session.user.hasVocabAccess },
                { label: t("perfGrammar"), stats: progress.performance.GRAMMAR, color: "bg-violet-500", enabled: session.user.hasGrammarAccess },
                { label: t("perfReading"), stats: progress.performance.READING, color: "bg-indigo-500", enabled: session.user.hasReadingAccess },
              ]
                .filter((item) => item.enabled || item.stats.total > 0)
                .map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-zinc-400">{item.label}</span>
                      <span className="font-semibold text-white">
                        {item.stats.accuracy === null ? t("perfEmpty") : formatter.number(item.stats.accuracy / 100, { style: "percent" })}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all`}
                        style={{ width: `${item.stats.accuracy ?? 0}%` }}
                      />
                    </div>
                    {item.stats.total > 0 ? (
                      <p className="mt-1 text-[11px] text-zinc-500">{t("perfCount", { correct: item.stats.correct, total: item.stats.total })}</p>
                    ) : null}
                  </div>
                ))}
            </div>
            {progress.performance.VOCABULARY.total + progress.performance.GRAMMAR.total + progress.performance.READING.total === 0 ? (
              <p className="mt-4 text-xs leading-5 text-zinc-500">{t("perfHint")}</p>
            ) : null}
          </div>

          {session.user.hasLiveClassesAccess ? (
          <div className="rounded-[30px] border border-teal-500/20 bg-teal-500/8 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <div className="mb-2 flex items-center gap-2">
              <Video size={14} className="text-teal-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">
                {t("nextLive")}
              </p>
            </div>
            <p className="text-xl font-black text-white">{nextLiveLabel ?? t("nextLiveNone")}</p>
            {nextLiveClass ? <p className="mt-1 text-xs text-zinc-400">{nextLiveClass.title}</p> : null}
            <Link
              href="/live-classes"
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition"
            >
              {t("details")} <ArrowRight size={12} />
            </Link>
          </div>
          ) : null}
        </div>
      </div>

      {/* Module quick access */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-white">{t("modulesTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {moduleCards.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition-all hover:-translate-y-0.5 hover:border-white/20"
            >
              <div className="pointer-events-none absolute -right-8 top-4 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${m.gradient}`}
              >
                <m.Icon size={18} className="text-white" />
              </div>
              <h3 className="font-bold text-white">{m.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{m.desc}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">{m.stat}</span>
                <ArrowRight
                  size={14}
                  className="text-zinc-500 transition-transform group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {dailyContent.vocabulary || dailyContent.reading || dailyContent.grammar ? (
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">{t("preparedTitle")}</h2>
              <p className="mt-1 text-sm text-zinc-400">{t("preparedText")}</p>
            </div>
            <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
              {t("autoDaily")}
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {dailyContent.vocabulary ? (
              <Link href="/vocabulary" className="rounded-[24px] border border-blue-500/20 bg-blue-500/8 p-5 transition hover:border-blue-400/40">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Vocabulary</p>
                <h3 className="mt-2 text-lg font-bold text-white">{dailyContent.vocabulary.items[0]?.word ?? t("vocabReady")}</h3>
                <p className="mt-2 text-sm text-zinc-300">{dailyContent.vocabulary.items.slice(0, 3).map((item) => item.word).join(", ")}</p>
              </Link>
            ) : null}
            {dailyContent.reading ? (
              <Link href="/reading" className="rounded-[24px] border border-indigo-500/20 bg-indigo-500/8 p-5 transition hover:border-indigo-400/40">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Reading</p>
                <h3 className="mt-2 text-lg font-bold text-white">{dailyContent.reading.passages[0]?.title ?? t("readingReady")}</h3>
                <p className="mt-2 text-sm text-zinc-300">{dailyContent.reading.passages[0]?.summary ?? dailyContent.reading.dailyGoal}</p>
              </Link>
            ) : null}
            {dailyContent.grammar ? (
              <Link href="/grammar" className="rounded-[24px] border border-violet-500/20 bg-violet-500/8 p-5 transition hover:border-violet-400/40">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Grammar</p>
                <h3 className="mt-2 text-lg font-bold text-white">{dailyContent.grammar.focusTopic}</h3>
                <p className="mt-2 text-sm text-zinc-300">{dailyContent.grammar.topicReason}</p>
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {!hasAnyExamAccess ? (
        <div className="rounded-[30px] border border-emerald-500/20 bg-gradient-to-r from-emerald-900/25 via-teal-900/15 to-cyan-900/15 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15">
                <FileText size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  {t("newModule")}
                </p>
                <h3 className="mt-1 text-base font-black text-white">
                  {t("examPromoTitle")}
                </h3>
                <p className="mt-1 text-sm text-zinc-300">
                  {t("examPromoText")}
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              {t("examPromoCta")}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : null}

      {session.user.hasReadingAccess ? (
      <div className="rounded-[30px] border border-fuchsia-500/20 bg-gradient-to-r from-fuchsia-900/25 via-indigo-900/15 to-cyan-900/15 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/15">
              <Zap size={18} className="text-fuchsia-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-300">
                {t("readerBadge")}
              </p>
              <h3 className="mt-1 text-base font-black text-white">
                {t("readerTitle")}
              </h3>
              <p className="mt-1 text-sm text-zinc-300">
                {t("readerText")}
              </p>
            </div>
          </div>
          <Link
            href="/reading"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            {t("readerCta")}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      ) : null}
    </DashboardShell>
  );
}

