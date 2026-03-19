import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { SignJWT } from "jose";
import { prisma } from "@/src/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// JWT secret — üretimde NEXTAUTH_SECRET ile aynı secret kullanılır
function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz e-posta veya şifre formatı." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true, image: true, role: true, password: true },
    });

    if (!user?.password) {
      return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
    }

    // JWT token oluştur (7 gün geçerli)
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(await getJwtSecret());

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[mobile/login] error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
