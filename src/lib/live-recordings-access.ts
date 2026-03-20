import type { Prisma } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

const QUALIFYING_RECORDING_STATUSES = ["ACTIVE", "TRIALING", "CANCELLED", "EXPIRED"] as const;

export type LiveRecordingAccessSubscription = Prisma.SubscriptionGetPayload<{
  include: {
    plan: {
      select: {
        name: true;
      };
    };
  };
}>;

export async function getLiveRecordingAccessSubscription(
  userId: string,
): Promise<LiveRecordingAccessSubscription | null> {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: [...QUALIFYING_RECORDING_STATUSES] },
      startDate: { not: null },
      plan: { includesLiveClass: true },
    },
    orderBy: { createdAt: "desc" },
    include: {
      plan: {
        select: {
          name: true,
        },
      },
    },
  });
}