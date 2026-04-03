import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { createAiProfileOverridesFromStudentContext, getDailyVocabulary } from "@/src/lib/ai-content";
import { authOptions } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { buildAiApiResponse, inferFallbackReasonFromModel } from "@/src/lib/ai-api-response";
import { assessVocabularyModuleQuality } from "@/src/lib/ai-quality";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      interestTags: true,
      targetExam: true,
      targetScore: true,
      currentLevel: true,
      dailyGoalMinutes: true,
    },
  });
  const data = await getDailyVocabulary({
    profile: createAiProfileOverridesFromStudentContext({
      targetExam: profile?.targetExam,
      currentLevel: profile?.currentLevel,
      targetScore: profile?.targetScore,
      dailyGoalMinutes: profile?.dailyGoalMinutes,
      interestTags: profile?.interestTags,
      focusSkill: "vocabulary",
    }),
  });

  const quality = assessVocabularyModuleQuality(data);
  const modelFallback = data.model.includes("local");
  const usedFallback = modelFallback || !quality.passed;

  return Response.json(
    buildAiApiResponse({
      data,
      ai: {
        model: data.model,
        providerAvailable: !data.model.includes("local"),
        traceId: null,
        latencyMs: null,
        attempts: null,
        usedFallback,
        fallbackReason: modelFallback
          ? inferFallbackReasonFromModel(data.model)
          : !quality.passed
            ? "quality_threshold_not_met"
            : null,
        errorType: null,
        qualityScore: quality.qualityScore,
        qualityChecks: quality.qualityChecks,
      },
    }),
  );
}