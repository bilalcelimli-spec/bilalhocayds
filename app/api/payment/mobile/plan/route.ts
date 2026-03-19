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
  planId: z.string().min(1),
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

  const { planId, fullName, phone } = body.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { id: true, name: true, monthlyPrice: true, isActive: true },
  });

  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Plan bulunamadı." }, { status: 404 });
  }

  if (!plan.monthlyPrice || plan.monthlyPrice <= 0) {
    return NextResponse.json({ error: "Bu plan için fiyat bilgisi yok." }, { status: 400 });
  }

  const normalizedPhone = phone.replace(/\D/g, "");
  const userIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  const referenceId = `mplan${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

  const result = await paytrCheckout({
    planName: plan.name,
    amount: plan.monthlyPrice,
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
