/**
 * English versions of the built-in (non-AI) grammar lesson templates.
 * Used when the learner's interface language is English (User.locale === "en")
 * and the AI provider is unavailable or returns nothing usable.
 * Keys follow the blueprint and activity ids in ai-content.ts.
 */

export type GrammarBlueprintTextOverride = {
  dailyGoalTemplate: string;
  reasonTemplate: string;
  explanation: string;
  commonMistakes: string[];
  exampleNotes: string[];
  activities: Record<string, { explanation: string; whyOthersWrong?: string[]; sampleResponse?: string }>;
};

export const GRAMMAR_BLUEPRINT_EN: Record<string, GrammarBlueprintTextOverride> = {
  "articles-prepositions": {
    dailyGoalTemplate: "Today's goal is to reduce the core mistakes you make when choosing articles and prepositions for {exam}.",
    reasonTemplate:
      "Your current level is {level} and your goal is {goal}. Articles and prepositions were chosen today because weak sentence accuracy limits both gap-fill scores and IELTS accuracy.",
    explanation:
      "When choosing an article, first check whether the noun is specific, mentioned for the first time, singular or uncountable. In preposition questions, fixed patterns next to the word and the meaning relationship decide the answer. The most common exam trap is dropping the article because your first language doesn't use one, or choosing a general preposition instead of the correct fixed one.",
    commonMistakes: [
      "Dropping the article with specific nouns",
      "Mixing up in / on / at for time and place",
      "Memorising fixed preposition patterns without context",
    ],
    exampleNotes: [
      "The difference between first mention and specific mention decides the article.",
      "In preposition questions, read the collocation and the meaning together.",
      "Patterns such as interested in and weak at are tested directly in exams.",
      "Checking the article is critical with singular countable nouns.",
    ],
    activities: {
      "ap-mc-1": {
        explanation: "Both nouns are mentioned for the first time and in a general sense, so a / a is needed.",
        whyOthersWrong: [
          "Using the would assume a specific, already known thing.",
          "a / the makes the second noun specific for no reason.",
        ],
      },
      "ap-fill-1": { explanation: "good at and weak at are the natural, correct patterns in this sentence." },
      "ap-err-1": { explanation: "The teacher, the students and the exam are all specific, so the is needed." },
      "ap-tr-1": { explanation: "in the library and a structured routine are needed for accuracy." },
      "ap-rule-1": {
        explanation: "Rule awareness here means recognising specific reference.",
        sampleResponse: "The is used because the results and the process are specific in this context.",
      },
      "ap-prod-1": { explanation: "This task puts article choice and a preposition pattern into active use." },
    },
  },
  conditionals: {
    dailyGoalTemplate: "Today's goal is to strengthen tense and meaning agreement in conditional structures for {exam}.",
    reasonTemplate:
      "Your level is {level} and your target is {goal}. Conditionals were chosen today because reaching your goal requires reading how real a situation is, not just knowing tenses.",
    explanation:
      "In conditional questions, first decide whether the sentence describes something real, possible, imaginary, or a past situation that didn't happen. The most common mistakes are using will in the if clause, mixing up second and third conditionals, and looking only at the tense pattern without checking the meaning. Exam questions on this topic test time agreement and meaning together.",
    commonMistakes: [
      "Using will in the if clause",
      "Missing the difference between second and third conditionals",
      "Choosing an option without checking how real the situation is",
    ],
    exampleNotes: [
      "Keep zero and first conditional logic apart for general truths.",
      "Unreal present meaning is expressed with the second conditional.",
      "Past situations that didn't happen need the third conditional.",
      "Awareness of formal inversion links to conditionals at higher levels.",
    ],
    activities: {
      "cond-mc-1": {
        explanation: "The sentence describes a missed opportunity in the past, so the third conditional is needed.",
        whyOthersWrong: [
          "understood produces second conditional meaning.",
          "would understand can't be used in the if clause.",
        ],
      },
      "cond-fill-1": { explanation: "In the first conditional: if + present simple, main clause will + base verb." },
      "cond-err-1": { explanation: "would isn't used in the if clause; an unreal present situation needs the second conditional." },
      "cond-tr-1": { explanation: "A past cause-and-result relationship is transformed with the third conditional." },
      "cond-rule-1": {
        explanation: "were + could avoid shows a situation that isn't real at present.",
        sampleResponse: "This sentence describes a hypothetical situation that isn't true now.",
      },
      "cond-prod-1": { explanation: "One sentence should show a future possibility, the other a missed opportunity." },
    },
  },
  "relative-reduced": {
    dailyGoalTemplate: "Today's goal is to sharpen your clause analysis for {exam} by separating relative clauses from reduced clauses.",
    reasonTemplate:
      "Your current level is {level} and your goal is {goal}. Relative and reduced clauses were chosen because noticing formal structure differences is decisive for high scores.",
    explanation:
      "A relative clause is a full clause; a reduced clause gives the same information more economically. For high targets you need to notice which structure gives adjectival information, whether the subject is stated, and the formal tone of the sentence. Learners usually know the defining / non-defining difference but miss the subject–verb relationship once the structure is reduced.",
    commonMistakes: [
      "Pairing that and which with commas incorrectly",
      "Not noticing the implied subject in a reduced clause",
      "Reading participle structures as if they were tenses",
    ],
    exampleNotes: [
      "A full relative clause.",
      "The same meaning expressed with a reduced adjective clause.",
      "A non-defining clause adds extra information and is set off by commas.",
      "Past participle reduced clauses appear often in exams.",
    ],
    activities: {
      "rel-mc-1": {
        explanation: "A reduced passive structure describing the candidates is needed: candidates placed in the advanced group.",
        whyOthersWrong: ["placing gives an active meaning and doesn't fit here.", "who placing is grammatically incomplete."],
      },
      "rel-fill-1": { explanation: "It's a non-defining clause set off by commas, so which is needed." },
      "rel-err-1": { explanation: "Use who for people; which is for things." },
      "rel-tr-1": { explanation: "who are exposed to can be reduced to a passive adjective clause." },
      "rel-rule-1": {
        explanation: "In clauses that add extra information between commas, use which/who, not that.",
        sampleResponse: "This clause adds extra information and is set off by commas, so that isn't appropriate.",
      },
      "rel-prod-1": { explanation: "The aim is to use two different adjectival structures on purpose." },
    },
  },
  "connectors-modals": {
    dailyGoalTemplate: "Today's goal is to strengthen connector choice together with modal and passive meaning for {exam}.",
    reasonTemplate:
      "Your level is {level} and your target is {goal}. Connectors and modals were chosen today because exams test logical relationships and structural choices at the same time.",
    explanation:
      "Connector questions aren't about memorising linking words; they require reading the logical relationship between two ideas. Modals and passive forms test differences in meaning such as possibility, obligation, permission and formal style. Learners often focus on surface signals like however or therefore, but the real decision comes from the type of relationship in the sentence.",
    commonMistakes: [
      "Choosing however or therefore without checking the sentence logic",
      "Confusing modal meanings such as must have and should have",
      "Replacing formal passive structures with unnecessary active sentences",
    ],
    exampleNotes: [
      "however sets up a contrast.",
      "Formal passive and obligation combine in the same structure.",
      "Modal meaning and connector logic are interpreted together.",
      "A purpose relationship built with a passive structure.",
    ],
    activities: {
      "cm-mc-1": {
        explanation: "The second part gives a result, so therefore is needed.",
        whyOthersWrong: ["moreover adds information, not a result.", "unless starts a subordinate clause and doesn't fit here."],
      },
      "cm-fill-1": { explanation: "must expresses a strong conclusion drawn from the evidence." },
      "cm-err-1": { explanation: "A policy doesn't implement anything; it is implemented. So the passive is needed." },
      "cm-tr-1": { explanation: "The passive is preferred for a formal academic tone." },
      "cm-rule-1": {
        explanation: "The relationship is a contrast, so however fits.",
        sampleResponse: "The first clause says it looks simple, but the second clause gives the opposite of what we expect.",
      },
      "cm-prod-1": { explanation: "This task uses logical relationship and form choice at the same time." },
    },
  },
};
