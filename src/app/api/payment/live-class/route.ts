import { z } from "zod";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/src/lib/prisma";
import { paytrCheckout } from "@/lib/payment/paytr-checkout";
import { authOptions } from "@/src/auth";
import { isRateLimited, getClientIp } from "@/src/lib/rate-limit";

const bodySchema = z.object({
  liveClassId: z.string().min(1),
  fullName: z.string().min(2).max(120),
  email: z.email(),
  phone: z.string().min(10).max(20),
});

function createLivePurchaseReferenceId(liveClassId: string) {
  return `livep${liveClassId}${Date.now()}`;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(`livepay:${ip}`, 8, 60_000)) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });
  }

  const { liveClassId, fullName, email, phone } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    select: {
      id: true,
      title: true,
      singlePrice: true,
      scheduledAt: true,
    },
  });

  if (!liveClass) {
    return NextResponse.json({ error: "Ders bulunamadı." }, { status: 404 });
  }

  if (!liveClass.singlePrice || liveClass.singlePrice <= 0) {
    return NextResponse.json(
      { error: "Bu ders için tekil satın alım aktif değil." },
      { status: 400 },
    );
  }

  if (liveClass.scheduledAt <= new Date()) {
    return NextResponse.json(
      { error: "Bu ders geçmiş tarihli, satın alım yapılamaz." },
      { status: 400 },
    );
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  if (userId) {
    const activeLiveClassSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING"] },
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        plan: { includesLiveClass: true },
      },
      select: { id: true },
    });

    if (activeLiveClassSubscription) {
      return NextResponse.json(
        { error: "Canlı ders erişimin zaten aktif. Bu ders için ayrıca tekil satın alım gerekmiyor." },
        { status: 409 },
      );
    }
  }

  // Check for duplicate purchase
  const existing = await prisma.liveClassPurchase.findFirst({
    where: {
      liveClassId,
      status: "PAID",
      OR: userId ? [{ userId }, { email: normalizedEmail }] : [{ email: normalizedEmail }],
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Bu derse zaten satın alım yaptınız." },
      { status: 409 },
    );
  }

  const normalizedPhone = phone.replace(/\D/g, "");
  const referenceId = createLivePurchaseReferenceId(liveClassId);

  const purchase = await prisma.liveClassPurchase.create({
    data: {
      liveClassId,
      userId,
      amount: liveClass.singlePrice,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      referenceId,
      status: "PENDING",
    },
    select: { id: true },
  });

  try {
    const result = await paytrCheckout({
      planName: liveClass.title,
      amount: liveClass.singlePrice,
      email: normalizedEmail,
      phone: normalizedPhone,
      userName: fullName.trim(),
      userIp: ip,
      userId: userId ?? `guest:${purchase.id}`,
      referenceId,
    });

    return NextResponse.json({ payment: result });
  } catch (err) {
    // Clean up pending purchase on payment init failure
    await prisma.liveClassPurchase.delete({ where: { id: purchase.id } }).catch(() => null);
    const message = err instanceof Error ? err.message : "Ödeme başlatılamadı.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
