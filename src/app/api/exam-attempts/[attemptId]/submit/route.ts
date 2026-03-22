import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/auth";
import { submitExamAttempt } from "@/src/lib/exam-attempts";

type RouteContext = {
  params: Promise<{ attemptId: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attemptId } = await context.params;

  try {
    const result = await submitExamAttempt(session.user.id, attemptId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "ATTEMPT_NOT_FOUND") {
      return NextResponse.json({ error: "Attempt bulunamadi." }, { status: 404 });
    }

    console.error("[exam-attempts/:attemptId/submit] error", error);
    return NextResponse.json({ error: "Attempt gonderilemedi." }, { status: 500 });
  }
}