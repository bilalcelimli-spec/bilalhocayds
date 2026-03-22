import { prisma } from "@/lib/prisma";

export const REVIEW_FOLLOW_UP_ACTIONS = [
  "FOLLOW_UP_EXAM",
  "GRAMMAR_DRILL",
  "READING_PRACTICE",
  "VOCAB_REVIEW",
  "NO_ACTION",
] as const;

export type ReviewFollowUpAction = (typeof REVIEW_FOLLOW_UP_ACTIONS)[number];

export type ReviewBookingNotes = {
  studentNote: string | null;
  teacherPrepNote: string | null;
  lessonSummary: string | null;
  followUpAction: ReviewFollowUpAction | null;
};

export type ReviewSlotOption = {
  value: string;
  label: string;
};

const REVIEW_SLOT_HOURS = [10, 12, 14, 16, 18, 20] as const;
const SLOT_LOOKAHEAD_DAYS = 10;
const SLOT_MIN_LEAD_HOURS = 2;

function parseScheduleInput(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function createDateAtHour(reference: Date, hour: number) {
  return new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(), hour, 0, 0, 0);
}

function formatSlotLabel(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isFollowUpAction(value: unknown): value is ReviewFollowUpAction {
  return typeof value === "string" && REVIEW_FOLLOW_UP_ACTIONS.includes(value as ReviewFollowUpAction);
}

export function getReviewFollowUpActionLabel(value: ReviewFollowUpAction | null) {
  switch (value) {
    case "FOLLOW_UP_EXAM":
      return "1 yeni deneme planla";
    case "GRAMMAR_DRILL":
      return "Grammar drill öner";
    case "READING_PRACTICE":
      return "Reading practice öner";
    case "VOCAB_REVIEW":
      return "Vocabulary tekrar öner";
    case "NO_ACTION":
      return "Ek aksiyon gerekmiyor";
    default:
      return "Belirlenmedi";
  }
}

export function parseReviewBookingNotes(rawValue: string | null | undefined): ReviewBookingNotes {
  if (!rawValue?.trim()) {
    return {
      studentNote: null,
      teacherPrepNote: null,
      lessonSummary: null,
      followUpAction: null,
    };
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>;
    return {
      studentNote: typeof parsed.studentNote === "string" ? parsed.studentNote.trim() || null : null,
      teacherPrepNote: typeof parsed.teacherPrepNote === "string" ? parsed.teacherPrepNote.trim() || null : null,
      lessonSummary: typeof parsed.lessonSummary === "string" ? parsed.lessonSummary.trim() || null : null,
      followUpAction: isFollowUpAction(parsed.followUpAction) ? parsed.followUpAction : null,
    };
  } catch {
    return {
      studentNote: rawValue.trim() || null,
      teacherPrepNote: null,
      lessonSummary: null,
      followUpAction: null,
    };
  }
}

export function serializeReviewBookingNotes(notes: ReviewBookingNotes) {
  const normalized: ReviewBookingNotes = {
    studentNote: notes.studentNote?.trim() || null,
    teacherPrepNote: notes.teacherPrepNote?.trim() || null,
    lessonSummary: notes.lessonSummary?.trim() || null,
    followUpAction: notes.followUpAction ?? null,
  };

  if (!normalized.studentNote && !normalized.teacherPrepNote && !normalized.lessonSummary && !normalized.followUpAction) {
    return null;
  }

  return JSON.stringify(normalized);
}

export function mergeReviewBookingNotes(rawValue: string | null | undefined, patch: Partial<ReviewBookingNotes>) {
  const current = parseReviewBookingNotes(rawValue);
  return serializeReviewBookingNotes({
    ...current,
    ...patch,
  });
}

export function getReviewSlotOptions(now = new Date()): ReviewSlotOption[] {
  const options: ReviewSlotOption[] = [];
  const earliestAllowed = new Date(now.getTime() + SLOT_MIN_LEAD_HOURS * 60 * 60 * 1000);

  for (let dayOffset = 0; dayOffset < SLOT_LOOKAHEAD_DAYS; dayOffset += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);

    for (const hour of REVIEW_SLOT_HOURS) {
      const slot = createDateAtHour(day, hour);
      if (slot <= earliestAllowed) {
        continue;
      }

      options.push({
        value: slot.toISOString().slice(0, 16),
        label: formatSlotLabel(slot),
      });
    }
  }

  return options;
}

export function normalizeReviewSlotSelection(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const parsed = parseScheduleInput(normalized);
  if (!parsed) {
    return null;
  }

  const allowedValues = new Set(getReviewSlotOptions().map((option) => option.value));
  const parsedValue = parsed.toISOString().slice(0, 16);
  return allowedValues.has(parsedValue) ? parsed : null;
}

function buildScheduledEndAt(startAt: Date | null, durationMinutes: number) {
  return startAt ? new Date(startAt.getTime() + durationMinutes * 60 * 1000) : null;
}

export async function updateReviewBookingSchedule(input: {
  bookingId: string;
  teacherId: string | null;
  scheduledStartAt: string | null;
  teacherPrepNote: string | null;
}) {
  const booking = await prisma.examReviewBooking.findUnique({
    where: { id: input.bookingId },
    include: {
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  const nextStartAt = input.scheduledStartAt ? parseScheduleInput(input.scheduledStartAt) : null;
  const nextEndAt = buildScheduledEndAt(nextStartAt, booking.durationMinutes);
  const hasPaidPayment = booking.payments[0]?.status === "PAID" || booking.status === "PAID" || booking.status === "SCHEDULED" || booking.status === "COMPLETED";

  let nextStatus = booking.status;
  if (input.teacherId && nextStartAt && hasPaidPayment) {
    nextStatus = "SCHEDULED";
  } else if (!hasPaidPayment) {
    nextStatus = "PENDING_PAYMENT";
  } else if (booking.status !== "COMPLETED") {
    nextStatus = "PAID";
  }

  return prisma.examReviewBooking.update({
    where: { id: input.bookingId },
    data: {
      teacherId: input.teacherId,
      scheduledStartAt: nextStartAt,
      scheduledEndAt: nextEndAt,
      lessonNotes: mergeReviewBookingNotes(booking.lessonNotes, {
        teacherPrepNote: input.teacherPrepNote,
      }),
      status: nextStatus,
      cancelledAt: null,
    },
  });
}

export async function updateStudentReviewBookingPreference(input: {
  bookingId: string;
  userId: string;
  scheduledStartAt: string | null;
  studentNote: string | null;
}) {
  const booking = await prisma.examReviewBooking.findFirst({
    where: {
      id: input.bookingId,
      studentId: input.userId,
    },
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (["COMPLETED", "CANCELLED", "REFUNDED"].includes(booking.status)) {
    throw new Error("BOOKING_NOT_EDITABLE");
  }

  if (booking.teacherId) {
    throw new Error("BOOKING_ALREADY_ASSIGNED");
  }

  const nextStartAt = normalizeReviewSlotSelection(input.scheduledStartAt);

  if (input.scheduledStartAt && !nextStartAt) {
    throw new Error("BOOKING_SLOT_INVALID");
  }

  return prisma.examReviewBooking.update({
    where: { id: input.bookingId },
    data: {
      scheduledStartAt: nextStartAt,
      scheduledEndAt: buildScheduledEndAt(nextStartAt, booking.durationMinutes),
      lessonNotes: mergeReviewBookingNotes(booking.lessonNotes, {
        studentNote: input.studentNote,
      }),
      cancelledAt: null,
    },
  });
}

export async function completeReviewBooking(bookingId: string) {
  return prisma.examReviewBooking.update({
    where: { id: bookingId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}

export async function cancelReviewBooking(bookingId: string) {
  return prisma.examReviewBooking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      scheduledStartAt: null,
      scheduledEndAt: null,
    },
  });
}