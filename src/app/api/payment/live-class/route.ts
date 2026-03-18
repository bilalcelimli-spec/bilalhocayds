import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/auth";
import { paytrCheckout } from "@/lib/payment/paytr-checkout";
import { prisma } from "@/src/lib/prisma";

const requestSchema = z.object({
  liveClassId: z.string().min(1),
  fullName: z.string().min(2).max(120),
  email: z.email(),
  phone: z.string().min(10).max(20),
});

const rateLimitStore = new Map<string, number[]>();

function createLivePurchaseReferenceId() {
  return `livep${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `live-pay:${ip}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 12;
  const entries = (rateLimitStore.get(key) ?? []).filter((t) => now - t < windowMs);
  entries.push(now);
  rateLimitStore.set(key, entries);
  return entries.length > maxRequests;
}

export async function POST(request: Request) {
  const rateKey = getClientKey(request);
  if (isRateLimited(rateKey)) {
    return NextResponse.json(
      { error: "Cok fazla deneme. Lutfen bir dakika sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  const payload = requestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Gecersiz istek." }, { status: 400 });
  }

  const { liveClassId, fullName, email, phone } = payload.data;

  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    select: {
      id: true,
      title: true,
      scheduledAt: true,
      singlePrice: true,
    },
  });

  if (!liveClass) {
    return NextResponse.json({ error: "Canli ders bulunamadi." }, { status: 404 });
  }

  if (!liveClass.singlePrice || liveClass.singlePrice <= 0) {
    return NextResponse.json({ error: "Bu ders icin tek ders satin alma aktif degil." }, { status: 400 });
  }

  if (liveClass.scheduledAt <= new Date()) {
    return NextResponse.json({ error: "Gecmis ders icin satin alma yapilamaz." }, { status: 400 });
  }

  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
    return NextResponse.json({ error: "Telefon numarasi gecersiz." }, { status: 400 });
  }

  const [firstName, ...rest] = fullName.trim().split(" ");
  const surname = rest.join(" ") || "-";

  await prisma.lead
    .create({
      data: {
        name: firstName,
        surname,
        email: email.toLowerCase(),
        phone: normalizedPhone,
        plan: `Tek Ders: ${liveClass.title}`,
      },
    })
    .catch(() => null);

  const session = await getServerSession(authOptions);

  const purchase = await prisma.liveClassPurchase.create({
    data: {
      liveClassId: liveClass.id,
      userId: session?.user?.id ?? null,
      amount: liveClass.singlePrice,
      fullName: fullName.trim(),
      email: email.toLowerCase(),
      phone: normalizedPhone,
      referenceId: createLivePurchaseReferenceId(),
    },
    select: { id: true, referenceId: true },
  });

  const referenceId = purchase.referenceId;
  const userIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  const payment = await paytrCheckout({
    planName: `Tek Ders - ${liveClass.title}`,
    amount: liveClass.singlePrice,
    email: email.toLowerCase(),
    phone: normalizedPhone,
    userName: fullName.trim(),
    userIp,
    userId: session?.user?.id ?? email.toLowerCase(),
    referenceId,
  });

  await prisma.liveClassPurchase
    .update({
      where: { id: purchase.id },
      data: {
        providerMessage: payment.message ?? null,
      },
    })
    .catch(() => null);

  return NextResponse.json({
    success: true,
    payment,
    liveClass: {
      id: liveClass.id,
      title: liveClass.title,
      scheduledAt: liveClass.scheduledAt,
      singlePrice: liveClass.singlePrice,
    },
    purchaseId: purchase.id,
  });
}
