import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getDailyGrammarModule } from "@/src/lib/ai-content";
import { authOptions } from "@/src/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await getDailyGrammarModule();
  return Response.json(data);
}