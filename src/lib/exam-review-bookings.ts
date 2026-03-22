import { prisma } from "@/lib/prisma";

function parseScheduleInput(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function updateReviewBookingSchedule(input: {
  bookingId: string;
  teacherId: string | null;
  scheduledStartAt: string | null;
  lessonNotes: string | null;
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
  const nextEndAt = nextStartAt
    ? new Date(nextStartAt.getTime() + booking.durationMinutes * 60 * 1000)
    : null;
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
      lessonNotes: input.lessonNotes,
      status: nextStatus,
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