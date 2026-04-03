import type { AiChatResult, AiProvider, InternalChatRequest } from "../types";

// Anthropic Messages API: https://docs.anthropic.com/en/api/messages
// POST https://api.anthropic.com/v1/messages
// Required headers: x-api-key, anthropic-version, content-type
// Max tokens default: 4096

const ANTHROPIC_API_VERSION = "2023-06-01";
const DEFAULT_MAX_TOKENS = 4096;
const RETRYABLE_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function computeBackoffMs(attempt: number) {
  const base = 200 * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 200);
  return Math.min(2_500, base + jitter);
}

export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic" as const;

  private get apiKey() {
    return process.env.ANTHROPIC_API_KEY ?? "";
  }

  private get model() {
    return process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
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
          max_tokens: DEFAULT_MAX_TOKENS,
          system: req.systemPrompt,
          messages: [{ role: "user", content: req.userPrompt }],
          temperature: req.temperature ?? 0.4,
        };

        // Anthropic does not support response_format natively;
        // we hint via system prompt in the client layer.

        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
            "anthropic-version": ANTHROPIC_API_VERSION,
          },
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

      // Anthropic response shape: { content: [{ type: "text", text: "..." }], model: "..." }
      const typed = json as {
        model?: string;
        content?: Array<{ type?: string; text?: string }>;
      };

      const responseModel = typeof typed?.model === "string" ? typed.model : this.model;
      const rawText =
        typed?.content?.find((block) => block.type === "text")?.text ?? null;

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
