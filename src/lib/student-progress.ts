import { AttemptStatus, DailyContentModule } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import { getIstanbulDayKey } from "@/src/lib/student-daily-content";

export const PRACTICE_PERFORMANCE_WINDOW_DAYS = 30;
const STREAK_LOOKBACK_DAYS = 120;
const DAY_MS = 24 * 60 * 60 * 1000;

export type PracticeAnswerInput = { itemKey: string; isCorrect: boolean };

/** Stores practice answers for today's daily content. The first answer to an item wins. */
export async function recordPracticeAnswers(
  userId: string,
  moduleKey: DailyContentModule,
  answers: PracticeAnswerInput[],
  now = new Date(),
) {
  if (answers.length === 0) return 0;
  const dayKey = getIstanbulDayKey(now);
  const result = await prisma.studentPracticeAnswer.createMany({
    data: answers.map((answer) => ({ userId, moduleKey, dayKey, itemKey: answer.itemKey, isCorrect: answer.isCorrect })),
    skipDuplicates: true,
  });
  return result.count;
}

function dayKeyInZone(date: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  } catch {
    return getIstanbulDayKey(date);
  }
}

function previousDayKey(dayKey: string) {
  return new Date(Date.parse(`${dayKey}T12:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
}

/** Consecutive days with activity, counting back from today (or yesterday if nothing yet today). */
export function countStreak(activityDayKeys: Set<string>, now: Date, timeZone: string) {
  let cursor = dayKeyInZone(now, timeZone);
  if (!activityDayKeys.has(cursor)) cursor = previousDayKey(cursor);
  let streak = 0;
  while (activityDayKeys.has(cursor)) {
    streak += 1;
    cursor = previousDayKey(cursor);
  }
  return streak;
}

export type ModulePerformance = { correct: number; total: number; accuracy: number | null };

export type StudentProgressSummary = {
  performance: Record<DailyContentModule, ModulePerformance>;
  streakDays: number;
  practicedToday: Set<DailyContentModule>;
  examSubmittedToday: boolean;
};

export async function getStudentProgressSummary(userId: string, timeZone: string, now = new Date()): Promise<StudentProgressSummary> {
  const performanceSince = new Date(now.getTime() - PRACTICE_PERFORMANCE_WINDOW_DAYS * DAY_MS);
  const streakSince = new Date(now.getTime() - STREAK_LOOKBACK_DAYS * DAY_MS);

  const [grouped, practiceDates, examDates] = await Promise.all([
    prisma.studentPracticeAnswer.groupBy({
      by: ["moduleKey", "isCorrect"],
      where: { userId, answeredAt: { gte: performanceSince } },
      _count: { _all: true },
    }),
    prisma.studentPracticeAnswer.findMany({
      where: { userId, answeredAt: { gte: streakSince } },
      select: { answeredAt: true, moduleKey: true },
    }),
    prisma.examAttempt.findMany({
      where: { studentId: userId, status: { not: AttemptStatus.IN_PROGRESS }, submittedAt: { gte: streakSince } },
      select: { submittedAt: true },
    }),
  ]);

  const performance = Object.fromEntries(
    Object.values(DailyContentModule).map((moduleKey) => {
      const rows = grouped.filter((row) => row.moduleKey === moduleKey);
      const total = rows.reduce((sum, row) => sum + row._count._all, 0);
      const correct = rows.filter((row) => row.isCorrect).reduce((sum, row) => sum + row._count._all, 0);
      return [moduleKey, { correct, total, accuracy: total > 0 ? Math.round((correct / total) * 100) : null }];
    }),
  ) as Record<DailyContentModule, ModulePerformance>;

  const todayKey = dayKeyInZone(now, timeZone);
  const activityDays = new Set<string>();
  const practicedToday = new Set<DailyContentModule>();
  for (const row of practiceDates) {
    const key = dayKeyInZone(row.answeredAt, timeZone);
    activityDays.add(key);
    if (key === todayKey) practicedToday.add(row.moduleKey);
  }
  let examSubmittedToday = false;
  for (const row of examDates) {
    if (!row.submittedAt) continue;
    const key = dayKeyInZone(row.submittedAt, timeZone);
    activityDays.add(key);
    if (key === todayKey) examSubmittedToday = true;
  }

  return { performance, streakDays: countStreak(activityDays, now, timeZone), practicedToday, examSubmittedToday };
}
