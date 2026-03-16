import bcrypt from "bcrypt";
import { z } from "zod";

import { prisma } from "@/src/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  interestTags: z.array(z.string().min(2)).min(1).max(8),
  priorityTags: z.array(z.string().min(2)).max(2).default([]),
});

export async function POST(req: Request) {
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

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json({ error: "Bu email zaten kayitli" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "STUDENT",
        studentProfile: {
          create: {
            interestTags: orderedInterestTags,
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
