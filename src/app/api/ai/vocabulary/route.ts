import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { createAiProfileOverridesFromStudentContext, getDailyVocabulary } from "@/src/lib/ai-content";
import { authOptions } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

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
  return Response.json(data);
}