import { z } from "zod";

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
};

function extractJsonText(rawContent: unknown) {
  if (typeof rawContent !== "string") {
    return null;
  }

  const trimmed = rawContent.trim();
  if (!trimmed) {
    return null;
  }

  const jsonMatch = trimmed.match(/\{[\s\S]*\}$/);
  return jsonMatch?.[0] ?? trimmed;
}

export async function callAiJson<TSchema extends z.ZodTypeAny>(
  input: AiJsonRequest<TSchema>,
): Promise<AiJsonResponse<TSchema>> {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  if (!apiKey) {
    return {
      data: null,
      rawText: null,
      model,
      providerAvailable: false,
    };
  }

  const baseUrl = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: input.temperature ?? 0.2,
        response_format: {
          type: "json_object",
        },
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        data: null,
        rawText: null,
        model,
        providerAvailable: true,
      };
    }

    const json = await response.json();
    const rawText = extractJsonText(json?.choices?.[0]?.message?.content);

    if (!rawText) {
      return {
        data: null,
        rawText: null,
        model,
        providerAvailable: true,
      };
    }

    const parsed = input.schema.safeParse(JSON.parse(rawText));

    return {
      data: parsed.success ? parsed.data : null,
      rawText,
      model,
      providerAvailable: true,
    };
  } catch {
    return {
      data: null,
      rawText: null,
      model,
      providerAvailable: true,
    };
  }
}