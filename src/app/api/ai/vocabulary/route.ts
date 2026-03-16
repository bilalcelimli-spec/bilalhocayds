import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getDailyVocabulary } from "@/src/lib/ai-content";
import { authOptions } from "@/src/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await getDailyVocabulary();
  return Response.json(data);
}