import type { AiChatResult, AiProvider, InternalChatRequest } from "../types";

// Google Gemini API (REST v1beta)
// POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}
// Body: { systemInstruction, contents, generationConfig }

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const RETRYABLE_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function computeBackoffMs(attempt: number) {
  const base = 200 * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 200);
  return Math.min(2_500, base + jitter);
}

export class GeminiProvider implements AiProvider {
  readonly name = "gemini" as const;

  private get apiKey() {
    return process.env.GEMINI_API_KEY ?? "";
  }

  private get model() {
    return process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  }

  isAvailable() {
    return Boolean(this.apiKey);
  }

  async complete(req: InternalChatRequest): Promise<AiChatResult> {
    const { traceId, startedAt, maxRetries, timeoutMs } = req;

    if (!this.apiKey) {
      return {
        ok: false,
        model: this.model,
        traceId,
        providerAvailable: false,
        latencyMs: Math.max(0, Date.now() - startedAt),
        attempts: 0,
        rawText: null,
        statusCode: null,
        errorType: "no_api_key",
      };
    }

    let attempts = 0;
    const url = `${GEMINI_BASE_URL}/${this.model}:generateContent?key=${this.apiKey}`;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        await sleep(computeBackoffMs(attempt));
      }

      attempts += 1;

      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

      let response: Response;
      try {
        const body: Record<string, unknown> = {
          systemInstruction: {
            parts: [{ text: req.systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: req.userPrompt }],
            },
          ],
          generationConfig: {
            temperature: req.temperature ?? 0.4,
            ...(req.responseFormat === "json_object"
              ? { responseMimeType: "application/json" }
              : {}),
          },
        };

        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: timeoutController.signal,
        });
      } catch (error) {
        clearTimeout(timeoutId);
        const isTimeout =
          error instanceof Error &&
          (error.name === "AbortError" || error.message.toLowerCase().includes("abort"));

        if (isTimeout) {
          return {
            ok: false,
            model: this.model,
            traceId,
            providerAvailable: true,
            latencyMs: Math.max(0, Date.now() - startedAt),
            attempts,
            rawText: null,
            statusCode: null,
            errorType: "timeout",
          };
        }

        if (attempt < maxRetries) continue;

        return {
          ok: false,
          model: this.model,
          traceId,
          providerAvailable: true,
          latencyMs: Math.max(0, Date.now() - startedAt),
          attempts,
          rawText: null,
          statusCode: null,
          errorType: "network",
        };
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        if (RETRYABLE_HTTP_STATUSES.has(response.status) && attempt < maxRetries) {
          continue;
        }
        return {
          ok: false,
          model: this.model,
          traceId,
          providerAvailable: true,
          latencyMs: Math.max(0, Date.now() - startedAt),
          attempts,
          rawText: null,
          statusCode: response.status,
          errorType: "http",
        };
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        if (attempt < maxRetries) continue;
        return {
          ok: false,
          model: this.model,
          traceId,
          providerAvailable: true,
          latencyMs: Math.max(0, Date.now() - startedAt),
          attempts,
          rawText: null,
          statusCode: response.status,
          errorType: "http",
        };
      }

      // Gemini response shape:
      // { candidates: [{ content: { parts: [{ text: "..." }] } }], modelVersion: "..." }
      const typed = json as {
        modelVersion?: string;
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const responseModel = typeof typed?.modelVersion === "string" ? typed.modelVersion : this.model;
      const rawText =
        typed?.candidates?.[0]?.content?.parts?.find((p) => typeof p.text === "string")?.text ?? null;

      return {
        ok: true,
        model: responseModel,
        traceId,
        providerAvailable: true,
        latencyMs: Math.max(0, Date.now() - startedAt),
        attempts,
        rawText: typeof rawText === "string" ? rawText : null,
        statusCode: response.status,
      };
    }

    return {
      ok: false,
      model: this.model,
      traceId,
      providerAvailable: true,
      latencyMs: Math.max(0, Date.now() - startedAt),
      attempts,
      rawText: null,
      statusCode: null,
      errorType: "http",
    };
  }
}
