import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const exams = await prisma.examModule.findMany({
      where: { isActive: true, isPublished: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        examType: true,
        cefrLevel: true,
        durationMinutes: true,
        questionCount: true,
        description: true,
        instructions: true,
        contentJson: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("[exams] error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
