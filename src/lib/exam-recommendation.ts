/**
 * Result-specific study advice for a submitted mock exam.
 * Pure functions: the result page renders the returned tips with translations.
 */

/** Each wrong answer removes this much from the net score (see computeAndPersistAttemptResult). */
export const WRONG_ANSWER_PENALTY = 0.25;

export type PracticeModule = "vocabulary" | "grammar" | "reading";

/** Groups ExamSectionType values that share the same solving strategy. */
export type SectionStrategy =
  | "vocabulary"
  | "grammar"
  | "cloze"
  | "sentenceCompletion"
  | "translation"
  | "paragraphCompletion"
  | "reading"
  | "dialogue"
  | "general";

export type ExamRecommendationInput = {
  correctCount: number;
  incorrectCount: number;
  blankCount: number;
  accuracyPercentage: number | null;
  answers: Array<{
    section: string;
    sectionType?: string | null;
    selectedAnswer: string | null;
    correctAnswer: string;
  }>;
};

export type ExamTip =
  | { kind: "perfect" }
  | {
      kind: "weakSection";
      section: string;
      accuracy: number;
      missed: number;
      total: number;
      strategy: SectionStrategy;
      practice: PracticeModule | null;
    }
  | { kind: "blanks"; blank: number; total: number }
  | { kind: "wrongs"; wrong: number; netLost: number }
  | { kind: "level"; band: "foundation" | "developing" | "strong"; accuracy: number };

const STRATEGY_BY_SECTION_TYPE: Record<string, SectionStrategy> = {
  VOCABULARY: "vocabulary",
  CLOSEST_MEANING: "vocabulary",
  GRAMMAR: "grammar",
  CLOZE_TEST: "cloze",
  SENTENCE_COMPLETION: "sentenceCompletion",
  TRANSLATION_EN_TO_TR: "translation",
  TRANSLATION_TR_TO_EN: "translation",
  PARAGRAPH_COMPLETION: "paragraphCompletion",
  READING_COMPREHENSION: "reading",
  DIALOGUE: "dialogue",
};

const PRACTICE_BY_STRATEGY: Partial<Record<SectionStrategy, PracticeModule>> = {
  vocabulary: "vocabulary",
  grammar: "grammar",
  cloze: "grammar",
  sentenceCompletion: "grammar",
  paragraphCompletion: "reading",
  reading: "reading",
};

export function getSectionStrategy(sectionType: string | null | undefined): SectionStrategy {
  return (sectionType && STRATEGY_BY_SECTION_TYPE[sectionType]) || "general";
}

export function getPracticeModule(strategy: SectionStrategy): PracticeModule | null {
  return PRACTICE_BY_STRATEGY[strategy] ?? null;
}

function isAnswerCorrect(answer: ExamRecommendationInput["answers"][number]) {
  const selected = answer.selectedAnswer?.trim().toUpperCase();
  return Boolean(selected) && selected === answer.correctAnswer.trim().toUpperCase();
}

export function buildExamRecommendations(result: ExamRecommendationInput): ExamTip[] {
  const total = result.correctCount + result.incorrectCount + result.blankCount;
  if (total === 0) return [];

  if (result.incorrectCount === 0 && result.blankCount === 0) {
    return [{ kind: "perfect" }];
  }

  const tips: ExamTip[] = [];

  // Weakest section: lowest accuracy among sections with at least one missed question.
  // Sections with 3+ questions are preferred so a single miss doesn't dominate.
  const sections = new Map<string, { total: number; correct: number; sectionType: string | null }>();
  for (const answer of result.answers) {
    const current = sections.get(answer.section) ?? { total: 0, correct: 0, sectionType: answer.sectionType ?? null };
    current.total += 1;
    if (isAnswerCorrect(answer)) current.correct += 1;
    sections.set(answer.section, current);
  }
  const candidates = [...sections.entries()]
    .map(([section, stats]) => ({
      section,
      ...stats,
      missed: stats.total - stats.correct,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }))
    .filter((item) => item.missed > 0);
  const pool = candidates.some((item) => item.total >= 3) ? candidates.filter((item) => item.total >= 3) : candidates;
  const weakest = pool.sort((a, b) => a.accuracy - b.accuracy || b.missed - a.missed)[0];
  if (weakest) {
    const strategy = getSectionStrategy(weakest.sectionType);
    tips.push({
      kind: "weakSection",
      section: weakest.section,
      accuracy: weakest.accuracy,
      missed: weakest.missed,
      total: weakest.total,
      strategy,
      practice: getPracticeModule(strategy),
    });
  }

  if (result.blankCount / total >= 0.2) {
    tips.push({ kind: "blanks", blank: result.blankCount, total });
  }

  const netLost = result.incorrectCount * WRONG_ANSWER_PENALTY;
  if (result.incorrectCount / total >= 0.3 && netLost >= 1) {
    tips.push({ kind: "wrongs", wrong: result.incorrectCount, netLost });
  }

  const accuracy = Math.round(result.accuracyPercentage ?? (result.correctCount / total) * 100);
  tips.push({
    kind: "level",
    band: accuracy < 50 ? "foundation" : accuracy < 80 ? "developing" : "strong",
    accuracy,
  });

  return tips;
}
