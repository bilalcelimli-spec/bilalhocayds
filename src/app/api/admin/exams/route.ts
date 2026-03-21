import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { authOptions } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

type ExamPayload = {
  id?: string;
  title: string;
  slug: string;
  examType: string;
  cefrLevel: string | null;
  durationMinutes: number;
  questionCount: number;
  description: string | null;
  instructions: string | null;
  contentJson: Prisma.InputJsonValue;
  isPublished: boolean;
  isActive: boolean;
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function parseContentJson(value: unknown): Prisma.InputJsonValue {
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) {
      return { sections: [], questions: [] };
    }

    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  }

  if (value && typeof value === "object") {
    return value as Prisma.InputJsonValue;
  }

  return { sections: [], questions: [] };
}

function parseExamPayload(data: unknown): ExamPayload {
  const input = (data ?? {}) as Record<string, unknown>;
  const title = String(input.title ?? "").trim();
  const slugSource = String(input.slug ?? "").trim() || title;

  return {
    id: typeof input.id === "string" ? input.id : undefined,
    title,
    slug: toSlug(slugSource),
    examType: String(input.examType ?? "General Practice").trim() || "General Practice",
    cefrLevel: String(input.cefrLevel ?? "").trim() || null,
    durationMinutes: parseNumber(input.durationMinutes, 45),
    questionCount: parseNumber(input.questionCount, 20),
    description: String(input.description ?? "").trim() || null,
    instructions: String(input.instructions ?? "").trim() || null,
    contentJson: parseContentJson(input.contentJson),
    isPublished: Boolean(input.isPublished),
    isActive: input.isActive !== false,
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const exams = await prisma.examModule.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const data = parseExamPayload(await request.json());
  if (!data.title || !data.slug) {
    return NextResponse.json(
      { error: "Sınav başlığı ve slug zorunludur." },
      { status: 400 },
    );
  }

  const exam = await prisma.examModule.create({
    data: {
      title: data.title,
      slug: data.slug,
      examType: data.examType,
      cefrLevel: data.cefrLevel,
      durationMinutes: data.durationMinutes,
      questionCount: data.questionCount,
      description: data.description,
      instructions: data.instructions,
      contentJson: data.contentJson,
      isPublished: data.isPublished,
      isActive: data.isActive,
    },
  });

  return NextResponse.json(exam);
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const data = parseExamPayload(await request.json());
  if (!data.id || !data.title || !data.slug) {
    return NextResponse.json(
      { error: "Sınav güncellemesi için id, başlık ve slug zorunludur." },
      { status: 400 },
    );
  }

  const exam = await prisma.examModule.update({
    where: { id: data.id },
    data: {
      title: data.title,
      slug: data.slug,
      examType: data.examType,
      cefrLevel: data.cefrLevel,
      durationMinutes: data.durationMinutes,
      questionCount: data.questionCount,
      description: data.description,
      instructions: data.instructions,
      contentJson: data.contentJson,
      isPublished: data.isPublished,
      isActive: data.isActive,
    },
  });

  return NextResponse.json(exam);
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "Sınav id zorunludur." }, { status: 400 });
  }

  await prisma.examModule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
