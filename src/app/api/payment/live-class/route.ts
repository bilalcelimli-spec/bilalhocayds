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

  // Check for duplicate purchase
  if (userId) {
    const existing = await prisma.liveClassPurchase.findFirst({
      where: { liveClassId, userId, status: "PAID" },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu derse zaten satın alım yaptınız." },
        { status: 409 },
      );
    }
  }

  const normalizedPhone = phone.replace(/\D/g, "");
  const referenceId = `livep:${liveClassId}:${Date.now()}`;

  const purchase = await prisma.liveClassPurchase.create({
    data: {
      liveClassId,
      userId,
      amount: liveClass.singlePrice,
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: normalizedPhone,
      referenceId,
      status: "PENDING",
    },
    select: { id: true },
  });

  try {
    const result = await paytrCheckout({
      planName: liveClass.title,
      amount: Math.round(liveClass.singlePrice * 100),
      email: email.toLowerCase().trim(),
      phone: normalizedPhone,
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
