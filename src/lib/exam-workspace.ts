import { AttemptStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function formatCurrency(amount: number | null | undefined, currency = "TRY") {
  if (amount === null || amount === undefined || !Number.isFinite(amount) || amount <= 0) {
    return "Kapali";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDurationLabel(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export async function getStudentExamWorkspace(slug: string, userId: string) {
  const exam = await prisma.examModule.findFirst({
    where: {
      slug,
      isActive: true,
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      subtitle: true,
      slug: true,
      description: true,
      instructions: true,
      sourceLabel: true,
      cefrLevel: true,
      durationMinutes: true,
      questionCount: true,
      aiExplanationEnabled: true,
      lessonReviewPrice: true,
      lessonCurrency: true,
      publicationStatus: true,
      activeVersionId: true,
    },
  });

  if (!exam) {
    return null;
  }

  const [activeVersion, latestAttempt, latestPaidBooking] = await Promise.all([
    prisma.examVersion.findFirst({
      where: {
        examModuleId: exam.id,
        ...(exam.activeVersionId ? { id: exam.activeVersionId } : {}),
      },
      orderBy: { versionNumber: "desc" },
      include: {
        sections: {
          orderBy: { displayOrder: "asc" },
          select: {
            id: true,
            title: true,
            sectionType: true,
            questionStartNumber: true,
            questionEndNumber: true,
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
        questions: {
          orderBy: { displayOrder: "asc" },
          select: { id: true },
        },
      },
    }),
    prisma.examAttempt.findFirst({
      where: {
        examModuleId: exam.id,
        studentId: userId,
      },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        netScore: true,
      },
    }),
    prisma.examReviewBooking.findFirst({
      where: {
        examModuleId: exam.id,
        studentId: userId,
        status: {
          in: ["PAID", "SCHEDULED", "COMPLETED"],
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        scheduledStartAt: true,
      },
    }),
  ]);

  return {
    exam,
    activeVersion,
    latestAttempt,
    latestPaidBooking,
  };
}

export async function getAdminExamWorkspace(examId: string) {
  const exam = await prisma.examModule.findUnique({
    where: { id: examId },
    select: {
      id: true,
      title: true,
      subtitle: true,
      slug: true,
      examType: true,
      cefrLevel: true,
      durationMinutes: true,
      questionCount: true,
      description: true,
      instructions: true,
      sourceLabel: true,
      examSeries: true,
      yearLabel: true,
      estimatedDifficulty: true,
      targetStudentLevel: true,
      publicationStatus: true,
      aiExplanationEnabled: true,
      lessonReviewPrice: true,
      lessonCurrency: true,
      price: true,
      isForSale: true,
      isPublished: true,
      isActive: true,
      activeVersionId: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  if (!exam) {
    return null;
  }

  const activeVersion = await prisma.examVersion.findFirst({
    where: {
      examModuleId: exam.id,
      ...(exam.activeVersionId ? { id: exam.activeVersionId } : {}),
    },
    orderBy: { versionNumber: "desc" },
    include: {
      assets: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      parseJobs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      sections: {
        orderBy: { displayOrder: "asc" },
        include: {
          _count: {
            select: {
              questions: true,
              passageGroups: true,
            },
          },
        },
      },
      questions: {
        orderBy: { displayOrder: "asc" },
        include: {
          section: {
            select: {
              id: true,
              title: true,
            },
          },
          explanations: {
            where: { isActive: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const [submittedAttemptCount, inProgressAttemptCount, averageMetrics, recentAttempts, recentBookings, pricingRules, latestSubmittedAttempt] = await Promise.all([
    prisma.examAttempt.count({
      where: {
        examModuleId: exam.id,
        status: {
          in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED],
        },
      },
    }),
    prisma.examAttempt.count({
      where: {
        examModuleId: exam.id,
        status: AttemptStatus.IN_PROGRESS,
      },
    }),
    prisma.examAttempt.aggregate({
      where: {
        examModuleId: exam.id,
        status: {
          in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED],
        },
      },
      _avg: {
        netScore: true,
        accuracyPercentage: true,
      },
    }),
    prisma.examAttempt.findMany({
      where: { examModuleId: exam.id },
      orderBy: { startedAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        netScore: true,
        accuracyPercentage: true,
        correctCount: true,
        incorrectCount: true,
        blankCount: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.examReviewBooking.findMany({
      where: { examModuleId: exam.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.examPricingRule.findMany({
      where: {
        OR: [{ examModuleId: exam.id }, { examModuleId: null }],
        isActive: true,
      },
      orderBy: [{ examModuleId: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    prisma.examAttempt.findFirst({
      where: {
        examModuleId: exam.id,
        status: {
          in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED],
        },
      },
      orderBy: { submittedAt: "desc" },
      include: {
        answers: {
          orderBy: { question: { displayOrder: "asc" } },
          include: {
            question: {
              include: {
                section: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const questionStatusSummary = (activeVersion?.questions ?? []).reduce<Record<string, number>>((summary, question) => {
    summary[question.status] = (summary[question.status] ?? 0) + 1;
    return summary;
  }, {});

  return {
    exam,
    activeVersion,
    submittedAttemptCount,
    inProgressAttemptCount,
    averageNet: averageMetrics._avg.netScore ?? 0,
    averageAccuracy: averageMetrics._avg.accuracyPercentage ?? 0,
    recentAttempts,
    recentBookings,
    pricingRules,
    latestSubmittedAttempt,
    questionStatusSummary,
  };
}