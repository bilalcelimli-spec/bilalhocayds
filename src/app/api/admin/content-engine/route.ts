import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/auth";
import {
  contentSourceTypes,
  generateContentFromSources,
  inferPublishedModule,
  type ContentSourceType,
} from "@/src/lib/content-creator-engine";
import { prisma } from "@/src/lib/prisma";

const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(160),
  sourceType: z.enum(contentSourceTypes),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  rawText: z.string().optional(),
  styleNotes: z.string().optional(),
  tags: z.array(z.string().min(1).max(40)).default([]),
  fileField: z.string().optional(),
});

const requestSchema = z.object({
  title: z.string().min(3).max(160),
  itemType: z.string().min(2).max(120),
  outputFormat: z.string().min(2).max(80),
  itemCount: z.coerce.number().int().min(1).max(12),
  instructions: z.string().max(4000).optional(),
  sources: z.array(sourceSchema).min(1),
});

const publishSchema = z.object({
  runId: z.string().min(1),
  action: z.enum(["approve", "unpublish"]),
});

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>> | null) {
  const user = (session as { user?: { role?: string; id?: string } } | null)?.user;
  return Boolean(user?.role === "ADMIN");
}

function buildSourcePreview(source: {
  id: string;
  title: string;
  sourceType: ContentSourceType;
  sourceUrl: string | null;
  mimeType: string | null;
  tags: string[];
  createdAt: Date;
  extractedText: string;
}) {
  return {
    id: source.id,
    title: source.title,
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    mimeType: source.mimeType,
    tags: source.tags,
    createdAt: source.createdAt.toISOString(),
    excerpt: source.extractedText.slice(0, 220),
  };
}

function buildRunPreview(run: {
  id: string;
  title: string;
  status: string;
  isApproved: boolean;
  approvedAt: Date | null;
  isPublished: boolean;
  publishedAt: Date | null;
  itemType: string;
  outputFormat: string;
  itemCount: number;
  createdAt: Date;
  styleAnalysis: string | null;
  sourceIds: string[];
  generatedText: string | null;
}) {
  return {
    id: run.id,
    title: run.title,
    status: run.status,
    isApproved: run.isApproved,
    approvedAt: run.approvedAt?.toISOString() ?? null,
    isPublished: run.isPublished,
    publishedAt: run.publishedAt?.toISOString() ?? null,
    itemType: run.itemType,
    outputFormat: run.outputFormat,
    itemCount: run.itemCount,
    sourceCount: run.sourceIds.length,
    createdAt: run.createdAt.toISOString(),
    summary: run.styleAnalysis?.slice(0, 220) ?? null,
    generatedPreview: run.generatedText?.slice(0, 320) ?? null,
    distributionTarget: inferPublishedModule(run.itemType),
  };
}

async function getDashboardData() {
  const [sources, runs] = await Promise.all([
    prisma.contentSource.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        sourceType: true,
        sourceUrl: true,
        mimeType: true,
        tags: true,
        createdAt: true,
        extractedText: true,
      },
    }),
    prisma.contentGenerationRun.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        isApproved: true,
        approvedAt: true,
        isPublished: true,
        publishedAt: true,
        itemType: true,
        outputFormat: true,
        itemCount: true,
        createdAt: true,
        styleAnalysis: true,
        sourceIds: true,
        generatedText: true,
      },
    }),
  ]);

  return {
    sources: sources.map(buildSourcePreview),
    runs: runs.map(buildRunPreview),
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/admin/content-engine][GET]", error);
    return NextResponse.json({ error: "Content engine verileri okunamadi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as { user?: { role?: string; id?: string } } | null)?.user;

  try {
    const formData = await request.formData();
    const rawSources = JSON.parse(String(formData.get("sources") ?? "[]"));
    const payload = requestSchema.parse({
      title: String(formData.get("title") ?? ""),
      itemType: String(formData.get("itemType") ?? ""),
      outputFormat: String(formData.get("outputFormat") ?? ""),
      itemCount: String(formData.get("itemCount") ?? "1"),
      instructions: String(formData.get("instructions") ?? ""),
      sources: rawSources,
    });

    const result = await generateContentFromSources({
      title: payload.title,
      itemType: payload.itemType,
      outputFormat: payload.outputFormat,
      itemCount: payload.itemCount,
      instructions: payload.instructions,
      createdById: user?.id ?? null,
      sources: await Promise.all(
        payload.sources.map(async (source) => {
          const fileEntry = source.fileField ? formData.get(source.fileField) : null;
          const file = fileEntry instanceof File && fileEntry.size > 0
            ? {
                name: fileEntry.name,
                type: fileEntry.type,
                buffer: Buffer.from(await fileEntry.arrayBuffer()),
              }
            : null;

          return {
            title: source.title,
            sourceType: source.sourceType,
            sourceUrl: source.sourceUrl || undefined,
            rawText: source.rawText,
            styleNotes: source.styleNotes,
            tags: source.tags,
            file,
            mimeType: file?.type,
          };
        }),
      ),
    });

    return NextResponse.json({
      run: buildRunPreview({
        id: result.run.id,
        title: result.run.title,
        status: result.run.status,
        isApproved: result.run.isApproved,
        approvedAt: result.run.approvedAt,
        isPublished: result.run.isPublished,
        publishedAt: result.run.publishedAt,
        itemType: result.run.itemType,
        outputFormat: result.run.outputFormat,
        itemCount: result.run.itemCount,
        createdAt: result.run.createdAt,
        styleAnalysis: result.run.styleAnalysis,
        sourceIds: result.run.sourceIds,
        generatedText: result.run.generatedText,
      }),
      sources: result.sources.map(buildSourcePreview),
      generatedItems: result.generatedItems,
      generatedText: result.generatedText,
      styleAnalysis: result.styleAnalysis,
      model: result.model,
    });
  } catch (error) {
    console.error("[api/admin/content-engine][POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Gecersiz veri gonderildi.", detail: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Icerik uretimi basarisiz oldu." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as { user?: { role?: string; id?: string } } | null)?.user;

  try {
    const payload = publishSchema.parse(await request.json());
    const now = new Date();

    const run = await prisma.contentGenerationRun.update({
      where: { id: payload.runId },
      data:
        payload.action === "approve"
          ? {
              isApproved: true,
              approvedAt: now,
              approvedById: user?.id ?? null,
              isPublished: true,
              publishedAt: now,
              publishedById: user?.id ?? null,
            }
          : {
              isPublished: false,
              publishedAt: null,
              publishedById: null,
            },
      select: {
        id: true,
        title: true,
        status: true,
        isApproved: true,
        approvedAt: true,
        isPublished: true,
        publishedAt: true,
        itemType: true,
        outputFormat: true,
        itemCount: true,
        createdAt: true,
        styleAnalysis: true,
        sourceIds: true,
        generatedText: true,
      },
    });

    return NextResponse.json({ run: buildRunPreview(run) });
  } catch (error) {
    console.error("[api/admin/content-engine][PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Gecersiz islem." }, { status: 400 });
    }
    return NextResponse.json({ error: "Icerik yayin durumu guncellenemedi." }, { status: 500 });
  }
}