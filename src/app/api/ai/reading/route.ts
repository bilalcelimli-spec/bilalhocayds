import { createAiProfileOverridesFromStudentContext, getDailyReadingModule } from "@/src/lib/ai-content";
import { authOptions } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { buildAiApiResponse, inferFallbackReasonFromModel } from "@/src/lib/ai-api-response";
import { assessReadingModuleQuality } from "@/src/lib/ai-quality";

export async function GET() {
  const session = await getServerSession(authOptions);
  const profile = session?.user?.id
    ? await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          interestTags: true,
          targetExam: true,
          targetScore: true,
          currentLevel: true,
          dailyGoalMinutes: true,
        },
      })
    : null;

  const data = await getDailyReadingModule({
    interestTags: profile?.interestTags ?? [],
    profile: createAiProfileOverridesFromStudentContext({
      targetExam: profile?.targetExam,
      currentLevel: profile?.currentLevel,
      targetScore: profile?.targetScore,
      dailyGoalMinutes: profile?.dailyGoalMinutes,
      interestTags: profile?.interestTags,
      focusSkill: "reading",
    }),
  });

  const quality = assessReadingModuleQuality(data);
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