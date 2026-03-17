"use client";

import { type ComponentType, useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Globe,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Settings2,
  Share2,
  Sparkles,
  Target,
  Wand2,
  X,
} from "lucide-react";

import {
  buildSeoPageUrl,
  SEO_GROUP_LABELS,
  SEO_PAGE_PRESETS,
  type SeoPagePreset,
} from "@/src/lib/seo-presets";

type SeoConfig = {
  id: string;
  pageKey: string;
  pageLabel: string;
  pagePath?: string | null;
  title?: string | null;
  description?: string | null;
  primaryKeyword?: string | null;
  secondaryKeywords?: string | null;
  searchIntent?: string | null;
  keywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  ogType?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  twitterCard?: string | null;
  canonicalUrl?: string | null;
  noIndex: boolean;
  noFollow?: boolean;
  noArchive?: boolean;
  noSnippet?: boolean;
  maxSnippet?: number | null;
  maxVideoPreview?: number | null;
  maxImagePreview?: string | null;
  robotsDirectives?: string | null;
  breadcrumbTitle?: string | null;
  schemaType?: string | null;
  schemaMarkup?: string | null;
  sitemapPriority?: number | null;
  changeFrequency?: string | null;
  customHeadTags?: string | null;
  contentNotes?: string | null;
  updatedAt: string;
  createdAt?: string;
};

type AiSuggestions = {
  primaryKeyword?: string;
  secondaryKeywords?: string;
  searchIntent?: string;
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  ogType?: string;
  twitterCard?: string;
  schemaType?: string;
  robotsDirectives?: string;
  breadcrumbTitle?: string;
  changeFrequency?: string;
  sitemapPriority?: number;
  schemaMarkup?: object;
  analysis?: {
    titleScore?: number | null;
    descriptionScore?: number | null;
    keywordDensityNotes?: string;
    competitorInsight?: string;
    improvements?: string[];
    targetKeywords?: string[];
    estimatedCtr?: string;
    serp?: string;
  };
};

type FormValue = string | boolean | number;
type FormState = Record<string, FormValue>;

type PageItem = SeoPagePreset & {
  isCustom?: boolean;
};

const SEARCH_INTENT_OPTIONS = ["informational", "commercial", "navigational", "transactional"];
const OG_TYPE_OPTIONS = ["website", "article", "course", "product"];
const TWITTER_CARD_OPTIONS = ["summary", "summary_large_image"];
const CHANGE_FREQUENCY_OPTIONS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];
const MAX_IMAGE_PREVIEW_OPTIONS = ["large", "standard", "none"];
const SCHEMA_TYPE_OPTIONS = [
  "WebSite",
  "WebPage",
  "Course",
  "Article",
  "Product",
  "FAQPage",
  "ProfilePage",
  "VideoGallery",
  "DefinedTermSet",
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Counter({ value, ideal, max }: { value: string; ideal: [number, number]; max: number }) {
  const len = value.trim().length;
  const inIdeal = len >= ideal[0] && len <= ideal[1];
  const over = len > max;
  return (
    <span
      className={cn(
        "text-xs font-medium",
        over ? "text-red-400" : inIdeal ? "text-emerald-300" : "text-amber-300",
      )}
    >
      {len}/{max}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Icon className="h-5 w-5 text-amber-300" />
      </div>
      <div>
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-xs leading-5 text-zinc-400">{subtitle}</p>
      </div>
    </div>
  );
}

function SearchPreview({ url, title, description }: { url: string; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        <Eye className="h-3.5 w-3.5" /> Google Önizleme
      </p>
      <div className="space-y-1.5">
        <p className="truncate text-xs text-emerald-400">{url}</p>
        <p className="line-clamp-1 text-lg font-medium text-blue-400">
          {title || "Sayfa başlığı burada görünür"}
        </p>
        <p className="line-clamp-2 text-sm leading-6 text-zinc-400">
          {description || "Meta açıklama burada görünür."}
        </p>
      </div>
    </div>
  );
}

function SocialPreview({ title, description, image, network }: { title: string; description: string; image: string; network: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70">
      <div className="flex h-36 items-center justify-center border-b border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-xs text-zinc-500">
        {image ? <span className="truncate px-4">{image}</span> : `${network} görsel önizleme alanı`}
      </div>
      <div className="p-4">
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">{network}</p>
        <p className="line-clamp-2 text-sm font-semibold text-white">{title || `${network} başlığı`}</p>
        <p className="mt-1 line-clamp-3 text-xs leading-5 text-zinc-400">
          {description || `${network} açıklaması burada görünür.`}
        </p>
      </div>
    </div>
  );
}

function AuditChip({ label, state }: { label: string; state: "ok" | "warn" | "error" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        state === "ok" && "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
        state === "warn" && "border-amber-400/30 bg-amber-400/10 text-amber-300",
        state === "error" && "border-red-400/30 bg-red-400/10 text-red-300",
      )}
    >
      {label}
    </span>
  );
}

export default function SeoEditor({
  initialConfigs,
  siteUrl,
}: {
  initialConfigs: SeoConfig[];
  siteUrl: string;
}) {
  const [configs, setConfigs] = useState<Map<string, SeoConfig>>(
    () => new Map(initialConfigs.map((config) => [config.pageKey, config])),
  );
  const [activeKey, setActiveKey] = useState(initialConfigs[0]?.pageKey ?? SEO_PAGE_PRESETS[0].key);
  const [form, setForm] = useState<FormState>({});
  const [extraContext, setExtraContext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestions | null>(null);
  const [aiRaw, setAiRaw] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [showSchema, setShowSchema] = useState(true);
  const [showCustomPage, setShowCustomPage] = useState(false);
  const [customPageLabel, setCustomPageLabel] = useState("");
  const [customPagePath, setCustomPagePath] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isAiPending, startAiTransition] = useTransition();

  const pages = useMemo<PageItem[]>(() => {
    const presetMap = new Map(SEO_PAGE_PRESETS.map((item) => [item.key, item]));
    const customItems: PageItem[] = [];

    for (const config of configs.values()) {
      if (!presetMap.has(config.pageKey)) {
        customItems.push({
          key: config.pageKey,
          label: config.pageLabel,
          path: config.pagePath || `/${config.pageKey}`,
          group: "public",
          description: config.contentNotes || "Özel SEO sayfası",
          defaultSchemaType: config.schemaType || "WebPage",
          isCustom: true,
        });
      }
    }

    return [...SEO_PAGE_PRESETS, ...customItems];
  }, [configs]);

  const activePage = pages.find((page) => page.key === activeKey) ?? pages[0];
  const activeConfig = activePage ? configs.get(activePage.key) : undefined;

  function readField<T extends FormValue>(field: keyof SeoConfig, fallback: T): T {
    const formValue = form[field as string];
    if (formValue !== undefined) return formValue as T;
    const configValue = activeConfig?.[field];
    if (configValue !== undefined && configValue !== null) return configValue as T;
    return fallback;
  }

  function setField(field: keyof SeoConfig | string, value: FormValue) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function switchPage(pageKey: string) {
    setActiveKey(pageKey);
    setForm({});
    setError(null);
    setSaved(false);
    setAiSuggestions(null);
    setAiRaw(null);
    setAiAvailable(null);
    setExtraContext("");
  }

  function buildPayload() {
    const pagePath = String(readField("pagePath", activePage?.path ?? "/"));
    return {
      pageKey: activePage.key,
      pageLabel: String(readField("pageLabel", activePage.label)),
      pagePath: pagePath || null,
      title: String(readField("title", "")) || null,
      description: String(readField("description", "")) || null,
      primaryKeyword: String(readField("primaryKeyword", "")) || null,
      secondaryKeywords: String(readField("secondaryKeywords", "")) || null,
      searchIntent: String(readField("searchIntent", "")) || null,
      keywords: String(readField("keywords", "")) || null,
      ogTitle: String(readField("ogTitle", "")) || null,
      ogDescription: String(readField("ogDescription", "")) || null,
      ogImage: String(readField("ogImage", "")) || null,
      ogType: String(readField("ogType", "")) || null,
      twitterTitle: String(readField("twitterTitle", "")) || null,
      twitterDescription: String(readField("twitterDescription", "")) || null,
      twitterImage: String(readField("twitterImage", "")) || null,
      twitterCard: String(readField("twitterCard", "")) || null,
      canonicalUrl: String(readField("canonicalUrl", "")) || null,
      noIndex: Boolean(readField("noIndex", false)),
      noFollow: Boolean(readField("noFollow", false)),
      noArchive: Boolean(readField("noArchive", false)),
      noSnippet: Boolean(readField("noSnippet", false)),
      maxSnippet: String(readField("maxSnippet", "")) ? Number(readField("maxSnippet", 0)) : null,
      maxVideoPreview: String(readField("maxVideoPreview", ""))
        ? Number(readField("maxVideoPreview", 0))
        : null,
      maxImagePreview: String(readField("maxImagePreview", "")) || null,
      robotsDirectives: String(readField("robotsDirectives", "")) || null,
      breadcrumbTitle: String(readField("breadcrumbTitle", "")) || null,
      schemaType: String(readField("schemaType", activePage.defaultSchemaType)) || null,
      schemaMarkup: String(readField("schemaMarkup", "")) || null,
      sitemapPriority: String(readField("sitemapPriority", ""))
        ? Number(readField("sitemapPriority", 0))
        : null,
      changeFrequency: String(readField("changeFrequency", "")) || null,
      customHeadTags: String(readField("customHeadTags", "")) || null,
      contentNotes: String(readField("contentNotes", "")) || null,
    };
  }

  const pagePath = String(readField("pagePath", activePage?.path ?? "/"));
  const pageUrl = buildSeoPageUrl(siteUrl, pagePath || activePage.path);
  const title = String(readField("title", ""));
  const description = String(readField("description", ""));
  const primaryKeyword = String(readField("primaryKeyword", ""));
  const secondaryKeywords = String(readField("secondaryKeywords", ""));
  const keywords = String(readField("keywords", ""));
  const ogTitle = String(readField("ogTitle", ""));
  const ogDescription = String(readField("ogDescription", ""));
  const ogImage = String(readField("ogImage", ""));
  const twitterTitle = String(readField("twitterTitle", ogTitle || title));
  const twitterDescription = String(readField("twitterDescription", ogDescription || description));
  const twitterImage = String(readField("twitterImage", ogImage));
  const schemaMarkup = String(readField("schemaMarkup", ""));
  const contentNotes = String(readField("contentNotes", ""));
  const robotsDirectives = String(readField("robotsDirectives", ""));

  const auditItems = useMemo(() => {
    const titleLength = title.trim().length;
    const descLength = description.trim().length;
    const states = [
      {
        label: title ? "Title hazır" : "Title eksik",
        state: !title ? "error" : titleLength >= 45 && titleLength <= 60 ? "ok" : "warn",
      },
      {
        label: description ? "Description hazır" : "Description eksik",
        state: !description ? "error" : descLength >= 135 && descLength <= 160 ? "ok" : "warn",
      },
      {
        label: primaryKeyword ? "Ana kelime tanımlı" : "Ana kelime eksik",
        state: primaryKeyword ? "ok" : "warn",
      },
      {
        label: ogImage ? "OG görsel hazır" : "OG görsel eksik",
        state: ogImage ? "ok" : "warn",
      },
      {
        label: schemaMarkup ? "Schema hazır" : "Schema eksik",
        state: schemaMarkup ? "ok" : "warn",
      },
      {
        label: readField("canonicalUrl", "") ? "Canonical hazır" : "Canonical eksik",
        state: readField("canonicalUrl", "") ? "ok" : "warn",
      },
      {
        label: readField("noIndex", false) ? "Noindex aktif" : "Index açık",
        state: readField("noIndex", false) ? "warn" : "ok",
      },
    ] as Array<{ label: string; state: "ok" | "warn" | "error" }>;
    return states;
  }, [description, ogImage, primaryKeyword, readField, schemaMarkup, title]);

  const coverage = useMemo(() => {
    const total = pages.length;
    const configured = pages.filter((page) => {
      const cfg = configs.get(page.key);
      return Boolean(cfg?.title || cfg?.description || cfg?.schemaMarkup);
    }).length;
    return { total, configured, missing: total - configured };
  }, [configs, pages]);

  function createCustomPage() {
    const label = customPageLabel.trim();
    const rawPath = customPagePath.trim();
    if (!label) {
      setError("Özel sayfa için başlık gerekli.");
      return;
    }
    const path = rawPath.startsWith("/") ? rawPath : `/${rawPath || slugify(label)}`;
    const key = slugify(path.replace(/^\//, "").replace(/\//g, "-")) || slugify(label);
    const existing = configs.get(key);
    if (!existing) {
      const now = new Date().toISOString();
      setConfigs((current) => {
        const next = new Map(current);
        next.set(key, {
          id: `draft_${key}`,
          pageKey: key,
          pageLabel: label,
          pagePath: path,
          schemaType: "WebPage",
          noIndex: false,
          noFollow: false,
          noArchive: false,
          noSnippet: false,
          updatedAt: now,
          createdAt: now,
        });
        return next;
      });
    }
    setCustomPageLabel("");
    setCustomPagePath("");
    setShowCustomPage(false);
    switchPage(key);
  }

  function resetDraft() {
    setForm({});
    setAiSuggestions(null);
    setAiRaw(null);
    setError(null);
  }

  function applyAi() {
    if (!aiSuggestions) return;
    const fields: Array<[keyof AiSuggestions, string]> = [
      ["primaryKeyword", "primaryKeyword"],
      ["secondaryKeywords", "secondaryKeywords"],
      ["searchIntent", "searchIntent"],
      ["title", "title"],
      ["description", "description"],
      ["keywords", "keywords"],
      ["ogTitle", "ogTitle"],
      ["ogDescription", "ogDescription"],
      ["twitterTitle", "twitterTitle"],
      ["twitterDescription", "twitterDescription"],
      ["ogType", "ogType"],
      ["twitterCard", "twitterCard"],
      ["schemaType", "schemaType"],
      ["robotsDirectives", "robotsDirectives"],
      ["breadcrumbTitle", "breadcrumbTitle"],
      ["changeFrequency", "changeFrequency"],
    ];

    for (const [source, target] of fields) {
      const value = aiSuggestions[source];
      if (typeof value === "string" && value) {
        setField(target, value);
      }
    }
    if (typeof aiSuggestions.sitemapPriority === "number") {
      setField("sitemapPriority", aiSuggestions.sitemapPriority);
    }
    if (aiSuggestions.schemaMarkup) {
      setField("schemaMarkup", JSON.stringify(aiSuggestions.schemaMarkup, null, 2));
    }
  }

  function fillRobotsPreset() {
    setField("robotsDirectives", "max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    setField("maxSnippet", -1);
    setField("maxVideoPreview", -1);
    setField("maxImagePreview", "large");
  }

  function duplicateTitleToSocial() {
    setField("ogTitle", title);
    setField("twitterTitle", title);
    setField("ogDescription", description);
    setField("twitterDescription", description);
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const payload = buildPayload();
        const response = await fetch("/api/admin/seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error ?? "SEO ayarları kaydedilemedi.");
        }
        setConfigs((current) => new Map(current).set(payload.pageKey, data as SeoConfig));
        setForm({});
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Kayıt hatası.");
      }
    });
  }

  function handleAiGenerate() {
    setAiSuggestions(null);
    setAiRaw(null);
    setError(null);
    startAiTransition(async () => {
      try {
        const response = await fetch("/api/ai/seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageKey: activePage.key,
            pageLabel: String(readField("pageLabel", activePage.label)),
            pagePath,
            currentTitle: title,
            currentDescription: description,
            currentKeywords: keywords,
            currentPrimaryKeyword: primaryKeyword,
            currentSecondaryKeywords: secondaryKeywords,
            currentSearchIntent: String(readField("searchIntent", "")),
            context: extraContext,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "AI önerisi alınamadı.");
        }
        setAiAvailable(data.aiAvailable ?? false);
        setAiSuggestions(data.suggestions ?? null);
        setAiRaw(data.raw ?? null);
      } catch (aiError) {
        setError(aiError instanceof Error ? aiError.message : "AI isteği başarısız oldu.");
      }
    });
  }

  return (
    <div className="grid gap-6 px-6 pb-8 pt-2 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">SEO Coverage</p>
              <p className="mt-1 text-2xl font-black text-white">{coverage.configured}/{coverage.total}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomPage((current) => !current)}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-400/20"
            >
              <Plus className="h-4 w-4" /> Sayfa Ekle
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <AuditChip label={`${coverage.missing} eksik`} state={coverage.missing > 0 ? "warn" : "ok"} />
            <AuditChip label={`${pages.filter((page) => configs.get(page.key)?.noIndex).length} noindex`} state="warn" />
          </div>

          {showCustomPage && (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <input
                value={customPageLabel}
                onChange={(event) => setCustomPageLabel(event.target.value)}
                placeholder="Örn: Blog Ana Sayfa"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40"
              />
              <input
                value={customPagePath}
                onChange={(event) => setCustomPagePath(event.target.value)}
                placeholder="/blog"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40"
              />
              <button
                type="button"
                onClick={createCustomPage}
                className="w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
              >
                Sayfa Oluştur
              </button>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            <Search className="h-3.5 w-3.5" /> Sayfa Bazlı Yönetim
          </p>
          <div className="space-y-4">
            {Object.entries(SEO_GROUP_LABELS).map(([groupKey, groupLabel]) => {
              const groupPages = pages.filter((page) => page.group === groupKey);
              if (groupPages.length === 0) return null;
              return (
                <div key={groupKey}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-600">{groupLabel}</p>
                  <div className="space-y-1.5">
                    {groupPages.map((page) => {
                      const configured = configs.get(page.key);
                      const ready = Boolean(configured?.title || configured?.description || configured?.schemaMarkup);
                      return (
                        <button
                          key={page.key}
                          type="button"
                          onClick={() => switchPage(page.key)}
                          className={cn(
                            "flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                            activeKey === page.key
                              ? "border border-amber-400/25 bg-amber-400/10"
                              : "border border-transparent bg-white/0 hover:border-white/10 hover:bg-white/5",
                          )}
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{page.label}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">{page.path}</p>
                          </div>
                          {ready ? (
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                          ) : (
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                {SEO_GROUP_LABELS[activePage.group]}
              </span>
              {activePage.isCustom && (
                <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-xs font-semibold text-sky-300">
                  Custom
                </span>
              )}
            </div>
            <h2 className="mt-3 text-3xl font-black text-white">{activePage.label}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-400">{activePage.description}</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">{pageUrl}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetDraft}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              <RefreshCcw className="h-4 w-4" /> Taslağı Sıfırla
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Kaydet
            </button>
          </div>
        </div>

        {saved && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-300">
            SEO ayarları kaydedildi.
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4 lg:col-span-2">
            <SectionTitle
              icon={Bot}
              title="AI SEO Co-Pilot"
              subtitle="Anahtar kelime, sosyal snippet, schema ve CTR odaklı öneriler üretir."
            />
            <div className="space-y-3">
              <textarea
                value={extraContext}
                onChange={(event) => setExtraContext(event.target.value)}
                rows={3}
                placeholder="Hedef kitle, dönüşüm amacı, rakipler, kampanya mesajı, içerik tonu..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-amber-400/40"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isAiPending}
                  className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm font-bold text-amber-300 hover:bg-amber-400/20 disabled:opacity-50"
                >
                  {isAiPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI Önerisi Al
                </button>
                <button
                  type="button"
                  onClick={applyAi}
                  disabled={!aiSuggestions}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40"
                >
                  <Wand2 className="h-4 w-4" /> Tümünü Uygula
                </button>
              </div>
            </div>

            {aiSuggestions && (
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-300" />
                    <p className="text-sm font-bold text-white">AI Audit</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {aiSuggestions.analysis?.titleScore != null && (
                      <AuditChip
                        label={`Title ${aiSuggestions.analysis.titleScore}/100`}
                        state={aiSuggestions.analysis.titleScore >= 80 ? "ok" : aiSuggestions.analysis.titleScore >= 60 ? "warn" : "error"}
                      />
                    )}
                    {aiSuggestions.analysis?.descriptionScore != null && (
                      <AuditChip
                        label={`Description ${aiSuggestions.analysis.descriptionScore}/100`}
                        state={aiSuggestions.analysis.descriptionScore >= 80 ? "ok" : aiSuggestions.analysis.descriptionScore >= 60 ? "warn" : "error"}
                      />
                    )}
                  </div>
                  <div className="mt-4 space-y-2 text-xs leading-6 text-zinc-300">
                    {aiSuggestions.analysis?.keywordDensityNotes && <p>{aiSuggestions.analysis.keywordDensityNotes}</p>}
                    {aiSuggestions.analysis?.competitorInsight && <p>{aiSuggestions.analysis.competitorInsight}</p>}
                    {aiSuggestions.analysis?.estimatedCtr && <p>CTR: {aiSuggestions.analysis.estimatedCtr}</p>}
                    {aiSuggestions.analysis?.serp && <p>SERP: {aiSuggestions.analysis.serp}</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-300" />
                    <p className="text-sm font-bold text-white">AI Önerileri</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(aiSuggestions.analysis?.targetKeywords ?? []).map((keyword) => (
                      <span key={keyword} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <ul className="mt-4 space-y-2 text-xs leading-6 text-zinc-300">
                    {(aiSuggestions.analysis?.improvements ?? []).map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-amber-300">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {aiRaw && (
              <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-zinc-300">
                {aiRaw}
              </pre>
            )}
            {aiAvailable === false && (
              <p className="mt-4 text-xs text-amber-300">AI anahtarı yoksa sistem temel öneri moduna düşer.</p>
            )}
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
            <SectionTitle
              icon={Settings2}
              title="Canlı Audit"
              subtitle="Başlık, snippet, canonical, schema ve robots alanlarının durumunu canlı izler."
            />
            <div className="flex flex-wrap gap-2">
              {auditItems.map((item) => (
                <AuditChip key={item.label} label={item.label} state={item.state} />
              ))}
            </div>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-zinc-300">
              <p>Title: 45-60 karakter hedeflenir.</p>
              <p>Description: 135-160 karakter hedeflenir.</p>
              <p>Primary keyword başlığın başında veya ilk yarısında olmalı.</p>
              <p>Canonical ve OG görseli olmayan sayfalar paylaşımda ve indexlemede zayıf kalır.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SearchPreview url={pageUrl} title={title} description={description} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SocialPreview title={ogTitle || title} description={ogDescription || description} image={ogImage} network="Open Graph" />
            <SocialPreview title={twitterTitle || title} description={twitterDescription || description} image={twitterImage || ogImage} network="Twitter / X" />
          </div>
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
              <SectionTitle
                icon={Target}
                title="Arama Stratejisi"
                subtitle="Anahtar kelime hiyerarşisi, intent, path ve canonical mantığını sayfa bazında yönetin."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Sayfa Adı</label>
                  <input
                    value={String(readField("pageLabel", activePage.label))}
                    onChange={(event) => setField("pageLabel", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Sayfa Path</label>
                  <input
                    value={pagePath}
                    onChange={(event) => setField("pagePath", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Primary Keyword</label>
                  <input
                    value={primaryKeyword}
                    onChange={(event) => setField("primaryKeyword", event.target.value)}
                    placeholder="yds hazırlık platformu"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Search Intent</label>
                  <select
                    value={String(readField("searchIntent", "commercial"))}
                    onChange={(event) => setField("searchIntent", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  >
                    {SEARCH_INTENT_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-zinc-900">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-white">Secondary Keywords</label>
                <textarea
                  value={secondaryKeywords}
                  onChange={(event) => setField("secondaryKeywords", event.target.value)}
                  rows={2}
                  placeholder="yds online ders, yökdil çalışma sistemi, ydt deneme programı"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-amber-400/40"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-white">Keyword Cluster / Tags</label>
                <textarea
                  value={keywords}
                  onChange={(event) => setField("keywords", event.target.value)}
                  rows={2}
                  placeholder="YDS hazırlık, yökdil, ydt, online İngilizce, canlı ders, AI çalışma planı"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-amber-400/40"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
              <SectionTitle
                icon={Search}
                title="SERP Snippet"
                subtitle="Başlık ve açıklamayı CTR odaklı optimize edin; snippet limitlerini canlı görün."
              />
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-white">Meta Title</label>
                    <Counter value={title} ideal={[45, 60]} max={70} />
                  </div>
                  <input
                    value={title}
                    onChange={(event) => setField("title", event.target.value)}
                    placeholder="YDS Hazırlık Platformu | Bilal Hoca YDS"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-amber-400/40"
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-white">Meta Description</label>
                    <Counter value={description} ideal={[135, 160]} max={180} />
                  </div>
                  <textarea
                    value={description}
                    onChange={(event) => setField("description", event.target.value)}
                    rows={3}
                    placeholder="AI destekli çalışma planı, vocabulary, reading, grammar ve canlı derslerle YDS hedefini daha hızlı yakala."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-amber-400/40"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Canonical URL</label>
                  <input
                    value={String(readField("canonicalUrl", pageUrl))}
                    onChange={(event) => setField("canonicalUrl", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
              <SectionTitle
                icon={Share2}
                title="Sosyal Paylaşım"
                subtitle="OG ve Twitter kartlarını ayrı optimize edin; platform bazlı başlık, açıklama ve görsel kullanın."
              />
              <div className="mb-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={duplicateTitleToSocial}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  <Copy className="h-3.5 w-3.5" /> Meta veriyi sosyal alana kopyala
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">OG Title</label>
                  <input
                    value={ogTitle}
                    onChange={(event) => setField("ogTitle", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">OG Type</label>
                  <select
                    value={String(readField("ogType", activePage.defaultSchemaType === "Product" ? "product" : "website"))}
                    onChange={(event) => setField("ogType", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  >
                    {OG_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-zinc-900">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-white">OG Description</label>
                  <textarea
                    value={ogDescription}
                    onChange={(event) => setField("ogDescription", event.target.value)}
                    rows={2}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">OG Image URL</label>
                  <input
                    value={ogImage}
                    onChange={(event) => setField("ogImage", event.target.value)}
                    placeholder="https://.../og-home.png"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Twitter Card</label>
                  <select
                    value={String(readField("twitterCard", "summary_large_image"))}
                    onChange={(event) => setField("twitterCard", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  >
                    {TWITTER_CARD_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-zinc-900">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Twitter Title</label>
                  <input
                    value={twitterTitle}
                    onChange={(event) => setField("twitterTitle", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Twitter Image URL</label>
                  <input
                    value={twitterImage}
                    onChange={(event) => setField("twitterImage", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-white">Twitter Description</label>
                  <textarea
                    value={twitterDescription}
                    onChange={(event) => setField("twitterDescription", event.target.value)}
                    rows={2}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
              <button
                type="button"
                onClick={() => setShowAdvanced((current) => !current)}
                className="flex w-full items-center justify-between text-left"
              >
                <SectionTitle
                  icon={Globe}
                  title="Indexing & Robots"
                  subtitle="noindex, nofollow, snippet limitleri ve robots direktiflerini yönetin."
                />
                {showAdvanced ? <ChevronUp className="h-5 w-5 text-zinc-500" /> : <ChevronDown className="h-5 w-5 text-zinc-500" />}
              </button>
              {showAdvanced && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {[
                      ["noIndex", "noindex"],
                      ["noFollow", "nofollow"],
                      ["noArchive", "noarchive"],
                      ["noSnippet", "nosnippet"],
                    ].map(([field, label]) => {
                      const enabled = Boolean(readField(field as keyof SeoConfig, false));
                      return (
                        <button
                          key={field}
                          type="button"
                          onClick={() => setField(field, !enabled)}
                          className={cn(
                            "rounded-full border px-3 py-2 text-xs font-semibold transition",
                            enabled
                              ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                              : "border-white/10 bg-white/5 text-zinc-400",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={fillRobotsPreset}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    <Wand2 className="h-3.5 w-3.5" /> Google-friendly robots preset uygula
                  </button>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Max Snippet</label>
                      <input
                        value={String(readField("maxSnippet", ""))}
                        onChange={(event) => setField("maxSnippet", event.target.value)}
                        placeholder="-1"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Max Video Preview</label>
                      <input
                        value={String(readField("maxVideoPreview", ""))}
                        onChange={(event) => setField("maxVideoPreview", event.target.value)}
                        placeholder="-1"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Max Image Preview</label>
                      <select
                        value={String(readField("maxImagePreview", "large"))}
                        onChange={(event) => setField("maxImagePreview", event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                      >
                        {MAX_IMAGE_PREVIEW_OPTIONS.map((option) => (
                          <option key={option} value={option} className="bg-zinc-900">
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Breadcrumb Title</label>
                      <input
                        value={String(readField("breadcrumbTitle", activePage.label))}
                        onChange={(event) => setField("breadcrumbTitle", event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">Robots Directives</label>
                    <textarea
                      value={robotsDirectives}
                      onChange={(event) => setField("robotsDirectives", event.target.value)}
                      rows={3}
                      placeholder="max-image-preview:large, max-snippet:-1, max-video-preview:-1"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-amber-400/40"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
              <button
                type="button"
                onClick={() => setShowSchema((current) => !current)}
                className="flex w-full items-center justify-between text-left"
              >
                <SectionTitle
                  icon={ImageIcon}
                  title="Structured Data & Sitemap"
                  subtitle="Schema tipi, JSON-LD, sitemap priority ve change frequency alanlarını yönetin."
                />
                {showSchema ? <ChevronUp className="h-5 w-5 text-zinc-500" /> : <ChevronDown className="h-5 w-5 text-zinc-500" />}
              </button>
              {showSchema && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Schema Type</label>
                      <select
                        value={String(readField("schemaType", activePage.defaultSchemaType))}
                        onChange={(event) => setField("schemaType", event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                      >
                        {SCHEMA_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option} className="bg-zinc-900">
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Change Frequency</label>
                      <select
                        value={String(readField("changeFrequency", "weekly"))}
                        onChange={(event) => setField("changeFrequency", event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                      >
                        {CHANGE_FREQUENCY_OPTIONS.map((option) => (
                          <option key={option} value={option} className="bg-zinc-900">
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Sitemap Priority</label>
                      <input
                        value={String(readField("sitemapPriority", activePage.key === "home" ? 1 : 0.8))}
                        onChange={(event) => setField("sitemapPriority", event.target.value)}
                        placeholder="0.8"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Schema Generator Notu</label>
                      <input
                        value={String(readField("schemaType", activePage.defaultSchemaType))}
                        readOnly
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-400 outline-none"
                      />
                    </div>
                  </div>
                  <textarea
                    value={schemaMarkup}
                    onChange={(event) => setField("schemaMarkup", event.target.value)}
                    rows={12}
                    placeholder='{"@context":"https://schema.org","@type":"WebSite","name":"Bilal Hoca YDS"}'
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs leading-6 text-emerald-300 outline-none placeholder:text-zinc-600 focus:border-amber-400/40"
                  />
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
              <SectionTitle
                icon={Settings2}
                title="Editorial Notes & Custom Head"
                subtitle="Sayfa özelinde içerik notları, test notları veya ek head etiketleri saklayın."
              />
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Content Notes</label>
                  <textarea
                    value={contentNotes}
                    onChange={(event) => setField("contentNotes", event.target.value)}
                    rows={4}
                    placeholder="Bu sayfada intent commercial; CTA üst fold'da kalmalı, testimonial blokları genişletilmeli..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-amber-400/40"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Custom Head Tags</label>
                  <textarea
                    value={String(readField("customHeadTags", ""))}
                    onChange={(event) => setField("customHeadTags", event.target.value)}
                    rows={6}
                    placeholder={'<meta name="article:section" content="pricing" />'}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs leading-6 text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-amber-400/40"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
