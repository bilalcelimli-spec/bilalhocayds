import bcrypt from "bcrypt";
import { getLocale, getTimeZone, getTranslations } from "next-intl/server";
import { z } from "zod";

import { prisma } from "@/src/lib/prisma";
import { getClientIp, isRateLimited } from "@/src/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  interestTags: z.array(z.string().min(2)).max(8).optional().default([]),
  priorityTags: z.array(z.string().min(2)).max(2).optional().default([]),
});

export async function POST(req: Request) {
  const [tErrors, t] = await Promise.all([getTranslations("apiErrors"), getTranslations("register.api")]);
  if (isRateLimited(`register:${getClientIp(req)}`, 5, 60_000)) {
    return Response.json({ error: tErrors("tooManyRequests") }, { status: 429 });
  }
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: tErrors("invalidData") }, { status: 400 });
    }

    const { name, email, password, interestTags, priorityTags } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, password: true },
    });

    if (existingUser?.password) {
      // Hesap zaten aktif → giriş yap
      return Response.json({ error: t("emailTaken") }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [locale, timeZone] = await Promise.all([getLocale(), getTimeZone()]);

    const normalizedPriority = (priorityTags ?? []).filter((tag) => (interestTags ?? []).includes(tag));
    const orderedInterestTags = [
      ...normalizedPriority,
      ...(interestTags ?? []).filter((tag) => !normalizedPriority.includes(tag)),
    ];

    let user;

    if (existingUser) {
      // Satın alma sırasında oluşturulmuş hesap — şifreyi set et
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          password: hashedPassword,
          role: "STUDENT",
          locale,
          timezone: timeZone,
          studentProfile: {
            upsert: {
              update: { interestTags: orderedInterestTags },
              create: { interestTags: orderedInterestTags },
            },
          },
        },
      });
    } else {
      // Yeni kullanıcı — serbest kayıt, abonelik sonradan alınır
      user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role: "STUDENT",
          locale,
          timezone: timeZone,
          studentProfile: {
            create: { interestTags: orderedInterestTags },
          },
        },
      });
    }

    return Response.json(
      { message: t("created"), userId: user.id },
      { status: 201 }
    );
  } catch {
    return Response.json({ error: tErrors("serverError") }, { status: 500 });
  }
}

