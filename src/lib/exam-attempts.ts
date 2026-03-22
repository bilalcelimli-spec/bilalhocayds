import { AttemptStatus, type ExamQuestion, type ExamSectionType, type Prisma } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

type LegacyExamQuestion = {
  prompt: string;
  choices: string[];
  answer?: string;
  sectionTitle: string;
};

type SaveAttemptAnswerInput = {
  questionId: string;
  selectedAnswer?: string | null;
  isFlaggedForReview?: boolean;
};

function parseLegacyQuestions(value: unknown, sectionTitle: string): LegacyExamQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<LegacyExamQuestion[]>((questions, item) => {
    if (!item || typeof item !== "object") {
      return questions;
    }

    const record = item as Record<string, unknown>;
    const prompt = String(record.prompt ?? record.question ?? "").trim();
    if (!prompt) {
      return questions;
    }

    const rawChoices = Array.isArray(record.choices)
      ? record.choices
      : Array.isArray(record.options)
        ? record.options
        : [];

    const choices = rawChoices
      .map((choice) => String(choice ?? "").trim())
      .filter(Boolean);

    questions.push({
      prompt,
      choices,
      answer: String(record.answer ?? record.correctAnswer ?? "").trim() || undefined,
      sectionTitle,
    });

    return questions;
  }, []);
}

function normalizeLegacyExamContent(contentJson: Prisma.JsonValue): {
  sections: Array<{ title: string; questions: LegacyExamQuestion[] }>;
  questions: LegacyExamQuestion[];
} {
  if (!contentJson || typeof contentJson !== "object" || Array.isArray(contentJson)) {
    return { sections: [], questions: [] };
  }

  const record = contentJson as Record<string, unknown>;
  const sections = Array.isArray(record.sections)
    ? record.sections
        .map((section) => {
          if (!section || typeof section !== "object") {
            return null;
          }

          const sectionRecord = section as Record<string, unknown>;
          const title = String(sectionRecord.title ?? sectionRecord.name ?? "Bolum").trim() || "Bolum";
          const questions = parseLegacyQuestions(sectionRecord.questions, title);

          if (questions.length === 0) {
            return null;
          }

          return { title, questions };
        })
        .filter((value): value is { title: string; questions: LegacyExamQuestion[] } => Boolean(value))
    : [];

  const flatQuestions = parseLegacyQuestions(record.questions, "General");

  return {
    sections,
    questions: sections.length > 0 ? sections.flatMap((section) => section.questions) : flatQuestions,
  };
}

function inferSectionType(title: string): ExamSectionType {
  const normalized = title.toLowerCase();

  if (normalized.includes("vocab")) return "VOCABULARY";
  if (normalized.includes("grammar")) return "GRAMMAR";
  if (normalized.includes("cloze")) return "CLOZE_TEST";
  if (normalized.includes("sentence")) return "SENTENCE_COMPLETION";
  if (normalized.includes("translation")) return "TRANSLATION_EN_TO_TR";
  if (normalized.includes("paragraph")) return "PARAGRAPH_COMPLETION";
  if (normalized.includes("reading")) return "READING_COMPREHENSION";
  return "OTHER";
}

function toOptionValue(index: number, option: string) {
  const letter = ["A", "B", "C", "D", "E"][index] ?? "E";
  const normalized = option.replace(/^[A-E]\)\s*/, "").trim();
  return `${letter}) ${normalized}`;
}

function normalizeSelectedAnswer(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toUpperCase();
  return ["A", "B", "C", "D", "E"].includes(trimmed) ? trimmed : null;
}

async function ensureExamVersion(examModuleId: string) {
  const exam = await prisma.examModule.findUnique({
    where: { id: examModuleId },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!exam) {
    throw new Error("EXAM_NOT_FOUND");
  }

  if (exam.activeVersionId) {
    const activeVersion = await prisma.examVersion.findUnique({
      where: { id: exam.activeVersionId },
      include: {
        questions: {
          orderBy: { displayOrder: "asc" },
          include: {
            section: true,
          },
        },
      },
    });

    if (activeVersion && activeVersion.questions.length > 0) {
      return activeVersion;
    }
  }

  const normalizedContent = normalizeLegacyExamContent(exam.contentJson as Prisma.JsonValue);
  if (normalizedContent.questions.length === 0) {
    throw new Error("EXAM_VERSION_EMPTY");
  }

  const versionNumber = (exam.versions[0]?.versionNumber ?? 0) + 1;

  return prisma.$transaction(async (tx) => {
    const version = await tx.examVersion.create({
      data: {
        examModuleId,
        versionNumber,
        label: `Legacy import v${versionNumber}`,
        parseJobStatus: "COMPLETED",
        parseConfidence: 1,
        isActive: true,
        parsedSnapshotJson: exam.contentJson as Prisma.InputJsonValue,
      },
    });

    const createdSections = new Map<string, string>();
    let globalQuestionNumber = 1;

    for (const [sectionIndex, section] of (normalizedContent.sections.length > 0
      ? normalizedContent.sections
      : [{ title: "General", questions: normalizedContent.questions }]).entries()) {
      const createdSection = await tx.examSection.create({
        data: {
          examModuleId,
          examVersionId: version.id,
          sectionType: inferSectionType(section.title),
          title: section.title,
          displayOrder: sectionIndex + 1,
          questionStartNumber: globalQuestionNumber,
          questionEndNumber: globalQuestionNumber + section.questions.length - 1,
        },
      });

      createdSections.set(section.title, createdSection.id);

      for (const [questionIndex, question] of section.questions.entries()) {
        const options = Array.from({ length: 5 }, (_, index) => toOptionValue(index, question.choices[index] ?? `${String.fromCharCode(65 + index)})`));
        await tx.examQuestion.create({
          data: {
            examModuleId,
            examVersionId: version.id,
            sectionId: createdSection.id,
            questionNumber: globalQuestionNumber,
            displayOrder: globalQuestionNumber,
            sectionType: inferSectionType(section.title),
            questionText: question.prompt,
            optionA: options[0],
            optionB: options[1],
            optionC: options[2],
            optionD: options[3],
            optionE: options[4],
            correctAnswer: normalizeSelectedAnswer(question.answer) ?? "A",
            status: "VERIFIED",
            isVerified: true,
            parseConfidence: 1,
          },
        });
        globalQuestionNumber += 1;
        void questionIndex;
      }
    }

    await tx.examModule.update({
      where: { id: examModuleId },
      data: {
        activeVersionId: version.id,
        publicationStatus: exam.isPublished ? "PUBLISHED" : "READY",
      },
    });

    return tx.examVersion.findUniqueOrThrow({
      where: { id: version.id },
      include: {
        questions: {
          orderBy: { displayOrder: "asc" },
          include: { section: true },
        },
      },
    });
  });
}

async function userHasExamAccess(userId: string, examModuleId: string) {
  const now = new Date();
  const [manualFeatureAccess, manualExamAccess, activeSubscription, paidPurchase] = await Promise.all([
    prisma.studentFeatureAccess.findUnique({
      where: { userId },
      select: { hasExamAccess: true },
    }),
    prisma.studentFeatureExamAccess.findFirst({
      where: { userId, examModuleId },
      select: { id: true },
    }),
    prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING"] },
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      select: {
        plan: {
          select: {
            includesExam: true,
            examModules: {
              where: { examModuleId },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.examPurchase.findFirst({
      where: {
        examModuleId,
        userId,
        status: "PAID",
      },
      select: { id: true },
    }),
  ]);

  return Boolean(
    manualFeatureAccess?.hasExamAccess ||
      manualExamAccess ||
      activeSubscription?.plan.includesExam ||
      (activeSubscription?.plan.examModules.length ?? 0) > 0 ||
      paidPurchase,
  );
}

function serializeQuestion(question: ExamQuestion & { section: { title: string } }) {
  return {
    id: question.id,
    number: question.questionNumber,
    section: question.section.title,
    prompt: question.questionText,
    options: [question.optionA, question.optionB, question.optionC, question.optionD, question.optionE],
    correctAnswer: question.correctAnswer,
  };
}

async function computeAndPersistAttemptResult(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      examModule: true,
      answers: {
        include: {
          question: {
            include: { section: true },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }

  const answerUpdates = attempt.answers.map((answer) => {
    const selected = normalizeSelectedAnswer(answer.selectedAnswer);
    const correct = normalizeSelectedAnswer(answer.question.correctAnswer);
    return {
      id: answer.id,
      isCorrect: Boolean(selected && correct && selected === correct),
      selected,
      section: answer.question.section.title,
    };
  });

  const correctCount = answerUpdates.filter((item) => item.isCorrect).length;
  const blankCount = answerUpdates.filter((item) => !item.selected).length;
  const incorrectCount = answerUpdates.length - correctCount - blankCount;
  const netScore = Number((correctCount - incorrectCount * 0.25).toFixed(2));
  const accuracyPercentage = answerUpdates.length > 0 ? Math.round((correctCount / answerUpdates.length) * 100) : 0;

  const sectionMap = new Map<string, { total: number; correct: number; blank: number }>();
  for (const item of answerUpdates) {
    const current = sectionMap.get(item.section) ?? { total: 0, correct: 0, blank: 0 };
    current.total += 1;
    if (item.isCorrect) current.correct += 1;
    if (!item.selected) current.blank += 1;
    sectionMap.set(item.section, current);
  }

  const sectionPerformance = Array.from(sectionMap.entries()).map(([section, stats]) => ({
    section,
    total: stats.total,
    correct: stats.correct,
    blank: stats.blank,
    incorrect: stats.total - stats.correct - stats.blank,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));

  const strongestSection = [...sectionPerformance].sort((left, right) => right.accuracy - left.accuracy)[0]?.section ?? null;
  const weakestSection = [...sectionPerformance].sort((left, right) => left.accuracy - right.accuracy)[0]?.section ?? null;

  await prisma.$transaction([
    ...answerUpdates.map((answer) =>
      prisma.examAttemptAnswer.update({
        where: { id: answer.id },
        data: { isCorrect: answer.isCorrect },
      }),
    ),
    prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        correctCount,
        incorrectCount,
        blankCount,
        netScore,
        score: correctCount,
        accuracyPercentage,
        strongestSection,
        weakestSection,
        sectionPerformanceJson: sectionPerformance as unknown as Prisma.InputJsonValue,
        scoreSummaryJson: {
          correctCount,
          incorrectCount,
          blankCount,
          netScore,
          accuracyPercentage,
        },
      },
    }),
  ]);

  return {
    correctCount,
    incorrectCount,
    blankCount,
    netScore,
    score: correctCount,
    accuracyPercentage,
    strongestSection,
    weakestSection,
    sectionPerformance,
  };
}

export async function startExamAttempt(userId: string, examIdentifier: { examModuleId?: string; slug?: string }) {
  const exam = await prisma.examModule.findFirst({
    where: {
      ...(examIdentifier.examModuleId ? { id: examIdentifier.examModuleId } : {}),
      ...(examIdentifier.slug ? { slug: examIdentifier.slug } : {}),
      isActive: true,
      isPublished: true,
    },
  });

  if (!exam) {
    throw new Error("EXAM_NOT_FOUND");
  }

  const hasAccess = await userHasExamAccess(userId, exam.id);
  if (!hasAccess) {
    throw new Error("EXAM_ACCESS_DENIED");
  }

  const existingAttempt = await prisma.examAttempt.findFirst({
    where: {
      examModuleId: exam.id,
      studentId: userId,
      status: AttemptStatus.IN_PROGRESS,
    },
    orderBy: { startedAt: "desc" },
  });

  if (existingAttempt) {
    return existingAttempt;
  }

  const version = await ensureExamVersion(exam.id);
  const expiresAt = new Date(Date.now() + exam.durationMinutes * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const attempt = await tx.examAttempt.create({
      data: {
        examModuleId: exam.id,
        examVersionId: version.id,
        studentId: userId,
        expiresAt,
        metadataJson: {
          source: "manual-start",
        },
      },
    });

    if (version.questions.length > 0) {
      await tx.examAttemptAnswer.createMany({
        data: version.questions.map((question) => ({
          attemptId: attempt.id,
          questionId: question.id,
        })),
      });
    }

    return attempt;
  });
}

export async function getExamAttemptPayload(userId: string, attemptId: string) {
  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, studentId: userId },
    include: {
      examModule: true,
      answers: {
        orderBy: { question: { displayOrder: "asc" } },
        include: {
          question: {
            include: { section: true },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }

  if (attempt.status === AttemptStatus.IN_PROGRESS && attempt.expiresAt.getTime() <= Date.now()) {
    await submitExamAttempt(userId, attemptId, true);
    return getExamAttemptPayload(userId, attemptId);
  }

  return {
    attemptId: attempt.id,
    status: attempt.status,
    exam: {
      id: attempt.examModule.id,
      title: attempt.examModule.title,
      slug: attempt.examModule.slug,
      durationMinutes: attempt.examModule.durationMinutes,
      questionCount: attempt.examModule.questionCount,
      instructions: attempt.examModule.instructions,
    },
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: attempt.expiresAt.toISOString(),
    remainingSeconds: Math.max(0, Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000)),
    answeredCount: attempt.answers.filter((answer) => Boolean(answer.selectedAnswer)).length,
    flaggedCount: attempt.answers.filter((answer) => answer.isFlaggedForReview).length,
    questions: attempt.answers.map((answer) => ({
      ...serializeQuestion(answer.question),
      selectedAnswer: answer.selectedAnswer,
      isFlaggedForReview: answer.isFlaggedForReview,
      isCorrect: answer.isCorrect,
    })),
  };
}

export async function saveExamAttemptAnswers(userId: string, attemptId: string, answers: SaveAttemptAnswerInput[]) {
  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, studentId: userId },
    include: { answers: true },
  });

  if (!attempt) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new Error("ATTEMPT_NOT_EDITABLE");
  }

  if (attempt.expiresAt.getTime() <= Date.now()) {
    await submitExamAttempt(userId, attemptId, true);
    throw new Error("ATTEMPT_EXPIRED");
  }

  const answerMap = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));

  await prisma.$transaction(
    answers.flatMap((input) => {
      const current = answerMap.get(input.questionId);
      if (!current) {
        return [];
      }

      const nextSelected = normalizeSelectedAnswer(input.selectedAnswer ?? current.selectedAnswer);
      const nextFlagState = typeof input.isFlaggedForReview === "boolean" ? input.isFlaggedForReview : current.isFlaggedForReview;

      return [
        prisma.examAttemptAnswer.update({
          where: { id: current.id },
          data: {
            selectedAnswer: nextSelected,
            isFlaggedForReview: nextFlagState,
            firstAnsweredAt: current.firstAnsweredAt ?? (nextSelected ? new Date() : null),
            lastAnsweredAt: new Date(),
          },
        }),
        prisma.examAttemptAnswerEvent.create({
          data: {
            attemptId,
            questionId: input.questionId,
            eventType: "autosave",
            previousAnswer: current.selectedAnswer,
            nextAnswer: nextSelected,
            previousFlagState: current.isFlaggedForReview,
            nextFlagState,
          },
        }),
      ];
    }),
  );

  return getExamAttemptPayload(userId, attemptId);
}

export async function submitExamAttempt(userId: string, attemptId: string, autoSubmitted = false) {
  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, studentId: userId },
  });

  if (!attempt) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    return computeAndPersistAttemptResult(attemptId);
  }

  const submittedAt = new Date();
  const durationSecondsUsed = Math.max(0, Math.floor((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000));

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: autoSubmitted ? AttemptStatus.AUTO_SUBMITTED : AttemptStatus.SUBMITTED,
      autoSubmitted,
      submittedAt,
      resultLockedAt: submittedAt,
      durationSecondsUsed,
    },
  });

  return computeAndPersistAttemptResult(attemptId);
}

export async function getExamAttemptResult(userId: string, attemptId: string) {
  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, studentId: userId },
    include: {
      examModule: true,
      answers: {
        orderBy: { question: { displayOrder: "asc" } },
        include: {
          question: {
            include: { section: true },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }

  if (attempt.status === AttemptStatus.IN_PROGRESS) {
    if (attempt.expiresAt.getTime() <= Date.now()) {
      await submitExamAttempt(userId, attemptId, true);
      return getExamAttemptResult(userId, attemptId);
    }

    throw new Error("ATTEMPT_NOT_SUBMITTED");
  }

  return {
    attemptId: attempt.id,
    status: attempt.status,
    exam: {
      id: attempt.examModule.id,
      title: attempt.examModule.title,
      slug: attempt.examModule.slug,
    },
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    durationSecondsUsed: attempt.durationSecondsUsed,
    correctCount: attempt.correctCount,
    incorrectCount: attempt.incorrectCount,
    blankCount: attempt.blankCount,
    score: attempt.score,
    netScore: attempt.netScore,
    accuracyPercentage: attempt.accuracyPercentage,
    strongestSection: attempt.strongestSection,
    weakestSection: attempt.weakestSection,
    sectionPerformance: attempt.sectionPerformanceJson,
    answers: attempt.answers.map((answer) => ({
      ...serializeQuestion(answer.question),
      selectedAnswer: answer.selectedAnswer,
      isFlaggedForReview: answer.isFlaggedForReview,
      isCorrect: answer.isCorrect,
      explanation: answer.question.manualExplanation,
    })),
  };
}