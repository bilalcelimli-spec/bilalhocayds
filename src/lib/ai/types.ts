export type AiResponseFormat = "json_object" | "text";

export type AiChatRequest = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
  responseFormat?: AiResponseFormat;
};

export type AiChatResultBase = {
  model: string;
  traceId: string;
  providerAvailable: boolean;
  latencyMs: number;
  attempts: number;
};

export type AiErrorType = "no_api_key" | "timeout" | "network" | "http";

export type AiChatSuccess = AiChatResultBase & {
  ok: true;
  rawText: string | null;
  statusCode: number;
};

export type AiChatFailure = AiChatResultBase & {
  ok: false;
  rawText: null;
  statusCode: number | null;
  errorType: AiErrorType;
};

export type AiChatResult = AiChatSuccess | AiChatFailure;

export type AiProviderName = "openai" | "anthropic" | "gemini";

export type InternalChatRequest = AiChatRequest & {
  traceId: string;
  startedAt: number;
  maxRetries: number;
  timeoutMs: number;
};

export interface AiProvider {
  readonly name: AiProviderName;
  isAvailable(): boolean;
  complete(request: InternalChatRequest): Promise<AiChatResult>;
}
