import { AttemptStatus, ParseJobStatus, type ExamQuestion, type ExamSectionType, type Prisma } from "@prisma/client";

import {
  decideAdaptiveNextStep,
  generateValidatedAdaptiveQuestion,
  inferQuestionFormat,
  mapAdaptiveQuestionToExamQuestion,
  ROUTER_PROMPT_VERSION,
} from "@/src/lib/adaptive-exam";
import { logAdaptiveAudit } from "@/src/lib/adaptive-audit";
import type {
  AdaptiveAttemptConfig,
  AdaptiveSkillType,
  CefrLevel,
  ExamContext,
  QuestionFormat,
} from "@/src/lib/adaptive-exam-schemas";
import { ensureAttemptExplanationsForUser } from "@/src/lib/exam-explanations";
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

type DeliveryMode = "STANDARD" | "ADAPTIVE";

type AdaptiveAttemptHistoryEntry = {
  questionId: string;
  questionNumber: number;
  level: CefrLevel;
  correct: boolean | null;
  responseTimeSeconds: number | null;
  constructTested: string;
  generatedAt: string;
};

type AdaptiveAttemptState = {
  status: "READY_FOR_QUESTION" | "WAITING_FOR_ANSWER" | "COMPLETED";
  skillType: AdaptiveSkillType;
  examContext: ExamContext;
  currentLevel: CefrLevel;
  currentConfidence: number;
  topicTheme: string;
  questionFormat: QuestionFormat;
  minItemsBeforeStop: number;
  targetConfidenceToStop: number;
  maxQuestions: number;
  history: AdaptiveAttemptHistoryEntry[];
  lastDecision?: Record<string, unknown>;
  generatorPromptVersion?: string;
  validatorPromptVersion?: string;
  routerPromptVersion?: string;
};

type AttemptMetadata = {
  source: string;
  deliveryMode: DeliveryMode;
  adaptiveState?: AdaptiveAttemptState;
};

type StartExamAttemptInput = {
  examModuleId?: string;
  slug?: string;
  deliveryMode?: DeliveryMode;
  adaptiveConfig?: AdaptiveAttemptConfig;
};

type AdaptiveAnswerInput = {
  questionId: string;
  selectedAnswer: string | null;
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

function parseAttemptMetadata(value: Prisma.JsonValue | null | undefined): AttemptMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { source: "manual-start", deliveryMode: "STANDARD" };
  }

  const record = value as Record<string, unknown>;
  const deliveryMode = record.deliveryMode === "ADAPTIVE" ? "ADAPTIVE" : "STANDARD";
  const adaptiveStateRaw = record.adaptiveState;

  if (!adaptiveStateRaw || typeof adaptiveStateRaw !== "object" || Array.isArray(adaptiveStateRaw)) {
    return {
      source: typeof record.source === "string" ? record.source : "manual-start",
      deliveryMode,
    };
  }

  const adaptiveStateRecord = adaptiveStateRaw as Record<string, unknown>;
  const history = Array.isArray(adaptiveStateRecord.history)
    ? adaptiveStateRecord.history
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
          const item = entry as Record<string, unknown>;
          const level = String(item.level ?? "B1").toUpperCase() as CefrLevel;
          return {
            questionId: String(item.questionId ?? ""),
            questionNumber: Number(item.questionNumber ?? 0),
            level: ["A2", "B1", "B2", "C1"].includes(level) ? level : "B1",
            correct: typeof item.correct === "boolean" ? item.correct : null,
            responseTimeSeconds: typeof item.responseTimeSeconds === "number" ? item.responseTimeSeconds : null,
            constructTested: String(item.constructTested ?? "unknown"),
            generatedAt: String(item.generatedAt ?? new Date().toISOString()),
          } satisfies AdaptiveAttemptHistoryEntry;
        })
    : [];

  return {
    source: typeof record.source === "string" ? record.source : "manual-start",
    deliveryMode,
    adaptiveState: {
      status: adaptiveStateRecord.status === "COMPLETED"
        ? "COMPLETED"
        : adaptiveStateRecord.status === "READY_FOR_QUESTION"
          ? "READY_FOR_QUESTION"
          : "WAITING_FOR_ANSWER",
      skillType: adaptiveStateRecord.skillType === "READING" ? "READING" : "GRAMMAR",
      examContext: (["YDS", "YOKDIL", "YDT", "IELTS", "GENERAL"] as const).includes(String(adaptiveStateRecord.examContext ?? "GENERAL") as ExamContext)
        ? (String(adaptiveStateRecord.examContext) as ExamContext)
        : "GENERAL",
      currentLevel: (["A2", "B1", "B2", "C1"] as const).includes(String(adaptiveStateRecord.currentLevel ?? "B1") as CefrLevel)
        ? (String(adaptiveStateRecord.currentLevel) as CefrLevel)
        : "B1",
      currentConfidence: Math.max(0, Math.min(1, Number(adaptiveStateRecord.currentConfidence ?? 0.55))),
      topicTheme: String(adaptiveStateRecord.topicTheme ?? "General English"),
      questionFormat: (["sentence_completion", "paragraph_completion", "reading_mcq", "error_identification"] as const).includes(String(adaptiveStateRecord.questionFormat ?? "sentence_completion") as QuestionFormat)
        ? (String(adaptiveStateRecord.questionFormat) as QuestionFormat)
        : "sentence_completion",
      minItemsBeforeStop: Number(adaptiveStateRecord.minItemsBeforeStop ?? 6),
      targetConfidenceToStop: Number(adaptiveStateRecord.targetConfidenceToStop ?? 0.84),
      maxQuestions: Number(adaptiveStateRecord.maxQuestions ?? 18),
      history,
      lastDecision: adaptiveStateRecord.lastDecision && typeof adaptiveStateRecord.lastDecision === "object" && !Array.isArray(adaptiveStateRecord.lastDecision)
        ? (adaptiveStateRecord.lastDecision as Record<string, unknown>)
        : undefined,
      generatorPromptVersion: typeof adaptiveStateRecord.generatorPromptVersion === "string" ? adaptiveStateRecord.generatorPromptVersion : undefined,
      validatorPromptVersion: typeof adaptiveStateRecord.validatorPromptVersion === "string" ? adaptiveStateRecord.validatorPromptVersion : undefined,
      routerPromptVersion: typeof adaptiveStateRecord.routerPromptVersion === "string" ? adaptiveStateRecord.routerPromptVersion : undefined,
    },
  };
}

function inferExamContext(examType: string): ExamContext {
  const normalized = examType.toLowerCase();
  if (normalized.includes("yokdil")) return "YOKDIL";
  if (normalized.includes("ydt")) return "YDT";
  if (normalized.includes("ielts")) return "IELTS";
  if (normalized.includes("yds")) return "YDS";
  return "GENERAL";
}

function inferAdaptiveSkillType(title: string, examType: string, requested?: AdaptiveSkillType): AdaptiveSkillType {
  if (requested) {
    return requested;
  }

  const normalized = `${title} ${examType}`.toLowerCase();
  return normalized.includes("reading") ? "READING" : "GRAMMAR";
}

function inferInitialAdaptiveLevel(values: Array<string | null | undefined>, requested?: CefrLevel): CefrLevel {
  if (requested) {
    return requested;
  }

  for (const value of values) {
    const normalized = String(value ?? "").toUpperCase().trim();
    if (["A2", "B1", "B2", "C1"].includes(normalized)) {
      return normalized as CefrLevel;
    }
  }

  return "B1";
}

function createAdaptiveAttemptState(exam: {
  title: string;
  examType: string;
  cefrLevel: string | null;
  targetStudentLevel: string | null;
  sourceLabel: string | null;
}, config?: AdaptiveAttemptConfig): AdaptiveAttemptState {
  const skillType = inferAdaptiveSkillType(exam.title, exam.examType, config?.skillType);
  const currentLevel = inferInitialAdaptiveLevel([config?.initialCefrLevel, exam.cefrLevel, exam.targetStudentLevel]);
  const questionFormat = inferQuestionFormat(skillType, config?.questionFormat);

  return {
    status: "READY_FOR_QUESTION",
    skillType,
    examContext: config?.examContext ?? inferExamContext(exam.examType),
    currentLevel,
    currentConfidence: 0.55,
    topicTheme: config?.topicTheme ?? exam.sourceLabel ?? exam.title,
    questionFormat,
    minItemsBeforeStop: config?.minItemsBeforeStop ?? 6,
    targetConfidenceToStop: config?.targetConfidenceToStop ?? 0.84,
    maxQuestions: config?.maxQuestions ?? 18,
    history: [],
  };
}

async function createAdaptiveExamVersion(examModuleId: string) {
  return prisma.$transaction(async (tx) => {
    const latestVersion = await tx.examVersion.findFirst({
      where: { examModuleId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    return tx.examVersion.create({
      data: {
        examModuleId,
        versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
        label: `Adaptive session ${new Date().toISOString()}`,
        parseJobStatus: ParseJobStatus.COMPLETED,
        parseConfidence: 1,
        isActive: false,
        parsedSnapshotJson: { mode: "adaptive" } as Prisma.InputJsonValue,
      },
    });
  });
}

async function getOrCreateAdaptiveSection(input: {
  examModuleId: string;
  examVersionId: string;
  skillType: AdaptiveSkillType;
  sectionType: ExamSectionType;
  questionNumber: number;
}) {
  const title = input.skillType === "READING" ? "Adaptive Reading" : "Adaptive Grammar";
  const existing = await prisma.examSection.findFirst({
    where: { examVersionId: input.examVersionId, title },
  });

  if (existing) {
    return prisma.examSection.update({
      where: { id: existing.id },
      data: { questionEndNumber: input.questionNumber },
    });
  }

  return prisma.examSection.create({
    data: {
      examModuleId: input.examModuleId,
      examVersionId: input.examVersionId,
      sectionType: input.sectionType,
      title,
      displayOrder: 1,
      questionStartNumber: input.questionNumber,
      questionEndNumber: input.questionNumber,
    },
  });
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

export async function startExamAttempt(userId: string, examIdentifier: StartExamAttemptInput) {
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

  const deliveryMode = examIdentifier.deliveryMode ?? "STANDARD";
  const existingAttempts = await prisma.examAttempt.findMany({
    where: {
      examModuleId: exam.id,
      studentId: userId,
      status: AttemptStatus.IN_PROGRESS,
    },
    orderBy: { startedAt: "desc" },
  });

  const existingAttempt = existingAttempts.find((attempt) => parseAttemptMetadata(attempt.metadataJson).deliveryMode === deliveryMode);
  if (existingAttempt) {
    return existingAttempt;
  }

  if (deliveryMode === "ADAPTIVE") {
    const version = await createAdaptiveExamVersion(exam.id);
    const expiresAt = new Date(Date.now() + exam.durationMinutes * 60 * 1000);
    const adaptiveState = createAdaptiveAttemptState(exam, examIdentifier.adaptiveConfig);

    const attempt = await prisma.examAttempt.create({
      data: {
        examModuleId: exam.id,
        examVersionId: version.id,
        studentId: userId,
        expiresAt,
        metadataJson: {
          source: "adaptive-start",
          deliveryMode: "ADAPTIVE",
          adaptiveState,
        } as Prisma.InputJsonValue,
      },
    });

    await logAdaptiveAudit({
      actorUserId: userId,
      targetType: "ADAPTIVE_ATTEMPT",
      targetId: attempt.id,
      action: "attempt_started",
      afterJson: {
        examModuleId: exam.id,
        examVersionId: version.id,
        currentLevel: adaptiveState.currentLevel,
        skillType: adaptiveState.skillType,
      },
      metadataJson: {
        deliveryMode: "ADAPTIVE",
        topicTheme: adaptiveState.topicTheme,
      },
    });

    await ensureAdaptiveQuestionForAttempt(userId, attempt.id);

    return prisma.examAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
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
          deliveryMode: "STANDARD",
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

async function ensureAdaptiveQuestionForAttempt(userId: string, attemptId: string) {
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

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new Error("ATTEMPT_NOT_EDITABLE");
  }

  if (attempt.expiresAt.getTime() <= Date.now()) {
    await submitExamAttempt(userId, attemptId, true);
    throw new Error("ATTEMPT_EXPIRED");
  }

  const metadata = parseAttemptMetadata(attempt.metadataJson);
  if (metadata.deliveryMode !== "ADAPTIVE" || !metadata.adaptiveState) {
    throw new Error("ATTEMPT_NOT_ADAPTIVE");
  }

  if (attempt.answers.some((answer) => !answer.selectedAnswer)) {
    return getExamAttemptPayload(userId, attemptId);
  }

  if (
    metadata.adaptiveState.status === "COMPLETED" ||
    metadata.adaptiveState.history.length >= metadata.adaptiveState.maxQuestions
  ) {
    await submitExamAttempt(userId, attemptId, false);
    return getExamAttemptResult(userId, attemptId);
  }

  const nextQuestionNumber = metadata.adaptiveState.history.length + 1;
  const generated = await generateValidatedAdaptiveQuestion({
    skillType: metadata.adaptiveState.skillType,
    targetCefr: metadata.adaptiveState.currentLevel,
    topicTheme: metadata.adaptiveState.topicTheme,
    examContext: metadata.adaptiveState.examContext,
    studentLocale: "tr-TR",
    explanationLanguage: "tr",
    questionFormat: metadata.adaptiveState.questionFormat,
  });

  const mappedQuestion = mapAdaptiveQuestionToExamQuestion(generated.question);
  const section = await getOrCreateAdaptiveSection({
    examModuleId: attempt.examModuleId,
    examVersionId: attempt.examVersionId,
    skillType: metadata.adaptiveState.skillType,
    sectionType: mappedQuestion.sectionType,
    questionNumber: nextQuestionNumber,
  });

  const createdQuestion = await prisma.examQuestion.create({
    data: {
      examModuleId: attempt.examModuleId,
      examVersionId: attempt.examVersionId,
      sectionId: section.id,
      questionNumber: nextQuestionNumber,
      displayOrder: nextQuestionNumber,
      sectionType: mappedQuestion.sectionType,
      questionText: mappedQuestion.questionText,
      optionA: mappedQuestion.optionA,
      optionB: mappedQuestion.optionB,
      optionC: mappedQuestion.optionC,
      optionD: mappedQuestion.optionD,
      optionE: mappedQuestion.optionE,
      correctAnswer: mappedQuestion.correctAnswer,
      manualExplanation: mappedQuestion.manualExplanation,
      difficultyLabel: mappedQuestion.difficultyLabel,
      topicTags: mappedQuestion.topicTags,
      status: "VERIFIED",
      isVerified: true,
      parseConfidence: generated.validation.qualityScore / 100,
    },
  });

  await prisma.examAttemptAnswer.create({
    data: {
      attemptId: attempt.id,
      questionId: createdQuestion.id,
    },
  });

  const nextMetadata: AttemptMetadata = {
    ...metadata,
    adaptiveState: {
      ...metadata.adaptiveState,
      status: "WAITING_FOR_ANSWER",
      generatorPromptVersion: generated.promptVersion,
      validatorPromptVersion: generated.validatorPromptVersion,
      history: [
        ...metadata.adaptiveState.history,
        {
          questionId: createdQuestion.id,
          questionNumber: nextQuestionNumber,
          level: generated.question.targetCefr,
          correct: null,
          responseTimeSeconds: null,
          constructTested: generated.question.constructTested,
          generatedAt: createdQuestion.createdAt.toISOString(),
        },
      ],
    },
  };

  await prisma.examAttempt.update({
    where: { id: attempt.id },
    data: {
      metadataJson: nextMetadata as unknown as Prisma.InputJsonValue,
    },
  });

  await logAdaptiveAudit({
    actorUserId: userId,
    targetType: "ADAPTIVE_ATTEMPT",
    targetId: attempt.id,
    action: "question_generated",
    afterJson: {
      questionId: createdQuestion.id,
      questionNumber: nextQuestionNumber,
      level: generated.question.targetCefr,
      constructTested: generated.question.constructTested,
      validationScore: generated.validation.qualityScore,
    },
    metadataJson: {
      usedFallback: generated.usedFallback,
      promptVersion: generated.promptVersion,
      validatorPromptVersion: generated.validatorPromptVersion,
      model: generated.model,
    },
  });

  return getExamAttemptPayload(userId, attempt.id);
}

export async function submitAdaptiveExamAnswer(userId: string, attemptId: string, input: AdaptiveAnswerInput) {
  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, studentId: userId },
    include: {
      examModule: true,
      answers: {
        include: {
          question: {
            include: { section: true },
          },
        },
        orderBy: { question: { displayOrder: "asc" } },
      },
    },
  });

  if (!attempt) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new Error("ATTEMPT_NOT_EDITABLE");
  }

  const metadata = parseAttemptMetadata(attempt.metadataJson);
  if (metadata.deliveryMode !== "ADAPTIVE" || !metadata.adaptiveState) {
    throw new Error("ATTEMPT_NOT_ADAPTIVE");
  }

  const currentAnswer = attempt.answers.find((answer) => answer.questionId === input.questionId);
  if (!currentAnswer) {
    throw new Error("QUESTION_NOT_FOUND");
  }

  const selectedAnswer = normalizeSelectedAnswer(input.selectedAnswer);
  const isCorrect = Boolean(selectedAnswer && selectedAnswer === normalizeSelectedAnswer(currentAnswer.question.correctAnswer));
  const now = new Date();
  const firstAnsweredAt = currentAnswer.firstAnsweredAt ?? now;
  const responseTimeSeconds = Math.max(0, Math.floor((now.getTime() - currentAnswer.createdAt.getTime()) / 1000));

  await prisma.$transaction([
    prisma.examAttemptAnswer.update({
      where: { id: currentAnswer.id },
      data: {
        selectedAnswer,
        isFlaggedForReview: typeof input.isFlaggedForReview === "boolean" ? input.isFlaggedForReview : currentAnswer.isFlaggedForReview,
        firstAnsweredAt,
        lastAnsweredAt: now,
        isCorrect,
      },
    }),
    prisma.examAttemptAnswerEvent.create({
      data: {
        attemptId,
        questionId: currentAnswer.questionId,
        eventType: "adaptive-answer",
        previousAnswer: currentAnswer.selectedAnswer,
        nextAnswer: selectedAnswer,
        previousFlagState: currentAnswer.isFlaggedForReview,
        nextFlagState: typeof input.isFlaggedForReview === "boolean" ? input.isFlaggedForReview : currentAnswer.isFlaggedForReview,
        metadataJson: {
          responseTimeSeconds,
        } as Prisma.InputJsonValue,
      },
    }),
  ]);

  const nextHistory = metadata.adaptiveState.history.map((entry) =>
    entry.questionId === input.questionId
      ? {
          ...entry,
          correct: isCorrect,
          responseTimeSeconds,
        }
      : entry,
  );
  const answeredHistory = nextHistory.filter((entry) => entry.correct !== null);
  const decisionResult = await decideAdaptiveNextStep({
    itemsAnsweredCount: answeredHistory.length,
    elapsedMinutes: Math.max(0, (Date.now() - attempt.startedAt.getTime()) / 60000),
    maxMinutes: attempt.examModule.durationMinutes,
    currentEstimatedLevel: metadata.adaptiveState.currentLevel,
    recentHistory: answeredHistory.slice(-5).map((entry) => ({
      itemCefr: entry.level,
      correct: Boolean(entry.correct),
      responseTimeSeconds: entry.responseTimeSeconds,
      discriminationHint: entry.level === metadata.adaptiveState.currentLevel ? "high" : "medium",
    })),
    levelConfidenceScore: metadata.adaptiveState.currentConfidence,
    stopRules: {
      minItemsBeforeStop: metadata.adaptiveState.minItemsBeforeStop,
      targetConfidenceToStop: metadata.adaptiveState.targetConfidenceToStop,
      maxConsecutiveCorrectForLevelUp: 3,
      maxConsecutiveWrongForLevelDown: 2,
      maxQuestions: metadata.adaptiveState.maxQuestions,
    },
  });

  const shouldEnd = decisionResult.decision.nextAction === "end_test" || decisionResult.decision.stopRecommendation.shouldEnd;
  const nextMetadata: AttemptMetadata = {
    ...metadata,
    adaptiveState: {
      ...metadata.adaptiveState,
      status: shouldEnd ? "COMPLETED" : "READY_FOR_QUESTION",
      currentLevel: decisionResult.decision.recommendedNextCefrLevel,
      currentConfidence: decisionResult.decision.confidenceScoreOfCurrentLevel,
      history: nextHistory,
      lastDecision: decisionResult.decision as unknown as Record<string, unknown>,
      routerPromptVersion: decisionResult.promptVersion ?? ROUTER_PROMPT_VERSION,
    },
  };

  await prisma.examAttempt.update({
    where: { id: attempt.id },
    data: {
      metadataJson: nextMetadata as unknown as Prisma.InputJsonValue,
    },
  });

  await logAdaptiveAudit({
    actorUserId: userId,
    targetType: "ADAPTIVE_ATTEMPT",
    targetId: attempt.id,
    action: "answer_submitted",
    beforeJson: {
      questionId: currentAnswer.questionId,
      previousAnswer: currentAnswer.selectedAnswer,
      previousLevel: metadata.adaptiveState.currentLevel,
      previousConfidence: metadata.adaptiveState.currentConfidence,
    },
    afterJson: {
      selectedAnswer,
      isCorrect,
      nextLevel: decisionResult.decision.recommendedNextCefrLevel,
      nextConfidence: decisionResult.decision.confidenceScoreOfCurrentLevel,
    },
    metadataJson: {
      responseTimeSeconds,
      routerPromptVersion: decisionResult.promptVersion,
      finished: shouldEnd,
    },
  });

  if (shouldEnd) {
    const result = await submitExamAttempt(userId, attempt.id, false);
    return {
      finished: true,
      decision: decisionResult.decision,
      result,
    };
  }

  const payload = await ensureAdaptiveQuestionForAttempt(userId, attempt.id);

  return {
    finished: false,
    decision: decisionResult.decision,
    payload,
  };
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

  const metadata = parseAttemptMetadata(attempt.metadataJson);

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
    deliveryMode: metadata.deliveryMode,
    adaptive:
      metadata.deliveryMode === "ADAPTIVE" && metadata.adaptiveState
        ? {
            skillType: metadata.adaptiveState.skillType,
            topicTheme: metadata.adaptiveState.topicTheme,
            currentLevel: metadata.adaptiveState.currentLevel,
            currentConfidence: metadata.adaptiveState.currentConfidence,
            history: metadata.adaptiveState.history,
            lastDecision: metadata.adaptiveState.lastDecision ?? null,
            status: metadata.adaptiveState.status,
          }
        : null,
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

  const metadata = parseAttemptMetadata(attempt.metadataJson);
  if (metadata.deliveryMode === "ADAPTIVE") {
    await logAdaptiveAudit({
      actorUserId: userId,
      targetType: "ADAPTIVE_ATTEMPT",
      targetId: attempt.id,
      action: autoSubmitted ? "attempt_auto_submitted" : "attempt_completed",
      metadataJson: {
        deliveryMode: "ADAPTIVE",
        durationSecondsUsed,
      },
    });
  }

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

  const metadata = parseAttemptMetadata(attempt.metadataJson);

  if (attempt.status === AttemptStatus.IN_PROGRESS) {
    if (attempt.expiresAt.getTime() <= Date.now()) {
      await submitExamAttempt(userId, attemptId, true);
      return getExamAttemptResult(userId, attemptId);
    }

    throw new Error("ATTEMPT_NOT_SUBMITTED");
  }

  const explanationMap = attempt.examModule.aiExplanationEnabled
    ? await ensureAttemptExplanationsForUser(userId, attemptId).catch(() => new Map())
    : new Map();

  return {
    attemptId: attempt.id,
    status: attempt.status,
    deliveryMode: metadata.deliveryMode,
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
    adaptiveSummary:
      metadata.deliveryMode === "ADAPTIVE" && metadata.adaptiveState
        ? {
            skillType: metadata.adaptiveState.skillType,
            topicTheme: metadata.adaptiveState.topicTheme,
            finalLevel: metadata.adaptiveState.currentLevel,
            finalConfidence: metadata.adaptiveState.currentConfidence,
            history: metadata.adaptiveState.history,
            lastDecision: metadata.adaptiveState.lastDecision ?? null,
          }
        : null,
    answers: attempt.answers.map((answer) => ({
      ...serializeQuestion(answer.question),
      selectedAnswer: answer.selectedAnswer,
      isFlaggedForReview: answer.isFlaggedForReview,
      isCorrect: answer.isCorrect,
      explanation: explanationMap.get(answer.question.id)?.detailed ?? answer.question.manualExplanation,
      explanationDetail: explanationMap.get(answer.question.id) ?? null,
    })),
  };
}