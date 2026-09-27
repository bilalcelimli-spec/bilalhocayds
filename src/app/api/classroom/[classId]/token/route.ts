import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/auth";
import { describeDenialReason, resolveClassroomAccess } from "@/src/lib/live-class-access";
import { buildRoomName, createClassroomToken, isLiveKitConfigured } from "@/src/lib/livekit";
import { prisma } from "@/src/lib/prisma";

export async function POST(_request: Request, context: { params: Promise<{ classId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
  }

  if (!isLiveKitConfigured()) {
    return NextResponse.json({ error: "Canlı sınıf altyapısı henüz yapılandırılmadı." }, { status: 503 });
  }

  const { classId } = await context.params;
  const liveClass = await prisma.liveClass.findUnique({ where: { id: classId } });
  if (!liveClass) {
    return NextResponse.json({ error: "Ders bulunamadı." }, { status: 404 });
  }

  const access = await resolveClassroomAccess({ id: session.user.id, role: session.user.role }, liveClass);
  if (!access.allowed) {
    return NextResponse.json(
      { error: describeDenialReason(access.reason), reason: access.reason, opensAt: access.opensAt ?? null },
      { status: 403 },
    );
  }

  let roomName = liveClass.roomName;
  if (!roomName) {
    roomName = buildRoomName(liveClass.id);
    await prisma.liveClass.update({ where: { id: liveClass.id }, data: { roomName } });
  }

  const displayName = session.user.name?.trim() || session.user.email?.split("@")[0] || "Öğrenci";
  const { token, serverUrl } = await createClassroomToken({
    roomName,
    identity: session.user.id,
    displayName,
    role: access.role,
  });

  return NextResponse.json({ token, serverUrl, role: access.role });
}
