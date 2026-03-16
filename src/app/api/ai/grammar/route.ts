import { getDailyGrammarModule } from "@/src/lib/ai-content";

export async function GET() {
  const data = await getDailyGrammarModule();
  return Response.json(data);
}