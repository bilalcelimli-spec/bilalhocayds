export type MockExamSectionSummary = {
  label: string;
  questionRange: string;
  questionCount: number;
};

export type MockExamQuestionState = {
  id: string;
  number: number;
  section: string;
  prompt: string;
  options: string[];
  selected?: "A" | "B" | "C" | "D" | "E";
  correct: "A" | "B" | "C" | "D" | "E";
  flagged?: boolean;
  explanation: {
    shortReason: string;
    detailed: string;
    examTip: string;
  };
};

export type MockExamWorkspace = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  totalQuestions: number;
  sourceLabel: string;
  level: string;
  status: string;
  lessonPrice: string;
  aiExplanationEnabled: boolean;
  sections: MockExamSectionSummary[];
  questions: MockExamQuestionState[];
  reviewMetrics: {
    correct: number;
    incorrect: number;
    blank: number;
    net: number;
    accuracy: number;
    strongestSection: string;
    weakestSection: string;
  };
};

const workspace: MockExamWorkspace = {
  id: "mock-yds-2026-pack-01",
  slug: "yds-mock-pack-2026-1",
  title: "Bilal Hoca YDS Mock Pack 2026 / 01",
  subtitle: "Gerçek sınav temposuna uygun, premium deneme deneyimi",
  durationMinutes: 180,
  totalQuestions: 80,
  sourceLabel: "Bilal Hoca Original Mock Series",
  level: "B2-C1",
  status: "Review Ready",
  lessonPrice: "TRY 1,250",
  aiExplanationEnabled: true,
  sections: [
    { label: "Vocabulary", questionRange: "1-12", questionCount: 12 },
    { label: "Grammar", questionRange: "13-24", questionCount: 12 },
    { label: "Cloze Test", questionRange: "25-34", questionCount: 10 },
    { label: "Sentence Completion", questionRange: "35-44", questionCount: 10 },
    { label: "Translation", questionRange: "45-56", questionCount: 12 },
    { label: "Reading", questionRange: "57-80", questionCount: 24 },
  ],
  questions: [
    {
      id: "q-12",
      number: 12,
      section: "Vocabulary",
      prompt: "The committee remained cautious because the proposed policy was still considered too ____ for nationwide implementation.",
      options: ["A) coherent", "B) premature", "C) durable", "D) impartial", "E) cumulative"],
      selected: "C",
      correct: "B",
      flagged: true,
      explanation: {
        shortReason: '"premature" means not yet ready or too early for implementation.',
        detailed: 'The sentence signals caution and incomplete readiness. The committee is hesitant because implementation across the country would be too early. "durable" refers to long-lasting quality, not timing.',
        examTip: "In YDS vocabulary items, temporal caution markers such as still, yet, or not ready often point to words like premature, delayed, or tentative.",
      },
    },
    {
      id: "q-38",
      number: 38,
      section: "Sentence Completion",
      prompt: "____ digital tools can improve speed and access, they still require careful instructional design if they are to produce meaningful learning outcomes.",
      options: ["A) Unless", "B) Because", "C) While", "D) After", "E) Since"],
      selected: "B",
      correct: "C",
      explanation: {
        shortReason: '"While" creates the contrast between benefits and limitations.',
        detailed: 'The first clause praises digital tools, while the second clause introduces a limitation. The sentence therefore needs a contrastive linker, not a causal one. "Because" would weaken the intended tension.',
        examTip: "When a sentence balances positive and restrictive claims, check contrast linkers first: while, although, even though, whereas.",
      },
    },
    {
      id: "q-71",
      number: 71,
      section: "Reading",
      prompt: "According to the passage, one major risk of urban transport reform is that projects may lose momentum when ____.",
      options: ["A) ticket prices remain stable", "B) political priorities shift", "C) researchers support rail systems", "D) commuters reduce car use", "E) city centers expand rapidly"],
      selected: "B",
      correct: "B",
      explanation: {
        shortReason: "The passage explicitly links long-term delivery risk to political turnover.",
        detailed: "The author notes that even well-planned transport reforms can stall when administrations change and funding or strategic focus shifts. This is a classic detail-tracking question.",
        examTip: "In reading detail questions, search for explicit risk markers such as however, critics warn, or a major challenge is.",
      },
    },
  ],
  reviewMetrics: {
    correct: 58,
    incorrect: 16,
    blank: 6,
    net: 54,
    accuracy: 72,
    strongestSection: "Vocabulary",
    weakestSection: "Reading Inference",
  },
};

export function getMockExamWorkspaceBySlug(slug: string) {
  return slug === workspace.slug ? workspace : workspace;
}

export function getMockExamWorkspaceById(examId: string) {
  return examId === workspace.id ? workspace : workspace;
}

export function getMockExamAttempt(attemptId: string) {
  return {
    attemptId,
    startedAtLabel: "22 Mar 2026 · 14:00",
    remainingTimeLabel: "02:13:42",
    answeredCount: 74,
    flaggedCount: 5,
    unansweredCount: 6,
    workspace,
  };
}