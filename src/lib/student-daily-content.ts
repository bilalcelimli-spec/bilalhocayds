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
};

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
    return existing.contentJson as StudentDailyContentMap[M];
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
) {
  const tasks: Array<Promise<[DailyContentModule, StudentDailyContentMap[DailyContentModule]]>> = [];

  if (accessState.hasVocabAccess) {
    tasks.push(
      getOrCreateStudentDailyContent(userId, DailyContentModule.VOCABULARY).then((content) => [
        DailyContentModule.VOCABULARY,
        content,
      ]),
    );
  }

  if (accessState.hasReadingAccess) {
    tasks.push(
      getOrCreateStudentDailyContent(userId, DailyContentModule.READING).then((content) => [
        DailyContentModule.READING,
        content,
      ]),
    );
  }

  if (accessState.hasGrammarAccess) {
    tasks.push(
      getOrCreateStudentDailyContent(userId, DailyContentModule.GRAMMAR).then((content) => [
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

export { getIstanbulDayKey };