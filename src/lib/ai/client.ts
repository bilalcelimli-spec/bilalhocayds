import type { AiChatRequest, AiChatResult, AiProvider, AiProviderName, InternalChatRequest } from "./types";
import { OpenAiProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { GeminiProvider } from "./providers/gemini";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RETRY_COUNT = 2;

// ─── Provider registry ───────────────────────────────────────────────────────

const PROVIDERS: Record<AiProviderName, AiProvider> = {
  openai: new OpenAiProvider(),
  anthropic: new AnthropicProvider(),
  gemini: new GeminiProvider(),
};

/**
 * Returns the ordered list of providers to try.
 *
 * Reads `AI_PROVIDERS` env var (comma-separated list, e.g. "anthropic,openai,gemini").
 * Falls back to `AI_PROVIDER` (single value) for backward compat.
 * If neither is set, auto-detects based on available API keys in order:
 *   openai → anthropic → gemini
 */
function resolveProviderChain(): AiProvider[] {
  const multiEnv = process.env.AI_PROVIDERS ?? "";
  if (multiEnv.trim()) {
    return multiEnv
      .split(",")
      .map((s) => s.trim().toLowerCase() as AiProviderName)
      .filter((name): name is AiProviderName => name in PROVIDERS)
      .map((name) => PROVIDERS[name]);
  }

  const singleEnv = process.env.AI_PROVIDER ?? "";
  if (singleEnv.trim()) {
    const name = singleEnv.trim().toLowerCase() as AiProviderName;
    const provider = PROVIDERS[name];
    return provider ? [provider] : [];
  }

  // Auto-detect: return all providers that have an API key configured.
  return (["openai", "anthropic", "gemini"] as AiProviderName[])
    .map((name) => PROVIDERS[name])
    .filter((p) => p.isAvailable());
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function createTraceId() {
  return `ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getConfiguredTimeoutMs(requested?: number): number {
  if (typeof requested === "number" && Number.isFinite(requested) && requested > 0) {
    return requested;
  }
  const env = Number(process.env.AI_TIMEOUT_MS ?? "");
  return Number.isFinite(env) && env > 0 ? env : DEFAULT_TIMEOUT_MS;
}

function getConfiguredRetryCount(requested?: number): number {
  if (typeof requested === "number" && Number.isFinite(requested) && requested >= 0) {
    return Math.floor(requested);
  }
  const env = Number(process.env.AI_MAX_RETRIES ?? "");
  return Number.isFinite(env) && env >= 0 ? Math.floor(env) : DEFAULT_RETRY_COUNT;
}

/**
 * Hint for Anthropic / Gemini when caller requests json_object format.
 * OpenAI supports it natively via response_format; others need a prompt hint.
 */
function maybeAddJsonHint(systemPrompt: string, provider: AiProvider, responseFormat?: string) {
  if (responseFormat !== "json_object" || provider.name === "openai") {
    return systemPrompt;
  }
  return `${systemPrompt}\n\nIMPORTANT: Respond with valid JSON only. Do not include markdown fences or any text outside the JSON structure.`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Extracts a clean JSON string from arbitrary AI-generated text.
 * Handles markdown code fences, leading/trailing prose, etc.
 */
export function extractJsonTextFromContent(rawContent: unknown): string | null {
  if (typeof rawContent !== "string") return null;

  const trimmed = rawContent.trim();
  if (!trimmed) return null;

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) return fencedMatch[1].trim();

  const jsonObjectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch?.[0]) return jsonObjectMatch[0].trim();

  const jsonArrayMatch = trimmed.match(/\[[\s\S]*\]/);
  if (jsonArrayMatch?.[0]) return jsonArrayMatch[0].trim();

  return trimmed;
}

/**
 * Calls the configured AI provider(s) in order and returns the first success.
 * Tries each provider up to its configured retry count before moving to the next.
 */
export async function callAiChatCompletion(input: AiChatRequest): Promise<AiChatResult> {
  const traceId = createTraceId();
  const startedAt = Date.now();
  const timeoutMs = getConfiguredTimeoutMs(input.timeoutMs);
  const maxRetries = getConfiguredRetryCount(input.maxRetries);
  const chain = resolveProviderChain();

  // No providers available at all
  if (chain.length === 0) {
    return {
      ok: false,
      model: "unknown",
      traceId,
      providerAvailable: false,
      latencyMs: 0,
      attempts: 0,
      rawText: null,
      statusCode: null,
      errorType: "no_api_key",
    };
  }

  let lastResult: AiChatResult | null = null;

  for (const provider of chain) {
    if (!provider.isAvailable()) {
      continue;
    }

    const internalReq: InternalChatRequest = {
      ...input,
      systemPrompt: maybeAddJsonHint(input.systemPrompt, provider, input.responseFormat),
      traceId,
      startedAt,
      maxRetries,
      timeoutMs,
    };

    const result = await provider.complete(internalReq);
    lastResult = result;

    if (result.ok) {
      return result;
    }

    // Cascade to the next provider on key absence, timeout, or network error.
    // Surface HTTP errors (4xx/5xx) immediately — they usually indicate a real
    // problem that retrying with a different provider won't fix.
    const shouldCascade =
      result.errorType === "no_api_key" ||
      result.errorType === "timeout" ||
      result.errorType === "network";

    if (!shouldCascade) {
      return result;
    }

    // Try the next provider.
  }

  // All providers exhausted
  return (
    lastResult ?? {
      ok: false,
      model: "unknown",
      traceId,
      providerAvailable: false,
      latencyMs: Math.max(0, Date.now() - startedAt),
      attempts: 0,
      rawText: null,
      statusCode: null,
      errorType: "no_api_key",
    }
  );
}

export type { AiChatRequest, AiChatResult, AiProviderName };
