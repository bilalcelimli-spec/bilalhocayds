import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { prisma } from "@/src/lib/prisma";
import {
  createPasswordResetExpiry,
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "@/src/lib/password-reset";
import { getClientIp, isRateLimited } from "@/src/lib/rate-limit";
import { resolveSiteUrl } from "@/src/lib/site-url";
import { sendPasswordResetEmail } from "@/src/lib/mail";

const forgotPasswordSchema = z.object({
  email: z.email(),
});

export async function POST(request: Request) {
  const [t, tErrors] = await Promise.all([getTranslations("forgotPassword.api"), getTranslations("apiErrors")]);
  const genericResponse = { message: t("sent") };

  if (isRateLimited(`forgot-password:${getClientIp(request)}`, 5, 60_000)) {
    return Response.json({ error: tErrors("tooManyRequests") }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: t("invalidEmail") }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true, password: true, locale: true },
    });

    await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          user ? { userId: user.id } : undefined,
        ].filter(Boolean) as Array<{ expiresAt?: { lt: Date }; userId?: string }>,
      },
    });

    if (!user?.password) {
      return Response.json(genericResponse);
    }

    const token = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(token);
    const expiresAt = createPasswordResetExpiry();
    const resetUrl = `${resolveSiteUrl()}/reset-password?token=${token}`;

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await sendPasswordResetEmail({
      to: user.email,
      fullName: user.name?.trim() || user.email,
      resetUrl,
      locale: user.locale,
    });

    return Response.json(genericResponse);
  } catch {
    return Response.json({ error: tErrors("serverError") }, { status: 500 });
  }
}