import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getLiveRecordingAccessSubscription } from "@/src/lib/live-recordings-access";
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
    const now = new Date();

    const accessSubscription = await getLiveRecordingAccessSubscription(userId);

    const recordings = await prisma.liveClass.findMany({
      where: {
        scheduledAt: { lt: now },
        NOT: [{ recordingUrl: null }, { recordingUrl: "" }],
      },
      orderBy: { scheduledAt: "desc" },
      select: {
        id: true,
        title: true,
        topicOutline: true,
        description: true,
        scheduledAt: true,
        durationMinutes: true,
        recordingUrl: true,
      },
      take: 40,
    });

    const hasAccess = Boolean(accessSubscription);

    return NextResponse.json({
      hasAccess,
      recordings: recordings.map((r) => ({
        id: r.id,
        title: r.title,
        topic: r.topicOutline,
        description: r.description,
        scheduledAt: r.scheduledAt,
        duration: r.durationMinutes,
        recordingUrl: hasAccess ? r.recordingUrl : null,
      })),
    });
  } catch (err) {
    console.error("[live-recordings] error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
