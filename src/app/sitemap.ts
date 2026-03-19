import type { MetadataRoute } from "next";

import { prisma } from "@/src/lib/prisma";
import { SEO_PAGE_PRESETS, buildSeoPageUrl } from "@/src/lib/seo-presets";
import { resolveSiteUrl } from "@/src/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const DEFAULT_CHANGE_FREQUENCIES: Record<string, NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>> = {
  home: "daily",
  pricing: "weekly",
  "live-classes": "weekly",
};

const DEFAULT_PRIORITIES: Record<string, number> = {
  home: 1,
  pricing: 0.9,
  "live-classes": 0.8,
};

function normalizeChangeFrequency(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case "always":
    case "hourly":
    case "daily":
    case "weekly":
    case "monthly":
    case "yearly":
    case "never":
      return normalized;
    default:
      return undefined;
  }
}

function normalizePriority(value: number | null | undefined, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, value));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveSiteUrl();

  const [seoConfigs, activePlans] = await Promise.all([
    prisma.seoConfig
      .findMany({
        select: {
          pageKey: true,
          pagePath: true,
          canonicalUrl: true,
          noIndex: true,
          sitemapPriority: true,
          changeFrequency: true,
          updatedAt: true,
        },
      })
      .catch(() => []),
    prisma.plan
      .findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      })
      .catch(() => []),
  ]);

  const seoConfigByPageKey = new Map(seoConfigs.map((config) => [config.pageKey, config]));

  const staticEntries: MetadataRoute.Sitemap = SEO_PAGE_PRESETS.filter((preset) => preset.group === "public")
    .map((preset) => {
      const seoConfig = seoConfigByPageKey.get(preset.key);

      if (seoConfig?.noIndex) {
        return null;
      }

      const path = seoConfig?.pagePath?.trim() || preset.path;
      const url = seoConfig?.canonicalUrl?.trim() || buildSeoPageUrl(siteUrl, path);

      return {
        url,
        lastModified: seoConfig?.updatedAt ?? new Date(),
        changeFrequency:
          normalizeChangeFrequency(seoConfig?.changeFrequency) ??
          DEFAULT_CHANGE_FREQUENCIES[preset.key] ??
          "weekly",
        priority: normalizePriority(seoConfig?.sitemapPriority, DEFAULT_PRIORITIES[preset.key] ?? 0.7),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const planEntries: MetadataRoute.Sitemap = activePlans.map((plan) => ({
    url: buildSeoPageUrl(siteUrl, `/pricing/${plan.slug}`),
    lastModified: plan.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...planEntries];
}