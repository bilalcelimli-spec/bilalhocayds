import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/auth";
import { examModule, examPurchase, prisma } from "@/src/lib/prisma";
import { paytrCheckout } from "@/lib/payment/paytr-checkout";

const requestSchema = z.object({
	examModuleId: z.string().min(1),
	fullName: z.string().min(2).max(120),
	email: z.email(),
	phone: z.string().min(10).max(20),
});

const rateLimitStore = new Map<string, number[]>();

function createExamPurchaseReferenceId() {
	return `examp${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

function getClientKey(request: Request) {
	const forwarded = request.headers.get("x-forwarded-for");
	const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
	return `exam-pay:${ip}`;
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
		return NextResponse.json({ error: "Cok fazla deneme. Lutfen bir dakika sonra tekrar deneyin." }, { status: 429 });
	}

	const payload = requestSchema.safeParse(await request.json());
	if (!payload.success) {
		return NextResponse.json({ error: "Gecersiz istek." }, { status: 400 });
	}

	const { examModuleId, fullName, email, phone } = payload.data;
	const exam = await examModule.findUnique({ where: { id: examModuleId } });
	if (!exam || !exam.isActive || !exam.isPublished || !exam.isForSale || !exam.price || exam.price <= 0) {
		return NextResponse.json({ error: "Bu sinav su anda satin alinabilir degil." }, { status: 400 });
	}

	const normalizedPhone = phone.replace(/\D/g, "");
	if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
		return NextResponse.json({ error: "Telefon numarasi gecersiz." }, { status: 400 });
	}

	const [firstName, ...rest] = fullName.trim().split(" ");
	const surname = rest.join(" ") || "-";

	await prisma.lead.create({
		data: {
			name: firstName,
			surname,
			email: email.toLowerCase(),
			phone: normalizedPhone,
			plan: `Exam Marketplace: ${exam.title}`,
		},
	}).catch(() => null);

	const session = await getServerSession(authOptions);
	const purchase = await examPurchase.create({
		data: {
			examModuleId: exam.id,
			userId: session?.user?.id ?? null,
			amount: exam.price,
			fullName: fullName.trim(),
			email: email.toLowerCase(),
			phone: normalizedPhone,
			referenceId: createExamPurchaseReferenceId(),
		},
	});

	const userIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
	const payment = await paytrCheckout({
		planName: `Exam Marketplace - ${exam.title}`,
		amount: exam.price,
		email: email.toLowerCase(),
		phone: normalizedPhone,
		userName: fullName.trim(),
		userIp,
		userId: session?.user?.id ?? email.toLowerCase(),
		referenceId: purchase.referenceId,
	});

	await examPurchase.update({
		where: { id: purchase.id },
		data: { providerMessage: payment.message ?? null },
	}).catch(() => null);

	return NextResponse.json({
		success: true,
		payment,
		exam: {
			id: exam.id,
			title: exam.title,
			examType: exam.examType,
			questionCount: exam.questionCount,
			durationMinutes: exam.durationMinutes,
			price: exam.price,
		},
		purchaseId: purchase.id,
	});
}