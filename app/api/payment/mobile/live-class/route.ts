import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { paytrCheckout } from "@/lib/payment/paytr-checkout";

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

const schema = z.object({
  liveClassId: z.string().min(1),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(10).max(20),
});

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { liveClassId, fullName, phone } = body.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    select: { id: true, title: true, scheduledAt: true, singlePrice: true },
  });

  if (!liveClass) {
    return NextResponse.json({ error: "Canlı ders bulunamadı." }, { status: 404 });
  }

  if (!liveClass.singlePrice || liveClass.singlePrice <= 0) {
    return NextResponse.json({ error: "Bu ders için tek ders satın alma aktif değil." }, { status: 400 });
  }

  if (liveClass.scheduledAt <= new Date()) {
    return NextResponse.json({ error: "Geçmiş ders için satın alma yapılamaz." }, { status: 400 });
  }

  const normalizedPhone = phone.replace(/\D/g, "");
  const userIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  const referenceId = `mlivep${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

  await prisma.liveClassPurchase.create({
    data: {
      liveClassId: liveClass.id,
      userId,
      amount: liveClass.singlePrice,
      fullName: fullName.trim(),
      email: user.email,
      phone: normalizedPhone,
      referenceId,
    },
  });

  const result = await paytrCheckout({
    planName: `Tek Ders - ${liveClass.title}`,
    amount: liveClass.singlePrice,
    email: user.email,
    phone: normalizedPhone,
    userName: fullName.trim(),
    userIp,
    userId,
    referenceId,
  });

  if (!result.success) {
    return NextResponse.json({ error: "Ödeme başlatılamadı." }, { status: 500 });
  }

  return NextResponse.json({
    checkoutUrl: result.redirectUrl,
    orderReference: result.orderReference,
  });
}
