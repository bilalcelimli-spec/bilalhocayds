import { NextResponse } from "next/server";

import { getWebhookReceiver } from "@/src/lib/livekit";
import { prisma } from "@/src/lib/prisma";

async function findClassByRoom(roomName: string | undefined) {
  if (!roomName) return null;
  return prisma.liveClass.findUnique({ where: { roomName }, select: { id: true, status: true } });
}

async function closeOpenAttendances(liveClassId: string, userId: string | undefined, leftAt: Date) {
  const open = await prisma.liveClassAttendance.findMany({
    where: { liveClassId, leftAt: null, ...(userId ? { userId } : {}) },
    select: { id: true, joinedAt: true },
  });

  await Promise.all(
    open.map((attendance) =>
      prisma.liveClassAttendance.update({
        where: { id: attendance.id },
        data: {
          leftAt,
          durationSeconds: Math.max(0, Math.round((leftAt.getTime() - attendance.joinedAt.getTime()) / 1000)),
        },
      }),
    ),
  );
}

export async function POST(request: Request) {
  const receiver = getWebhookReceiver();
  if (!receiver) {
    return NextResponse.json({ error: "LiveKit is not configured" }, { status: 503 });
  }

  const body = await request.text();
  let event;
  try {
    event = await receiver.receive(body, request.headers.get("authorization") ?? undefined);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const liveClass = await findClassByRoom(event.room?.name);
  if (!liveClass) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const eventTime = event.createdAt ? new Date(Number(event.createdAt) * 1000) : new Date();

  switch (event.event) {
    case "room_started":
      if (liveClass.status === "SCHEDULED") {
        await prisma.liveClass.update({
          where: { id: liveClass.id },
          data: { status: "LIVE", startedAt: eventTime },
        });
      }
      break;
    case "room_finished":
      await closeOpenAttendances(liveClass.id, undefined, eventTime);
      if (liveClass.status !== "CANCELLED") {
        await prisma.liveClass.update({
          where: { id: liveClass.id },
          data: { status: "ENDED", endedAt: eventTime },
        });
      }
      break;
    case "participant_joined": {
      const userId = event.participant?.identity;
      if (!userId) break;
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) break;
      // Aynı kullanıcı yeniden bağlandıysa açık kalan kaydı kapatıp yenisini aç.
      await closeOpenAttendances(liveClass.id, userId, eventTime);
      await prisma.liveClassAttendance.create({
        data: { liveClassId: liveClass.id, userId, joinedAt: eventTime },
      });
      break;
    }
    case "participant_left": {
      const userId = event.participant?.identity;
      if (!userId) break;
      await closeOpenAttendances(liveClass.id, userId, eventTime);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
