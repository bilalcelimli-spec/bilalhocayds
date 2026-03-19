import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getDailyVocabulary } from "@/src/lib/ai-content";

function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(auth.slice(7), await getJwtSecret());
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const data = await getDailyVocabulary();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[mobile/vocabulary] error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
