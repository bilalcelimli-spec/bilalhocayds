import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/auth";
import { submitAdaptiveExamAnswer } from "@/src/lib/exam-attempts";

const requestSchema = z.object({
  questionId: z.string().min(1),
  selectedAnswer: z.enum(["A", "B", "C", "D", "E"]).nullable(),
  isFlaggedForReview: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ attemptId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Gecersiz adaptive answer payload." }, { status: 400 });
  }

  const { attemptId } = await context.params;

  try {
    const result = await submitAdaptiveExamAnswer(session.user.id, attemptId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "ATTEMPT_NOT_FOUND") {
      return NextResponse.json({ error: "Attempt bulunamadi." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "ATTEMPT_NOT_ADAPTIVE") {
      return NextResponse.json({ error: "Attempt adaptive degil." }, { status: 409 });
    }

    if (error instanceof Error && error.message === "QUESTION_NOT_FOUND") {
      return NextResponse.json({ error: "Soru bulunamadi." }, { status: 404 });
    }

    console.error("[exam-attempts/:attemptId/adaptive/answer] error", error);
    return NextResponse.json({ error: "Adaptive answer kaydedilemedi." }, { status: 500 });
  }
}