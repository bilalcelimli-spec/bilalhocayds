import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { authOptions } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

type PlanPayload = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  includesLiveClass: boolean;
  includesAIPlanner: boolean;
  includesReading: boolean;
  includesGrammar: boolean;
  includesVocab: boolean;
  includesExam: boolean;
  isStandaloneExamProduct: boolean;
  isActive: boolean;
  examModuleIds: string[];
};

const planSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  monthlyPrice: true,
  yearlyPrice: true,
  includesLiveClass: true,
  includesAIPlanner: true,
  includesReading: true,
  includesGrammar: true,
  includesVocab: true,
  includesExam: true,
  isStandaloneExamProduct: true,
  isActive: true,
  examModules: {
    select: {
      examModule: {
        select: {
          id: true,
          title: true,
          marketplaceTitle: true,
          examType: true,
          price: true,
          isForSale: true,
          isPublished: true,
          isActive: true,
        },
      },
    },
  },
} as const;

type PlanWithExamModules = Prisma.PlanGetPayload<{ select: typeof planSelect }>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

function parsePlanPayload(data: unknown): PlanPayload {
  const input = (data ?? {}) as Record<string, unknown>;
  const examModuleIds = Array.isArray(input.examModuleIds)
    ? Array.from(
        new Set(
          input.examModuleIds
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim())
            .filter((value) => value.length > 0),
        ),
      )
    : [];

  const toNumber = (value: unknown) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  };

  return {
    id: typeof input.id === "string" ? input.id : undefined,
    name: String(input.name ?? "").trim(),
    slug: String(input.slug ?? "").trim(),
    description: String(input.description ?? "").trim() || null,
    monthlyPrice: toNumber(input.monthlyPrice),
    yearlyPrice: toNumber(input.yearlyPrice),
    includesLiveClass: Boolean(input.includesLiveClass),
    includesAIPlanner: Boolean(input.includesAIPlanner),
    includesReading: input.includesReading !== false,
    includesGrammar: input.includesGrammar !== false,
    includesVocab: input.includesVocab !== false,
    includesExam: Boolean(input.includesExam),
    isStandaloneExamProduct: Boolean(input.isStandaloneExamProduct),
    isActive: input.isActive !== false,
    examModuleIds,
  };
}

async function resolveValidExamIds(examModuleIds: string[]) {
  if (examModuleIds.length === 0) {
    return [];
  }

  const exams = await prisma.examModule.findMany({
    where: { id: { in: examModuleIds } },
    select: { id: true },
  });

  return exams.map((exam) => exam.id);
}

function serializePlan(plan: PlanWithExamModules) {
  return {
    ...plan,
    examModules: plan.examModules.map(({ examModule }) => examModule),
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const plans = await prisma.plan.findMany({
    orderBy: { createdAt: "desc" },
    select: planSelect,
  });
  return NextResponse.json(plans.map(serializePlan));
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const data = parsePlanPayload(await request.json());
  if (!data.name || !data.slug) {
    return NextResponse.json(
      { error: "Plan adı ve slug zorunludur." },
      { status: 400 }
    );
  }

  const validExamIds = await resolveValidExamIds(data.examModuleIds);

  const plan = await prisma.plan.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      monthlyPrice: data.monthlyPrice,
      yearlyPrice: data.yearlyPrice,
      includesLiveClass: data.includesLiveClass,
      includesAIPlanner: data.includesAIPlanner,
      includesReading: data.includesReading,
      includesGrammar: data.includesGrammar,
      includesVocab: data.includesVocab,
      includesExam: data.includesExam,
      isStandaloneExamProduct: data.isStandaloneExamProduct,
      isActive: data.isActive,
      examModules: validExamIds.length > 0
        ? {
            create: validExamIds.map((examModuleId) => ({ examModuleId })),
          }
        : undefined,
    },
    select: planSelect,
  });
  return NextResponse.json(serializePlan(plan));
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const data = parsePlanPayload(await request.json());
  if (!data.id || !data.name || !data.slug) {
    return NextResponse.json(
      { error: "Plan güncellemesi için id, ad ve slug zorunludur." },
      { status: 400 }
    );
  }

  const validExamIds = await resolveValidExamIds(data.examModuleIds);

  const plan = await prisma.plan.update({
    where: { id: data.id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      monthlyPrice: data.monthlyPrice,
      yearlyPrice: data.yearlyPrice,
      includesLiveClass: data.includesLiveClass,
      includesAIPlanner: data.includesAIPlanner,
      includesReading: data.includesReading,
      includesGrammar: data.includesGrammar,
      includesVocab: data.includesVocab,
      includesExam: data.includesExam,
      isStandaloneExamProduct: data.isStandaloneExamProduct,
      isActive: data.isActive,
      examModules: {
        deleteMany: {},
        ...(validExamIds.length > 0
          ? {
              create: validExamIds.map((examModuleId) => ({ examModuleId })),
            }
          : {}),
      },
    },
    select: planSelect,
  });
  return NextResponse.json(serializePlan(plan));
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "Plan id zorunludur." }, { status: 400 });
  }

  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}