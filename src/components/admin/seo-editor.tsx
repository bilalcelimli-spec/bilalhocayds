"use client";

import { useState, useTransition, useCallback } from "react";
import {
  AlertCircle,
  BarChart2,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Eye,
  Globe,
  Loader2,
  Save,
  Search,
  Sparkles,
  X,
} from "lucide-react";

type SeoConfig = {
  id: string;
  pageKey: string;
  pageLabel: string;
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  noIndex: boolean;
  schemaMarkup?: string | null;
  updatedAt: string;
};

type AiSuggestions = {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  schemaMarkup?: object;
  analysis?: {
    titleScore?: number | null;
    descriptionScore?: number | null;
    competitorInsight?: string;
    improvements?: string[];
    targetKeywords?: string[];
    estimatedCtr?: string;
    serp?: string;
  };
};

const PAGES = [
  { key: "home", label: "Ana Sayfa" },
  { key: "pricing", label: "Fiyatlandırma" },
  { key: "live-classes", label: "Canlı Dersler" },
  { key: "grammar", label: "Grammar Modülü" },
  { key: "vocabulary", label: "Vocabulary Modülü" },
  { key: "reading", label: "Reading Modülü" },
  { key: "dashboard", label: "Dashboard" },
  { key: "login", label: "Giriş Yap" },
  { key: "register", label: "Kayıt Ol" },
];

type FormState = Record<string, string | boolean>;

function ScoreBadge({ score }: { score?: number | null }) {
  if (!score) return null;
  const color =
    score >= 80
      ? "text-emerald-300 border-emerald-400/30 bg-emerald-400/10"
      : score >= 60
      ? "text-amber-300 border-amber-400/30 bg-amber-400/10"
      : "text-red-300 border-red-400/30 bg-red-400/10";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${color}`}>
      <BarChart2 className="h-3 w-3" /> {score}/100
    </span>
  );
}

function CharCounter({ value, max, warn }: { value: string; max: number; warn: number }) {
  const len = value.length;
  const color = len > max ? "text-red-400" : len > warn ? "text-amber-400" : "text-zinc-500";
  return <span className={`text-xs ${color}`}>{len}/{max}</span>;
}

function SerpPreview({ title, description, url }: { title: string; description: string; url: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-zinc-400">
        <Eye className="h-3.5 w-3.5" /> SERP Önizleme (Google)
      </p>
      <div className="flex items-start gap-2">
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
        <div>
          <p className="text-xs text-zinc-500 break-all">{url}</p>
          <p className="mt-0.5 text-base font-medium text-blue-400 cursor-pointer line-clamp-1 hover:underline">
            {title || "Sayfa başlığı buraya gelecek"}
          </p>
          <p className="mt-0.5 text-sm leading-5 text-zinc-400 line-clamp-2">
            {description || "Meta açıklama buraya gelecek..."}
          </p>
        </div>
      </div>
    </div>
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
    () => new Map(initialConfigs.map((c) => [c.pageKey, c]))
  );
  const [activeKey, setActiveKey] = useState("home");
  const [form, setForm] = useState<FormState>({});
  const [isPending, startTransition] = useTransition();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestions | null>(null);
  const [aiRaw, setAiRaw] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extraContext, setExtraContext] = useState("");
  const [showSchema, setShowSchema] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activePage = PAGES.find((p) => p.key === activeKey)!;
  const config = configs.get(activeKey);

  const getField = useCallback(
    (field: string): string | boolean => {
      if (field in form) return form[field];
      if (config) {
        const val = (config as unknown as Record<string, unknown>)[field];
        if (val !== undefined && val !== null) return val as string | boolean;
      }
      if (field === "noIndex") return false;
      return "";
    },
    [form, config]
  );

  const setField = useCallback((field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const switchPage = (key: string) => {
    setActiveKey(key);
    setForm({});
    setAiSuggestions(null);
    setAiRaw(null);
    setError(null);
    setSaved(null);
    setExtraContext("");
    setShowSchema(false);
    setShowAdvanced(false);
  };

  const applyAiField = (field: string, value: string | undefined) => {
    if (!value) return;
    setField(field, value);
  };

  const applyAllAi = () => {
    if (!aiSuggestions) return;
    if (aiSuggestions.title) setField("title", aiSuggestions.title);
    if (aiSuggestions.description) setField("description", aiSuggestions.description);
    if (aiSuggestions.keywords) setField("keywords", aiSuggestions.keywords);
    if (aiSuggestions.ogTitle) setField("ogTitle", aiSuggestions.ogTitle);
    if (aiSuggestions.ogDescription) setField("ogDescription", aiSuggestions.ogDescription);
    if (aiSuggestions.schemaMarkup) {
      setField("schemaMarkup", JSON.stringify(aiSuggestions.schemaMarkup, null, 2));
    }
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    setAiSuggestions(null);
    setAiRaw(null);
    setError(null);
    try {
      const res = await fetch("/api/ai/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageKey: activeKey,
          pageLabel: activePage.label,
          currentTitle: getField("title"),
          currentDescription: getField("description"),
          currentKeywords: getField("keywords"),
          context: extraContext,
        }),
      });
      const data = await res.json();
      setAiAvailable(data.aiAvailable ?? false);
      if (data.suggestions) {
        setAiSuggestions(data.suggestions);
      } else if (data.raw) {
        setAiRaw(data.raw);
      }
    } catch {
      setError("AI isteği başarısız oldu.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    setSaved(null);
    setError(null);
    startTransition(async () => {
      try {
        const body = {
          pageKey: activeKey,
          pageLabel: activePage.label,
          title: (getField("title") as string) || null,
          description: (getField("description") as string) || null,
          keywords: (getField("keywords") as string) || null,
          ogTitle: (getField("ogTitle") as string) || null,
          ogDescription: (getField("ogDescription") as string) || null,
          ogImage: (getField("ogImage") as string) || null,
          canonicalUrl: (getField("canonicalUrl") as string) || null,
          noIndex: getField("noIndex") === true,
          schemaMarkup: (getField("schemaMarkup") as string) || null,
        };
        const res = await fetch("/api/admin/seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Kayıt başarısız.");
        }
        const updated: SeoConfig = await res.json();
        setConfigs((prev) => new Map(prev).set(activeKey, updated));
        setForm({});
        setSaved(activeKey);
        setTimeout(() => setSaved(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kayıt hatası.");
      }
    });
  };

  const titleVal = String(getField("title") || "");
  const descVal = String(getField("description") || "");
  const keywordsVal = String(getField("keywords") || "");
  const ogTitleVal = String(getField("ogTitle") || "");
  const ogDescVal = String(getField("ogDescription") || "");
  const ogImageVal = String(getField("ogImage") || "");
  const canonicalVal = String(getField("canonicalUrl") || "");
  const schemaVal = String(getField("schemaMarkup") || "");
  const noIndexVal = getField("noIndex") === true;

  const pageUrl = `${siteUrl}${activeKey === "home" ? "" : `/${activeKey}`}`;

  return (
    <div className="flex min-h-screen flex-col gap-6 p-6 lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full shrink-0 lg:w-64">
        <div className="sticky top-24 rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <Search className="h-3.5 w-3.5" /> Sayfalar
          </p>
          <nav className="space-y-1">
            {PAGES.map((page) => {
              const cfg = configs.get(page.key);
              const hasTitle = !!cfg?.title;
              return (
                <button
                  key={page.key}
                  onClick={() => switchPage(page.key)}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeKey === page.key
                      ? "bg-amber-400/15 text-amber-300"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span>{page.label}</span>
                  {hasTitle ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-zinc-600" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Ana içerik */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">{activePage.label}</h2>
            <p className="mt-0.5 text-sm text-zinc-400">{pageUrl}</p>
          </div>
          <div className="flex items-center gap-3">
            {saved === activeKey && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-300">
                <Check className="h-4 w-4" /> Kaydedildi
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-amber-300 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Kaydet
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
            <X className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* AI Bölümü */}
        <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/8 to-zinc-900/60 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-400/20">
              <Brain className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-white">AI SEO Uzmanı</h3>
              <p className="text-xs text-zinc-400">Bu sayfa için optimize edilmiş SEO önerisi al</p>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder="Ek bağlam (opsiyonel): Hedef kitle, rakip siteler, odak konusu..."
              rows={2}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400/40"
            />
            <button
              onClick={handleAiGenerate}
              disabled={aiLoading}
              className="flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/15 px-5 py-2.5 text-sm font-bold text-amber-300 hover:bg-amber-400/25 disabled:opacity-50 transition-colors"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {aiLoading ? "AI analiz ediyor..." : "AI ile SEO Önerisi Al"}
            </button>
          </div>

          {/* AI Sonuçları */}
          {aiSuggestions && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-300">
                  <Sparkles className="h-4 w-4" />
                  {aiAvailable ? "AI Önerileri" : "Temel Öneriler"}
                </p>
                <button
                  onClick={applyAllAi}
                  className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-400/20 transition-colors"
                >
                  Tümünü Uygula
                </button>
              </div>

              {/* Analiz */}
              {aiSuggestions.analysis && (
                <div className="rounded-2xl border border-white/8 bg-zinc-900/50 p-4 space-y-3">
                  {(aiSuggestions.analysis.titleScore || aiSuggestions.analysis.descriptionScore) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {aiSuggestions.analysis.titleScore != null && (
                        <><span className="text-xs text-zinc-400">Başlık:</span><ScoreBadge score={aiSuggestions.analysis.titleScore} /></>
                      )}
                      {aiSuggestions.analysis.descriptionScore != null && (
                        <><span className="text-xs text-zinc-400 ml-2">Açıklama:</span><ScoreBadge score={aiSuggestions.analysis.descriptionScore} /></>
                      )}
                    </div>
                  )}
                  {aiSuggestions.analysis.serp && (
                    <p className="text-xs text-zinc-300">
                      <span className="font-semibold text-zinc-200">SERP: </span>
                      {aiSuggestions.analysis.serp}
                    </p>
                  )}
                  {aiSuggestions.analysis.competitorInsight && (
                    <p className="text-xs text-zinc-300">
                      <span className="font-semibold text-zinc-200">Rekabet: </span>
                      {aiSuggestions.analysis.competitorInsight}
                    </p>
                  )}
                  {aiSuggestions.analysis.estimatedCtr && (
                    <p className="text-xs text-zinc-300">
                      <span className="font-semibold text-zinc-200">Tahmini CTR: </span>
                      {aiSuggestions.analysis.estimatedCtr}
                    </p>
                  )}
                  {aiSuggestions.analysis.improvements && aiSuggestions.analysis.improvements.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold text-zinc-200">İyileştirme Önerileri:</p>
                      <ul className="space-y-1">
                        {aiSuggestions.analysis.improvements.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                            <span className="text-amber-400 mt-0.5 shrink-0">→</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiSuggestions.analysis.targetKeywords && aiSuggestions.analysis.targetKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {aiSuggestions.analysis.targetKeywords.map((kw) => (
                        <span key={kw} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-300">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Öneri alanları */}
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { field: "title", label: "Title", value: aiSuggestions.title },
                    { field: "description", label: "Description", value: aiSuggestions.description },
                    { field: "keywords", label: "Keywords", value: aiSuggestions.keywords },
                    { field: "ogTitle", label: "OG Title", value: aiSuggestions.ogTitle },
                    { field: "ogDescription", label: "OG Description", value: aiSuggestions.ogDescription },
                  ] as { field: string; label: string; value: string | undefined }[]
                )
                  .filter(({ value }) => !!value)
                  .map(({ field, label, value }) => (
                    <div key={field} className="rounded-2xl border border-white/8 bg-zinc-900/40 p-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400">{label}</span>
                        <button
                          onClick={() => applyAiField(field, value)}
                          className="flex items-center gap-1 rounded-lg border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300 hover:bg-amber-400/20"
                        >
                          <Edit2 className="h-3 w-3" /> Uygula
                        </button>
                      </div>
                      <p className="text-xs leading-5 text-slate-300">{value}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {aiRaw && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
              <p className="mb-2 text-xs font-bold text-zinc-400">Ham AI Yanıtı</p>
              <pre className="whitespace-pre-wrap text-xs text-slate-300">{aiRaw}</pre>
            </div>
          )}
        </div>

        {/* SERP Önizleme */}
        <SerpPreview title={titleVal} description={descVal} url={pageUrl} />

        {/* Form */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 space-y-5">
          <h3 className="font-bold text-white">SEO Alanları</h3>

          {/* Title */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-300">Meta Title</label>
              <CharCounter value={titleVal} max={60} warn={50} />
            </div>
            <input
              value={titleVal}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="YDS Hazırlık | Bilal Hoca AI Platformu"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400/40"
            />
            <p className="mt-1 text-xs text-zinc-500">Google arama sonuçlarında mavi başlık olarak görünür. 60 karakter altında tutun.</p>
          </div>

          {/* Description */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-300">Meta Description</label>
              <CharCounter value={descVal} max={160} warn={140} />
            </div>
            <textarea
              value={descVal}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="YDS, YÖKDİL ve YDT sınavına hazırlanmak için AI destekli platform..."
              rows={3}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400/40"
            />
            <p className="mt-1 text-xs text-zinc-500">Başlığın altında snippet olarak görünür. 155–160 karakter ideal.</p>
          </div>

          {/* Keywords */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300">Keywords</label>
            <textarea
              value={keywordsVal}
              onChange={(e) => setField("keywords", e.target.value)}
              placeholder="YDS hazırlık, YÖKDİL, online İngilizce, AI öğrenme, canlı ders"
              rows={2}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400/40"
            />
            <p className="mt-1 text-xs text-zinc-500">Virgülle ayır. Schema ve içerik planlaması için kullanılır.</p>
          </div>

          {/* Open Graph */}
          <div className="rounded-2xl border border-white/8 bg-zinc-900/40 p-4 space-y-4">
            <h4 className="text-sm font-bold text-slate-200">Open Graph (Sosyal Medya)</h4>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">OG Title</label>
                <CharCounter value={ogTitleVal} max={95} warn={70} />
              </div>
              <input
                value={ogTitleVal}
                onChange={(e) => setField("ogTitle", e.target.value)}
                placeholder="Facebook/Twitter'da gösterilecek başlık"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400/40"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">OG Description</label>
                <CharCounter value={ogDescVal} max={200} warn={155} />
              </div>
              <textarea
                value={ogDescVal}
                onChange={(e) => setField("ogDescription", e.target.value)}
                placeholder="Sosyal medyada paylaşımda açıklama"
                rows={2}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">OG Image URL</label>
              <input
                value={ogImageVal}
                onChange={(e) => setField("ogImage", e.target.value)}
                placeholder="https://bilalhocayds.com/og-image.png (1200×630 px önerilir)"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400/40"
              />
            </div>
          </div>

          {/* Gelişmiş */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Gelişmiş Ayarlar
            </button>
            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Canonical URL</label>
                  <input
                    value={canonicalVal}
                    onChange={(e) => setField("canonicalUrl", e.target.value)}
                    placeholder={pageUrl}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400/40"
                  />
                  <p className="mt-1 text-xs text-zinc-500">Duplicate content sorununu önlemek için kullanın.</p>
                </div>
                <label className="flex cursor-pointer items-center gap-3">
                  <button
                    role="switch"
                    aria-checked={noIndexVal}
                    onClick={() => setField("noIndex", !noIndexVal)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      noIndexVal ? "bg-red-500" : "bg-zinc-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        noIndexVal ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-slate-300">noindex</p>
                    <p className="text-xs text-zinc-500">Bu sayfayı arama motorlarından gizle</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* JSON-LD Schema */}
          <div>
            <button
              onClick={() => setShowSchema(!showSchema)}
              className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              {showSchema ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              JSON-LD Schema Markup
            </button>
            {showSchema && (
              <div className="mt-3">
                <textarea
                  value={schemaVal}
                  onChange={(e) => setField("schemaMarkup", e.target.value)}
                  placeholder={'{"@context":"https://schema.org","@type":"EducationalOrganization","name":"Bilal Hoca YDS"}'}
                  rows={8}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 font-mono text-xs text-emerald-300 placeholder:text-zinc-600 outline-none focus:border-amber-400/40"
                />
                <p className="mt-1 text-xs text-zinc-500">Geçerli JSON-LD giriniz. AI butonu ile otomatik oluşturulabilir.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
