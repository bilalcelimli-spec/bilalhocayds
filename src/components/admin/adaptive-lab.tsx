"use client";

import { useState, useTransition } from "react";
import { BarChart3, BrainCircuit, FileJson, Gauge, PenTool, Route, Sparkles, type LucideIcon } from "lucide-react";

type AdaptiveAttemptPreview = {
  id: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  correctCount: number;
  incorrectCount: number;
  blankCount: number;
  netScore: number | null;
  accuracyPercentage: number | null;
  durationSecondsUsed: number | null;
  exam: { id: string; title: string; slug: string; examType: string };
  student: { id: string; name: string | null; email: string };
  currentLevel: string;
  currentConfidence: number;
  topicTheme: string;
  skillType: string;
  questionCount: number;
};

type AuditPreview = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorName: string;
  actorEmail: string;
  createdAt: string;
  metadataJson: unknown;
};

type LabProps = {
  summary: {
    totalAdaptiveAttempts: number;
    completedAdaptiveAttempts: number;
    inProgressAdaptiveAttempts: number;
    averageAccuracy: number;
    averageQuestionCount: number;
    auditEventCount: number;
  };
  levelDistribution: Array<{ level: string; count: number }>;
  recentAdaptiveAttempts: AdaptiveAttemptPreview[];
  recentAuditLogs: AuditPreview[];
};

type JsonResult = Record<string, unknown> | null;

type AiEnvelopeResponse = {
  status?: "ok" | "fallback";
  data?: Record<string, unknown>;
  ai?: {
    usedFallback?: boolean;
    fallbackReason?: string | null;
    qualityScore?: number | null;
    qualityChecks?: string[] | null;
    latencyMs?: number | null;
    attempts?: number | null;
  };
};

type ResultWithMeta = Record<string, unknown> & {
  _meta?: {
    status?: "ok" | "fallback" | null;
    ai?: AiEnvelopeResponse["ai"] | null;
  };
};

const questionDefaults = {
  skillType: "GRAMMAR",
  targetCefr: "B1",
  topicTheme: "technology",
  examContext: "YDS",
  studentLocale: "tr-TR",
  explanationLanguage: "tr",
  questionFormat: "sentence_completion",
};

const routerDefaults = {
  itemsAnsweredCount: 5,
  elapsedMinutes: 14,
  maxMinutes: 45,
  currentEstimatedLevel: "B1",
  recentHistory: [
    { itemCefr: "B1", correct: true, responseTimeSeconds: 52, discriminationHint: "medium" },
    { itemCefr: "B1", correct: true, responseTimeSeconds: 49, discriminationHint: "high" },
    { itemCefr: "B2", correct: false, responseTimeSeconds: 91, discriminationHint: "high" },
  ],
  levelConfidenceScore: 0.66,
  stopRules: {
    minItemsBeforeStop: 6,
    targetConfidenceToStop: 0.84,
    maxConsecutiveCorrectForLevelUp: 3,
    maxConsecutiveWrongForLevelDown: 2,
    maxQuestions: 18,
  },
};

const writingDefaults = {
  promptText: "Do the advantages of online learning outweigh the disadvantages?",
  studentAnswer: "Online learning has many benefits for students because it is flexible and cheap. However, some students feel lonely and they lose focus. In my opinion, the advantages are bigger if students have a good study plan and enough teacher support.",
  targetExam: "IELTS",
  expectedCefrBand: "B2",
  feedbackLanguage: "tr",
};

const summaryCards: Array<{ label: string; value: (summary: LabProps["summary"]) => string; Icon: LucideIcon }> = [
  { label: "Adaptive Attempt", value: (summary) => String(summary.totalAdaptiveAttempts), Icon: BrainCircuit },
  { label: "Tamamlanan", value: (summary) => String(summary.completedAdaptiveAttempts), Icon: Gauge },
  { label: "Aktif", value: (summary) => String(summary.inProgressAdaptiveAttempts), Icon: Route },
  { label: "Ortalama Accuracy", value: (summary) => `%${summary.averageAccuracy}`, Icon: BarChart3 },
  { label: "Ortalama Soru", value: (summary) => String(summary.averageQuestionCount), Icon: FileJson },
  { label: "Audit Event", value: (summary) => String(summary.auditEventCount), Icon: Sparkles },
];

export function AdaptiveLab({ summary, levelDistribution, recentAdaptiveAttempts, recentAuditLogs }: LabProps) {
  const [questionPayload, setQuestionPayload] = useState(JSON.stringify(questionDefaults, null, 2));
  const [routerPayload, setRouterPayload] = useState(JSON.stringify(routerDefaults, null, 2));
  const [writingPayload, setWritingPayload] = useState(JSON.stringify(writingDefaults, null, 2));
  const [questionResult, setQuestionResult] = useState<JsonResult>(null);
  const [routerResult, setRouterResult] = useState<JsonResult>(null);
  const [writingResult, setWritingResult] = useState<JsonResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runRequest(endpoint: string, body: string, setter: (value: JsonResult) => void) {
    setError(null);

    startTransition(async () => {
      try {
        const parsed = JSON.parse(body) as Record<string, unknown>;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });

        const json = await response.json();
        if (!response.ok) {
          setError(json?.error ?? "İstek başarısız oldu.");
          return;
        }

        const envelope = json as AiEnvelopeResponse;
        if (envelope && typeof envelope === "object" && envelope.data && typeof envelope.data === "object") {
          setter({
            ...(envelope.data as Record<string, unknown>),
            _meta: {
              status: envelope.status ?? null,
              ai: envelope.ai ?? null,
            },
          });
          return;
        }

        setter(json as JsonResult);
      } catch {
        setError("Payload geçerli JSON olmalı.");
      }
    });
  }

  function renderMeta(result: JsonResult) {
    const meta = (result as ResultWithMeta | null)?._meta;
    if (!meta?.ai) return null;

    const quality = typeof meta.ai.qualityScore === "number" ? Math.round(meta.ai.qualityScore * 100) : null;

    return (
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">AI Meta</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-semibold ${meta.ai.usedFallback ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}`}>
            {meta.ai.usedFallback ? "Fallback" : "AI Live"}
          </span>
          {quality != null ? (
            <span className={`rounded-full px-2.5 py-1 font-semibold ${quality >= 80 ? "bg-emerald-500/15 text-emerald-300" : quality >= 60 ? "bg-amber-500/15 text-amber-300" : "bg-red-500/15 text-red-300"}`}>
              Kalite {quality}/100
            </span>
          ) : null}
          {typeof meta.ai.attempts === "number" ? (
            <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 font-semibold text-cyan-300">{meta.ai.attempts} deneme</span>
          ) : null}
          {typeof meta.ai.latencyMs === "number" ? (
            <span className="rounded-full bg-blue-500/15 px-2.5 py-1 font-semibold text-blue-300">{meta.ai.latencyMs} ms</span>
          ) : null}
        </div>
        {meta.ai.fallbackReason ? (
          <p className="mt-2 text-xs text-amber-300">Fallback nedeni: <span className="font-semibold">{meta.ai.fallbackReason}</span></p>
        ) : null}
        {Array.isArray(meta.ai.qualityChecks) && meta.ai.qualityChecks.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {meta.ai.qualityChecks.map((check) => (
              <span key={check} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300">
                {check}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {summaryCards.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
              <Icon size={16} className="text-emerald-300" />
            </div>
            <p className="mt-4 text-3xl font-black text-white">{value(summary)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-3">
              <FileJson size={18} className="text-cyan-300" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Question Playground</p>
                <h2 className="mt-1 text-xl font-black text-white">Adaptive soru üretimini dene</h2>
              </div>
            </div>
            <textarea value={questionPayload} onChange={(event) => setQuestionPayload(event.target.value)} rows={14} className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-xs leading-6 text-white outline-none" />
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-xs text-zinc-500">Schema valid payload gönder, servis hem generation hem validation sonucunu döndürür.</p>
              <button type="button" disabled={isPending} onClick={() => runRequest("/api/ai/adaptive/question", questionPayload, setQuestionResult)} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60">
                Soru üret
              </button>
            </div>
            {questionResult ? (
              <>
                {renderMeta(questionResult)}
                <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-zinc-200">{JSON.stringify(questionResult, null, 2)}</pre>
              </>
            ) : null}
          </section>

          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-3">
              <Route size={18} className="text-amber-300" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Router Playground</p>
                <h2 className="mt-1 text-xl font-black text-white">Adaptive karar motorunu dene</h2>
              </div>
            </div>
            <textarea value={routerPayload} onChange={(event) => setRouterPayload(event.target.value)} rows={16} className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-xs leading-6 text-white outline-none" />
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-xs text-zinc-500">Sonuçta `nextAction`, önerilen seviye ve confidence açıklaması gelir.</p>
              <button type="button" disabled={isPending} onClick={() => runRequest("/api/ai/adaptive/router", routerPayload, setRouterResult)} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60">
                Karar üret
              </button>
            </div>
            {routerResult ? (
              <>
                {renderMeta(routerResult)}
                <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-zinc-200">{JSON.stringify(routerResult, null, 2)}</pre>
              </>
            ) : null}
          </section>

          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-3">
              <PenTool size={18} className="text-emerald-300" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Writing Playground</p>
                <h2 className="mt-1 text-xl font-black text-white">Writing evaluator sonucunu dene</h2>
              </div>
            </div>
            <textarea value={writingPayload} onChange={(event) => setWritingPayload(event.target.value)} rows={14} className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-xs leading-6 text-white outline-none" />
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-xs text-zinc-500">Prompt, öğrenci cevabı ve hedef CEFR ile rubric bazlı JSON döner.</p>
              <button type="button" disabled={isPending} onClick={() => runRequest("/api/ai/adaptive/writing", writingPayload, setWritingResult)} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60">
                Writing değerlendir
              </button>
            </div>
            {writingResult ? (
              <>
                {renderMeta(writingResult)}
                <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-zinc-200">{JSON.stringify(writingResult, null, 2)}</pre>
              </>
            ) : null}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Level Distribution</p>
            <div className="mt-4 space-y-3">
              {levelDistribution.map((item) => {
                const max = Math.max(...levelDistribution.map((entry) => entry.count), 1);
                return (
                  <div key={item.level}>
                    <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                      <span>{item.level}</span>
                      <span className="font-semibold text-white">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.round((item.count / max) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Recent Adaptive Attempts</p>
            <div className="mt-4 space-y-3">
              {recentAdaptiveAttempts.length > 0 ? recentAdaptiveAttempts.map((attempt) => (
                <div key={attempt.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{attempt.exam.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{attempt.student.name ?? attempt.student.email} · {attempt.skillType} · {attempt.topicTheme}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${attempt.status === "IN_PROGRESS" ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}`}>{attempt.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                    <span>Level {attempt.currentLevel}</span>
                    <span>Confidence %{Math.round(attempt.currentConfidence * 100)}</span>
                    <span>{attempt.questionCount} soru</span>
                    <span>Accuracy %{Math.round(attempt.accuracyPercentage ?? 0)}</span>
                  </div>
                </div>
              )) : <p className="text-sm text-zinc-500">Henüz adaptive attempt yok.</p>}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Audit Stream</p>
            <div className="mt-4 space-y-3">
              {recentAuditLogs.length > 0 ? recentAuditLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{log.action}</p>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{new Date(log.createdAt).toLocaleString("tr-TR")}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{log.targetType} · {log.actorName}</p>
                </div>
              )) : <p className="text-sm text-zinc-500">Henüz audit kaydı yok.</p>}
            </div>
          </section>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
    </div>
  );
}