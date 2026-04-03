import { z } from "zod";

import { callAiChatCompletion, extractJsonTextFromContent } from "@/src/lib/ai-client";

type AiJsonRequest<TSchema extends z.ZodTypeAny> = {
  schema: TSchema;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
};

type AiJsonResponse<TSchema extends z.ZodTypeAny> = {
  data: z.infer<TSchema> | null;
  rawText: string | null;
  model: string;
  providerAvailable: boolean;
  traceId: string;
  latencyMs: number;
  attempts: number;
  errorType: "no_api_key" | "timeout" | "network" | "http" | "invalid_json" | "schema_mismatch" | null;
};

export async function callAiJson<TSchema extends z.ZodTypeAny>(
  input: AiJsonRequest<TSchema>,
): Promise<AiJsonResponse<TSchema>> {
  const completion = await callAiChatCompletion({
    systemPrompt: input.systemPrompt,
    userPrompt: input.userPrompt,
    temperature: input.temperature ?? 0.2,
    responseFormat: "json_object",
  });

  if (!completion.ok) {
    return {
      data: null,
      rawText: null,
      model: completion.model,
      providerAvailable: completion.providerAvailable,
      traceId: completion.traceId,
      latencyMs: completion.latencyMs,
      attempts: completion.attempts,
      errorType: completion.errorType,
    };
  }

  const rawText = extractJsonTextFromContent(completion.rawText);
  if (!rawText) {
    return {
      data: null,
      rawText: null,
      model: completion.model,
      providerAvailable: completion.providerAvailable,
      traceId: completion.traceId,
      latencyMs: completion.latencyMs,
      attempts: completion.attempts,
      errorType: "invalid_json",
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    return {
      data: null,
      rawText,
      model: completion.model,
      providerAvailable: completion.providerAvailable,
      traceId: completion.traceId,
      latencyMs: completion.latencyMs,
      attempts: completion.attempts,
      errorType: "invalid_json",
    };
  }

  const schemaResult = input.schema.safeParse(parsedJson);
  return {
    data: schemaResult.success ? schemaResult.data : null,
    rawText,
    model: completion.model,
    providerAvailable: completion.providerAvailable,
    traceId: completion.traceId,
    latencyMs: completion.latencyMs,
    attempts: completion.attempts,
    errorType: schemaResult.success ? null : "schema_mismatch",
  };
}