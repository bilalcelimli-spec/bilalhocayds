import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/auth";
import { examPurchase } from "@/src/lib/prisma";

function escapeCsvValue(value: string | number | null | undefined) {
	const text = String(value ?? "");
	if (text.includes(",") || text.includes("\n") || text.includes("\"")) {
		return `"${text.replaceAll("\"", "\"\"")}"`;
	}
	return text;
}

export async function GET(request: Request) {
	const session = await getServerSession(authOptions);
	if (!session || session.user.role !== "ADMIN") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const status = searchParams.get("status") ?? "ALL";
	const examId = searchParams.get("examId") ?? "ALL";
	const from = searchParams.get("from");
	const to = searchParams.get("to");

	const sales = await examPurchase.findMany({
		orderBy: { createdAt: "desc" },
		include: { examModule: true, user: true },
	});

	const fromDate = from ? new Date(`${from}T00:00:00`) : null;
	const toDate = to ? new Date(`${to}T23:59:59.999`) : null;
	const filtered = sales.filter((sale) => {
		if (status !== "ALL" && sale.status !== status) return false;
		if (examId !== "ALL" && sale.examModuleId !== examId) return false;
		if (fromDate && sale.createdAt < fromDate) return false;
		if (toDate && sale.createdAt > toDate) return false;
		return true;
	});

	const rows = [
		["referenceId", "status", "amount", "fullName", "email", "phone", "examTitle", "examType", "createdAt", "paidAt"],
		...filtered.map((sale) => [
			sale.referenceId,
			sale.status,
			sale.amount,
			sale.fullName,
			sale.email,
			sale.phone,
			sale.examModule?.marketplaceTitle ?? sale.examModule?.title ?? "",
			sale.examModule?.examType ?? "",
			sale.createdAt.toISOString(),
			sale.paidAt?.toISOString() ?? "",
		]),
	];

	const csv = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
	return new NextResponse(csv, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="exam-sales-${new Date().toISOString().slice(0, 10)}.csv"`,
		},
	});
}