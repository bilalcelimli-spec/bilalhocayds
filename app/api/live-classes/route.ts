import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const liveClasses = await prisma.liveClass.findMany({
      where: {
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        topicOutline: true,
        meetingLink: true,
        scheduledAt: true,
        singlePrice: true,
        durationMinutes: true,
      },
    });

    return NextResponse.json(
      liveClasses.map((cls) => ({
        id: cls.id,
        title: cls.title,
        description: cls.description,
        topic: cls.topicOutline,
        zoomLink: cls.meetingLink,
        scheduledAt: cls.scheduledAt,
        price: cls.singlePrice,
        duration: cls.durationMinutes,
      }))
    );
  } catch (err) {
    console.error("[live-classes] error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
