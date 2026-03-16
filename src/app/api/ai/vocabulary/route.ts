import { getDailyVocabulary } from "@/src/lib/ai-content";

export async function GET() {
  const data = await getDailyVocabulary();
  return Response.json(data);
}