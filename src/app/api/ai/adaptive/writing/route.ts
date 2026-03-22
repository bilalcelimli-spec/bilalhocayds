import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/auth";
import { evaluateWriting } from "@/src/lib/adaptive-exam";
import { logAdaptiveAudit } from "@/src/lib/adaptive-audit";
import { writingEvaluationInputSchema } from "@/src/lib/adaptive-exam-schemas";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = writingEvaluationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Gecersiz writing payload." }, { status: 400 });
  }

  try {
    const result = await evaluateWriting(parsed.data);
    await logAdaptiveAudit({
      actorUserId: session.user.id,
      targetType: "ADAPTIVE_LAB",
      targetId: "writing-evaluator",
      action: "writing_evaluated",
      beforeJson: {
        promptText: parsed.data.promptText,
        targetExam: parsed.data.targetExam,
        expectedCefrBand: parsed.data.expectedCefrBand,
      },
      afterJson: result.evaluation,
      metadataJson: {
        promptVersion: result.promptVersion,
        model: result.model,
        usedFallback: result.usedFallback,
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[ai/adaptive/writing] error", error);
    return NextResponse.json({ error: "Writing degerlendirme uretilemedi." }, { status: 500 });
  }
}