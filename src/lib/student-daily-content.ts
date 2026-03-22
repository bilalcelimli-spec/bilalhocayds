import { DailyContentModule, type Prisma } from "@prisma/client";

import {
  createAiProfileOverridesFromStudentContext,
  getDailyGrammarModule,
  getDailyReadingModule,
  getDailyVocabulary,
  type GrammarModuleResponse,
  type ReadingModuleResponse,
  type VocabularyResponse,
} from "@/src/lib/ai-content";
import { prisma } from "@/src/lib/prisma";

const ISTANBUL_TIME_ZONE = "Europe/Istanbul";

type StudentDailyContentMap = {
  [DailyContentModule.VOCABULARY]: VocabularyResponse;
  [DailyContentModule.READING]: ReadingModuleResponse;
  [DailyContentModule.GRAMMAR]: GrammarModuleResponse;
};

type StudentFeatureAccessState = {
  hasVocabAccess?: boolean;
  hasReadingAccess?: boolean;
  hasGrammarAccess?: boolean;
  hasExamAccess?: boolean;
  hasLiveClassesAccess?: boolean;
  hasLiveRecordingsAccess?: boolean;
  hasContentLibraryAccess?: boolean;
  hasAIPlannerAccess?: boolean;
  accessibleExamIds?: string[];
};

const TURKISH_CHARACTER_PATTERN = /[çğıöşüÇĞİÖŞÜ]/;

function getWordCount(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function isReadingContentValid(content: ReadingModuleResponse) {
  if (!Array.isArray(content.passages) || content.passages.length !== 3) {
    return false;
  }

  return content.passages.every((passage) => {
    const wordCount = getWordCount(passage.passage);

    if (wordCount < 150 || wordCount > 250) {
      return false;
    }

    if (TURKISH_CHARACTER_PATTERN.test(passage.title) || TURKISH_CHARACTER_PATTERN.test(passage.passage)) {
      return false;
    }

    if (!Array.isArray(passage.questions) || passage.questions.length === 0) {
      return false;
    }

    return passage.questions.every((question) => {
      if (!Array.isArray(question.options) || question.options.length !== 4) {
        return false;
      }

      return question.options.includes(question.answer);
    });
  });
}

function isStoredContentStillValid<M extends DailyContentModule>(
  moduleKey: M,
  content: StudentDailyContentMap[M],
) {
  if (moduleKey === DailyContentModule.READING) {
    return isReadingContentValid(content as ReadingModuleResponse);
  }

  return true;
}

function getIstanbulDayKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

async function getStudentProfileContext(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      interestTags: true,
      targetExam: true,
      targetScore: true,
      currentLevel: true,
      dailyGoalMinutes: true,
    },
  });

  return {
    profile,
    vocabularyProfile: createAiProfileOverridesFromStudentContext({
      targetExam: profile?.targetExam,
      currentLevel: profile?.currentLevel,
      targetScore: profile?.targetScore,
      dailyGoalMinutes: profile?.dailyGoalMinutes,
      interestTags: profile?.interestTags,
      focusSkill: "vocabulary",
    }),
    readingProfile: createAiProfileOverridesFromStudentContext({
      targetExam: profile?.targetExam,
      currentLevel: profile?.currentLevel,
      targetScore: profile?.targetScore,
      dailyGoalMinutes: profile?.dailyGoalMinutes,
      interestTags: profile?.interestTags,
      focusSkill: "reading",
    }),
    grammarProfile: createAiProfileOverridesFromStudentContext({
      targetExam: profile?.targetExam,
      currentLevel: profile?.currentLevel,
      targetScore: profile?.targetScore,
      dailyGoalMinutes: profile?.dailyGoalMinutes,
      interestTags: profile?.interestTags,
    }),
  };
}

async function generateStudentDailyContent<M extends DailyContentModule>(
  userId: string,
  moduleKey: M,
  date: Date,
): Promise<StudentDailyContentMap[M]> {
  const context = await getStudentProfileContext(userId);

  if (moduleKey === DailyContentModule.VOCABULARY) {
    return getDailyVocabulary({
      date,
      profile: context.vocabularyProfile,
    }) as Promise<StudentDailyContentMap[M]>;
  }

  if (moduleKey === DailyContentModule.READING) {
    return getDailyReadingModule({
      date,
      interestTags: context.profile?.interestTags ?? [],
      profile: context.readingProfile,
    }) as Promise<StudentDailyContentMap[M]>;
  }

  return getDailyGrammarModule({
    date,
    profile: context.grammarProfile,
  }) as Promise<StudentDailyContentMap[M]>;
}

export async function getOrCreateStudentDailyContent<M extends DailyContentModule>(
  userId: string,
  moduleKey: M,
  date = new Date(),
): Promise<StudentDailyContentMap[M]> {
  const dayKey = getIstanbulDayKey(date);
  const existing = await prisma.studentDailyContent.findUnique({
    where: {
      userId_dayKey_moduleKey: {
        userId,
        dayKey,
        moduleKey,
      },
    },
    select: {
      contentJson: true,
    },
  });

  if (existing) {
    const storedContent = existing.contentJson as StudentDailyContentMap[M];

    if (isStoredContentStillValid(moduleKey, storedContent)) {
      return storedContent;
    }
  }

  const generated = await generateStudentDailyContent(userId, moduleKey, date);

  await prisma.studentDailyContent.upsert({
    where: {
      userId_dayKey_moduleKey: {
        userId,
        dayKey,
        moduleKey,
      },
    },
    update: {
      contentJson: generated as unknown as Prisma.InputJsonValue,
      generatedAt: new Date(generated.generatedAt),
    },
    create: {
      userId,
      dayKey,
      moduleKey,
      contentJson: generated as unknown as Prisma.InputJsonValue,
      generatedAt: new Date(generated.generatedAt),
    },
  });

  return generated;
}

export async function ensureTodayStudentDailyContent(
  userId: string,
  accessState: StudentFeatureAccessState,
  date = new Date(),
) {
  const tasks: Array<Promise<[DailyContentModule, StudentDailyContentMap[DailyContentModule]]>> = [];

  if (accessState.hasVocabAccess) {
    tasks.push(
      getOrCreateStudentDailyContent(userId, DailyContentModule.VOCABULARY, date).then((content) => [
        DailyContentModule.VOCABULARY,
        content,
      ]),
    );
  }

  if (accessState.hasReadingAccess) {
    tasks.push(
      getOrCreateStudentDailyContent(userId, DailyContentModule.READING, date).then((content) => [
        DailyContentModule.READING,
        content,
      ]),
    );
  }

  if (accessState.hasGrammarAccess) {
    tasks.push(
      getOrCreateStudentDailyContent(userId, DailyContentModule.GRAMMAR, date).then((content) => [
        DailyContentModule.GRAMMAR,
        content,
      ]),
    );
  }

  const entries = await Promise.all(tasks);

  return entries.reduce<{
    vocabulary?: VocabularyResponse;
    reading?: ReadingModuleResponse;
    grammar?: GrammarModuleResponse;
  }>((accumulator, [moduleKey, content]) => {
    if (moduleKey === DailyContentModule.VOCABULARY) {
      accumulator.vocabulary = content as VocabularyResponse;
    }

    if (moduleKey === DailyContentModule.READING) {
      accumulator.reading = content as ReadingModuleResponse;
    }

    if (moduleKey === DailyContentModule.GRAMMAR) {
      accumulator.grammar = content as GrammarModuleResponse;
    }

    return accumulator;
  }, {});
}

export async function getEffectiveStudentAccess(userId: string): Promise<StudentFeatureAccessState> {
  const now = new Date();
  const [activeSubscription, manualFeatureAccess, manualExamAccesses] = await Promise.all([
    prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "TRIALING"] },
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        plan: {
          select: {
            includesReading: true,
            includesGrammar: true,
            includesVocab: true,
            includesExam: true,
            includesLiveClass: true,
            includesAIPlanner: true,
            examModules: {
              select: {
                examModuleId: true,
              },
            },
          },
        },
      },
    }),
    prisma.studentFeatureAccess.findUnique({
      where: { userId },
      select: {
        hasReadingAccess: true,
        hasGrammarAccess: true,
        hasVocabAccess: true,
        hasExamAccess: true,
        hasLiveClassesAccess: true,
        hasLiveRecordingsAccess: true,
        hasContentLibraryAccess: true,
        hasAIPlannerAccess: true,
      },
    }),
    prisma.studentFeatureExamAccess.findMany({
      where: { userId },
      select: { examModuleId: true },
    }),
  ]);

  if (manualFeatureAccess) {
    return {
      hasReadingAccess: manualFeatureAccess.hasReadingAccess,
      hasGrammarAccess: manualFeatureAccess.hasGrammarAccess,
      hasVocabAccess: manualFeatureAccess.hasVocabAccess,
      hasExamAccess: manualFeatureAccess.hasExamAccess,
      hasLiveClassesAccess: manualFeatureAccess.hasLiveClassesAccess,
      hasLiveRecordingsAccess: manualFeatureAccess.hasLiveRecordingsAccess,
      hasContentLibraryAccess: manualFeatureAccess.hasContentLibraryAccess,
      hasAIPlannerAccess: manualFeatureAccess.hasAIPlannerAccess,
      accessibleExamIds: manualExamAccesses.map((item) => item.examModuleId),
    };
  }

  return {
    hasReadingAccess: Boolean(activeSubscription?.plan.includesReading),
    hasGrammarAccess: Boolean(activeSubscription?.plan.includesGrammar),
    hasVocabAccess: Boolean(activeSubscription?.plan.includesVocab),
    hasExamAccess: Boolean(activeSubscription?.plan.includesExam),
    hasLiveClassesAccess: Boolean(activeSubscription?.plan.includesLiveClass),
    hasLiveRecordingsAccess: Boolean(activeSubscription?.plan.includesLiveClass),
    hasContentLibraryAccess: Boolean(activeSubscription),
    hasAIPlannerAccess: Boolean(activeSubscription?.plan.includesAIPlanner),
    accessibleExamIds: activeSubscription?.plan.examModules.map((item) => item.examModuleId) ?? [],
  };
}

export async function generateDailyContentForEligibleStudents(date = new Date()) {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, email: true },
  });

  const results = await Promise.all(
    students.map(async (student) => {
      const accessState = await getEffectiveStudentAccess(student.id);
      const hasAnyDailyModuleAccess = Boolean(
        accessState.hasVocabAccess || accessState.hasReadingAccess || accessState.hasGrammarAccess,
      );

      if (!hasAnyDailyModuleAccess) {
        return {
          userId: student.id,
          email: student.email,
          generated: [],
        };
      }

      const generated = await ensureTodayStudentDailyContent(student.id, accessState, date);

      return {
        userId: student.id,
        email: student.email,
        generated: [
          generated.vocabulary ? DailyContentModule.VOCABULARY : null,
          generated.reading ? DailyContentModule.READING : null,
          generated.grammar ? DailyContentModule.GRAMMAR : null,
        ].filter((value): value is DailyContentModule => value !== null),
      };
    }),
  );

  return {
    dayKey: getIstanbulDayKey(date),
    totalStudents: students.length,
    generatedStudents: results.filter((result) => result.generated.length > 0).length,
    results,
  };
}

export { getIstanbulDayKey };