import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/src/lib/prisma";

function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, await getJwtSecret());
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING"] },
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      user,
      activeSubscription: activeSubscription
        ? {
            plan: activeSubscription.plan,
            expiresAt: activeSubscription.endDate?.toISOString() ?? null,
          }
        : null,
      stats: null, // İleride eklenebilir
    });
  } catch (err) {
    console.error("[dashboard] error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
