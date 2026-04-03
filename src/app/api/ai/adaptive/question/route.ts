import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/auth";
import { generateValidatedAdaptiveQuestion } from "@/src/lib/adaptive-exam";
import { logAdaptiveAudit } from "@/src/lib/adaptive-audit";
import { adaptiveQuestionInputSchema } from "@/src/lib/adaptive-exam-schemas";
import { buildAiApiResponse } from "@/src/lib/ai-api-response";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adaptiveQuestionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Gecersiz question payload." }, { status: 400 });
  }

  try {
    const result = await generateValidatedAdaptiveQuestion(parsed.data);
    await logAdaptiveAudit({
      actorUserId: session.user.id,
      targetType: "ADAPTIVE_LAB",
      targetId: "question-generator",
      action: "question_generated",
      afterJson: result.question,
      metadataJson: {
        validation: result.validation,
        promptVersion: result.promptVersion,
        model: result.model,
        usedFallback: result.usedFallback,
      },
    });
    return NextResponse.json(
      buildAiApiResponse({
        data: result,
        ai: {
          model: result.model,
          providerAvailable: result.aiTelemetry.providerAvailable,
          traceId: result.aiTelemetry.traceId,
          latencyMs: result.aiTelemetry.latencyMs,
          attempts: result.aiTelemetry.attempts,
          usedFallback: result.usedFallback,
          fallbackReason: result.usedFallback ? result.fallbackReason ?? result.aiTelemetry.errorType ?? "adaptive_question_fallback" : null,
          errorType: result.aiTelemetry.errorType,
          qualityScore: result.qualityScore,
          qualityChecks: result.qualityChecks,
        },
      }),
    );
  } catch (error) {
    console.error("[ai/adaptive/question] error", error);
    return NextResponse.json({ error: "Adaptive soru uretilemedi." }, { status: 500 });
  }
}