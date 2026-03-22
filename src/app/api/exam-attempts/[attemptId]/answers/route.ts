import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/auth";
import { saveExamAttemptAnswers } from "@/src/lib/exam-attempts";

const requestSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedAnswer: z.enum(["A", "B", "C", "D", "E"]).nullable().optional(),
      isFlaggedForReview: z.boolean().optional(),
    }),
  ).min(1),
});

type RouteContext = {
  params: Promise<{ attemptId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Gecersiz answer payload." }, { status: 400 });
  }

  const { attemptId } = await context.params;

  try {
    const payload = await saveExamAttemptAnswers(session.user.id, attemptId, parsed.data.answers);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "ATTEMPT_NOT_FOUND") {
      return NextResponse.json({ error: "Attempt bulunamadi." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "ATTEMPT_NOT_EDITABLE") {
      return NextResponse.json({ error: "Attempt artik duzenlenemez." }, { status: 409 });
    }

    if (error instanceof Error && error.message === "ATTEMPT_EXPIRED") {
      return NextResponse.json({ error: "Sure doldu, attempt otomatik gonderildi." }, { status: 409 });
    }

    console.error("[exam-attempts/:attemptId/answers] error", error);
    return NextResponse.json({ error: "Answers kaydedilemedi." }, { status: 500 });
  }
}