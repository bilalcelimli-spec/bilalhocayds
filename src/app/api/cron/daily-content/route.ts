import { NextResponse } from "next/server";

import { generateDailyContentForEligibleStudents } from "@/src/lib/student-daily-content";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");

  return authHeader === `Bearer ${secret}` || headerSecret === secret;
}

async function handleCron(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();

  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const result = await generateDailyContentForEligibleStudents(date);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("[cron/daily-content] error:", error);
    return NextResponse.json({ error: "Failed to generate daily content" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}