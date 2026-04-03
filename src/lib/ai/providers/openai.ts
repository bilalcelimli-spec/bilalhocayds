import type { AiChatResult, AiProvider, InternalChatRequest } from "../types";

const RETRYABLE_HTTP_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function computeBackoffMs(attempt: number) {
  const base = 200 * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 200);
  return Math.min(2_500, base + jitter);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
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

export class OpenAiProvider implements AiProvider {
  readonly name = "openai" as const;

  private get apiKey() {
    return process.env.AI_API_KEY ?? "";
  }

  private get model() {
    return process.env.AI_MODEL ?? "gpt-4o-mini";
  }

  private get baseUrl() {
    return (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
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
          model: this.model,
          messages: [
            { role: "system", content: req.systemPrompt },
            { role: "user", content: req.userPrompt },
          ],
          temperature: req.temperature ?? 0.4,
        };

        if (req.responseFormat === "json_object") {
          body.response_format = { type: "json_object" };
        }

        response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
          cache: "no-store",
          signal: combineSignals([timeoutController.signal]),
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

        if (attempt < maxRetries) {
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

      const responseModel =
        typeof (json as Record<string, unknown>)?.model === "string"
          ? (json as Record<string, unknown>).model as string
          : this.model;

      const rawText: unknown =
        (json as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;

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
