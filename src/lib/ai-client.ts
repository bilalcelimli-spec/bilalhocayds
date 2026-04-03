// Backward-compatibility re-export.
// Implementation moved to @/src/lib/ai/client.ts (multi-provider layer).

export type { AiChatResult } from "./ai/types";
export { callAiChatCompletion, extractJsonTextFromContent } from "./ai/client";