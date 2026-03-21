import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

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
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

function parsePlanPayload(data: unknown): PlanPayload {
  const input = (data ?? {}) as Record<string, unknown>;
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
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const plans = await prisma.plan.findMany();
  return NextResponse.json(plans);
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
    },
  });
  return NextResponse.json(plan);
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
    },
  });
  return NextResponse.json(plan);
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