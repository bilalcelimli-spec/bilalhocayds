import { type ExamSectionType } from "@prisma/client";

import { callAiJson } from "@/src/lib/ai-json";
import {
  adaptiveGeneratedQuestionSchema,
  adaptiveQuestionInputSchema,
  adaptiveQuestionValidationSchema,
  adaptiveRouterDecisionSchema,
  adaptiveRouterInputSchema,
  type AdaptiveGeneratedQuestion,
  type AdaptiveQuestionInput,
  type AdaptiveQuestionValidation,
  type AdaptiveRouterDecision,
  type AdaptiveRouterInput,
  type AdaptiveSkillType,
  type CefrLevel,
  type QuestionFormat,
  type WritingEvaluation,
  type WritingEvaluationInput,
  writingEvaluationSchema,
} from "@/src/lib/adaptive-exam-schemas";

const GENERATOR_PROMPT_VERSION = "adaptive-question-v1";
const ROUTER_PROMPT_VERSION = "adaptive-router-v1";
const VALIDATOR_PROMPT_VERSION = "adaptive-validator-v1";
const WRITING_PROMPT_VERSION = "adaptive-writing-v1";

const QUESTION_QUALITY_THRESHOLD = 72;
const ROUTER_QUALITY_THRESHOLD = 65;
const WRITING_QUALITY_THRESHOLD = 68;

const CEFR_ORDER: CefrLevel[] = ["A2", "B1", "B2", "C1"];

function clampLevel(level: CefrLevel, delta: number) {
  const currentIndex = CEFR_ORDER.indexOf(level);
  const nextIndex = Math.max(0, Math.min(CEFR_ORDER.length - 1, currentIndex + delta));
  return CEFR_ORDER[nextIndex];
}

function inferQuestionFormat(skillType: AdaptiveSkillType, requested?: QuestionFormat): QuestionFormat {
  if (requested) {
    return requested;
  }

  return skillType === "READING" ? "reading_mcq" : "sentence_completion";
}

function inferSectionType(skillType: AdaptiveSkillType, format: QuestionFormat): ExamSectionType {
  if (skillType === "READING") {
    if (format === "paragraph_completion") return "PARAGRAPH_COMPLETION";
    return "READING_COMPREHENSION";
  }

  if (format === "paragraph_completion") return "PARAGRAPH_COMPLETION";
  if (format === "error_identification") return "GRAMMAR";
  return "SENTENCE_COMPLETION";
}

function createFallbackQuestion(input: AdaptiveQuestionInput): AdaptiveGeneratedQuestion {
  const isReading = input.skillType === "READING";
  const questionText = isReading
    ? "According to the passage, what is the main reason the writer supports gradual adaptation?"
    : "If students ___ short review sessions regularly, they would retain information more effectively.";
  const passage = isReading
    ? "Many exam coaches now recommend shorter but more frequent study sessions. They argue that students build stronger long-term retention when review becomes a habit rather than an emergency response before an exam. This approach does not eliminate the need for hard work, but it makes progress more stable and easier to maintain over time."
    : null;
  const options = isReading
    ? {
        A: "Because intense study is always more motivating",
        B: "Because regular review creates steadier long-term learning",
        C: "Because students should avoid difficult topics",
        D: "Because teachers prefer shorter classes",
        E: "Because exams no longer require memorization",
      }
    : {
        A: "kept",
        B: "keep",
        C: "had kept",
        D: "would keep",
        E: "have kept",
      };
  const correctAnswer = isReading ? "B" : "B";

  return {
    skillType: input.skillType,
    targetCefr: input.targetCefr,
    topicTheme: input.topicTheme,
    examContext: input.examContext,
    questionFormat: inferQuestionFormat(input.skillType, input.questionFormat),
    constructTested: isReading ? "main idea" : "second conditional form",
    passage,
    questionText,
    options,
    correctAnswer,
    rationale: {
      correctOptionReason: isReading
        ? "The passage explicitly supports regular review because it leads to stronger long-term retention."
        : "The sentence expresses a present unreal condition, so the base verb 'keep' is required after 'if students'.",
      distractorReasons: isReading
        ? {
            A: "The passage does not claim intense study is more motivating.",
            B: "This is the only option that matches the writer's stated argument.",
            C: "The writer does not suggest avoiding difficult topics.",
            D: "Teacher preference is not the writer's main reason.",
            E: "The passage never says memorization is unnecessary.",
          }
        : {
            A: "The tense does not fit the if-clause in this structure.",
            B: "This is the grammatically correct verb form in the sentence.",
            C: "Past perfect is incorrect for this present unreal meaning.",
            D: "'Would' should not be used in the if-clause here.",
            E: "Present perfect does not match the conditional pattern.",
          },
    },
    studentExplanation: isReading
      ? "The writer says frequent review helps students remember more over time. That idea matches option B."
      : "This sentence uses a conditional pattern about an unreal present result. After 'if students', we use 'keep', so B is correct.",
    teacherMetadata: {
      difficultyNotes: `${input.targetCefr} seviyesinde tek yapı ve açık bağlam sinyali kullanıldı.`,
      commonTrap: isReading ? "surface keyword matching" : "using would in the if-clause",
      estimatedTimeSeconds: isReading ? 90 : 45,
    },
  };
}

function validateQuestionDeterministically(question: AdaptiveGeneratedQuestion): AdaptiveQuestionValidation {
  const optionValues = Object.values(question.options).map((value) => value.trim().toLowerCase());
  const duplicateCount = optionValues.length - new Set(optionValues).size;
  const rejectReasons: string[] = [];

  if (duplicateCount > 0) {
    rejectReasons.push("Duplicate answer options detected.");
  }

  if (!question.questionText.trim()) {
    rejectReasons.push("Question text is empty.");
  }

  if (question.skillType === "READING" && !question.passage) {
    rejectReasons.push("Reading item is missing a passage.");
  }

  if (!question.options[question.correctAnswer]?.trim()) {
    rejectReasons.push("Correct answer does not exist in options.");
  }

  return {
    isValid: rejectReasons.length === 0,
    rejectReasons,
    revisionInstructions: rejectReasons.length === 0 ? [] : ["Revise option uniqueness and skill alignment."],
    qualityScore: rejectReasons.length === 0 ? 84 : Math.max(25, 70 - rejectReasons.length * 15),
  };
}

function buildQuestionGenerationPrompts(input: AdaptiveQuestionInput) {
  const systemPrompt = [
    "You are an English assessment content engine specialized in CEFR-aligned multiple-choice exam items for Turkish learners.",
    "Generate exactly one original item.",
    "Stay within the requested CEFR level.",
    "Return valid JSON only.",
    `Prompt version: ${GENERATOR_PROMPT_VERSION}`,
  ].join(" ");

  const userPrompt = JSON.stringify({
    skill_type: input.skillType,
    target_cefr: input.targetCefr,
    topic_theme: input.topicTheme,
    exam_context: input.examContext,
    student_locale: input.studentLocale,
    explanation_language: input.explanationLanguage,
    question_format: input.questionFormat,
    constraints: {
      originalityRequired: true,
      optionCount: 5,
      readingPassageMaxWords: input.passageMaxWords ?? 180,
    },
    output_contract: {
      keys: [
        "skillType",
        "targetCefr",
        "topicTheme",
        "examContext",
        "questionFormat",
        "constructTested",
        "passage",
        "questionText",
        "options",
        "correctAnswer",
        "rationale",
        "studentExplanation",
        "teacherMetadata",
      ],
    },
  });

  return { systemPrompt, userPrompt };
}

function buildValidationPrompts(question: AdaptiveGeneratedQuestion) {
  return {
    systemPrompt: [
      "You are a CEFR-aligned question quality reviewer.",
      "Check validity, ambiguity, single-answer quality, and distractor plausibility.",
      "Return valid JSON only.",
      `Prompt version: ${VALIDATOR_PROMPT_VERSION}`,
    ].join(" "),
    userPrompt: JSON.stringify(question),
  };
}

function buildRouterPrompts(input: AdaptiveRouterInput) {
  return {
    systemPrompt: [
      "You are an adaptive testing decision assistant for a CEFR-based English assessment.",
      "Use the supplied evidence only.",
      "Return valid JSON only.",
      `Prompt version: ${ROUTER_PROMPT_VERSION}`,
    ].join(" "),
    userPrompt: JSON.stringify({
      items_answered_count: input.itemsAnsweredCount,
      elapsed_minutes: input.elapsedMinutes,
      max_minutes: input.maxMinutes,
      current_estimated_level: input.currentEstimatedLevel,
      recent_history: input.recentHistory,
      level_confidence_score: input.levelConfidenceScore,
      stop_rules: input.stopRules,
    }),
  };
}

function buildWritingPrompts(input: WritingEvaluationInput) {
  return {
    systemPrompt: [
      "You are a certified English writing assessor for CEFR-aligned exam preparation.",
      "Evaluate conservatively and return valid JSON only.",
      `Prompt version: ${WRITING_PROMPT_VERSION}`,
    ].join(" "),
    userPrompt: JSON.stringify({
      prompt_text: input.promptText,
      student_answer: input.studentAnswer,
      target_exam: input.targetExam,
      expected_cefr_band: input.expectedCefrBand,
      feedback_language: input.feedbackLanguage,
    }),
  };
}

function inferDifficultyTrend(history: AdaptiveRouterInput["recentHistory"]) {
  if (history.length < 2) {
    return "stable" as const;
  }

  const indices = history.map((item) => CEFR_ORDER.indexOf(item.itemCefr));
  const deltas = indices.slice(1).map((value, index) => value - indices[index]);
  const positive = deltas.filter((value) => value > 0).length;
  const negative = deltas.filter((value) => value < 0).length;

  if (positive > 0 && negative > 0) return "mixed";
  if (positive > 0) return "harder";
  if (negative > 0) return "easier";
  return "stable";
}

function deterministicRouter(input: AdaptiveRouterInput): AdaptiveRouterDecision {
  const answered = input.recentHistory.length;
  const recentAccuracy = answered > 0
    ? input.recentHistory.filter((item) => item.correct).length / answered
    : 0;
  const lastCorrectStreak = [...input.recentHistory].reverse().findIndex((item) => !item.correct);
  const correctStreak = lastCorrectStreak === -1 ? answered : lastCorrectStreak;
  const lastWrongStreak = [...input.recentHistory].reverse().findIndex((item) => item.correct);
  const wrongStreak = lastWrongStreak === -1 ? answered : lastWrongStreak;
  const elapsedRatio = input.elapsedMinutes / input.maxMinutes;
  const timePressure = elapsedRatio >= 0.9 ? "high" : elapsedRatio >= 0.65 ? "medium" : "low";
  const difficultyTrend = inferDifficultyTrend(input.recentHistory);

  let nextLevel = input.currentEstimatedLevel;
  let nextAction: AdaptiveRouterDecision["nextAction"] = "continue_same_level";
  let confidence = input.levelConfidenceScore;
  let reason = "Recent evidence is mixed, so the next item should stay near the current level.";

  if (correctStreak >= input.stopRules.maxConsecutiveCorrectForLevelUp) {
    nextLevel = clampLevel(input.currentEstimatedLevel, 1);
    nextAction = "generate_question";
    confidence = Math.min(0.99, confidence + 0.12);
    reason = "Recent correct streak supports a moderate upward move.";
  } else if (wrongStreak >= input.stopRules.maxConsecutiveWrongForLevelDown) {
    nextLevel = clampLevel(input.currentEstimatedLevel, -1);
    nextAction = "generate_question";
    confidence = Math.max(0.15, confidence - 0.12);
    reason = "Recent wrong streak indicates the current level may be too high.";
  } else {
    confidence = Math.min(0.99, Math.max(0.1, confidence + (recentAccuracy - 0.5) * 0.1));
    nextAction = "generate_question";
  }

  const shouldEnd =
    input.itemsAnsweredCount >= input.stopRules.maxQuestions ||
    input.elapsedMinutes >= input.maxMinutes ||
    (input.itemsAnsweredCount >= input.stopRules.minItemsBeforeStop && confidence >= input.stopRules.targetConfidenceToStop);

  if (shouldEnd) {
    nextAction = "end_test";
  }

  return {
    nextAction,
    recommendedNextCefrLevel: nextLevel,
    confidenceScoreOfCurrentLevel: Number(confidence.toFixed(2)),
    decisionReason: shouldEnd ? "Stop conditions are satisfied based on confidence, time, or total items." : reason,
    evidenceSummary: {
      recentAccuracy: Number(recentAccuracy.toFixed(2)),
      recentDifficultyTrend: difficultyTrend,
      timePressure,
      stability: confidence >= 0.8 ? "high" : confidence >= 0.6 ? "medium" : "low",
    },
    stopRecommendation: {
      shouldEnd,
      reason: shouldEnd ? "Adaptive stop rule satisfied." : "More evidence is needed before ending the test.",
    },
  };
}

function clampQualityScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function evaluateRouterQuality(decision: AdaptiveRouterDecision) {
  const checks: string[] = [];

  if (decision.decisionReason.trim().length >= 30) {
    checks.push("Decision reason is sufficiently specific.");
  } else {
    checks.push("Decision reason is too short.");
  }

  if (decision.stopRecommendation.shouldEnd && decision.nextAction !== "end_test") {
    checks.push("Stop recommendation conflicts with nextAction.");
  } else {
    checks.push("Stop recommendation and nextAction are consistent.");
  }

  if (decision.confidenceScoreOfCurrentLevel >= 0 && decision.confidenceScoreOfCurrentLevel <= 1) {
    checks.push("Confidence score is in expected range.");
  } else {
    checks.push("Confidence score is out of expected range.");
  }

  const consistencyPenalty = checks.some((item) => item.includes("conflicts")) ? 15 : 0;
  const brevityPenalty = checks.some((item) => item.includes("too short")) ? 10 : 0;
  const score =
    decision.evidenceSummary.recentAccuracy * 40 +
    decision.confidenceScoreOfCurrentLevel * 35 +
    (decision.evidenceSummary.stability === "high" ? 15 : decision.evidenceSummary.stability === "medium" ? 10 : 6) +
    (decision.nextAction === "generate_question" || decision.nextAction === "end_test" ? 10 : 6) -
    consistencyPenalty -
    brevityPenalty;

  return {
    qualityScore: clampQualityScore(score),
    qualityChecks: checks,
  };
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function deterministicWritingEvaluation(input: WritingEvaluationInput): WritingEvaluation {
  const sentences = splitSentences(input.studentAnswer);
  const words = input.studentAnswer.trim().split(/\s+/).filter(Boolean);
  const short = words.length < 60;
  const transitionCount = (input.studentAnswer.match(/\bhowever\b|\btherefore\b|\bmoreover\b|\bfirstly\b|\bin addition\b/gi) ?? []).length;
  const grammarIssue = /\bi am agree\b|\bmore better\b|\bhe go\b|\bshe go\b/i.exec(input.studentAnswer);
  const lengthBonus = Math.min(20, Math.floor(words.length / 12));
  const coherenceBase = Math.min(85, 45 + transitionCount * 8 + sentences.length * 3);
  const grammarPenalty = grammarIssue ? 18 : 6;
  const grammar = Math.max(35, 70 + lengthBonus - grammarPenalty);
  const lexical = Math.max(40, Math.min(88, 52 + new Set(words.map((word) => word.toLowerCase())).size / 4));
  const task = short ? 48 : Math.min(90, 58 + lengthBonus);
  const coherence = Math.max(40, short ? coherenceBase - 12 : coherenceBase);
  const overall = Math.round((task + coherence + lexical + grammar) / 4);
  const estimatedCefrLevel = overall >= 85 ? "C1" : overall >= 70 ? "B2" : overall >= 55 ? "B1" : "A2";

  return {
    scores: {
      taskAchievement: task,
      coherenceAndCohesion: coherence,
      lexicalResource: Math.round(lexical),
      grammaticalRangeAndAccuracy: Math.round(grammar),
    },
    overallScoreOutOf100: overall,
    estimatedCefrLevel,
    ratingConfidence: short ? 61 : 77,
    summaryJudgement: short
      ? "The response shows some control, but it is too brief for a high-confidence evaluation."
      : "The response addresses the task with workable control, but clearer development and cleaner grammar would raise the score.",
    strengths: short ? ["Basic task awareness"] : ["Task focus", "Some organizational control"],
    priorityImprovements: [
      "Develop ideas with clearer supporting details.",
      "Use more accurate sentence structures.",
      "Expand vocabulary with more precise academic wording.",
    ],
    sentenceLevelIssues: grammarIssue
      ? [
          {
            original: grammarIssue[0],
            issueType: "grammar",
            problem: "The phrase is grammatically incorrect.",
            suggestedFix: grammarIssue[0].replace(/i am agree/i, "I agree").replace(/more better/i, "better"),
            explanation: "Use the correct verb pattern or comparative form.",
          },
        ]
      : [
          {
            original: sentences[0] ?? input.studentAnswer,
            issueType: "coherence",
            problem: "The response would be stronger with clearer supporting development.",
            suggestedFix: "Add one concrete example after the main claim.",
            explanation: "Supporting details improve task achievement and coherence.",
          },
        ],
    correctedVersion: input.studentAnswer.trim(),
    generalFeedback: short
      ? "Cevabın konuya temas ediyor ancak daha yüksek puan için fikirlerini örneklerle geliştirmen gerekiyor."
      : "Cevap genel olarak anlaşılır. Daha güçlü bağlaçlar, daha net paragraf akışı ve daha kontrollü grammar kullanımı puanı yükseltir.",
    teacherNotes: {
      lengthAssessment: short ? "too_short" : words.length > 180 ? "strong" : "adequate",
      topicRelevance: "high",
      organizationAssessment: coherence >= 75 ? "high" : coherence >= 60 ? "medium" : "low",
      grammarControlAssessment: grammar >= 75 ? "high" : grammar >= 60 ? "medium" : "low",
    },
  };
}

function evaluateWritingQuality(evaluation: WritingEvaluation) {
  const checks: string[] = [];

  if (evaluation.summaryJudgement.trim().length >= 20) {
    checks.push("Summary judgement has sufficient detail.");
  } else {
    checks.push("Summary judgement is too brief.");
  }

  if (evaluation.priorityImprovements.length >= 2) {
    checks.push("Priority improvements are actionable.");
  } else {
    checks.push("Priority improvements are insufficient.");
  }

  if (evaluation.sentenceLevelIssues.length >= 1) {
    checks.push("Sentence-level issue list is present.");
  } else {
    checks.push("Sentence-level issue list is missing.");
  }

  const score = evaluation.overallScoreOutOf100 * 0.75 + evaluation.ratingConfidence * 0.25;

  return {
    qualityScore: clampQualityScore(score),
    qualityChecks: checks,
  };
}

export function mapAdaptiveQuestionToExamQuestion(question: AdaptiveGeneratedQuestion) {
  const sectionType = inferSectionType(question.skillType, question.questionFormat);

  return {
    sectionType,
    questionText: question.passage
      ? `${question.passage}\n\n${question.questionText}`
      : question.questionText,
    optionA: question.options.A,
    optionB: question.options.B,
    optionC: question.options.C,
    optionD: question.options.D,
    optionE: question.options.E,
    correctAnswer: question.correctAnswer,
    manualExplanation: question.studentExplanation,
    difficultyLabel: question.targetCefr,
    topicTags: [question.topicTheme, question.constructTested, `adaptive:${question.skillType.toLowerCase()}`],
  };
}

export async function generateValidatedAdaptiveQuestion(
  rawInput: AdaptiveQuestionInput,
): Promise<{
  question: AdaptiveGeneratedQuestion;
  validation: AdaptiveQuestionValidation;
  promptVersion: string;
  validatorPromptVersion: string;
  model: string;
  usedFallback: boolean;
  fallbackReason: string | null;
  qualityScore: number;
  qualityChecks: string[];
  aiTelemetry: {
    providerAvailable: boolean;
    traceId: string;
    latencyMs: number;
    attempts: number;
    errorType: string | null;
  };
}> {
  const input = adaptiveQuestionInputSchema.parse({
    ...rawInput,
    questionFormat: inferQuestionFormat(rawInput.skillType, rawInput.questionFormat),
  });

  const generatedFallback = createFallbackQuestion(input);
  const generatorPrompts = buildQuestionGenerationPrompts(input);
  const generation = await callAiJson({
    schema: adaptiveGeneratedQuestionSchema,
    ...generatorPrompts,
    temperature: 0.45,
  });

  const question = generation.data ?? generatedFallback;
  const deterministicValidation = validateQuestionDeterministically(question);
  const validationPrompts = buildValidationPrompts(question);
  const aiValidation = await callAiJson({
    schema: adaptiveQuestionValidationSchema,
    ...validationPrompts,
    temperature: 0.1,
  });

  const validation = aiValidation.data ?? deterministicValidation;
  const finalValidation = validation.isValid ? validation : deterministicValidation;
  const qualityChecks = [...finalValidation.rejectReasons];
  const failedQualityGate = finalValidation.qualityScore < QUESTION_QUALITY_THRESHOLD;

  if (failedQualityGate) {
    qualityChecks.push(`Quality score below threshold: ${finalValidation.qualityScore}/${QUESTION_QUALITY_THRESHOLD}.`);
  }

  const finalQuestion = finalValidation.isValid && !failedQualityGate ? question : generatedFallback;
  const finalValidationResult = finalValidation.isValid && !failedQualityGate
    ? finalValidation
    : validateQuestionDeterministically(finalQuestion);
  const usedFallback = !generation.data || !finalValidation.isValid || failedQualityGate;
  const fallbackReason = !generation.data
    ? generation.errorType ?? "generation_failed"
    : !finalValidation.isValid
      ? "validation_failed"
      : failedQualityGate
        ? "quality_threshold_not_met"
        : null;

  return {
    question: finalQuestion,
    validation: finalValidationResult,
    promptVersion: GENERATOR_PROMPT_VERSION,
    validatorPromptVersion: VALIDATOR_PROMPT_VERSION,
    model: generation.model,
    usedFallback,
    fallbackReason,
    qualityScore: finalValidationResult.qualityScore,
    qualityChecks,
    aiTelemetry: {
      providerAvailable: generation.providerAvailable,
      traceId: generation.traceId,
      latencyMs: generation.latencyMs,
      attempts: generation.attempts,
      errorType: generation.errorType,
    },
  };
}

export async function decideAdaptiveNextStep(rawInput: AdaptiveRouterInput): Promise<{
  decision: AdaptiveRouterDecision;
  promptVersion: string;
  model: string;
  usedFallback: boolean;
  fallbackReason: string | null;
  qualityScore: number;
  qualityChecks: string[];
  aiTelemetry: {
    providerAvailable: boolean;
    traceId: string;
    latencyMs: number;
    attempts: number;
    errorType: string | null;
  };
}> {
  const input = adaptiveRouterInputSchema.parse(rawInput);
  const fallbackDecision = deterministicRouter(input);
  const prompts = buildRouterPrompts(input);
  const aiDecision = await callAiJson({
    schema: adaptiveRouterDecisionSchema,
    ...prompts,
    temperature: 0.15,
  });

  const candidateDecision = aiDecision.data ?? fallbackDecision;
  const quality = evaluateRouterQuality(candidateDecision);
  const failedQualityGate = quality.qualityScore < ROUTER_QUALITY_THRESHOLD;

  return {
    decision: aiDecision.data && !failedQualityGate ? aiDecision.data : fallbackDecision,
    promptVersion: ROUTER_PROMPT_VERSION,
    model: aiDecision.model,
    usedFallback: !aiDecision.data || failedQualityGate,
    fallbackReason: !aiDecision.data
      ? aiDecision.errorType ?? "router_generation_failed"
      : failedQualityGate
        ? "quality_threshold_not_met"
        : null,
    qualityScore: quality.qualityScore,
    qualityChecks: quality.qualityChecks,
    aiTelemetry: {
      providerAvailable: aiDecision.providerAvailable,
      traceId: aiDecision.traceId,
      latencyMs: aiDecision.latencyMs,
      attempts: aiDecision.attempts,
      errorType: aiDecision.errorType,
    },
  };
}

export async function evaluateWriting(rawInput: WritingEvaluationInput): Promise<{
  evaluation: WritingEvaluation;
  promptVersion: string;
  model: string;
  usedFallback: boolean;
  fallbackReason: string | null;
  qualityScore: number;
  qualityChecks: string[];
  aiTelemetry: {
    providerAvailable: boolean;
    traceId: string;
    latencyMs: number;
    attempts: number;
    errorType: string | null;
  };
}> {
  const input = rawInput;
  const fallbackEvaluation = deterministicWritingEvaluation(input);
  const prompts = buildWritingPrompts(input);
  const aiEvaluation = await callAiJson({
    schema: writingEvaluationSchema,
    ...prompts,
    temperature: 0.2,
  });

  const candidateEvaluation = aiEvaluation.data ?? fallbackEvaluation;
  const quality = evaluateWritingQuality(candidateEvaluation);
  const failedQualityGate = quality.qualityScore < WRITING_QUALITY_THRESHOLD;

  return {
    evaluation: aiEvaluation.data && !failedQualityGate ? aiEvaluation.data : fallbackEvaluation,
    promptVersion: WRITING_PROMPT_VERSION,
    model: aiEvaluation.model,
    usedFallback: !aiEvaluation.data || failedQualityGate,
    fallbackReason: !aiEvaluation.data
      ? aiEvaluation.errorType ?? "writing_generation_failed"
      : failedQualityGate
        ? "quality_threshold_not_met"
        : null,
    qualityScore: quality.qualityScore,
    qualityChecks: quality.qualityChecks,
    aiTelemetry: {
      providerAvailable: aiEvaluation.providerAvailable,
      traceId: aiEvaluation.traceId,
      latencyMs: aiEvaluation.latencyMs,
      attempts: aiEvaluation.attempts,
      errorType: aiEvaluation.errorType,
    },
  };
}

export {
  GENERATOR_PROMPT_VERSION,
  ROUTER_PROMPT_VERSION,
  VALIDATOR_PROMPT_VERSION,
  WRITING_PROMPT_VERSION,
  clampLevel,
  inferQuestionFormat,
};