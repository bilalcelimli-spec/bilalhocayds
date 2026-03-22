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

const genericResponse = {
  message: "Eger bu e-posta adresiyle kayitli bir hesap varsa, sifre sifirlama baglantisi gonderildi.",
};

export async function POST(request: Request) {
  if (isRateLimited(`forgot-password:${getClientIp(request)}`, 5, 60_000)) {
    return Response.json({ error: "Cok fazla istek. Lutfen bir dakika sonra tekrar deneyin." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Gecersiz e-posta adresi." }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true, password: true },
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
    });

    return Response.json(genericResponse);
  } catch {
    return Response.json({ error: "Sunucu hatasi" }, { status: 500 });
  }
}