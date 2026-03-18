import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

const upsertSchema = z.object({
  pageKey: z.string().min(1).max(80),
  pageLabel: z.string().min(1).max(120),
  pagePath: z.string().max(240).optional().nullable(),
  title: z.string().max(120).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  primaryKeyword: z.string().max(120).optional().nullable(),
  secondaryKeywords: z.string().max(500).optional().nullable(),
  searchIntent: z.string().max(80).optional().nullable(),
  keywords: z.string().max(500).optional().nullable(),
  ogTitle: z.string().max(120).optional().nullable(),
  ogDescription: z.string().max(500).optional().nullable(),
  ogImage: z.string().url().optional().nullable().or(z.literal("")),
  ogType: z.string().max(80).optional().nullable(),
  twitterTitle: z.string().max(120).optional().nullable(),
  twitterDescription: z.string().max(500).optional().nullable(),
  twitterImage: z.string().url().optional().nullable().or(z.literal("")),
  twitterCard: z.string().max(80).optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable().or(z.literal("")),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
  noArchive: z.boolean().optional(),
  noSnippet: z.boolean().optional(),
  maxSnippet: z.number().int().min(-1).max(500).optional().nullable(),
  maxVideoPreview: z.number().int().min(-1).max(50000).optional().nullable(),
  maxImagePreview: z.string().max(40).optional().nullable(),
  robotsDirectives: z.string().max(500).optional().nullable(),
  breadcrumbTitle: z.string().max(120).optional().nullable(),
  schemaType: z.string().max(120).optional().nullable(),
  schemaMarkup: z.string().optional().nullable(),
  sitemapPriority: z.number().min(0).max(1).optional().nullable(),
  changeFrequency: z.string().max(40).optional().nullable(),
  customHeadTags: z.string().optional().nullable(),
  contentNotes: z.string().optional().nullable(),
});

function adminGuard(session: Awaited<ReturnType<typeof getServerSession>> | null) {
  if (!session) return false;
  const user = (session as { user?: { role?: string } }).user;
  return user?.role === "ADMIN";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!adminGuard(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const configs = await prisma.seoConfig.findMany({ orderBy: { pageKey: "asc" } });
    return NextResponse.json(configs);
  } catch (error) {
    console.error("[api/admin/seo][GET]", error);
    return NextResponse.json(
      { error: "SEO kayitlari okunamadi. Veritabani migrasyonlarini kontrol edin." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!adminGuard(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri.", detail: parsed.error.flatten() }, { status: 400 });
  }

  const {
    pageKey,
    pageLabel,
    pagePath,
    ogImage,
    twitterImage,
    canonicalUrl,
    ...rest
  } = parsed.data;

  let config;

  try {
    config = await prisma.seoConfig.upsert({
      where: { pageKey },
      create: {
        id: `seo_${pageKey.replace(/[^a-z0-9]/gi, "_")}`,
        pageKey,
        pageLabel,
        pagePath: pagePath || null,
        ogImage: ogImage || null,
        twitterImage: twitterImage || null,
        canonicalUrl: canonicalUrl || null,
        ...rest,
      },
      update: {
        pageLabel,
        pagePath: pagePath || null,
        ogImage: ogImage || null,
        twitterImage: twitterImage || null,
        canonicalUrl: canonicalUrl || null,
        ...rest,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[api/admin/seo][POST]", error);
    return NextResponse.json(
      { error: "SEO kaydi olusturulamadi. Veritabani tablosu veya migrasyonlari eksik olabilir." },
      { status: 500 },
    );
  }

  return NextResponse.json(config);
}
