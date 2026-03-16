import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

type LeadPayload = {
  name: string;
  surname: string;
  phone: string;
  email: string;
  plan: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<LeadPayload>;
  const data: LeadPayload = {
    name: String(body.name ?? "").trim(),
    surname: String(body.surname ?? "").trim(),
    phone: String(body.phone ?? "").trim(),
    email: String(body.email ?? "").trim().toLowerCase(),
    plan: String(body.plan ?? "").trim(),
  };

  if (!data.name || !data.surname || !data.phone || !data.email || !data.plan) {
    return NextResponse.json({ error: "Eksik lead verisi." }, { status: 400 });
  }

  const lead = await prisma.lead.create({ data });
  return NextResponse.json(lead);
}