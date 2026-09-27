import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { defaultLocale, isLocale, localizedPath, locales, type Locale } from "@/src/i18n/config";
import { prisma } from "@/src/lib/prisma";
import { buildSeoPageUrl } from "@/src/lib/seo-presets";
import { resolveSiteUrl } from "@/src/lib/site-url";

type PublicPageKey = "home" | "pricing" | "live-classes" | "plan-detail";

type PublicPageMetadataInput = {
  pageKey: PublicPageKey;
  /** Unprefixed path, e.g. "/pricing" or "/pricing/pro". */
  path: string;
  /** Page-specific values (e.g. plan name) interpolated into the seo messages. */
  values?: Record<string, string>;
  /** Overrides the Turkish description (e.g. a plan's own description). */
  description?: string | null;
};

const SEO_MESSAGE_KEYS: Record<PublicPageKey, "home" | "pricing" | "liveClasses" | "planDetail"> = {
  home: "home",
  pricing: "pricing",
  "live-classes": "liveClasses",
  "plan-detail": "planDetail",
};

function splitList(value: string | null | undefined) {
  return (value ?? "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** hreflang alternates + canonical for a public page: Turkish unprefixed, English under /en. */
export function buildLanguageAlternates(path: string, locale: Locale, siteUrl = resolveSiteUrl()) {
  const languages: Record<string, string> = {};
  for (const value of locales) {
    languages[value] = buildSeoPageUrl(siteUrl, localizedPath(path, value));
  }
  languages["x-default"] = buildSeoPageUrl(siteUrl, localizedPath(path, defaultLocale));

  return {
    canonical: buildSeoPageUrl(siteUrl, localizedPath(path, locale)),
    languages,
  };
}

/**
 * Metadata for the public marketing pages.
 * English pages use the `seo` messages; Turkish pages apply the admin SEO settings
 * (SeoConfig) when present and fall back to the Turkish messages.
 */
export async function buildPublicPageMetadata({
  pageKey,
  path,
  values,
  description,
}: PublicPageMetadataInput): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const siteUrl = resolveSiteUrl();
  const t = await getTranslations({ locale, namespace: "seo" });
  const messageKey = SEO_MESSAGE_KEYS[pageKey];

  const fallbackTitle = t(`${messageKey}.title`, values);
  // Database content (plan descriptions) is Turkish, so it only overrides the Turkish description.
  const fallbackDescription = (locale === defaultLocale ? description?.trim() : undefined) || t(`${messageKey}.description`, values);
  const alternates = buildLanguageAlternates(path, locale, siteUrl);
  const siteName = t("siteName");

  const seoConfig =
    locale === defaultLocale && pageKey !== "plan-detail"
      ? await prisma.seoConfig.findUnique({ where: { pageKey } }).catch(() => null)
      : null;

  const title = seoConfig?.title?.trim() || fallbackTitle;
  const metaDescription = seoConfig?.description?.trim() || fallbackDescription;
  const keywords = splitList(seoConfig?.keywords ?? [seoConfig?.primaryKeyword, seoConfig?.secondaryKeywords].filter(Boolean).join(","));
  const ogImage = seoConfig?.ogImage?.trim();
  const twitterImage = seoConfig?.twitterImage?.trim() || ogImage;
  const twitterCard = seoConfig?.twitterCard === "summary" ? "summary" : "summary_large_image";

  return {
    title: { absolute: title },
    description: metaDescription,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: seoConfig?.canonicalUrl?.trim() || alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: seoConfig?.ogTitle?.trim() || title,
      description: seoConfig?.ogDescription?.trim() || metaDescription,
      url: alternates.canonical,
      siteName,
      locale: locale === "tr" ? "tr_TR" : "en_US",
      alternateLocale: locale === "tr" ? ["en_US"] : ["tr_TR"],
      type: "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: twitterCard,
      title: seoConfig?.twitterTitle?.trim() || seoConfig?.ogTitle?.trim() || title,
      description: seoConfig?.twitterDescription?.trim() || metaDescription,
      images: twitterImage ? [twitterImage] : undefined,
    },
    robots: seoConfig
      ? {
          index: !seoConfig.noIndex,
          follow: !seoConfig.noFollow,
          noarchive: seoConfig.noArchive || undefined,
          nosnippet: seoConfig.noSnippet || undefined,
          "max-snippet": seoConfig.maxSnippet ?? undefined,
          "max-video-preview": seoConfig.maxVideoPreview ?? undefined,
          "max-image-preview":
            seoConfig.maxImagePreview === "none" ||
            seoConfig.maxImagePreview === "standard" ||
            seoConfig.maxImagePreview === "large"
              ? seoConfig.maxImagePreview
              : undefined,
        }
      : undefined,
  };
}
