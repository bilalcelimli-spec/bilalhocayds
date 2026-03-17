import crypto from "node:crypto";

import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { paytrCheckout, type PaytrCheckoutResult } from "@/lib/payment/paytr-checkout";
import { authOptions } from "@/src/auth";
import { sendWelcomeEmail } from "@/src/lib/mail";
import { prisma } from "@/src/lib/prisma";

const requestSchema = z.object({
  planId: z.string().optional(),
  planSlug: z.string().optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  fullName: z.string().min(2).max(120),
  email: z.email(),
  phone: z.string().min(10).max(20),
});

const rateLimitStore = new Map<string, number[]>();

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `paytr:${ip}`;
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
      { error: "Cok fazla odeme denemesi. Lutfen bir dakika sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { error: "Gecersiz odeme bilgisi." },
      { status: 400 },
    );
  }

  const { planId, planSlug, billingCycle, fullName, email, phone } = payload.data;

  if (!planId && !planSlug) {
    return NextResponse.json(
      { error: "Plan secimi zorunludur." },
      { status: 400 },
    );
  }

  const plan = await prisma.plan.findFirst({
    where: {
      isActive: true,
      ...(planId ? { id: planId } : {}),
      ...(planSlug ? { slug: planSlug } : {}),
    },
    select: {
      id: true,
      name: true,
      monthlyPrice: true,
      yearlyPrice: true,
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan bulunamadi." }, { status: 404 });
  }

  const amount = billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "Secilen plan icin odeme tutari tanimli degil." },
      { status: 400 },
    );
  }

  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
    return NextResponse.json(
      { error: "Telefon numarasi gecersiz." },
      { status: 400 },
    );
  }

  const [firstName, ...rest] = fullName.trim().split(" ");
  const surname = rest.join(" ") || "-";
  const leadPlan = `${plan.name} (${billingCycle === "YEARLY" ? "Yillik" : "Aylik"})`;

  await prisma.lead
    .create({
      data: {
        name: firstName,
        surname,
        email: email.toLowerCase(),
        phone: normalizedPhone,
        plan: leadPlan,
      },
    })
    .catch(() => null);

  const session = await getServerSession(authOptions);

  let referenceId = `lead:${email.toLowerCase()}`;
  if (session?.user?.id) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + (billingCycle === "YEARLY" ? 365 : 30));

    const existing = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (existing) {
      const updated = await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          planId: plan.id,
          billingCycle,
          status: "TRIALING",
          startDate: now,
          endDate,
          autoRenew: true,
        },
        select: { id: true },
      });
      referenceId = `sub:${updated.id}`;
    } else {
      const created = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          planId: plan.id,
          billingCycle,
          status: "TRIALING",
          startDate: now,
          endDate,
          autoRenew: true,
        },
        select: { id: true },
      });
      referenceId = `sub:${created.id}`;
    }
  } else {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + (billingCycle === "YEARLY" ? 365 : 30));

    const normalizedEmail = email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, password: true },
    });

    const rawPassword = crypto.randomBytes(9).toString("base64url").slice(0, 12);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const needsPassword = !existingUser?.password;

    const guestUser = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            ...(existingUser.name ? {} : { name: fullName.trim() }),
            role: "STUDENT",
            ...(needsPassword ? { password: hashedPassword } : {}),
            studentProfile: {
              upsert: {
                update: {},
                create: {},
              },
            },
          },
          select: { id: true },
        })
      : await prisma.user.create({
          data: {
            name: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "STUDENT",
            studentProfile: {
              create: {},
            },
          },
          select: { id: true },
        });

    const existing = await prisma.subscription.findFirst({
      where: {
        userId: guestUser.id,
        status: { in: ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELLED", "EXPIRED"] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (existing) {
      const updated = await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          planId: plan.id,
          billingCycle,
          status: "TRIALING",
          startDate: now,
          endDate,
          autoRenew: true,
        },
        select: { id: true },
      });
      referenceId = `sub:${updated.id}`;
    } else {
      const created = await prisma.subscription.create({
        data: {
          userId: guestUser.id,
          planId: plan.id,
          billingCycle,
          status: "TRIALING",
          startDate: now,
          endDate,
          autoRenew: true,
        },
        select: { id: true },
      });
      referenceId = `sub:${created.id}`;
    }

    if (needsPassword || !existingUser) {
      const appBase = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "https://bilalhocayds.com";
      await sendWelcomeEmail({
        to: normalizedEmail,
        fullName: fullName.trim(),
        password: rawPassword,
        planName: plan.name,
        billingCycle,
        loginUrl: `${appBase}/login`,
      }).catch((err) => console.error("[mail] Welcome email failed:", err));
    }
  }

  const payment: PaytrCheckoutResult = await paytrCheckout({
    planName: plan.name,
    amount,
    email: email.toLowerCase(),
    phone: normalizedPhone,
    userId: session?.user?.id ?? email.toLowerCase(),
    referenceId,
  });

  return NextResponse.json({
    success: true,
    payment,
    amount,
    orderReference: referenceId,
    plan: { id: plan.id, name: plan.name, billingCycle },
  });
}
