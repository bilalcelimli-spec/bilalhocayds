import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/auth";
import { startExamAttempt } from "@/src/lib/exam-attempts";

const requestSchema = z.object({
  examModuleId: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success || (!parsed.data.examModuleId && !parsed.data.slug)) {
    return NextResponse.json({ error: "examModuleId veya slug zorunludur." }, { status: 400 });
  }

  try {
    const attempt = await startExamAttempt(session.user.id, parsed.data);
    return NextResponse.json({
      attemptId: attempt.id,
      examModuleId: attempt.examModuleId,
      examVersionId: attempt.examVersionId,
      status: attempt.status,
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: attempt.expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EXAM_ACCESS_DENIED") {
      return NextResponse.json({ error: "Bu deneme sinavi icin erisim yok." }, { status: 403 });
    }

    if (error instanceof Error && error.message === "EXAM_NOT_FOUND") {
      return NextResponse.json({ error: "Sinav bulunamadi." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "EXAM_VERSION_EMPTY") {
      return NextResponse.json({ error: "Sinav icerigi hazir degil." }, { status: 409 });
    }

    console.error("[exam-attempts/start] error", error);
    return NextResponse.json({ error: "Attempt baslatilamadi." }, { status: 500 });
  }
}