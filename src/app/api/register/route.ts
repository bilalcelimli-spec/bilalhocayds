import bcrypt from "bcrypt";
import { z } from "zod";

import { prisma } from "@/src/lib/prisma";
import { getClientIp, isRateLimited } from "@/src/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  interestTags: z.array(z.string().min(2)).min(1).max(8),
  priorityTags: z.array(z.string().min(2)).max(2).default([]),
});

export async function POST(req: Request) {
  if (isRateLimited(`register:${getClientIp(req)}`, 5, 60_000)) {
    return Response.json({ error: "Cok fazla istek. Lutfen bir dakika sonra tekrar deneyin." }, { status: 429 });
  }
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Gecersiz veri" }, { status: 400 });
    }

    const { name, email, password, interestTags, priorityTags } = parsed.data;
    const normalizedPriority = priorityTags.filter((tag) => interestTags.includes(tag));
    const orderedInterestTags = [
      ...normalizedPriority,
      ...interestTags.filter((tag) => !normalizedPriority.includes(tag)),
    ];

    const normalizedEmail = email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, password: true },
    });

    if (!existingUser) {
      return Response.json(
        { error: "Kayit icin once bir paket satin almalisin." },
        { status: 403 },
      );
    }

    if (existingUser.password) {
      return Response.json({ error: "Bu email zaten kayitli" }, { status: 409 });
    }

    const now = new Date();
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: existingUser.id,
        status: { in: ["ACTIVE", "TRIALING"] },
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      select: { id: true },
    });

    if (!activeSubscription) {
      return Response.json(
        { error: "Aktif paket bulunamadi. Once odeme adimini tamamlamalisin." },
        { status: 403 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        password: hashedPassword,
        role: "STUDENT",
        studentProfile: {
          upsert: {
            update: {
              interestTags: orderedInterestTags,
            },
            create: {
            interestTags: orderedInterestTags,
            },
          },
        },
      },
    });

    return Response.json(
      { message: "Kullanici olusturuldu", userId: user.id },
      { status: 201 }
    );
  } catch {
    return Response.json({ error: "Sunucu hatasi" }, { status: 500 });
  }
}
