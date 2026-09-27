import bcrypt from "bcrypt";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { prisma } from "@/src/lib/prisma";
import { hashPasswordResetToken } from "@/src/lib/password-reset";
import { getClientIp, isRateLimited } from "@/src/lib/rate-limit";

const tokenSchema = z.object({
  token: z.string().min(1),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

async function getActiveResetToken(token: string) {
  return prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashPasswordResetToken(token) },
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });
}

export async function GET(request: Request) {
  const t = await getTranslations("resetPassword");
  const url = new URL(request.url);
  const parsed = tokenSchema.safeParse({ token: url.searchParams.get("token") ?? "" });

  if (!parsed.success) {
    return Response.json({ valid: false, error: t("api.invalidLink") }, { status: 400 });
  }

  const resetToken = await getActiveResetToken(parsed.data.token);
  const isValid = Boolean(resetToken && !resetToken.usedAt && resetToken.expiresAt >= new Date());

  if (!isValid) {
    return Response.json({ valid: false, error: t("invalidOrExpired") }, { status: 400 });
  }

  return Response.json({ valid: true });
}

export async function POST(request: Request) {
  const [t, tErrors] = await Promise.all([getTranslations("resetPassword"), getTranslations("apiErrors")]);
  if (isRateLimited(`reset-password:${getClientIp(request)}`, 5, 60_000)) {
    return Response.json({ error: tErrors("tooManyRequests") }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const passwordIssue = parsed.error.issues.some((issue) => issue.path[0] === "password");
      return Response.json(
        { error: passwordIssue ? t("api.passwordTooShort") : tErrors("invalidData") },
        { status: 400 },
      );
    }

    const resetToken = await getActiveResetToken(parsed.data.token);

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return Response.json({ error: t("invalidOrExpired") }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.user.id,
          id: { not: resetToken.id },
        },
      }),
    ]);

    return Response.json({ message: t("updated") });
  } catch {
    return Response.json({ error: tErrors("serverError") }, { status: 500 });
  }
}