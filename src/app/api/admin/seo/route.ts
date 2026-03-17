import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

const upsertSchema = z.object({
  pageKey: z.string().min(1).max(80),
  pageLabel: z.string().min(1).max(120),
  title: z.string().max(120).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  keywords: z.string().max(500).optional().nullable(),
  ogTitle: z.string().max(120).optional().nullable(),
  ogDescription: z.string().max(500).optional().nullable(),
  ogImage: z.string().url().optional().nullable().or(z.literal("")),
  canonicalUrl: z.string().url().optional().nullable().or(z.literal("")),
  noIndex: z.boolean().optional(),
  schemaMarkup: z.string().optional().nullable(),
});

function adminGuard(session: Awaited<ReturnType<typeof getServerSession>> | null) {
  if (!session) return false;
  const user = (session as { user?: { role?: string } }).user;
  return user?.role === "ADMIN";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!adminGuard(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configs = await prisma.seoConfig.findMany({ orderBy: { pageKey: "asc" } });
  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!adminGuard(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri.", detail: parsed.error.flatten() }, { status: 400 });
  }

  const { pageKey, pageLabel, ogImage, canonicalUrl, ...rest } = parsed.data;

  const config = await prisma.seoConfig.upsert({
    where: { pageKey },
    create: {
      id: `seo_${pageKey.replace(/[^a-z0-9]/gi, "_")}`,
      pageKey,
      pageLabel,
      ogImage: ogImage || null,
      canonicalUrl: canonicalUrl || null,
      ...rest,
    },
    update: {
      pageLabel,
      ogImage: ogImage || null,
      canonicalUrl: canonicalUrl || null,
      ...rest,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(config);
}
