import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(leads);
  } catch (error) {
    // If migrations are not applied yet, avoid crashing admin UI and return empty data.
    console.error("Failed to load leads:", error);
    return NextResponse.json([]);
  }
}
