"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, FileText, Globe, Plus, Sparkles, Trash2, Upload, Video } from "lucide-react";

type SourceType = "TEXT" | "WEB" | "PDF" | "VIDEO" | "AUDIO" | "DOCUMENT" | "OTHER";

type SourceDraft = {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl: string;
  rawText: string;
  styleNotes: string;
  tags: string;
  file: File | null;
};

type SourcePreview = {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl: string | null;
  mimeType: string | null;
  tags: string[];
  createdAt: string;
  excerpt: string;
};

type RunPreview = {
  id: string;
  title: string;
  status: string;
  isApproved: boolean;
  approvedAt: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  itemType: string;
  outputFormat: string;
  itemCount: number;
  sourceCount: number;
  createdAt: string;
  summary: string | null;
  generatedPreview: string | null;
  distributionTarget?: string | null;
};

type GeneratedItem = {
  title: string;
  content: string;
  difficulty: string;
  tags: string[];
  sourceInspiration: string;
  answerKey?: string | null;
};

type GenerateResponse = {
  run: RunPreview;
  sources: SourcePreview[];
  generatedItems: GeneratedItem[];
  generatedText: string;
  styleAnalysis: string;
  model: string;
};

const sourceTypeOptions: Array<{ value: SourceType; label: string }> = [
  { value: "TEXT", label: "Metin" },
  { value: "WEB", label: "Web Sayfası" },
  { value: "PDF", label: "PDF" },
  { value: "VIDEO", label: "Video / Transcript" },
  { value: "AUDIO", label: "Audio / Transcript" },
  { value: "DOCUMENT", label: "Doküman" },
  { value: "OTHER", label: "Diğer" },
];

function makeSource(): SourceDraft {
  return {
    id: crypto.randomUUID(),
    title: "",
    sourceType: "TEXT",
    sourceUrl: "",
    rawText: "",
    styleNotes: "",
    tags: "",
    file: null,
  };
}

function sourceIcon(type: string) {
  if (type === "WEB") return Globe;
  if (type === "PDF" || type === "DOCUMENT") return FileText;
  if (type === "VIDEO") return Video;
  return Sparkles;
}

export default function ContentEngine({
  initialSources,
  initialRuns,
}: {
  initialSources: SourcePreview[];
  initialRuns: RunPreview[];
}) {
  const [title, setTitle] = useState("Kaynak Tabanlı İçerik Seti");
  const [itemType, setItemType] = useState("reading passage + questions");
  const [outputFormat, setOutputFormat] = useState("json-pack");
  const [itemCount, setItemCount] = useState(4);
  const [instructions, setInstructions] = useState("Kaynaklardaki zorluk ve öğretim tarzını koru, ancak tüm itemlar özgün olsun.");
  const [sources, setSources] = useState<SourceDraft[]>([makeSource()]);
  const [recentSources, setRecentSources] = useState(initialSources);
  const [recentRuns, setRecentRuns] = useState(initialRuns);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [runActionId, setRunActionId] = useState<string | null>(null);

  function updateSource(id: string, patch: Partial<SourceDraft>) {
    setSources((current) => current.map((source) => (source.id === id ? { ...source, ...patch } : source)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("title", title);
        formData.set("itemType", itemType);
        formData.set("outputFormat", outputFormat);
        formData.set("itemCount", String(itemCount));
        formData.set("instructions", instructions);

        const payloadSources = sources.map((source) => {
          const fileField = source.file ? `file-${source.id}` : undefined;
          if (source.file && fileField) {
            formData.set(fileField, source.file);
          }

          return {
            id: source.id,
            title: source.title,
            sourceType: source.sourceType,
            sourceUrl: source.sourceUrl,
            rawText: source.rawText,
            styleNotes: source.styleNotes,
            tags: source.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            fileField,
          };
        });

        formData.set("sources", JSON.stringify(payloadSources));

        const response = await fetch("/api/admin/content-engine", {
          method: "POST",
          body: formData,
        });

        const json = await response.json();
        if (!response.ok) {
          setError(json?.error ?? "Üretim sırasında hata oluştu.");
          return;
        }

        const data = json as GenerateResponse;
        setResult(data);
        setRecentRuns((current) => [data.run, ...current]);
        setRecentSources((current) => [...data.sources, ...current]);
      } catch {
        setError("İstek gönderilemedi. Lütfen tekrar deneyin.");
      }
    });
  }

  async function handleRunAction(runId: string, action: "approve" | "unpublish") {
    setRunActionId(runId);
    setError(null);

    try {
      const response = await fetch("/api/admin/content-engine", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, action }),
      });

      const json = await response.json();
      if (!response.ok) {
        setError(json?.error ?? "İçerik durumu güncellenemedi.");
        return;
      }

      const updatedRun = json.run as RunPreview;
      setRecentRuns((current) => current.map((run) => (run.id === updatedRun.id ? updatedRun : run)));
      if (result?.run.id === updatedRun.id) {
        setResult((current) => (current ? { ...current, run: updatedRun } : current));
      }
    } catch {
      setError("İçerik durumu güncellenemedi.");
    } finally {
      setRunActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={handleSubmit} className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Creator Engine</p>
              <h2 className="mt-2 text-2xl font-black text-white">Kaynaklardan özgün içerik üret</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
                PDF, web, video transcripti veya düz metin ver. Engine kaynaklardaki ton, zorluk, pedagojik yapı ve tekrar eden motifleri analiz edip benzer hissiyat taşıyan yeni itemlar üretir.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">Output</p>
              <p className="mt-1 text-sm font-semibold text-white">JSON + Markdown Pack</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Generation title" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
            <input value={itemType} onChange={(event) => setItemType(event.target.value)} placeholder="Item type" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
            <select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none">
              <option value="json-pack">JSON Pack</option>
              <option value="worksheet">Worksheet</option>
              <option value="lesson-notes">Lesson Notes</option>
              <option value="exam-drill">Exam Drill</option>
            </select>
            <input value={itemCount} onChange={(event) => setItemCount(Number(event.target.value))} type="number" min={1} max={12} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" />
          </div>

          <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={4} className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-zinc-500" placeholder="Üretim yönergesi" />

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Kaynak havuzu</p>
              <p className="text-xs text-zinc-500">İstersen tek kaynakla, istersen birden fazla kaynak karışımıyla üretim yap.</p>
            </div>
            <button type="button" onClick={() => setSources((current) => [...current, makeSource()])} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/[0.08]">
              <Plus size={14} />
              Kaynak ekle
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {sources.map((source, index) => {
              const Icon = sourceIcon(source.sourceType);
              return (
                <div key={source.id} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-amber-300">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Kaynak {index + 1}</p>
                        <p className="text-xs text-zinc-500">URL, metin, transcript veya dosya ile besle.</p>
                      </div>
                    </div>
                    {sources.length > 1 ? (
                      <button type="button" onClick={() => setSources((current) => current.filter((item) => item.id !== source.id))} className="rounded-xl border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10">
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input value={source.title} onChange={(event) => updateSource(source.id, { title: event.target.value })} placeholder="Kaynak başlığı" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
                    <select value={source.sourceType} onChange={(event) => updateSource(source.id, { sourceType: event.target.value as SourceType })} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none">
                      {sourceTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <input value={source.sourceUrl} onChange={(event) => updateSource(source.id, { sourceUrl: event.target.value })} placeholder="https://..." className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 md:col-span-2" />
                    <input value={source.tags} onChange={(event) => updateSource(source.id, { tags: event.target.value })} placeholder="exam, inference, academic" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
                    <input value={source.styleNotes} onChange={(event) => updateSource(source.id, { styleNotes: event.target.value })} placeholder="staccato anlatım, zor soru, tablo dili..." className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
                  </div>

                  <textarea value={source.rawText} onChange={(event) => updateSource(source.id, { rawText: event.target.value })} rows={5} placeholder="Kaynak metni, transcript veya notlar" className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-zinc-500" />

                  <label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/[0.05]">
                    <span>{source.file ? `${source.file.name} seçildi` : "PDF veya doküman yükle"}</span>
                    <input type="file" accept=".pdf,.txt,.md,.doc,.docx" className="hidden" onChange={(event) => updateSource(source.id, { file: event.target.files?.[0] ?? null })} />
                    <span className="rounded-xl border border-white/10 px-3 py-1 text-xs">Dosya seç</span>
                  </label>
                </div>
              );
            })}
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-xs leading-6 text-zinc-500">Video kaynaklarında transcript veya açıklama eklersen kalite artar. Web/PDF kaynaklarında URL veya dosya yeterlidir.</p>
            <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#fff3c2,#d4a843)] px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">
              <Sparkles size={15} />
              {isPending ? "Üretiliyor..." : "İçerik üret"}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">All Generated Content</p>
            <div className="mt-4 space-y-3">
              {recentRuns.length ? recentRuns.map((run) => (
                <div key={run.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{run.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">{run.itemType} · {run.itemCount} item · {run.outputFormat}</p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-amber-200">
                          {run.distributionTarget ? `Dağıtım: ${run.distributionTarget}` : "Dağıtım: manuel inceleme gerekli"}
                        </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${run.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-300" : run.status === "FAILED" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}>{run.status}</span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-zinc-400">{run.summary ?? "Henüz özet yok."}</p>
                  {run.generatedPreview ? <p className="mt-3 text-xs leading-6 text-zinc-500">{run.generatedPreview}</p> : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-600">
                    <span>{new Date(run.createdAt).toLocaleString("tr-TR")}</span>
                    <span>· {run.sourceCount} kaynak</span>
                    <span className={`rounded-full px-2 py-1 normal-case tracking-normal ${run.isPublished ? "bg-emerald-500/15 text-emerald-300" : run.isApproved ? "bg-blue-500/15 text-blue-300" : "bg-zinc-500/15 text-zinc-400"}`}>
                      {run.isPublished ? "Yayında" : run.isApproved ? "Onaylandı" : "Taslak"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!run.isPublished ? (
                      <button
                        type="button"
                        disabled={runActionId === run.id || run.status !== "COMPLETED"}
                        onClick={() => handleRunAction(run.id, "approve")}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 size={13} />
                        {runActionId === run.id ? "İşleniyor..." : "Onayla ve yayınla"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={runActionId === run.id}
                        onClick={() => handleRunAction(run.id, "unpublish")}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Upload size={13} />
                        {runActionId === run.id ? "İşleniyor..." : "Yayından kaldır"}
                      </button>
                    )}
                  </div>
                </div>
              )) : <p className="text-sm text-zinc-500">Henüz üretim geçmişi yok.</p>}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Source Bank</p>
            <div className="mt-4 space-y-3">
              {recentSources.length ? recentSources.map((source) => {
                const Icon = sourceIcon(source.sourceType);
                return (
                  <div key={source.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.05] text-zinc-300">
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{source.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-600">{source.sourceType} {source.mimeType ? `· ${source.mimeType}` : ""}</p>
                        <p className="mt-2 text-xs leading-6 text-zinc-400">{source.excerpt}</p>
                        {source.tags.length ? <p className="mt-2 text-[11px] text-amber-200">{source.tags.join(" · ")}</p> : null}
                      </div>
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-zinc-500">Henüz kayıtlı kaynak yok.</p>}
            </div>
          </div>
        </div>
      </div>

      {result ? (
        <div className="rounded-[30px] border border-emerald-500/20 bg-[linear-gradient(180deg,rgba(13,28,24,0.96),rgba(10,17,15,0.96))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Latest Output</p>
              <h3 className="mt-2 text-xl font-black text-white">{result.run.title}</h3>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">Model</p>
              <p className="mt-1 text-sm font-semibold text-white">{result.model}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">Stil Analizi</p>
              <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-zinc-300">{result.styleAnalysis}</pre>
            </div>
            <div className="space-y-3">
              {result.generatedItems.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{index + 1}. {item.title}</p>
                    <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-zinc-300">{item.difficulty}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-200">{item.content}</p>
                  <p className="mt-3 text-xs text-amber-200">İlham: {item.sourceInspiration}</p>
                  {item.tags.length ? <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">{item.tags.join(" · ")}</p> : null}
                  {item.answerKey ? <p className="mt-3 text-xs text-emerald-300">Answer Key: {item.answerKey}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}