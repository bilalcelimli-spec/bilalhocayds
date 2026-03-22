import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/auth";
import { mergeReviewBookingNotes, normalizeReviewSlotSelection } from "@/src/lib/exam-review-bookings";
import { paytrCheckout } from "@/lib/payment/paytr-checkout";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  attemptId: z.string().min(1),
  fullName: z.string().min(2).max(120),
  email: z.email(),
  phone: z.string().min(10).max(20),
  preferredSlot: z.string().optional(),
  bookingNote: z.string().max(1000).optional(),
});

const rateLimitStore = new Map<string, number[]>();

function createReviewPaymentReferenceId() {
  return `revp${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `review-pay:${ip}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 12;
  const entries = (rateLimitStore.get(key) ?? []).filter((time) => now - time < windowMs);
  entries.push(now);
  rateLimitStore.set(key, entries);
  return entries.length > maxRequests;
}

function parsePreferredSlot(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  return normalizeReviewSlotSelection(value) ?? "INVALID";
}

export async function POST(request: Request) {
  const rateKey = getClientKey(request);
  if (isRateLimited(rateKey)) {
    return NextResponse.json({ error: "Cok fazla deneme. Lutfen bir dakika sonra tekrar deneyin." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = requestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Gecersiz istek." }, { status: 400 });
  }

  const { attemptId, fullName, email, phone, preferredSlot, bookingNote } = payload.data;
  const attempt = await prisma.examAttempt.findFirst({
    where: {
      id: attemptId,
      studentId: session.user.id,
      status: {
        in: ["SUBMITTED", "AUTO_SUBMITTED"],
      },
    },
    include: {
      examModule: {
        select: {
          id: true,
          title: true,
          lessonReviewPrice: true,
          lessonCurrency: true,
        },
      },
      answers: {
        where: {
          OR: [{ isCorrect: false }, { selectedAnswer: null }],
        },
        select: {
          questionId: true,
        },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt bulunamadi veya henuz gonderilmedi." }, { status: 404 });
  }

  const amount = attempt.examModule.lessonReviewPrice;
  const currency = attempt.examModule.lessonCurrency || "TRY";
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Bu sinav icin review satisi aktif degil." }, { status: 400 });
  }

  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
    return NextResponse.json({ error: "Telefon numarasi gecersiz." }, { status: 400 });
  }

  const parsedPreferredSlot = parsePreferredSlot(preferredSlot);
  if (parsedPreferredSlot === "INVALID") {
    return NextResponse.json({ error: "Slot tarihi gecersiz." }, { status: 400 });
  }

  const selectedQuestionIds = attempt.answers.map((answer) => answer.questionId);

  const existingBooking = await prisma.examReviewBooking.findFirst({
    where: {
      attemptId: attempt.id,
      studentId: session.user.id,
      status: {
        in: ["PENDING_PAYMENT", "PAID", "SCHEDULED"],
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      teacherId: true,
      durationMinutes: true,
      scheduledStartAt: true,
      scheduledEndAt: true,
      lessonNotes: true,
    },
  });

  const scheduledStartAt = parsedPreferredSlot && !existingBooking?.teacherId
    ? parsedPreferredSlot
    : existingBooking?.scheduledStartAt ?? null;
  const bookingDuration = existingBooking?.durationMinutes ?? 30;
  const scheduledEndAt = scheduledStartAt
    ? new Date(scheduledStartAt.getTime() + bookingDuration * 60 * 1000)
    : existingBooking?.scheduledEndAt ?? null;
  const normalizedBookingNote = bookingNote?.trim() || null;

  const booking = existingBooking
    ? await prisma.examReviewBooking.update({
        where: { id: existingBooking.id },
        data: {
          selectedQuestionIds,
          scheduledStartAt,
          scheduledEndAt,
          lessonNotes: mergeReviewBookingNotes(existingBooking.lessonNotes, {
            studentNote: normalizedBookingNote,
          }),
        },
      })
    : await prisma.examReviewBooking.create({
        data: {
          examModuleId: attempt.examModule.id,
          attemptId: attempt.id,
          studentId: session.user.id,
          status: "PENDING_PAYMENT",
          durationMinutes: 30,
          priceAmount: amount,
          currency,
          selectedQuestionIds,
          bookingScope: "FULL_WRONG_SET",
          scheduledStartAt,
          scheduledEndAt,
          lessonNotes: mergeReviewBookingNotes(null, {
            studentNote: normalizedBookingNote,
          }),
        },
      });

  const referenceId = createReviewPaymentReferenceId();
  const paymentRecord = await prisma.examReviewPayment.create({
    data: {
      bookingId: booking.id,
      userId: session.user.id,
      provider: "paytr",
      providerPaymentId: referenceId,
      status: "PENDING",
      amount,
      currency,
      metadataJson: {
        attemptId: attempt.id,
        selectedQuestionIds,
      },
    },
  });

  const userIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  try {
    const payment = await paytrCheckout({
      planName: `Exam Review - ${attempt.examModule.title}`,
      amount,
      email: email.toLowerCase(),
      phone: normalizedPhone,
      userName: fullName.trim(),
      userIp,
      userId: session.user.id,
      referenceId,
    });

    await prisma.examReviewPayment.update({
      where: { id: paymentRecord.id },
      data: {
        providerMessage: payment.message ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      payment,
      bookingId: booking.id,
      paymentId: paymentRecord.id,
      amount,
      currency,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review odemesi baslatilamadi.";

    await prisma.examReviewPayment.update({
      where: { id: paymentRecord.id },
      data: {
        status: "FAILED",
        providerMessage: message,
      },
    }).catch(() => null);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}