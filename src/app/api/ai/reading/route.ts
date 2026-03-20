import { createAiProfileOverridesFromStudentContext, getDailyReadingModule } from "@/src/lib/ai-content";
import { authOptions } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";

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
  return Response.json(data);
}