function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function assessReadingModuleQuality(data: {
  passages: Array<{ passage: string; questions: unknown[] }>;
  answerKey: unknown[];
  warmUp: string[];
  strategyNotes: string[];
  personalizedNextStep: string;
}) {
  const checks: string[] = [];
  let score = 100;

  if (data.passages.length === 3) {
    checks.push("Passage count is exactly three.");
  } else {
    checks.push("Passage count deviates from expected three.");
    score -= 20;
  }

  const outOfRangePassages = data.passages.filter((item) => {
    const words = countWords(item.passage ?? "");
    return words < 180 || words > 320;
  }).length;

  if (outOfRangePassages === 0) {
    checks.push("Passage lengths are in target range.");
  } else {
    checks.push("One or more passages are outside target length range.");
    score -= Math.min(24, outOfRangePassages * 8);
  }

  const weakQuestionSets = data.passages.filter((item) => item.questions.length < 4).length;
  if (weakQuestionSets === 0) {
    checks.push("Each passage has sufficient question depth.");
  } else {
    checks.push("One or more passages have too few questions.");
    score -= Math.min(20, weakQuestionSets * 10);
  }

  if (data.answerKey.length >= 12) {
    checks.push("Answer key coverage is sufficient.");
  } else {
    checks.push("Answer key coverage is low.");
    score -= 12;
  }

  if (data.warmUp.length >= 2 && data.strategyNotes.length >= 2 && data.personalizedNextStep.trim().length > 0) {
    checks.push("Pedagogical guidance fields are present.");
  } else {
    checks.push("Pedagogical guidance fields are incomplete.");
    score -= 10;
  }

  const qualityScore = clampScore(score);
  return {
    qualityScore,
    qualityChecks: checks,
    passed: qualityScore >= 70,
  };
}

export function assessVocabularyModuleQuality(data: {
  items: Array<{ word: string; trMeaning: string; examples: Array<{ en: string; tr: string }> }>;
  activities: unknown[];
  warmUp: string[];
  strategyNotes: string[];
  personalizedNextStep: string;
}) {
  const checks: string[] = [];
  let score = 100;

  if (data.items.length >= 8 && data.items.length <= 12) {
    checks.push("Vocabulary item count is in target range.");
  } else {
    checks.push("Vocabulary item count is outside target range.");
    score -= 18;
  }

  const invalidItems = data.items.filter(
    (item) => !item.word?.trim() || !item.trMeaning?.trim() || (item.examples?.length ?? 0) === 0,
  ).length;

  if (invalidItems === 0) {
    checks.push("Vocabulary entries include meaning and example.");
  } else {
    checks.push("Some vocabulary entries are incomplete.");
    score -= Math.min(24, invalidItems * 8);
  }

  if (data.activities.length >= 5) {
    checks.push("Practice activity depth is sufficient.");
  } else {
    checks.push("Practice activity depth is insufficient.");
    score -= 16;
  }

  if (data.warmUp.length >= 2 && data.strategyNotes.length >= 2 && data.personalizedNextStep.trim().length > 0) {
    checks.push("Pedagogical guidance fields are present.");
  } else {
    checks.push("Pedagogical guidance fields are incomplete.");
    score -= 10;
  }

  const qualityScore = clampScore(score);
  return {
    qualityScore,
    qualityChecks: checks,
    passed: qualityScore >= 70,
  };
}

export function assessGrammarModuleQuality(data: {
  focusTopic: string;
  conceptExplanation: string;
  modelExamples: unknown[];
  activitySet: Record<string, unknown[]>;
  strategyNotes: string[];
  personalizedNextStep: string;
}) {
  const checks: string[] = [];
  let score = 100;

  if (data.focusTopic.trim().length > 0 && data.conceptExplanation.trim().length >= 40) {
    checks.push("Topic framing and concept explanation are sufficient.");
  } else {
    checks.push("Topic framing or concept explanation is weak.");
    score -= 18;
  }

  if (data.modelExamples.length >= 2) {
    checks.push("Model examples are present.");
  } else {
    checks.push("Model examples are insufficient.");
    score -= 14;
  }

  const activityBuckets = [
    "multipleChoice",
    "fillInTheBlanks",
    "errorCorrection",
    "sentenceTransformation",
    "ruleApplication",
    "miniProduction",
  ];
  const emptyBuckets = activityBuckets.filter((key) => (data.activitySet[key]?.length ?? 0) === 0);

  if (emptyBuckets.length === 0) {
    checks.push("All grammar activity buckets include items.");
  } else {
    checks.push("One or more grammar activity buckets are empty.");
    score -= Math.min(30, emptyBuckets.length * 5);
  }

  if (data.strategyNotes.length >= 2 && data.personalizedNextStep.trim().length > 0) {
    checks.push("Strategy and next-step guidance are present.");
  } else {
    checks.push("Strategy or next-step guidance is missing.");
    score -= 12;
  }

  const qualityScore = clampScore(score);
  return {
    qualityScore,
    qualityChecks: checks,
    passed: qualityScore >= 70,
  };
}