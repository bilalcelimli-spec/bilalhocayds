export type AiEnvelopeStatus = "ok" | "fallback";

export type AiEnvelopeMeta = {
  model: string | null;
  providerAvailable: boolean | null;
  traceId: string | null;
  latencyMs: number | null;
  attempts: number | null;
  usedFallback: boolean;
  fallbackReason: string | null;
  errorType: string | null;
  qualityScore?: number | null;
  qualityChecks?: string[] | null;
};

export function buildAiApiResponse<TData>(input: {
  data: TData;
  ai: AiEnvelopeMeta;
}) {
  return {
    status: input.ai.usedFallback ? ("fallback" as const) : ("ok" as const),
    data: input.data,
    ai: input.ai,
  };
}

export function inferFallbackReasonFromModel(model: string | null | undefined) {
  if (!model) {
    return "unknown_model";
  }

  return model.includes("local") ? "provider_unavailable_or_rewrite_failed" : null;
}