import { Prisma } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

const QUALIFYING_RECORDING_STATUSES = ["ACTIVE", "TRIALING", "CANCELLED", "EXPIRED"] as const;

const liveRecordingAccessSubscriptionArgs = Prisma.validator<Prisma.SubscriptionDefaultArgs>()({
  include: {
    plan: {
      select: {
        name: true,
      },
    },
  },
});

export type LiveRecordingAccessSubscription = Prisma.SubscriptionGetPayload<typeof liveRecordingAccessSubscriptionArgs>;

export async function getLiveRecordingAccessSubscription(
  userId: string,
): Promise<LiveRecordingAccessSubscription | null> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: [...QUALIFYING_RECORDING_STATUSES] },
      plan: { includesLiveClass: true },
    },
    orderBy: { createdAt: "desc" },
    ...liveRecordingAccessSubscriptionArgs,
  });

  return subscription as LiveRecordingAccessSubscription | null;
}