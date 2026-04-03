type AiResponseFormat = "json_object" | "text";

type AiChatRequest = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
  responseFormat?: AiResponseFormat;
};

type AiChatResultBase = {
  model: string;
  traceId: string;
  providerAvailable: boolean;
  latencyMs: number;
  attempts: number;
};

type AiChatSuccess = AiChatResultBase & {
  ok: true;
  rawText: string | null;
  statusCode: number;
};

type AiErrorType = "no_api_key" | "timeout" | "network" | "http";

type AiChatFailure = AiChatResultBase & {
  ok: false;
  rawText: null;
  statusCode: number | null;
  errorType: AiErrorType;
};

export type AiChatResult = AiChatSuccess | AiChatFailure;

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RETRY_COUNT = 2;
const RETRYABLE_HTTP_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function createTraceId() {
  return `ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getConfiguredModel() {
  return process.env.AI_MODEL ?? "gpt-4o-mini";
}

function getConfiguredBaseUrl() {
  return process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
}

function getConfiguredTimeoutMs(requested?: number) {
  if (typeof requested === "number" && Number.isFinite(requested) && requested > 0) {
    return requested;
  }

  const envTimeout = Number(process.env.AI_TIMEOUT_MS ?? "");
  if (Number.isFinite(envTimeout) && envTimeout > 0) {
    return envTimeout;
  }

  return DEFAULT_TIMEOUT_MS;
}

function getConfiguredRetryCount(requested?: number) {
  if (typeof requested === "number" && Number.isFinite(requested) && requested >= 0) {
    return Math.floor(requested);
  }

  const envRetry = Number(process.env.AI_MAX_RETRIES ?? "");
  if (Number.isFinite(envRetry) && envRetry >= 0) {
    return Math.floor(envRetry);
  }

  return DEFAULT_RETRY_COUNT;
}

function toLatency(startedAt: number) {
  return Math.max(0, Date.now() - startedAt);
}

function isRetryableStatus(status: number) {
  return RETRYABLE_HTTP_STATUSES.has(status);
}

function computeBackoffMs(attempt: number) {
  const base = 200 * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 200);
  return Math.min(2_500, base + jitter);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function combineSignals(signals: AbortSignal[]) {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }

    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }

  return controller.signal;
}

export function extractJsonTextFromContent(rawContent: unknown) {
  if (typeof rawContent !== "string") {
    return null;
  }

  const trimmed = rawContent.trim();
  if (!trimmed) {
    return null;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const jsonObjectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch?.[0]) {
    return jsonObjectMatch[0].trim();
  }

  const jsonArrayMatch = trimmed.match(/\[[\s\S]*\]/);
  if (jsonArrayMatch?.[0]) {
    return jsonArrayMatch[0].trim();
  }

  return trimmed;
}

export async function callAiChatCompletion(input: AiChatRequest): Promise<AiChatResult> {
  const apiKey = process.env.AI_API_KEY;
  const model = getConfiguredModel();
  const traceId = createTraceId();
  const startedAt = Date.now();

  if (!apiKey) {
    return {
      ok: false,
      rawText: null,
      model,
      traceId,
      providerAvailable: false,
      latencyMs: toLatency(startedAt),
      attempts: 0,
      statusCode: null,
      errorType: "no_api_key",
    };
  }

  const baseUrl = getConfiguredBaseUrl();
  const timeoutMs = getConfiguredTimeoutMs(input.timeoutMs);
  const maxRetries = getConfiguredRetryCount(input.maxRetries);
  const temperature = input.temperature ?? 0.2;
  const responseFormat = input.responseFormat ?? "text";

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort("timeout"), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "x-trace-id": traceId,
        },
        body: JSON.stringify({
          model,
          temperature,
          ...(responseFormat === "json_object"
            ? {
                response_format: {
                  type: "json_object",
                },
              }
            : {}),
          messages: [
            { role: "system", content: input.systemPrompt },
            { role: "user", content: input.userPrompt },
          ],
        }),
        cache: "no-store",
        signal: combineSignals([timeoutController.signal]),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (attempt <= maxRetries && isRetryableStatus(response.status)) {
          await sleep(computeBackoffMs(attempt));
          continue;
        }

        return {
          ok: false,
          rawText: null,
          model,
          traceId,
          providerAvailable: true,
          latencyMs: toLatency(startedAt),
          attempts: attempt,
          statusCode: response.status,
          errorType: "http",
        };
      }

      const json = await response.json();
      const rawText = typeof json?.choices?.[0]?.message?.content === "string" ? json.choices[0].message.content : null;

      return {
        ok: true,
        rawText,
        model,
        traceId,
        providerAvailable: true,
        latencyMs: toLatency(startedAt),
        attempts: attempt,
        statusCode: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      const isTimeout = error instanceof Error && error.name === "AbortError";
      const errorType: AiErrorType = isTimeout ? "timeout" : "network";

      if (attempt <= maxRetries) {
        await sleep(computeBackoffMs(attempt));
        continue;
      }

      return {
        ok: false,
        rawText: null,
        model,
        traceId,
        providerAvailable: true,
        latencyMs: toLatency(startedAt),
        attempts: attempt,
        statusCode: null,
        errorType,
      };
    }
  }

  return {
    ok: false,
    rawText: null,
    model,
    traceId,
    providerAvailable: true,
    latencyMs: toLatency(startedAt),
    attempts: maxRetries + 1,
    statusCode: null,
    errorType: "network",
  };
}