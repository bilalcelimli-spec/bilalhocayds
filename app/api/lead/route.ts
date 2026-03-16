import { z } from "zod";

import { prisma } from "@/src/lib/prisma";
import { isRateLimited, getClientIp } from "@/src/lib/rate-limit";
import { NextResponse } from "next/server";

const leadSchema = z.object({
  name: z.string().min(2).max(100),
  surname: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  email: z.email(),
  plan: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(`lead:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Cok fazla istek. Lutfen bir dakika sonra tekrar deneyin." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Gecersiz istek." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Gecersiz veri." }, { status: 400 });
  }

  const { name, surname, email, phone, plan } = parsed.data;
  const lead = await prisma.lead.create({
    data: {
      name: name.trim(),
      surname: surname.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.replace(/\D/g, ""),
      plan: plan.trim(),
    },
  });
  return NextResponse.json(lead);
}