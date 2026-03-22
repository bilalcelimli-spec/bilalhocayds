import { z } from "zod";

export const cefrLevelSchema = z.enum(["A2", "B1", "B2", "C1"]);
export const examContextSchema = z.enum(["YDS", "YOKDIL", "YDT", "IELTS", "GENERAL"]);
export const adaptiveSkillTypeSchema = z.enum(["GRAMMAR", "READING"]);
export const questionFormatSchema = z.enum([
  "sentence_completion",
  "paragraph_completion",
  "reading_mcq",
  "error_identification",
]);

const optionRecordSchema = z.object({
  A: z.string().min(1),
  B: z.string().min(1),
  C: z.string().min(1),
  D: z.string().min(1),
  E: z.string().min(1),
});

export const adaptiveQuestionInputSchema = z.object({
  skillType: adaptiveSkillTypeSchema,
  targetCefr: cefrLevelSchema,
  topicTheme: z.string().min(1),
  examContext: examContextSchema,
  studentLocale: z.string().default("tr-TR"),
  explanationLanguage: z.enum(["tr", "en", "bilingual"]).default("tr"),
  questionFormat: questionFormatSchema,
  passageMaxWords: z.number().int().min(40).max(260).optional(),
});

export const adaptiveGeneratedQuestionSchema = z.object({
  skillType: adaptiveSkillTypeSchema,
  targetCefr: cefrLevelSchema,
  topicTheme: z.string().min(1),
  examContext: examContextSchema,
  questionFormat: questionFormatSchema,
  constructTested: z.string().min(1),
  passage: z.string().nullable(),
  questionText: z.string().min(1),
  options: optionRecordSchema,
  correctAnswer: z.enum(["A", "B", "C", "D", "E"]),
  rationale: z.object({
    correctOptionReason: z.string().min(1),
    distractorReasons: optionRecordSchema,
  }),
  studentExplanation: z.string().min(1),
  teacherMetadata: z.object({
    difficultyNotes: z.string().min(1),
    commonTrap: z.string().min(1),
    estimatedTimeSeconds: z.number().int().min(15).max(600),
  }),
});

export const adaptiveQuestionValidationSchema = z.object({
  isValid: z.boolean(),
  rejectReasons: z.array(z.string()),
  revisionInstructions: z.array(z.string()),
  qualityScore: z.number().int().min(0).max(100),
});

export const adaptiveRouterInputSchema = z.object({
  itemsAnsweredCount: z.number().int().min(0),
  elapsedMinutes: z.number().min(0),
  maxMinutes: z.number().min(1),
  currentEstimatedLevel: cefrLevelSchema,
  recentHistory: z.array(
    z.object({
      itemCefr: cefrLevelSchema,
      correct: z.boolean(),
      responseTimeSeconds: z.number().int().min(0).nullable().optional(),
      discriminationHint: z.enum(["low", "medium", "high"]),
    }),
  ),
  levelConfidenceScore: z.number().min(0).max(1),
  stopRules: z.object({
    minItemsBeforeStop: z.number().int().min(1),
    targetConfidenceToStop: z.number().min(0).max(1),
    maxConsecutiveCorrectForLevelUp: z.number().int().min(1),
    maxConsecutiveWrongForLevelDown: z.number().int().min(1),
    maxQuestions: z.number().int().min(1).max(100),
  }),
});

export const adaptiveRouterDecisionSchema = z.object({
  nextAction: z.enum(["generate_question", "continue_same_level", "end_test"]),
  recommendedNextCefrLevel: cefrLevelSchema,
  confidenceScoreOfCurrentLevel: z.number().min(0).max(1),
  decisionReason: z.string().min(1),
  evidenceSummary: z.object({
    recentAccuracy: z.number().min(0).max(1),
    recentDifficultyTrend: z.enum(["easier", "stable", "harder", "mixed"]),
    timePressure: z.enum(["low", "medium", "high"]),
    stability: z.enum(["low", "medium", "high"]),
  }),
  stopRecommendation: z.object({
    shouldEnd: z.boolean(),
    reason: z.string().min(1),
  }),
});

export const writingEvaluationInputSchema = z.object({
  promptText: z.string().min(1),
  studentAnswer: z.string().min(1),
  targetExam: z.enum(["YDS", "YOKDIL", "YDT", "IELTS", "TOEFL", "GENERAL"]),
  expectedCefrBand: z.enum(["A2", "B1", "B2", "C1", "C2"]),
  feedbackLanguage: z.enum(["tr", "en", "bilingual"]).default("tr"),
});

export const writingEvaluationSchema = z.object({
  scores: z.object({
    taskAchievement: z.number().int().min(0).max(100),
    coherenceAndCohesion: z.number().int().min(0).max(100),
    lexicalResource: z.number().int().min(0).max(100),
    grammaticalRangeAndAccuracy: z.number().int().min(0).max(100),
  }),
  overallScoreOutOf100: z.number().int().min(0).max(100),
  estimatedCefrLevel: z.enum(["A2", "B1", "B2", "C1", "C2"]),
  ratingConfidence: z.number().int().min(0).max(100),
  summaryJudgement: z.string().min(1),
  strengths: z.array(z.string()),
  priorityImprovements: z.array(z.string()),
  sentenceLevelIssues: z.array(
    z.object({
      original: z.string().min(1),
      issueType: z.enum(["grammar", "vocabulary", "coherence", "punctuation", "spelling", "task_response"]),
      problem: z.string().min(1),
      suggestedFix: z.string().min(1),
      explanation: z.string().min(1),
    }),
  ),
  correctedVersion: z.string().min(1),
  generalFeedback: z.string().min(1),
  teacherNotes: z.object({
    lengthAssessment: z.enum(["too_short", "adequate", "strong"]),
    topicRelevance: z.enum(["low", "medium", "high"]),
    organizationAssessment: z.enum(["low", "medium", "high"]),
    grammarControlAssessment: z.enum(["low", "medium", "high"]),
  }),
});

export const adaptiveAttemptConfigSchema = z.object({
  skillType: adaptiveSkillTypeSchema,
  initialCefrLevel: cefrLevelSchema.optional(),
  topicTheme: z.string().min(1).optional(),
  examContext: examContextSchema.optional(),
  questionFormat: questionFormatSchema.optional(),
  targetConfidenceToStop: z.number().min(0.5).max(0.99).optional(),
  minItemsBeforeStop: z.number().int().min(3).max(20).optional(),
  maxQuestions: z.number().int().min(5).max(60).optional(),
});

export type AdaptiveAttemptConfig = z.infer<typeof adaptiveAttemptConfigSchema>;
export type AdaptiveGeneratedQuestion = z.infer<typeof adaptiveGeneratedQuestionSchema>;
export type AdaptiveQuestionInput = z.infer<typeof adaptiveQuestionInputSchema>;
export type AdaptiveQuestionValidation = z.infer<typeof adaptiveQuestionValidationSchema>;
export type AdaptiveRouterDecision = z.infer<typeof adaptiveRouterDecisionSchema>;
export type AdaptiveRouterInput = z.infer<typeof adaptiveRouterInputSchema>;
export type AdaptiveSkillType = z.infer<typeof adaptiveSkillTypeSchema>;
export type CefrLevel = z.infer<typeof cefrLevelSchema>;
export type ExamContext = z.infer<typeof examContextSchema>;
export type QuestionFormat = z.infer<typeof questionFormatSchema>;
export type WritingEvaluation = z.infer<typeof writingEvaluationSchema>;
export type WritingEvaluationInput = z.infer<typeof writingEvaluationInputSchema>;