import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/auth";
import { getExamAttemptResult } from "@/src/lib/exam-attempts";

type RouteContext = {
  params: Promise<{ attemptId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attemptId } = await context.params;

  try {
    const result = await getExamAttemptResult(session.user.id, attemptId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "ATTEMPT_NOT_FOUND") {
      return NextResponse.json({ error: "Attempt bulunamadi." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "ATTEMPT_NOT_SUBMITTED") {
      return NextResponse.json({ error: "Attempt henuz gonderilmedi." }, { status: 409 });
    }

    console.error("[exam-attempts/:attemptId/result] error", error);
    return NextResponse.json({ error: "Result okunamadi." }, { status: 500 });
  }
}