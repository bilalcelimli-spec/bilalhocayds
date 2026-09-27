import { DailyContentModule } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/auth";
import { recordPracticeAnswers } from "@/src/lib/student-progress";

const MAX_ANSWERS_PER_REQUEST = 100;
const ITEM_KEY_PATTERN = /^[\w:.-]{1,120}$/;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { module?: unknown; answers?: unknown } | null;
  const moduleKey = typeof body?.module === "string" ? body.module : "";
  if (!Object.values(DailyContentModule).includes(moduleKey as DailyContentModule)) {
    return NextResponse.json({ error: "INVALID_MODULE" }, { status: 400 });
  }
  if (!Array.isArray(body?.answers) || body.answers.length === 0 || body.answers.length > MAX_ANSWERS_PER_REQUEST) {
    return NextResponse.json({ error: "INVALID_ANSWERS" }, { status: 400 });
  }

  const answers = [];
  for (const raw of body.answers as Array<{ itemKey?: unknown; isCorrect?: unknown }>) {
    if (typeof raw?.itemKey !== "string" || !ITEM_KEY_PATTERN.test(raw.itemKey) || typeof raw.isCorrect !== "boolean") {
      return NextResponse.json({ error: "INVALID_ANSWERS" }, { status: 400 });
    }
    answers.push({ itemKey: raw.itemKey, isCorrect: raw.isCorrect });
  }

  const saved = await recordPracticeAnswers(session.user.id, moduleKey as DailyContentModule, answers);
  return NextResponse.json({ saved });
}
