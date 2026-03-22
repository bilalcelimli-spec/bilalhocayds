import { type Prisma } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

export async function logAdaptiveAudit(input: {
  actorUserId: string;
  targetType: string;
  targetId: string;
  action: string;
  beforeJson?: Prisma.InputJsonValue | null;
  afterJson?: Prisma.InputJsonValue | null;
  metadataJson?: Prisma.InputJsonValue | null;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        targetType: input.targetType,
        targetId: input.targetId,
        action: input.action,
        beforeJson: input.beforeJson ?? undefined,
        afterJson: input.afterJson ?? undefined,
        metadataJson: input.metadataJson ?? undefined,
      },
    });
  } catch (error) {
    console.error("[adaptive-audit] failed", error);
  }
}

function parseAdaptiveMetadata(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (record.deliveryMode !== "ADAPTIVE") {
    return null;
  }

  const adaptiveState = record.adaptiveState;
  if (!adaptiveState || typeof adaptiveState !== "object" || Array.isArray(adaptiveState)) {
    return null;
  }

  return adaptiveState as Record<string, unknown>;
}

type AdaptiveAttemptPreview = {
  id: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  correctCount: number;
  incorrectCount: number;
  blankCount: number;
  netScore: number | null;
  accuracyPercentage: number | null;
  durationSecondsUsed: number | null;
  exam: { id: string; title: string; slug: string; examType: string };
  student: { id: string; name: string | null; email: string };
  currentLevel: string;
  currentConfidence: number;
  topicTheme: string;
  skillType: string;
  questionCount: number;
  history: Array<Record<string, unknown>>;
};

export async function getAdaptiveAdminDashboardData() {
  const [recentAttempts, recentAuditLogs] = await Promise.all([
    prisma.examAttempt.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        id: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        correctCount: true,
        incorrectCount: true,
        blankCount: true,
        netScore: true,
        accuracyPercentage: true,
        durationSecondsUsed: true,
        metadataJson: true,
        examModule: {
          select: {
            id: true,
            title: true,
            slug: true,
            examType: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.adminAuditLog.findMany({
      where: {
        OR: [
          { targetType: "ADAPTIVE_ATTEMPT" },
          { targetType: "ADAPTIVE_LAB" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const adaptiveAttempts: AdaptiveAttemptPreview[] = recentAttempts.flatMap((attempt) => {
      const adaptiveState = parseAdaptiveMetadata(attempt.metadataJson);
      if (!adaptiveState) {
        return [];
      }

      const history = Array.isArray(adaptiveState.history)
        ? adaptiveState.history.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>>
        : [];

      return [{
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        blankCount: attempt.blankCount,
        netScore: attempt.netScore,
        accuracyPercentage: attempt.accuracyPercentage,
        durationSecondsUsed: attempt.durationSecondsUsed,
        exam: attempt.examModule,
        student: attempt.student,
        currentLevel: String(adaptiveState.currentLevel ?? "B1"),
        currentConfidence: Number(adaptiveState.currentConfidence ?? 0),
        topicTheme: String(adaptiveState.topicTheme ?? "General English"),
        skillType: String(adaptiveState.skillType ?? "GRAMMAR"),
        questionCount: history.length,
        history,
      }];
    });

  const completedAttempts = adaptiveAttempts.filter((attempt) => attempt.status !== "IN_PROGRESS");
  const avgAccuracy = completedAttempts.length
    ? Math.round(
        completedAttempts.reduce((sum, attempt) => sum + Number(attempt.accuracyPercentage ?? 0), 0) / completedAttempts.length,
      )
    : 0;
  const avgQuestions = adaptiveAttempts.length
    ? Number((adaptiveAttempts.reduce((sum, attempt) => sum + attempt.questionCount, 0) / adaptiveAttempts.length).toFixed(1))
    : 0;
  const levelDistribution = ["A2", "B1", "B2", "C1"].map((level) => ({
    level,
    count: adaptiveAttempts.filter((attempt) => attempt.currentLevel === level).length,
  }));

  return {
    summary: {
      totalAdaptiveAttempts: adaptiveAttempts.length,
      completedAdaptiveAttempts: completedAttempts.length,
      inProgressAdaptiveAttempts: adaptiveAttempts.filter((attempt) => attempt.status === "IN_PROGRESS").length,
      averageAccuracy: avgAccuracy,
      averageQuestionCount: avgQuestions,
      auditEventCount: recentAuditLogs.length,
    },
    levelDistribution,
    recentAdaptiveAttempts: adaptiveAttempts.slice(0, 20),
    recentAuditLogs: recentAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      actorName: log.actor.name ?? log.actor.email,
      actorEmail: log.actor.email,
      createdAt: log.createdAt.toISOString(),
      metadataJson: log.metadataJson,
    })),
  };
}