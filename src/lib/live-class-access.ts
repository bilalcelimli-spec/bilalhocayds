import type { LiveClass } from "@prisma/client";

import type { ClassroomRole } from "@/src/lib/livekit";
import { prisma } from "@/src/lib/prisma";

/** Öğrenciler ders başlangıcından bu kadar dakika önce sınıfa girebilir. */
export const STUDENT_EARLY_JOIN_MINUTES = 15;
/** Ders süresi bittikten sonra sınıf bu kadar dakika daha açık kalır. */
export const LATE_JOIN_GRACE_MINUTES = 60;

type SessionUser = {
  id: string;
  role: string;
};

export type ClassroomAccessDenialReason =
  | "not-platform-class"
  | "cancelled"
  | "ended"
  | "too-early"
  | "too-late"
  | "no-access"
  | "full";

export type ClassroomAccessResult =
  | { allowed: true; role: ClassroomRole }
  | { allowed: false; reason: ClassroomAccessDenialReason; opensAt?: Date };

export function isHostRole(role: string) {
  return role === "ADMIN" || role === "TEACHER";
}

export function getJoinWindow(liveClass: Pick<LiveClass, "scheduledAt" | "durationMinutes">) {
  const opensAt = new Date(liveClass.scheduledAt.getTime() - STUDENT_EARLY_JOIN_MINUTES * 60_000);
  const closesAt = new Date(
    liveClass.scheduledAt.getTime() + (liveClass.durationMinutes + LATE_JOIN_GRACE_MINUTES) * 60_000,
  );
  return { opensAt, closesAt };
}

export async function hasStudentLiveClassAccess(userId: string, liveClass: Pick<LiveClass, "id" | "type">) {
  const now = new Date();

  const purchase = await prisma.liveClassPurchase.findFirst({
    where: { userId, liveClassId: liveClass.id, status: "PAID" },
    select: { id: true },
  });
  if (purchase) {
    return true;
  }

  // Birebir dersler yalnızca o derse özel satın alma ile açılır.
  if (liveClass.type === "ONE_ON_ONE") {
    return false;
  }

  const [subscription, manualAccess] = await Promise.all([
    prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING"] },
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        plan: { includesLiveClass: true },
      },
      select: { id: true },
    }),
    prisma.studentFeatureAccess.findUnique({
      where: { userId },
      select: { hasLiveClassesAccess: true },
    }),
  ]);

  return Boolean(subscription) || manualAccess?.hasLiveClassesAccess === true;
}

export async function resolveClassroomAccess(
  user: SessionUser,
  liveClass: LiveClass,
  now = new Date(),
): Promise<ClassroomAccessResult> {
  if (liveClass.roomProvider !== "LIVEKIT") {
    return { allowed: false, reason: "not-platform-class" };
  }

  if (liveClass.status === "CANCELLED") {
    return { allowed: false, reason: "cancelled" };
  }

  if (isHostRole(user.role)) {
    return { allowed: true, role: "host" };
  }

  if (liveClass.status === "ENDED") {
    return { allowed: false, reason: "ended" };
  }

  const { opensAt, closesAt } = getJoinWindow(liveClass);
  if (now < opensAt && liveClass.status !== "LIVE") {
    return { allowed: false, reason: "too-early", opensAt };
  }
  if (now > closesAt && liveClass.status !== "LIVE") {
    return { allowed: false, reason: "too-late" };
  }

  if (!(await hasStudentLiveClassAccess(user.id, liveClass))) {
    return { allowed: false, reason: "no-access" };
  }

  if (liveClass.capacity && liveClass.capacity > 0) {
    const activeStudents = await prisma.liveClassAttendance.findMany({
      where: {
        liveClassId: liveClass.id,
        leftAt: null,
        userId: { not: user.id },
        user: { role: "STUDENT" },
      },
      distinct: ["userId"],
      select: { userId: true },
    });
    if (activeStudents.length >= liveClass.capacity) {
      return { allowed: false, reason: "full" };
    }
  }

  return { allowed: true, role: liveClass.type === "WEBINAR" ? "viewer" : "speaker" };
}
