import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/src/lib/prisma";

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
  try {
    const now = new Date();
    const userId = await getUserId(req);
    const [liveClasses, activeLiveClassSubscription, purchases] = await Promise.all([
      prisma.liveClass.findMany({
        where: {
          scheduledAt: { gte: now },
        },
        orderBy: { scheduledAt: "asc" },
        take: 20,
        select: {
          id: true,
          title: true,
          description: true,
          topicOutline: true,
          meetingLink: true,
          scheduledAt: true,
          singlePrice: true,
          durationMinutes: true,
        },
      }),
      userId
        ? prisma.subscription.findFirst({
            where: {
              userId,
              status: { in: ["ACTIVE", "TRIALING"] },
              startDate: { lte: now },
              OR: [{ endDate: null }, { endDate: { gte: now } }],
              plan: { includesLiveClass: true },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      userId
        ? prisma.liveClassPurchase.findMany({
            where: { userId, status: "PAID" },
            select: { liveClassId: true },
          })
        : Promise.resolve([]),
    ]);

    const purchasedClassIds = new Set(purchases.map((item) => item.liveClassId));
    const hasPlanAccess = Boolean(activeLiveClassSubscription);

    return NextResponse.json(
      liveClasses.map((cls) => ({
        id: cls.id,
        title: cls.title,
        description: cls.description,
        topic: cls.topicOutline,
        zoomLink: hasPlanAccess || purchasedClassIds.has(cls.id) ? cls.meetingLink : null,
        joinUrl: hasPlanAccess || purchasedClassIds.has(cls.id) ? cls.meetingLink : null,
        scheduledAt: cls.scheduledAt,
        price: cls.singlePrice,
        duration: cls.durationMinutes,
        hasAccess: hasPlanAccess || purchasedClassIds.has(cls.id),
        isIncludedInPlan: hasPlanAccess,
        isPurchased: purchasedClassIds.has(cls.id),
        canJoin: Boolean((hasPlanAccess || purchasedClassIds.has(cls.id)) && cls.meetingLink),
        canPurchase: !hasPlanAccess && !purchasedClassIds.has(cls.id) && (cls.singlePrice ?? 0) > 0,
        accessMode: hasPlanAccess
          ? "plan"
          : purchasedClassIds.has(cls.id)
            ? "purchase"
            : (cls.singlePrice ?? 0) > 0
              ? "purchase-available"
              : "members-only",
        statusLabel: hasPlanAccess
          ? "Uyelikte dahil"
          : purchasedClassIds.has(cls.id)
            ? "Satin alindi"
            : (cls.singlePrice ?? 0) > 0
              ? "Tek ders satin alim"
              : "Sadece uyelik",
        meetingStatus: hasPlanAccess || purchasedClassIds.has(cls.id)
          ? cls.meetingLink
            ? "Baglanti hazir. Derse dogrudan katilabilirsin."
            : "Baglanti ders saatine yakin aktif edilir."
          : (cls.singlePrice ?? 0) > 0
            ? "Erisim icin bu dersi satin alabilir veya canli ders paketine gecebilirsin."
            : "Bu oturum canli ders plani olan ogrenciler icin acik.",
      }))
    );
  } catch (err) {
    console.error("[live-classes] error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
