import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getDailyReadingModule, createAiProfileOverridesFromStudentContext } from "@/src/lib/ai-content";
import { prisma } from "@/src/lib/prisma";

function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(auth.slice(7), await getJwtSecret());
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: {
        targetExam: true,
        targetScore: true,
        currentLevel: true,
        dailyGoalMinutes: true,
        interestTags: true,
      },
    });

    const data = await getDailyReadingModule({
      interestTags: studentProfile?.interestTags ?? [],
      profile: createAiProfileOverridesFromStudentContext({
        targetExam: studentProfile?.targetExam,
        currentLevel: studentProfile?.currentLevel,
        targetScore: studentProfile?.targetScore,
        dailyGoalMinutes: studentProfile?.dailyGoalMinutes,
        interestTags: studentProfile?.interestTags,
        focusSkill: "reading",
      }),
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[mobile/reading] error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
