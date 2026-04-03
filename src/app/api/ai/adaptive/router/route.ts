import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/auth";
import { decideAdaptiveNextStep } from "@/src/lib/adaptive-exam";
import { logAdaptiveAudit } from "@/src/lib/adaptive-audit";
import { adaptiveRouterInputSchema } from "@/src/lib/adaptive-exam-schemas";
import { buildAiApiResponse } from "@/src/lib/ai-api-response";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adaptiveRouterInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Gecersiz router payload." }, { status: 400 });
  }

  try {
    const result = await decideAdaptiveNextStep(parsed.data);
    await logAdaptiveAudit({
      actorUserId: session.user.id,
      targetType: "ADAPTIVE_LAB",
      targetId: "router",
      action: "router_decision_generated",
      beforeJson: parsed.data,
      afterJson: result.decision,
      metadataJson: {
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
          fallbackReason: result.usedFallback ? result.fallbackReason ?? result.aiTelemetry.errorType ?? "ai_router_fallback" : null,
          errorType: result.aiTelemetry.errorType,
          qualityScore: result.qualityScore,
          qualityChecks: result.qualityChecks,
        },
      }),
    );
  } catch (error) {
    console.error("[ai/adaptive/router] error", error);
    return NextResponse.json({ error: "Adaptive router karari uretilemedi." }, { status: 500 });
  }
}