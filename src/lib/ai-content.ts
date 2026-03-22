type ExamType = "YDS" | "YDT" | "IELTS Academic" | "IELTS General";
type StudentLevel = "A2" | "B1" | "B2" | "C1";
type FocusSkill = "reading" | "vocabulary" | "mixed";
type QuestionCountPreference = "kisa" | "orta" | "yogun";
type ExplanationLanguage = "Turkish" | "English" | "bilingual";
type MotivationStyle = "formal" | "supportive" | "energetic" | "exam-coach style";

type AiStudentProfile = {
  examType: ExamType;
  studentLevel: StudentLevel;
  studentGoalScore: string;
  dailyStudyTime: 20 | 30 | 45 | 60;
  focusSkill: FocusSkill;
  topicPreferences: string[];
  weakAreas: string[];
  knownWordsLevel: "dusuk" | "orta" | "ileri";
  questionCountPreference: QuestionCountPreference;
  languageOfExplanations: ExplanationLanguage;
  studentHistory: string[];
  motivationStyle: MotivationStyle;
};

type VocabularyItem = {
  word: string;
  level: "B2" | "C1" | "C2";
  trMeaning: string;
  englishDefinition: string;
  synonym: string;
  antonym: string | null;
  collocation: string;
  wordFamily: string[];
  examNote: string;
  commonMistake: string;
  examples: Array<{ en: string; tr: string }>;
};

type ReadingQuestion = {
  id: string;
  type: "main-idea" | "detail" | "inference" | "vocabulary" | "tone";
  question: string;
  skillMeasured: string;
  answer: string;
  explanation: string;
  whyOthersWrong: string[];
  options: string[];
};

type ReadingPassage = {
  source: string;
  sourceUrl?: string;
  category: string;
  title: string;
  passage: string;
  summary: string;
  keyVocabulary: string[];
  questions: ReadingQuestion[];
  studyPlan: string[];
};

type VocabularyActivity = {
  type:
    | "fill-in-the-blanks"
    | "match-definition"
    | "synonym-selection"
    | "context-meaning"
    | "collocation-completion"
    | "rewrite"
    | "word-formation"
    | "multiple-choice"
    | "mini-translation";
  title: string;
  prompt: string;
  answer: string;
  explanation: string;
  options?: string[];
};

type PerformanceRubricItem = {
  label:
    | "Reading Accuracy"
    | "Vocabulary Knowledge"
    | "Contextual Meaning"
    | "Inference Skill"
    | "Attention to Detail"
    | "Paraphrase Recognition"
    | "Exam Readiness";
  score: number;
  comment: string;
  recommendation: string;
};

type PerformanceEvaluation = {
  mode: string;
  summary: string;
  strongAreas: string[];
  focusAreas: string[];
  rubric: PerformanceRubricItem[];
};

type ReadingAnswerKeyItem = {
  questionId: string;
  question: string;
  answer: string;
  explanation: string;
};

type ReadingModuleResponse = {
  generatedAt: string;
  model: string;
  sessionTitle: string;
  studentProfileSummary: string;
  dailyGoal: string;
  warmUp: string[];
  passages: ReadingPassage[];
  answerKey: ReadingAnswerKeyItem[];
  strategyNotes: string[];
  performanceGuide: {
    skimFirst: string;
    markSignals: string;
    answerOrder: string;
    reviewWindow: string;
  };
  performanceEvaluation: PerformanceEvaluation;
  personalizedNextStep: string;
};

type VocabularyResponse = {
  generatedAt: string;
  model: string;
  dailyTarget: number;
  sessionTitle: string;
  studentProfileSummary: string;
  dailyGoal: string;
  warmUp: string[];
  items: VocabularyItem[];
  reading?: { title: string; passage: string; words: string[] };
  activities: VocabularyActivity[];
  strategyNotes: string[];
  performanceEvaluation: PerformanceEvaluation;
  personalizedNextStep: string;
};

type VocabularySeed = Pick<VocabularyItem, "word" | "level" | "trMeaning">;

type AiPromptOptions = {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
};

const MASTER_READING_VOCAB_SYSTEM_PROMPT = `You are BilalHocaYDS Daily Reading and Vocabulary Engine.
You are an expert academic English instructor, exam content editor, assessment designer, and pedagogical AI specialized in YDS, YDT, IELTS Academic, and IELTS General.

Core rules:
- Produce exam-aligned, natural, high-quality, original content.
- Avoid robotic, repetitive, shallow, or generic wording.
- Match difficulty to the student's level and target exam.
- Reading tasks must measure main idea, detail, inference, vocabulary in context, reference, paraphrase recognition, and writer attitude when relevant.
- Vocabulary tasks must go beyond word-meaning matching and emphasize context, synonym, antonym, collocation, word family, academic usage, common confusion, and exam traps.
- Feedback and strategy notes must sound like a real teacher and exam coach, not a template generator.
- Keep outputs structured, publication-ready, and easy to embed in a learning platform.
- When Turkish is requested, explanations should be clear, accurate, and pedagogically strong.
- Reading passages, reading questions, answer choices, vocabulary mini-readings, and vocabulary activities must be written in English unless a task explicitly asks for translation fields.
- Never output mojibake, replacement characters, broken apostrophes, or malformed punctuation such as Ã, â€, or �.
`;

const DEFAULT_AI_PROFILE: AiStudentProfile = {
  examType: "YDS",
  studentLevel: "B2",
  studentGoalScore: "YDS 70+",
  dailyStudyTime: 30,
  focusSkill: "mixed",
  topicPreferences: ["education", "technology", "environment", "society", "science"],
  weakAreas: ["inference", "vocabulary in context", "paraphrasing", "main idea"],
  knownWordsLevel: "orta",
  questionCountPreference: "orta",
  languageOfExplanations: "Turkish",
  studentHistory: ["Ana fikir yerine detay secme", "Baglam icinde kelime anlamini kacirma"],
  motivationStyle: "exam-coach style",
};

type GrammarActivityType =
  | "multiple-choice"
  | "fill-in-the-blanks"
  | "error-correction"
  | "sentence-transformation"
  | "rule-application"
  | "mini-production";

type GrammarErrorType =
  | "tense confusion"
  | "article misuse"
  | "connector confusion"
  | "clause structure weakness"
  | "preposition error"
  | "passive-active confusion"
  | "modal meaning confusion"
  | "relative clause error"
  | "gerund/infinitive confusion"
  | "word order problem";

type GrammarExample = {
  en: string;
  tr: string;
  note: string;
};

type GrammarActivity = {
  id: string;
  type: GrammarActivityType;
  title: string;
  prompt: string;
  answer: string;
  explanation: string;
  testedPoint: string;
  errorType?: GrammarErrorType;
  options?: string[];
  whyOthersWrong?: string[];
  sampleResponse?: string;
};

type GrammarPerformanceRubricItem = {
  label:
    | "Grammar Accuracy"
    | "Rule Awareness"
    | "Contextual Usage"
    | "Sentence Control"
    | "Error Recognition"
    | "Exam Readiness Relative to Target Score";
  score: number;
  comment: string;
  recommendation: string;
};

type GrammarPerformanceEvaluation = {
  summary: string;
  targetScoreComment: string;
  strongAreas: string[];
  focusAreas: string[];
  nextFocus: string;
  rubric: GrammarPerformanceRubricItem[];
};

type GrammarActivitySet = {
  multipleChoice: GrammarActivity[];
  fillInTheBlanks: GrammarActivity[];
  errorCorrection: GrammarActivity[];
  sentenceTransformation: GrammarActivity[];
  ruleApplication: GrammarActivity[];
  miniProduction: GrammarActivity[];
};

type GrammarModuleResponse = {
  generatedAt: string;
  model: string;
  sessionTitle: string;
  studentGoalSnapshot: string;
  dailyGoal: string;
  warmUp: string[];
  focusTopic: string;
  topicReason: string;
  conceptExplanation: string;
  modelExamples: GrammarExample[];
  activitySet: GrammarActivitySet;
  strategyNotes: string[];
  performanceEvaluation: GrammarPerformanceEvaluation;
  personalizedNextStep: string;
};

type GrammarBlueprint = {
  id: string;
  topic: string;
  level: StudentLevel;
  dailyGoalTemplate: string;
  reasonTemplate: string;
  explanation: string;
  commonMistakes: string[];
  examples: GrammarExample[];
  activitySet: GrammarActivitySet;
};

const vocabularyPool: VocabularySeed[] = [
  { word: "mitigate", level: "C1", trMeaning: "azaltmak, hafifletmek" },
  { word: "subsequent", level: "B2", trMeaning: "sonraki" },
  { word: "coherent", level: "B2", trMeaning: "tutarlı" },
  { word: "detrimental", level: "C1", trMeaning: "zararlı" },
  { word: "allocate", level: "B2", trMeaning: "tahsis etmek" },
  { word: "plausible", level: "C1", trMeaning: "makul, inandırıcı" },
  { word: "disparity", level: "C1", trMeaning: "eşitsizlik, farklılık" },
  { word: "prevalent", level: "B2", trMeaning: "yaygın" },
  { word: "inevitable", level: "B2", trMeaning: "kaçınılmaz" },
  { word: "constraint", level: "C1", trMeaning: "kısıt, sınırlama" },
  { word: "comprehensive", level: "B2", trMeaning: "kapsamlı" },
  { word: "feasible", level: "B2", trMeaning: "uygulanabilir" },
  { word: "empirical", level: "C1", trMeaning: "deneysel, ampirik" },
  { word: "substantial", level: "B2", trMeaning: "önemli, kayda değer" },
  { word: "profound", level: "C1", trMeaning: "derin, kapsamlı" },
  { word: "explicit", level: "B2", trMeaning: "açık, net" },
  { word: "implicit", level: "C1", trMeaning: "örtük, dolaylı" },
  { word: "assumption", level: "C1", trMeaning: "varsayım" },
  { word: "conventional", level: "B2", trMeaning: "geleneksel" },
  { word: "resilient", level: "C1", trMeaning: "dayanıklı, esnek" },
  { word: "intrinsic", level: "C2", trMeaning: "içsel" },
  { word: "notion", level: "B2", trMeaning: "kavram, fikir" },
  { word: "ambiguous", level: "C1", trMeaning: "belirsiz, muğlak" },
  { word: "enhance", level: "B2", trMeaning: "geliştirmek" },
  { word: "sustainable", level: "B2", trMeaning: "sürdürülebilir" },
  { word: "adverse", level: "C1", trMeaning: "olumsuz" },
  { word: "justify", level: "B2", trMeaning: "gerekçelendirmek" },
  { word: "attribute", level: "C1", trMeaning: "atfetmek" },
  { word: "constrain", level: "C1", trMeaning: "sınırlamak" },
  { word: "predominant", level: "C2", trMeaning: "baskın" },
];

const readingPool: Omit<ReadingPassage, "questions" | "studyPlan">[] = [
  {
    source: "AI Exam Studio",
    category: "Technology",
    title: "How AI Tutors Are Reshaping Classroom Time",
    passage:
      "Schools in several countries are testing AI tutoring systems to support students outside regular class hours. Early reports suggest that the strongest benefit is not simply faster feedback, but the ability to identify recurring learning gaps before they become serious. Teachers say that when learners receive short, targeted guidance at home, classroom time can be used for discussion, problem-solving, and individual follow-up. Yet researchers warn that unequal access to devices could widen the achievement gap if schools fail to provide shared infrastructure. They also argue that students still need clear human supervision, especially when software offers simplified explanations or incomplete examples. For that reason, many specialists recommend a blended model in which AI tools handle routine practice while teachers monitor progress, correct misunderstandings, and decide when intervention is necessary. The current consensus is that technology becomes most effective when it supports, rather than replaces, professional judgment in the classroom.",
    summary:
      "AI tutoring can improve support quality, but only under equitable access and teacher supervision.",
    keyVocabulary: ["recurring", "infrastructure", "consensus", "equitable", "supervision"],
  },
  {
    source: "AI Exam Studio",
    category: "Economy",
    title: "Cities Expand Public Transport to Cut Urban Emissions",
    passage:
      "Several metropolitan authorities have announced long-term transport plans focused on rail upgrades and electric bus networks. Officials expect the shift to lower urban emissions, reduce traffic congestion, and gradually cut commuting costs for residents. Supporters argue that better public transport can also improve access to employment by connecting outer districts with commercial centers. Critics, however, say that implementation schedules are too optimistic and depend on uncertain funding cycles. They point out that maintenance costs, labor shortages, and political turnover often delay projects that initially appear straightforward. Policy analysts note that phased investments with measurable milestones usually produce more stable outcomes than large one-time projects because they allow governments to adjust priorities as conditions change. In their view, the real challenge is not announcing ambitious targets, but building financial and administrative systems strong enough to sustain the transition over many years.",
    summary:
      "Public transport expansion may reduce emissions, but funding realism and phased planning are key.",
    keyVocabulary: ["metropolitan", "implementation", "uncertain", "phased", "milestones"],
  },
  {
    source: "AI Exam Studio",
    category: "Society",
    title: "Why Micro-Learning Habits Improve Long-Term Retention",
    passage:
      "Education specialists increasingly recommend short, frequent study sessions instead of occasional intensive ones. According to recent surveys, students who divide content into focused blocks often show stronger retention after four weeks than those who depend on last-minute cramming. Researchers explain that the brain benefits from repeated retrieval because each review session strengthens access to the same material from a slightly different angle. The method appears especially effective when every session ends with active recall tasks such as self-testing, summarizing from memory, or explaining ideas aloud. Experts stress that consistency matters more than duration, particularly for language learners preparing for high-stakes exams. A learner who studies for twenty minutes every day may build a more reliable foundation than one who studies for three hours only once a week. For this reason, many instructors now design revision plans around routines that are realistic, repeatable, and easy to maintain over time.",
    summary:
      "Frequent short sessions with recall tasks create better long-term retention than cramming.",
    keyVocabulary: ["retention", "intensive", "focused", "consistency", "high-stakes"],
  },
  {
    source: "AI Exam Studio",
    category: "Science",
    title: "Heat-Resilient Crops Show Promise in Dry Regions",
    passage:
      "Agricultural scientists have developed crop varieties that maintain yield under prolonged heat stress. Early field data suggest that these varieties could reduce seasonal losses in drought-prone regions where traditional crops fail more frequently. Researchers say the most promising strains survive not because they eliminate environmental risk, but because they remain productive under unstable conditions that would normally damage growth. Even so, the team cautions that scientific success alone will not transform food systems. Seed distribution remains uneven, farmer training is limited in some districts, and local soil conditions may require separate adaptation strategies. Policy advisers add that farmers are more likely to adopt new varieties when credit access, insurance protection, and technical guidance are available at the same time. In other words, biological innovation may improve resilience, but only if it is supported by institutions capable of turning laboratory progress into practical agricultural change.",
    summary:
      "Heat-resilient crops could reduce losses, but distribution and training challenges remain.",
    keyVocabulary: ["prolonged", "yield", "drought-prone", "bottlenecks", "adaptation"],
  },
  {
    source: "AI Exam Studio",
    category: "Innovation",
    title: "Small Firms Adopt Automation in Unexpected Workflows",
    passage:
      "Automation tools are no longer limited to large enterprises with dedicated engineering teams. Interviews with small firms indicate that employees now automate repetitive communication, invoicing, and reporting tasks with minimal setup. Managers say the main advantage is not staff reduction, but reduced context-switching, since workers can stay focused on higher-value decisions instead of routine updates. This shift is especially visible in teams that handle large numbers of emails, internal approvals, or client status reports. Analysts caution, however, that workflow redesign and clear accountability are necessary to avoid hidden operational risks. When no one is responsible for checking automated outputs, minor errors can spread quickly across multiple systems. Experts therefore argue that successful adoption depends on clear review protocols, practical staff training, and realistic expectations. In that sense, automation improves efficiency most reliably when it is treated as a management process rather than a purely technical installation.",
    summary:
      "Small firms gain efficiency from automation, but governance and workflow design are essential.",
    keyVocabulary: ["enterprises", "repetitive", "context-switching", "accountability", "operational"],
  },
];

const grammarBlueprints: GrammarBlueprint[] = [
  {
    id: "articles-prepositions",
    topic: "Articles, Prepositions, and Sentence Accuracy",
    level: "B1",
    dailyGoalTemplate: "Bugunku oturumun amaci, {exam} hedefi icin article ve preposition secimindeki temel hatalari azaltmaktir.",
    reasonTemplate:
      "Ogrencinin mevcut seviyesi {level} ve hedefi {goal}. Bugun articles ve prepositions secildi cunku temel sentence accuracy zayif kalirsa hem YDS/YDT bosluk doldurma hem de IELTS accuracy puani sinirlanir.",
    explanation:
      "Article seciminde once isim belirli mi, ilk kez mi geciyor, tekil mi yoksa sayilamayan mi buna bakilir. Preposition sorularinda ise kelimenin yaninda gelen sabit kaliplar ve anlam iliskisi belirleyicidir. Sinavda en yaygin tuzak, Turkceden dogrudan ceviriyle article atlamak veya uygun preposition yerine genel bir secenek secmektir.",
    commonMistakes: [
      "Belirli isimlerde article atlamak",
      "in / on / at zaman ve mekan kullanimlarini karistirmak",
      "fixed preposition kaliplarini baglam disi ezberlemek",
    ],
    examples: [
      {
        en: "The committee reached a decision after a long discussion.",
        tr: "Komite uzun bir tartismanin ardindan bir karara ulasti.",
        note: "Ilk mention ve specific mention farki article secimini belirler.",
      },
      {
        en: "Students often struggle with the difference between in time and on time.",
        tr: "Ogrenciler siklikla in time ve on time arasindaki farkta zorlanir.",
        note: "Preposition sorularinda collocation ve anlam birlikte okunur.",
      },
      {
        en: "She is interested in academic writing, but she is weak at punctuation.",
        tr: "Akademik yazmaya ilgi duyuyor ama noktalamada zayif.",
        note: "interested in, weak at gibi kaliplar sinavlarda dogrudan test edilir.",
      },
      {
        en: "An effective study plan can make a noticeable difference in exam performance.",
        tr: "Etkili bir calisma plani sinav performansinda belirgin bir fark yaratabilir.",
        note: "Sayilabilir tekil isimlerde article kontrolu kritik noktadir.",
      },
    ],
    activitySet: {
      multipleChoice: [
        {
          id: "ap-mc-1",
          type: "multiple-choice",
          title: "Exam-style Gap Fill",
          prompt: "The researcher argued that ___ reliable conclusion cannot be reached without data collected from ___ wider sample.",
          options: ["a / a", "the / the", "a / the", "the / a"],
          answer: "a / a",
          explanation: "Her iki isim de ilk kez ve genel anlamda kullaniliyor; bu nedenle a / a gerekir.",
          testedPoint: "Article choice with singular countable nouns",
          errorType: "article misuse",
          whyOthersWrong: [
            "the kullanimi burada belirli, daha once bilinen bir nesne varsayardi.",
            "a / the ikinci ismi gereksiz yere belirli hale getirir.",
          ],
        },
      ],
      fillInTheBlanks: [
        {
          id: "ap-fill-1",
          type: "fill-in-the-blanks",
          title: "Preposition Focus",
          prompt: "Complete the sentence: Many candidates are good ___ grammar rules but weak ___ using them under time pressure.",
          answer: "at / at",
          explanation: "good at ve weak at kaliplari bu cumlede dogal ve dogrudur.",
          testedPoint: "Fixed preposition patterns",
          errorType: "preposition error",
        },
      ],
      errorCorrection: [
        {
          id: "ap-err-1",
          type: "error-correction",
          title: "Find the Article Error",
          prompt: "Correct the error: Teacher gave students useful feedback after exam.",
          answer: "The teacher gave the students useful feedback after the exam.",
          explanation: "Specific teacher, students ve exam oldugu icin the kullanimi gerekir.",
          testedPoint: "Specific reference with definite article",
          errorType: "article misuse",
        },
      ],
      sentenceTransformation: [
        {
          id: "ap-tr-1",
          type: "sentence-transformation",
          title: "Rewrite for Accuracy",
          prompt: "Rewrite using correct article and preposition use: Students usually improve when they work library and follow structured routine.",
          answer: "Students usually improve when they work in the library and follow a structured routine.",
          explanation: "in the library ve a structured routine yapilari accuracy icin gereklidir.",
          testedPoint: "Article + preposition repair",
          errorType: "article misuse",
        },
      ],
      ruleApplication: [
        {
          id: "ap-rule-1",
          type: "rule-application",
          title: "Choose the Rule",
          prompt: "Explain why the sentence uses 'the': The results were published after the review process.",
          answer: "Because both results and review process are specific and understood in context.",
          explanation: "Rule awareness burada belirli referansi tanimlamayi gerektirir.",
          testedPoint: "Definite reference awareness",
          errorType: "article misuse",
          sampleResponse: "The kullanilir cunku konusulan sonuc ve surec baglam icinde belirli hale gelmistir.",
        },
      ],
      miniProduction: [
        {
          id: "ap-prod-1",
          type: "mini-production",
          title: "Controlled Writing",
          prompt: "Write 2 short sentences using one article contrast and one fixed preposition pattern.",
          answer: "Example: A teacher can change a class quickly. Many students struggle with time management.",
          explanation: "Bu gorev article secimini ve preposition kalibini aktif kullanima tasir.",
          testedPoint: "Sentence accuracy in production",
          sampleResponse: "A student needs a plan. She is good at following weekly targets.",
        },
      ],
    },
  },
  {
    id: "conditionals",
    topic: "Conditionals and Unreal Meaning",
    level: "B2",
    dailyGoalTemplate: "Bugunku oturumun amaci, {exam} hedefi icin conditionals yapilarinda zaman ve anlam uyumunu guclendirmektir.",
    reasonTemplate:
      "Ogrencinin seviyesi {level} ve hedef puani {goal}. Conditionals bugun secildi cunku hedefe ulasmak icin sadece tense bilgisini degil, gerceklik derecesini de dogru okumasi gerekiyor.",
    explanation:
      "Conditionals sorularinda once cumlenin gercek mi, olasi mi, hayali mi yoksa gecmiste gerceklesmemis bir durum mu anlattigini belirlemek gerekir. If clause icinde will kullanmak, second ve third conditional yapilarini karistirmak ve anlami gormeden sadece tense kalibina bakmak en yaygin hatalardir. YDS, YDT ve IELTS sorularinda bu konu zaman uyumu ile anlam iliskisini birlikte olcer.",
    commonMistakes: [
      "if clause icinde will kullanmak",
      "second ve third conditional ayrimini kacirmak",
      "cumlenin gerceklik derecesini okumadan secenek isaretlemek",
    ],
    examples: [
      {
        en: "If students revise regularly, they usually perform better in grammar tests.",
        tr: "Ogrenciler duzenli tekrar yaparsa grammar testlerinde genelde daha iyi performans gosterir.",
        note: "Genel dogrular icin zero / first conditional mantigi ayrilmalidir.",
      },
      {
        en: "If I were preparing for IELTS 7.0, I would focus more on sentence transformation.",
        tr: "IELTS 7.0'a hazirlaniyor olsaydim sentence transformation'a daha fazla odaklanirdim.",
        note: "Unreal present meaning second conditional ile kurulur.",
      },
      {
        en: "If she had reviewed the clause types, she would not have missed that question.",
        tr: "Clause turlerini gozden gecirseydi o soruyu kacirmazdi.",
        note: "Gecmiste gerceklesmemis durumlar third conditional ister.",
      },
      {
        en: "Should you need more practice, the extra worksheet is on the dashboard.",
        tr: "Daha fazla pratiye ihtiyacin olursa ek calisma kagidi dashboard'da.",
        note: "Formal inversion awareness ileri hedeflerde conditionals ile baglantilidir.",
      },
    ],
    activitySet: {
      multipleChoice: [
        {
          id: "cond-mc-1",
          type: "multiple-choice",
          title: "Meaning-sensitive Gap Fill",
          prompt: "If the candidate ___ the connector contrast, she would not have chosen the literal option.",
          options: ["understood", "had understood", "would understand", "has understood"],
          answer: "had understood",
          explanation: "Gecmiste tamamlanmamis bir firsat anlatiliyor; third conditional gerekir.",
          testedPoint: "Third conditional form",
          errorType: "tense confusion",
          whyOthersWrong: [
            "understood second conditional anlami uretmez.",
            "would understand if clause icinde kullanilamaz.",
          ],
        },
      ],
      fillInTheBlanks: [
        {
          id: "cond-fill-1",
          type: "fill-in-the-blanks",
          title: "Complete the Pair",
          prompt: "Complete the sentence: If the lesson starts on time, we ___ the full revision block.",
          answer: "will complete",
          explanation: "First conditional yapisinda if + present simple, main clause will + base verb olur.",
          testedPoint: "First conditional form",
          errorType: "tense confusion",
        },
      ],
      errorCorrection: [
        {
          id: "cond-err-1",
          type: "error-correction",
          title: "Spot the Logic Error",
          prompt: "Correct the sentence: If I would know the rule, I would explain it better.",
          answer: "If I knew the rule, I would explain it better.",
          explanation: "If clause icinde would kullanilmaz; unreal present durum second conditional ister.",
          testedPoint: "If clause structure",
          errorType: "tense confusion",
        },
      ],
      sentenceTransformation: [
        {
          id: "cond-tr-1",
          type: "sentence-transformation",
          title: "Transform the Meaning",
          prompt: "Rewrite with a third conditional: She missed the workshop, so she stayed weak in reduced clauses.",
          answer: "If she had not missed the workshop, she would not have stayed weak in reduced clauses.",
          explanation: "Past cause-result iliskisi third conditional ile donusturulur.",
          testedPoint: "Past unreal transformation",
          errorType: "tense confusion",
        },
      ],
      ruleApplication: [
        {
          id: "cond-rule-1",
          type: "rule-application",
          title: "Apply the Rule",
          prompt: "State whether this sentence is real, possible, or unreal: If he were more careful, he could avoid article errors.",
          answer: "Unreal present situation.",
          explanation: "were + could avoid yapisi mevcutta gercek olmayan durumu gosterir.",
          testedPoint: "Meaning calibration",
          errorType: "modal meaning confusion",
          sampleResponse: "Bu cumle su anda gercek olmayan, varsayimsal bir durumu anlatir.",
        },
      ],
      miniProduction: [
        {
          id: "cond-prod-1",
          type: "mini-production",
          title: "Exam-mode Output",
          prompt: "Write 2 short sentences: one first conditional and one third conditional about exam preparation.",
          answer: "Example: If I revise tonight, I will feel calmer tomorrow. If I had started earlier, I would have finished the unit.",
          explanation: "Bir cumlede future possibility, digerinde missed opportunity kurulmalidir.",
          testedPoint: "Controlled conditional production",
          sampleResponse: "If I review the notes now, I will answer faster. If I had joined the live lesson, I would have understood inversion better.",
        },
      ],
    },
  },
  {
    id: "relative-reduced",
    topic: "Relative Clauses, Reduced Clauses, and Clause Analysis",
    level: "C1",
    dailyGoalTemplate: "Bugunku oturumun amaci, {exam} hedefi icin relative clause ile reduced clause ayrimini guclendirerek clause analysis becerisini keskinlestirmektir.",
    reasonTemplate:
      "Ogrencinin mevcut seviyesi {level}, hedefi ise {goal}. Bu oturumda relative / reduced clauses secildi cunku yuksek skor hedeflerinde formal structure farklarini gormek belirleyici olur.",
    explanation:
      "Relative clause tam bir clause yapisi sunar; reduced clause ise information'u daha ekonomik verir. Ozellikle YDS 75+ ve IELTS 7.0+ hedeflerinde hangi yapinin adjectival information verdigini, failin acik olup olmadigini ve cumnenin formal tonunu fark etmek gerekir. Ogrenciler genelde defining / non-defining farkini biliyor ama reduced structure gorunce fail ile fiil iliskisini kaciriyor.",
    commonMistakes: [
      "that ve which kullanimini virgulle birlikte yanlis eslemek",
      "reduced clause'ta implied subject'i fark etmemek",
      "participial yapilari zaman catisi gibi okumak",
    ],
    examples: [
      {
        en: "Students who analyse clause function carefully eliminate distractors faster.",
        tr: "Clause fonksiyonunu dikkatle analiz eden ogrenciler celdiricileri daha hizli eler.",
        note: "Tam relative clause kullanimi.",
      },
      {
        en: "Students analysing clause function carefully eliminate distractors faster.",
        tr: "Clause fonksiyonunu dikkatle analiz eden ogrenciler celdiricileri daha hizli eler.",
        note: "Ayni anlamin reduced adjective clause ile kurulmus hali.",
      },
      {
        en: "The worksheet, which was designed for YDS candidates, focuses on connector traps.",
        tr: "YDS adaylari icin tasarlanan calisma kagidi connector tuzaklarina odaklanir.",
        note: "Non-defining clause ek bilgi verir ve virgulle ayrilir.",
      },
      {
        en: "Questions written in a formal tone often test structural awareness rather than memorized rules.",
        tr: "Formal bir tonda yazilmis sorular siklikla ezber kurallardan cok yapisal farkindaligi test eder.",
        note: "Past participle reduced clause testlerde sik gorulur.",
      },
    ],
    activitySet: {
      multipleChoice: [
        {
          id: "rel-mc-1",
          type: "multiple-choice",
          title: "Clause Selection",
          prompt: "The candidates ___ in the advanced group will work on inversion and reduced clauses today.",
          options: ["placing", "placed", "who placing", "whose placed"],
          answer: "placed",
          explanation: "Burada candidates'i niteleyen reduced passive structure gerekir: candidates placed in the advanced group.",
          testedPoint: "Reduced passive clause recognition",
          errorType: "clause structure weakness",
          whyOthersWrong: [
            "placing aktif anlam verir ve burada uygun degildir.",
            "who placing gramatik olarak eksiktir.",
          ],
        },
      ],
      fillInTheBlanks: [
        {
          id: "rel-fill-1",
          type: "fill-in-the-blanks",
          title: "Relative Pronoun Accuracy",
          prompt: "Complete the sentence: The article, ___ examines academic failure patterns, is useful for IELTS candidates.",
          answer: "which",
          explanation: "Virgul ile ayrilan non-defining clause oldugu icin which gerekir.",
          testedPoint: "Non-defining relative clause",
          errorType: "relative clause error",
        },
      ],
      errorCorrection: [
        {
          id: "rel-err-1",
          type: "error-correction",
          title: "Fix the Structure",
          prompt: "Correct the sentence: Students which join the live class regularly improve faster.",
          answer: "Students who join the live class regularly improve faster.",
          explanation: "People icin relative pronoun who kullanilir; which nesneler icindir.",
          testedPoint: "Human vs non-human relative pronoun",
          errorType: "relative clause error",
        },
      ],
      sentenceTransformation: [
        {
          id: "rel-tr-1",
          type: "sentence-transformation",
          title: "Reduce the Clause",
          prompt: "Rewrite with a reduced clause: Students who are exposed to formal structures early gain confidence faster.",
          answer: "Students exposed to formal structures early gain confidence faster.",
          explanation: "who are exposed to ifadesi reduced passive adjective clause'a indirgenebilir.",
          testedPoint: "Reducing passive relative clauses",
          errorType: "clause structure weakness",
        },
      ],
      ruleApplication: [
        {
          id: "rel-rule-1",
          type: "rule-application",
          title: "Explain the Choice",
          prompt: "Why is 'that' not appropriate in 'My plan, which I updated yesterday, now includes grammar drills'?",
          answer: "Because the clause is non-defining and set off by commas; 'that' is not used in that pattern.",
          explanation: "Virgullu ek bilgi clause'larinda which/who kullanilir, that kullanilmaz.",
          testedPoint: "Defining vs non-defining awareness",
          errorType: "relative clause error",
          sampleResponse: "Bu clause ek bilgi veriyor ve virgulle ayriliyor; bu nedenle that uygun degil.",
        },
      ],
      miniProduction: [
        {
          id: "rel-prod-1",
          type: "mini-production",
          title: "Dual Output",
          prompt: "Write 2 short sentences: one with a relative clause and one with a reduced clause about exam study habits.",
          answer: "Example: Students who review errors daily improve steadily. Students exposed to regular feedback become more accurate.",
          explanation: "Iki farkli adjectival structure'in bilincli kullanimi hedeflenir.",
          testedPoint: "Controlled clause production",
          sampleResponse: "Learners who track mistakes weekly progress faster. Learners trained with timed drills adapt more quickly.",
        },
      ],
    },
  },
  {
    id: "connectors-modals",
    topic: "Connectors, Modals, Passive Forms, and Formal Structure Choice",
    level: "B2",
    dailyGoalTemplate: "Bugunku oturumun amaci, {exam} hedefi icin connector secimi ile modal/passive anlam kontrolunu ayni oturumda guclendirmektir.",
    reasonTemplate:
      "Ogrencinin seviyesi {level} ve hedef puani {goal}. Connectors ile modals bugun secildi cunku sinavlarda mantik iliskisi ve yapisal tercih ayni anda test edilir.",
    explanation:
      "Connector sorulari sadece baglac ezberi degil, iki fikir arasindaki mantik iliskisini okumayi gerektirir. Modals ve passive forms ise olasilik, zorunluluk, izin ya da resmi anlatim gibi anlam farklarini sinar. Ogrenciler genelde however / therefore gibi yuzeysel isaretlere odaklanir ama asıl karar cumlenin iliski turunden gelir.",
    commonMistakes: [
      "however ve therefore iliskisini cumle mantigina bakmadan secmek",
      "must have / should have gibi modal anlam farklarini karistirmak",
      "formal passive yapilari gereksiz aktif cumleyle degistirmek",
    ],
    examples: [
      {
        en: "The trial was limited; however, the findings were still worth discussing.",
        tr: "Deneme sinirliydi; ancak bulgular yine de tartismaya degerdi.",
        note: "however zItlik iliskisi kurar.",
      },
      {
        en: "The proposal must be reviewed before it is approved.",
        tr: "Teklif onaylanmadan once incelenmelidir.",
        note: "Formal passive ve zorunluluk ayni yapida birlesir.",
      },
      {
        en: "Candidates may overlook the clue unless they read the final clause carefully.",
        tr: "Adaylar son clause'u dikkatle okumazsa ipucunu gozden kacirabilir.",
        note: "modal anlam + connector mantigi birlikte yorumlanir.",
      },
      {
        en: "The report was revised so that the argument could be presented more clearly.",
        tr: "Arguman daha net sunulabilsin diye rapor revize edildi.",
        note: "purpose relation ve passive structure birlikte kurulmus.",
      },
    ],
    activitySet: {
      multipleChoice: [
        {
          id: "cm-mc-1",
          type: "multiple-choice",
          title: "Connector Trap",
          prompt: "The evidence was incomplete; ___, the editors refused to make a definite claim.",
          options: ["moreover", "therefore", "unless", "meanwhile"],
          answer: "therefore",
          explanation: "Ikinci kisim bir sonuc verdigi icin therefore gerekir.",
          testedPoint: "Result connector",
          errorType: "connector confusion",
          whyOthersWrong: [
            "moreover ek bilgi verir, sonuc degil.",
            "unless subordinate clause baslatir; burada uygun degildir.",
          ],
        },
      ],
      fillInTheBlanks: [
        {
          id: "cm-fill-1",
          type: "fill-in-the-blanks",
          title: "Modal Meaning",
          prompt: "Complete the sentence: The answer key is not here, so it ___ be in the teacher's folder.",
          answer: "must",
          explanation: "Must burada mantikli sonuctan cikan guclu tahmini verir.",
          testedPoint: "Deduction with modals",
          errorType: "modal meaning confusion",
        },
      ],
      errorCorrection: [
        {
          id: "cm-err-1",
          type: "error-correction",
          title: "Formal Structure Repair",
          prompt: "Correct the sentence: The new policy should implement before the exam season starts.",
          answer: "The new policy should be implemented before the exam season starts.",
          explanation: "Policy eylemi yapmaz; uygulanir. Bu nedenle passive form gerekir.",
          testedPoint: "Modal + passive form",
          errorType: "passive-active confusion",
        },
      ],
      sentenceTransformation: [
        {
          id: "cm-tr-1",
          type: "sentence-transformation",
          title: "Active to Formal Passive",
          prompt: "Rewrite more formally: Teachers will review the scripts tomorrow.",
          answer: "The scripts will be reviewed tomorrow.",
          explanation: "Formal academic tone icin passive tercih edilir.",
          testedPoint: "Formal written grammar",
          errorType: "passive-active confusion",
        },
      ],
      ruleApplication: [
        {
          id: "cm-rule-1",
          type: "rule-application",
          title: "Why This Connector?",
          prompt: "Explain why 'however' fits better than 'therefore': The rule seems simple; however, students still confuse it in timed tests.",
          answer: "Because the second clause contrasts with the expectation created by the first clause.",
          explanation: "Mantik iliskisi contrast oldugu icin however uygundur.",
          testedPoint: "Contrast logic",
          errorType: "connector confusion",
          sampleResponse: "Ilk cumle basit gorunuyor diyor ama ikinci cumle beklentinin tersini veriyor.",
        },
      ],
      miniProduction: [
        {
          id: "cm-prod-1",
          type: "mini-production",
          title: "Micro Writing",
          prompt: "Write 2 short formal sentences: one using a connector of contrast and one using modal + passive.",
          answer: "Example: The topic appears familiar; however, the distractors are severe. The response sheet must be checked carefully.",
          explanation: "Bu gorev mantik iliskisi ile form secimini ayni anda kullandirir.",
          testedPoint: "Formal grammar control",
          sampleResponse: "The passage is short; however, the inference is subtle. The final draft should be reviewed twice.",
        },
      ],
    },
  },
];

function normalizeExamType(raw?: string | null): ExamType | undefined {
  if (!raw) return undefined;
  const value = raw.trim().toLowerCase();
  if (value.includes("ielts") && value.includes("general")) return "IELTS General";
  if (value.includes("ielts")) return "IELTS Academic";
  if (value.includes("ydt")) return "YDT";
  if (value.includes("yds") || value.includes("yokdil") || value.includes("yokdil")) return "YDS";
  return undefined;
}

function normalizeStudentLevel(raw?: string | null): StudentLevel | undefined {
  if (!raw) return undefined;
  const value = raw.trim().toUpperCase();
  if (value === "A2" || value === "B1" || value === "B2" || value === "C1") {
    return value;
  }
  return undefined;
}

function normalizeStudyTime(value?: number | null): 20 | 30 | 45 | 60 | undefined {
  if (!value || Number.isNaN(value)) return undefined;
  if (value <= 20) return 20;
  if (value <= 30) return 30;
  if (value <= 45) return 45;
  return 60;
}

function clampRubricScore(base: number) {
  return Math.min(10, Math.max(1, base));
}

function createAiProfileOverridesFromStudentContext(input?: {
  targetExam?: string | null;
  currentLevel?: string | null;
  targetScore?: number | string | null;
  dailyGoalMinutes?: number | null;
  interestTags?: string[] | null;
  focusSkill?: FocusSkill;
}): Partial<AiStudentProfile> {
  return {
    examType: normalizeExamType(input?.targetExam),
    studentLevel: normalizeStudentLevel(input?.currentLevel),
    studentGoalScore:
      input?.targetScore !== undefined && input?.targetScore !== null && String(input.targetScore).trim()
        ? `${normalizeExamType(input?.targetExam) ?? DEFAULT_AI_PROFILE.examType} ${String(input.targetScore).trim()}+`
        : undefined,
    dailyStudyTime: normalizeStudyTime(input?.dailyGoalMinutes),
    topicPreferences: input?.interestTags?.length ? input.interestTags : undefined,
    focusSkill: input?.focusSkill,
  };
}

function createStudentProfileSummary(profile: AiStudentProfile) {
  return `${profile.examType} hedefli, ${profile.studentLevel} seviyesinde, gunde ${profile.dailyStudyTime} dakika ayiran ve ${profile.topicPreferences.slice(0, 3).join(", ")} temalarina ilgi duyan ogrenci profili.`;
}

function createDailyGoal(profile: AiStudentProfile, skill: FocusSkill) {
  if (skill === "vocabulary") {
    return `${profile.examType} icin baglam, synonym, collocation ve exam trap odakli kelime calismasi yap.`;
  }
  if (skill === "reading") {
    return `${profile.examType} reading mantigina uygun olarak ana fikir, detail, inference ve vocabulary in context becerilerini gelistir.`;
  }
  return `${profile.examType} icin reading ve vocabulary becerilerini birlikte guclendir.`;
}

function createWarmUp(profile: AiStudentProfile, topic: string) {
  return [
    `${topic} temasinda hangi kavramlarin sinav metinlerinde one cikabilecegini tahmin et.`,
    `${profile.examType} sorularinda bu konuda en cok hangi tuzaklara dusuyorsun?`,
    `Metne gecmeden once ${profile.weakAreas[0]} becerine ozellikle dikkat etmeye hazirlan.`,
  ];
}

function createDefaultRubric(profile: AiStudentProfile): PerformanceEvaluation {
  const weakAreaPenalty = profile.weakAreas.length >= 3 ? 1 : 0;

  const rubric: PerformanceRubricItem[] = [
    {
      label: "Reading Accuracy",
      score: clampRubricScore(7 - weakAreaPenalty),
      comment: "Ana fikir ve temel detaylari yakalama potansiyelin iyi, fakat tutarli kanit kullanimi izlenmeli.",
      recommendation: "Her cevabi metindeki belirli bir ifade ile eslestir.",
    },
    {
      label: "Vocabulary Knowledge",
      score: clampRubricScore(profile.knownWordsLevel === "ileri" ? 8 : profile.knownWordsLevel === "orta" ? 7 : 5),
      comment: "Kelime bilgisi sinav icin yeterli tabana sahip, ancak baglam ici ayrimlar kritik olmaya devam ediyor.",
      recommendation: "Bugun ogrendigim her kelime icin bir collocation yaz.",
    },
    {
      label: "Contextual Meaning",
      score: clampRubricScore(profile.weakAreas.includes("vocabulary in context") ? 5 : 7),
      comment: "Baglamdan anlam cikarma becerisi gelisiyor ama secenekler arasi ince farklar daha fazla dikkat istiyor.",
      recommendation: "Kelimeyi tek basina degil, cumledeki goreviyle birlikte analiz et.",
    },
    {
      label: "Inference Skill",
      score: clampRubricScore(profile.weakAreas.includes("inference") ? 5 : 7),
      comment: "Ima edilen bilgiyi yakalamada zaman zaman detaya takilma egilimi var.",
      recommendation: "Metinde birebir yazilmayan ama zorunlu olarak cikan sonuca odaklan.",
    },
    {
      label: "Attention to Detail",
      score: clampRubricScore(7 - weakAreaPenalty),
      comment: "Detay takibi genel olarak iyi, ancak zor sorularda anahtar kelime uyumu kontrol edilmeli.",
      recommendation: "Soru kokundeki niteleyicileri ve zaman isaretlerini ciz.",
    },
    {
      label: "Paraphrase Recognition",
      score: clampRubricScore(profile.weakAreas.includes("paraphrasing") ? 5 : 7),
      comment: "Paraphrase tuzaklarinda es anlam ve yeniden ifade kaliplarini daha bilincli takip etmelisin.",
      recommendation: "Ayni fikrin farkli ifade edilislerini iki sutunda not et.",
    },
    {
      label: "Exam Readiness",
      score: clampRubricScore(7),
      comment: "Sinav odakli rutin olusuyor; sure, strateji ve tutarlilik birlikte guclendikce skor da yukselecek.",
      recommendation: `${profile.dailyStudyTime} dakikalik calismayi soru analizi + tekrar bloklariyla tamamla.`,
    },
  ];

  return {
    mode: "Responses can be scored question by question when the student submits answers.",
    summary: `${profile.examType} odakli bugunku pakette ana takip alanlari: ${profile.weakAreas.join(", ")}.`,
    strongAreas: ["Calisma disiplini", "Sinav odakli farkindalik"],
    focusAreas: profile.weakAreas,
    rubric,
  };
}

function mergeAiProfile(profile?: Partial<AiStudentProfile>): AiStudentProfile {
  return {
    ...DEFAULT_AI_PROFILE,
    ...profile,
    topicPreferences: profile?.topicPreferences?.length
      ? profile.topicPreferences
      : DEFAULT_AI_PROFILE.topicPreferences,
    weakAreas: profile?.weakAreas?.length
      ? profile.weakAreas
      : DEFAULT_AI_PROFILE.weakAreas,
    studentHistory: profile?.studentHistory?.length
      ? profile.studentHistory
      : DEFAULT_AI_PROFILE.studentHistory,
  };
}

function formatAiProfile(profile: AiStudentProfile) {
  return [
    `exam_type: ${profile.examType}`,
    `student_level: ${profile.studentLevel}`,
    `student_goal_score: ${profile.studentGoalScore}`,
    `daily_study_time: ${profile.dailyStudyTime} dakika`,
    `focus_skill: ${profile.focusSkill}`,
    `topic_preferences: ${profile.topicPreferences.join(", ")}`,
    `weak_areas: ${profile.weakAreas.join(", ")}`,
    `known_words_level: ${profile.knownWordsLevel}`,
    `question_count_preference: ${profile.questionCountPreference}`,
    `language_of_explanations: ${profile.languageOfExplanations}`,
    `student_history: ${profile.studentHistory.join(" | ")}`,
    `motivation_style: ${profile.motivationStyle}`,
  ].join("\n");
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  const chunk = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(chunk);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const MOJIBAKE_PATTERN = /(?:Ã.|â€|â€“|â€”|â€˜|â€™|â€œ|â€�|Â|�)/;
const TURKISH_CHARACTER_PATTERN = /[çğıöşüÇĞİÖŞÜ]/;

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function repairMojibake(text: string) {
  if (!text) {
    return text;
  }

  let repaired = text
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€�/g, '"')
    .replace(/â€“/g, "-")
    .replace(/â€”/g, "-")
    .replace(/Â/g, "")
    .replace(/�/g, "");

  if (MOJIBAKE_PATTERN.test(repaired)) {
    try {
      const decoded = Buffer.from(repaired, "latin1").toString("utf8");
      if (!MOJIBAKE_PATTERN.test(decoded)) {
        repaired = decoded;
      }
    } catch {
      return normalizeWhitespace(repaired);
    }
  }

  return normalizeWhitespace(repaired);
}

function sanitizeEnglishText(text: string) {
  return repairMojibake(text)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

function containsTurkish(text: string) {
  return TURKISH_CHARACTER_PATTERN.test(text);
}

function isCleanEnglishContent(text: string, minimumLength = 1) {
  const normalized = sanitizeEnglishText(text);
  return normalized.length >= minimumLength && !containsTurkish(normalized) && !MOJIBAKE_PATTERN.test(normalized);
}

function getDaySeed(date: Date) {
  const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickUnique<T>(items: T[], count: number, seed: number) {
  const copy = [...items];
  const result: T[] = [];
  let localSeed = seed || 1;

  while (copy.length > 0 && result.length < count) {
    localSeed = (1664525 * localSeed + 1013904223) >>> 0;
    const index = localSeed % copy.length;
    result.push(copy.splice(index, 1)[0]);
  }

  return result;
}

function createVocabularyExamples(word: string, trMeaning: string) {
  return [
    {
      en: `In today's reading session, students were asked to use "${word}" in a sentence about exam strategy.`,
      tr: `Bugunku reading calismasinda ogrencilerden "${word}" kelimesini sinav stratejisiyle ilgili bir cumlede kullanmalari istendi.`,
    },
    {
      en: `Teachers explained that understanding "${word}" can improve both reading accuracy and vocabulary recall.`,
      tr: `Ogretmenler, "${word}" (${trMeaning}) kelimesini anlamanin hem reading dogrulugunu hem de kelime hatirlamayi gelistirebilecegini acikladi.`,
    },
  ];
}

function createVocabularyItemFallback(item: VocabularySeed): VocabularyItem {
  const lower = item.word.toLowerCase();

  return {
    ...item,
    englishDefinition: `${item.word} is used in academic or exam-oriented English to express a precise idea in context.`,
    synonym: lower === "mitigate" ? "alleviate" : lower === "coherent" ? "logical" : lower === "prevalent" ? "widespread" : `formal equivalent of ${item.word}`,
    antonym: lower === "mitigate" ? "intensify" : lower === "coherent" ? "inconsistent" : lower === "prevalent" ? "rare" : null,
    collocation: lower === "mitigate" ? "mitigate the risk" : lower === "coherent" ? "coherent argument" : lower === "prevalent" ? "prevalent view" : `${item.word} approach`,
    wordFamily: [item.word, `${item.word}ly`, `${item.word}ness`].filter((value, index, array) => array.indexOf(value) === index),
    examNote: `${item.word} kelimesi ${DEFAULT_AI_PROFILE.examType} reading sorularinda baglamdan anlam ve paraphrase odakli kullanima uygundur.`,
    commonMistake: `${item.word} kelimesini yalnizca sozluk anlami ile degil, cumledeki goreviyle birlikte yorumla.`,
    examples: createVocabularyExamples(item.word, item.trMeaning),
  };
}

function createVocabularyActivities(items: VocabularyItem[]): VocabularyActivity[] {
  const [first, second, third, fourth, fifth] = items;
  if (!first || !second || !third || !fourth || !fifth) return [];

  return [
    {
      type: "fill-in-the-blanks",
      title: "Exam Context Fill",
      prompt: `Choose the best word to complete the sentence: Students should ______ exam stress by using a fixed revision routine.`,
      answer: first.word,
      explanation: `${first.word} fits because the sentence requires a verb meaning reduce or make less severe.`,
      options: [first.word, second.word, third.word, fourth.word],
    },
    {
      type: "synonym-selection",
      title: "Synonym Precision",
      prompt: `Which option is closest in meaning to ${second.word}?`,
      answer: second.synonym,
      explanation: `${second.synonym} preserves the academic meaning of ${second.word} in exam-style usage.`,
      options: [second.synonym, first.word, third.word, second.antonym ?? "irrelevant"],
    },
    {
      type: "collocation-completion",
      title: "Collocation Builder",
      prompt: `Complete the collocation with the target word: ${third.collocation.replace(third.word, "______")}`,
      answer: third.word,
      explanation: `${third.collocation} is a natural academic collocation that may appear in exam passages.`,
    },
    {
      type: "context-meaning",
      title: "Meaning in Context",
      prompt: `In the sentence "The committee needed a ${fourth.word} framework before expanding the policy," what does ${fourth.word} most nearly suggest?`,
      answer: fourth.englishDefinition,
      explanation: `The context points to the precise academic sense of ${fourth.word}, not a vague everyday meaning.`,
      options: [
        fourth.englishDefinition,
        "a completely emotional reaction",
        "a temporary speaking error",
        "a purely personal preference",
      ],
    },
    {
      type: "word-formation",
      title: "Word Family Shift",
      prompt: `Rewrite the idea by changing the target word into a suitable family member: "The team remained ${fifth.word} during the crisis."`,
      answer: fifth.wordFamily[1] ?? fifth.word,
      explanation: `This task checks whether you can move from the base form to another member of the same word family without losing meaning.`,
    },
    {
      type: "rewrite",
      title: "Sentence Upgrade",
      prompt: `Rewrite this sentence in more academic English by using ${first.word}: "The policy reduced the damage caused by sudden price changes."`,
      answer: `The policy helped ${first.word} the damage caused by sudden price changes.`,
      explanation: `The goal is to replace a basic verb phrase with a more exam-appropriate academic choice.`,
    },
  ];
}

function createReadingQuestionFallbacks(
  passage: Omit<ReadingPassage, "questions" | "studyPlan">,
): ReadingQuestion[] {
  const keyword = passage.keyVocabulary[0] ?? "term";
  const secondaryKeyword = passage.keyVocabulary[1] ?? "evidence";
  return [
    {
      id: `${passage.title}-main-idea`,
      type: "main-idea",
      question: "Which option best summarizes the main idea of the passage?",
      skillMeasured: "Main idea recognition",
      answer: passage.summary,
      explanation: `The correct option captures the central claim of the passage without narrowing it to a single detail: ${passage.summary}`,
      whyOthersWrong: [
        "The distractors focus on isolated details rather than the writer's full argument.",
        "Some options overstate the writer's tone or certainty.",
      ],
      options: [
        passage.summary,
        `The passage mainly provides a technical definition of ${keyword}.`,
        "The writer argues that the issue has already been fully resolved.",
        "The passage is mostly historical and avoids current consequences.",
      ],
    },
    {
      id: `${passage.title}-detail`,
      type: "detail",
      question: "According to the writer, what makes implementation more difficult?",
      skillMeasured: "Detail tracking",
      answer: "Implementation depends on support conditions being managed carefully.",
      explanation: "A close reading of the limiting statements shows that the writer is cautious about the conditions required for success.",
      whyOthersWrong: ["The other options may appear in the passage, but they are not presented as the main obstacle."],
      options: [
        "Implementation depends on support conditions being managed carefully.",
        "The writer offers no examples related to the issue.",
        "The passage focuses only on individual preferences.",
        "The problem is expected to disappear in the short term.",
      ],
    },
    {
      id: `${passage.title}-inference`,
      type: "inference",
      question: "Which inference can be drawn from the passage?",
      skillMeasured: "Inference skill",
      answer: "Positive outcomes may remain limited if the supporting conditions are not in place.",
      explanation: "The passage implies this result even if it does not state it in exactly the same words.",
      whyOthersWrong: ["The distractors are either too absolute or rely on assumptions outside the passage."],
      options: [
        "Positive outcomes may remain limited if the supporting conditions are not in place.",
        "The writer considers the issue unnecessary and ineffective.",
        "Every stakeholder in the passage shares exactly the same view.",
        "A universal solution will be found very soon.",
      ],
    },
    {
      id: `${passage.title}-vocabulary`,
      type: "vocabulary",
      question: `As used in the passage, what does ${keyword} most nearly mean?`,
      skillMeasured: "Vocabulary in context",
      answer: "an academic element with a functional meaning in context",
      explanation: "The correct answer comes from the word's role in the sentence, not from an unrelated dictionary sense.",
      whyOthersWrong: ["The other meanings may exist elsewhere, but they do not match this specific context."],
      options: [
        "an academic element with a functional meaning in context",
        "a humorous side remark",
        "a purely historical label",
        "an informal phrase showing the writer's personal emotions",
      ],
    },
    {
      id: `${passage.title}-tone`,
      type: "tone",
      question: "How would you best describe the writer's tone?",
      skillMeasured: "Writer attitude",
      answer: "cautious but constructive",
      explanation: "The writer acknowledges benefits while also highlighting limits, so the tone is balanced rather than extreme.",
      whyOthersWrong: ["The extreme options fail to reflect the balanced stance of the passage."],
      options: ["cautious but constructive", "overly critical", `narrowly obsessed with ${secondaryKeyword}`, "irrelevant"],
    },
  ];
}

function getPassageWordCount(text: string) {
  return text
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function clampPassageLength(text: string, minimumWords: number, maximumWords: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const wordCount = getPassageWordCount(normalized);

  if (wordCount >= minimumWords && wordCount <= maximumWords) {
    return normalized;
  }

  if (wordCount > maximumWords) {
    const words = normalized.split(/\s+/);
    return `${words.slice(0, maximumWords).join(" ")}.`.replace(/\s+\./g, ".");
  }

  return `${normalized} Students who practise with timed review and short evidence checks usually improve both accuracy and decision speed in later exam sets.`;
}

function buildFallbackExpandedPassage(
  passage: Omit<ReadingPassage, "questions" | "studyPlan">,
  profile: AiStudentProfile,
) {
  const intro = `${passage.title} has become a useful topic for ${profile.examType} reading practice because it combines factual information with evaluative language.`;
  const body = `${passage.passage} Specialists note that candidates perform better when they identify not only the central claim, but also the conditions that limit that claim. In exam settings, this distinction is important because distractors often repeat familiar vocabulary while changing the writer's actual position. Another relevant point is that supporting evidence in this kind of text rarely appears in a single sentence; instead, it is distributed across examples, cautions, and implied consequences. Readers therefore need to compare details carefully before selecting an answer.`;
  const closing = `For serious exam preparation, the most effective strategy is to combine skimming for structure with closer reading for evidence. That approach helps students understand why the writer presents the issue as important, yet still incomplete or conditional.`;
  const expanded = `${intro} ${body} ${closing}`.replace(/\s+/g, " ").trim();

  return clampPassageLength(expanded, 200, 300);
}

function createPassageSummary(passage: string) {
  const sentences = passage.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 2).join(" ").trim();
}

function createReadingAnswerKey(passages: ReadingPassage[]): ReadingAnswerKeyItem[] {
  return passages.flatMap((passage) =>
    passage.questions.map((question) => ({
      questionId: question.id,
      question: question.question,
      answer: question.answer,
      explanation: question.explanation,
    }))
  );
}

function createStrategyNotes(profile: AiStudentProfile, skill: FocusSkill) {
  if (skill === "vocabulary") {
    return [
      `${profile.examType} kelime sorularinda once baglam, sonra synonym/collocation ipucunu kontrol et.`,
      `Yeni kelimeyi ogrenince hemen bir exam trap notu yaz; benzer gorunen ama farkli anlamdaki kelimeleri ayir.`,
      `Kelimeyi tek basina degil, ornek cumle ve collocation ile pekistir.`,
    ];
  }

  return [
    `${profile.examType} reading icin once paragrafin fonksiyonunu, sonra detayi bul.`,
    `${profile.weakAreas[0]} sorularinda metinde ima edilen bilgiyi ara; birebir yazilani degil.`,
    `However, therefore, despite gibi sinyal kelimeleri aktif isaretleyerek paragraf akisini takip et.`,
  ];
}

async function createVocabularyReading(words: string[]) {
  const profile = mergeAiProfile({ focusSkill: "vocabulary" });
  const aiText = await tryProviderRewrite({
    systemPrompt: MASTER_READING_VOCAB_SYSTEM_PROMPT,
    userPrompt: [
      "Use the master prompt principles and produce a JSON object only.",
      formatAiProfile(profile),
      "Task:",
      "Create a daily exam-focused reading + vocabulary mini session for the selected words.",
      "The reading passage must be original, natural, exam-oriented, and suitable for exam prep learners at the specified level.",
      "Write the title and the passage in English only.",
      "Do not use Turkish words or Turkish characters anywhere in the title or passage.",
      "Keep the passage length between 200 and 260 words.",
      "Use all target words naturally in context.",
      `Target words: ${words.join(", ")}`,
      "Return JSON with this exact shape:",
      '{"title":"...","passage":"..."}',
      "The title should sound professional and exam-oriented.",
      "Do not return markdown.",
    ].join("\n\n"),
    temperature: 0.5,
  });

  const fallback = `Students preparing for academic English exams often need a coherent routine that connects vocabulary review with timed reading practice. In a well-structured session, learners first identify prevalent themes in a short passage and then trace how each paragraph supports the writer's main claim. This process becomes more effective when students notice an implicit assumption behind the argument instead of focusing only on isolated details. Teachers therefore encourage learners to justify every answer with textual evidence rather than instinct. Even when time constraints make revision difficult, substantial progress is still feasible if students follow a consistent cycle of preview, close reading, and review. As a subsequent step, they compare mistakes, highlight weak collocations, and build a comprehensive notebook that records why a wrong option looked attractive. Although setbacks are inevitable, this method develops resilient habits and prepares students for longer exam passages with greater confidence.`;

  const parsed = aiText ? extractJsonObject(aiText) : null;
  const title = typeof parsed?.title === "string" && isCleanEnglishContent(parsed.title, 8)
    ? sanitizeEnglishText(parsed.title)
    : "Daily Reading: Vocabulary in Context";
  const passage = typeof parsed?.passage === "string" && isCleanEnglishContent(parsed.passage, 120)
    ? clampPassageLength(sanitizeEnglishText(parsed.passage), 200, 260)
    : clampPassageLength(fallback, 200, 260);

  return {
    title,
    passage,
    words,
  };
}

function extractJsonArray(text: string) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  const chunk = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(chunk);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function createAiVocabularyExamples(items: VocabularySeed[], profile: AiStudentProfile) {
  const aiText = await tryProviderRewrite({
    systemPrompt: MASTER_READING_VOCAB_SYSTEM_PROMPT,
    userPrompt: [
      "Use the master prompt principles and produce JSON only.",
      formatAiProfile(profile),
      "Task:",
      "For each target vocabulary item, create a full exam-focused vocabulary card.",
      "Return a JSON array only.",
      "Each item must follow this exact schema:",
      '{"word":"...","englishDefinition":"...","synonym":"...","antonym":"... or null","collocation":"...","wordFamily":["..."],"examNote":"...","commonMistake":"...","examples":[{"en":"...","tr":"..."},{"en":"...","tr":"..."}]}' ,
      `Target vocabulary: ${items.map((item) => `${item.word} (${item.trMeaning})`).join(", ")}`,
      "Use Turkish translations that are natural and clear.",
      "Do not return markdown.",
    ].join("\n\n"),
    temperature: 0.5,
  });

  const parsed = aiText ? extractJsonArray(aiText) : null;
  if (!parsed) {
    return items.map((item) => createVocabularyItemFallback(item)) satisfies VocabularyItem[];
  }

  const byWord = new Map(
    parsed
      .map((entry) => {
        const word = typeof entry?.word === "string" ? entry.word.trim().toLowerCase() : "";
        const examples = Array.isArray(entry?.examples)
          ? entry.examples
              .map((example: { en?: unknown; tr?: unknown }) => {
                const en = typeof example?.en === "string" ? example.en.trim() : "";
                const tr = typeof example?.tr === "string" ? example.tr.trim() : "";
                return en && tr ? { en, tr } : null;
              })
              .filter((example: { en: string; tr: string } | null): example is { en: string; tr: string } => Boolean(example))
          : [];
        const englishDefinition = typeof entry?.englishDefinition === "string" ? sanitizeEnglishText(entry.englishDefinition) : "";
        const synonym = typeof entry?.synonym === "string" ? sanitizeEnglishText(entry.synonym) : "";
        const antonym = typeof entry?.antonym === "string" ? sanitizeEnglishText(entry.antonym) : null;
        const collocation = typeof entry?.collocation === "string" ? sanitizeEnglishText(entry.collocation) : "";
        const wordFamily = Array.isArray(entry?.wordFamily)
          ? entry.wordFamily
              .map((value: unknown) => (typeof value === "string" ? sanitizeEnglishText(value) : ""))
              .filter((value: string) => value.length > 0)
              .slice(0, 4)
          : [];
        const examNote = typeof entry?.examNote === "string" ? repairMojibake(entry.examNote) : "";
        const commonMistake = typeof entry?.commonMistake === "string" ? repairMojibake(entry.commonMistake) : "";

        return word && examples.length > 0
          ? [word, { englishDefinition, synonym, antonym, collocation, wordFamily, examNote, commonMistake, examples: examples.slice(0, 2) }]
          : null;
      })
      .filter(
        (
          entry,
        ): entry is [
          string,
          {
            englishDefinition: string;
            synonym: string;
            antonym: string | null;
            collocation: string;
            wordFamily: string[];
            examNote: string;
            commonMistake: string;
            examples: Array<{ en: string; tr: string }>;
          },
        ] => Boolean(entry)
      )
  );

  return items.map((item) => {
    const fallback = createVocabularyItemFallback(item);
    const aiEntry = byWord.get(item.word.toLowerCase());

    return aiEntry
      ? {
          ...fallback,
          ...aiEntry,
        }
      : fallback;
  }) satisfies VocabularyItem[];
}

async function createAiReadingPassage(
  passage: Omit<ReadingPassage, "questions" | "studyPlan">,
  profile: AiStudentProfile,
) {
  const aiText = await tryProviderRewrite({
    systemPrompt: MASTER_READING_VOCAB_SYSTEM_PROMPT,
    userPrompt: [
      "Use the master prompt principles and produce a JSON object only.",
      formatAiProfile({ ...profile, focusSkill: "reading" }),
      "Task:",
      "Create an original exam-focused reading passage in English.",
      "The passage must feel suitable for YDS, YDT, or IELTS-style preparation depending on the profile.",
      "Do not adapt or summarize a news article. Write a fresh passage from scratch using only the topic/theme below as inspiration.",
      "The title, summary, passage, and key vocabulary must all be in English.",
      "Passage length must be between 200 and 300 words.",
      "The three daily passages should feel like clearly different topic areas rather than variations of the same text.",
      `Practice source label: ${profile.examType} Practice`,
      `Topic category: ${passage.category}`,
      `Topic hint: ${passage.title}`,
      `Theme notes: ${passage.passage}`,
      "Return JSON with this exact shape:",
      '{"title":"...","passage":"...","summary":"...","keyVocabulary":["word1","word2","word3","word4","word5"]}',
      "keyVocabulary must contain 5 useful exam-oriented words drawn from the passage.",
      "Summary must be one short sentence in English.",
      "Do not return markdown.",
    ].join("\n\n"),
    temperature: 0.45,
  });

  const parsed = aiText ? extractJsonObject(aiText) : null;
  const fallbackPassage = buildFallbackExpandedPassage(passage, profile);
  if (!parsed) {
    return {
      ...passage,
      source: `${profile.examType} Practice`,
      sourceUrl: undefined,
      title: sanitizeEnglishText(passage.title),
      passage: fallbackPassage,
      summary: sanitizeEnglishText(createPassageSummary(fallbackPassage)),
    };
  }

  const keyVocabulary = Array.isArray(parsed.keyVocabulary)
    ? parsed.keyVocabulary
        .map((word: unknown) => (typeof word === "string" ? word.trim().toLowerCase() : ""))
        .filter((word: string) => word.length >= 4)
        .slice(0, 5)
    : [];

  return {
    ...passage,
    source: `${profile.examType} Practice`,
    sourceUrl: undefined,
    title:
      typeof parsed.title === "string" && isCleanEnglishContent(parsed.title, 8)
        ? sanitizeEnglishText(parsed.title)
        : sanitizeEnglishText(passage.title),
    passage:
      typeof parsed.passage === "string" && isCleanEnglishContent(parsed.passage, 140) && getPassageWordCount(parsed.passage.trim()) >= 200
        ? clampPassageLength(sanitizeEnglishText(parsed.passage), 200, 300)
        : fallbackPassage,
    summary:
      typeof parsed.summary === "string" && isCleanEnglishContent(parsed.summary, 30)
        ? sanitizeEnglishText(parsed.summary)
        : sanitizeEnglishText(createPassageSummary(fallbackPassage)),
    keyVocabulary: keyVocabulary.length >= 3 ? keyVocabulary : passage.keyVocabulary,
  };
}

async function createAiReadingQuestions(
  passage: Omit<ReadingPassage, "questions" | "studyPlan">,
  profile: AiStudentProfile,
) {
  const aiText = await tryProviderRewrite({
    systemPrompt: MASTER_READING_VOCAB_SYSTEM_PROMPT,
    userPrompt: [
      "Use the master prompt principles and produce JSON only.",
      formatAiProfile({ ...profile, focusSkill: "reading" }),
      "Task:",
      "Create 5 high-quality English multiple-choice reading questions for the passage.",
      "Question set must cover a balanced mix of main idea, detail, inference, vocabulary in context, and tone/attitude.",
      "Every question must have exactly 4 options and exactly 1 correct answer.",
      "Write the question stems, answer choices, correct answers, and explanations in English.",
      "Do not use Turkish words or Turkish characters anywhere.",
      "Return a JSON array only.",
      'Each item must be: {"type":"main-idea|detail|inference|vocabulary|tone","question":"...","skillMeasured":"...","answer":"...","explanation":"...","whyOthersWrong":["..."],"options":["A","B","C","D"]}',
      `Title: ${passage.title}`,
      `Passage: ${passage.passage}`,
      `Key vocabulary: ${passage.keyVocabulary.join(", ")}`,
      "Questions must feel like a serious YDS/YDT/IELTS exam-prep editor wrote them.",
      "The answer field must exactly match one of the four options.",
    ].join("\n\n"),
    temperature: 0.45,
  });

  if (!aiText) {
    return createReadingQuestionFallbacks(passage);
  }

  const parsed = extractJsonArray(aiText);
  if (!parsed) {
    return createReadingQuestionFallbacks(passage);
  }

  const allowedTypes = new Set(["main-idea", "detail", "inference", "vocabulary", "tone"]);
  const normalized = parsed
    .map((item): ReadingQuestion | null => {
      const type = typeof item?.type === "string" ? item.type : "detail";
      const question = typeof item?.question === "string" ? sanitizeEnglishText(item.question) : "";
      const answer = typeof item?.answer === "string" ? sanitizeEnglishText(item.answer) : "";
      const explanation = typeof item?.explanation === "string" ? sanitizeEnglishText(item.explanation) : "";
      const skillMeasured = typeof item?.skillMeasured === "string" ? sanitizeEnglishText(item.skillMeasured) : type;
      const whyOthersWrong = Array.isArray(item?.whyOthersWrong)
        ? item.whyOthersWrong
            .map((entry: unknown) => (typeof entry === "string" ? sanitizeEnglishText(entry) : ""))
            .filter((entry: string) => entry.length > 0)
        : [];
      const options = Array.isArray(item?.options)
        ? item.options
            .map((entry: unknown) => (typeof entry === "string" ? sanitizeEnglishText(entry) : ""))
            .filter((entry: string) => entry.length > 0)
            .slice(0, 4)
        : [];

      if (!allowedTypes.has(type) || question.length < 8 || answer.length < 4 || explanation.length < 8) {
        return null;
      }

      if ([question, answer, explanation, skillMeasured, ...whyOthersWrong, ...options].some((value) => !isCleanEnglishContent(value, 1))) {
        return null;
      }

      if (options.length !== 4 || !options.includes(answer)) {
        return null;
      }

      return {
        id: `${passage.title}-${type}-${question.slice(0, 20)}`,
        type: type as ReadingQuestion["type"],
        question,
        skillMeasured,
        answer,
        explanation,
        whyOthersWrong,
        options,
      };
    })
    .filter((item): item is ReadingQuestion => Boolean(item));

  return normalized.length >= 3 ? normalized.slice(0, 5) : createReadingQuestionFallbacks(passage);
}

function createReadingPlan(source: string, profile: AiStudentProfile) {
  const examHint =
    profile.examType === "IELTS Academic" || profile.examType === "IELTS General"
      ? "Skimming ve scanning adimini zaman baskisi altinda uygula."
      : "Ana fikir ve paragraf gecislerini once bularak sinav hizini koru.";

  return [
    `3 dk: Baslik ve kaynak (${source}) uzerinden konu tahmini yap.`,
    "8 dk: Metni aktif not alarak oku, gecis ifadelerini isaretle.",
    "6 dk: Ana fikir + destekleyici fikirleri 3 maddede ozetle.",
    "8 dk: Comprehension sorularini coz ve yanitlarini kanitla.",
    `5 dk: Yeni kelimelerle iki ornek cumle yaz. ${examHint}`,
  ];
}

function createSessionTitle(profile: AiStudentProfile, skill: FocusSkill, topic: string) {
  if (skill === "vocabulary") {
    return `${profile.examType} Vocabulary Drill - ${topic}`;
  }
  if (skill === "reading") {
    return `${profile.examType} Reading Pack - ${topic}`;
  }
  return `Daily Reading & Vocabulary Drill - ${topic}`;
}

function createNextStep(profile: AiStudentProfile, skill: FocusSkill) {
  if (skill === "vocabulary") {
    return `Yarin ${profile.weakAreas[0]} odagini koruyarak bugunku kelimelerle 5 yeni exam-style cumle kur ve collocation tekrarina gec.`;
  }
  return `Yarin ayni seviyede bir metinde ${profile.weakAreas[0]} ve paraphrase recognition uzerine ikinci bir set cozmeyi hedefle.`;
}

function extractTargetScoreValue(goal?: string | null) {
  const normalizedGoal = typeof goal === "string" ? goal : "";
  const match = normalizedGoal.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function getLevelScore(level: StudentLevel) {
  if (level === "A2") return 2;
  if (level === "B1") return 4;
  if (level === "B2") return 6;
  return 8;
}

function inferTargetLevel(profile: AiStudentProfile): StudentLevel {
  const target = extractTargetScoreValue(profile.studentGoalScore);

  if (profile.examType === "IELTS Academic" || profile.examType === "IELTS General") {
    if ((target ?? 0) >= 7) return "C1";
    if ((target ?? 0) >= 6.5) return "B2";
    return "B1";
  }

  if (profile.examType === "YDT") {
    if ((target ?? 0) >= 75) return "C1";
    if ((target ?? 0) >= 60) return "B2";
    return "B1";
  }

  if ((target ?? 0) >= 75) return "C1";
  if ((target ?? 0) >= 60) return "B2";
  return "B1";
}

function inferGrammarPriorityIds(profile: AiStudentProfile) {
  const target = extractTargetScoreValue(profile.studentGoalScore) ?? 70;

  if (profile.examType === "IELTS Academic" || profile.examType === "IELTS General") {
    if (target >= 7) return ["relative-reduced", "connectors-modals", "conditionals"];
    if (target >= 6.5) return ["conditionals", "connectors-modals", "relative-reduced"];
    return ["articles-prepositions", "conditionals", "connectors-modals"];
  }

  if (profile.examType === "YDT") {
    if (target >= 75) return ["relative-reduced", "connectors-modals", "conditionals"];
    return ["conditionals", "articles-prepositions", "connectors-modals"];
  }

  if (target >= 75) return ["relative-reduced", "connectors-modals", "conditionals"];
  if (target >= 60) return ["conditionals", "relative-reduced", "connectors-modals"];
  return ["articles-prepositions", "conditionals", "connectors-modals"];
}

function selectGrammarBlueprint(profile: AiStudentProfile, seed: number) {
  const orderedIds = inferGrammarPriorityIds(profile);
  const orderedBlueprints = orderedIds
    .map((id) => grammarBlueprints.find((item) => item.id === id))
    .filter((item): item is GrammarBlueprint => Boolean(item));

  const fallbackBlueprints = grammarBlueprints.filter(
    (item) => !orderedIds.includes(item.id),
  );
  const pool = [...orderedBlueprints, ...fallbackBlueprints];
  return pool[seed % pool.length] ?? grammarBlueprints[0];
}

function createGrammarWarmUp(profile: AiStudentProfile, topic: string) {
  return [
    `${topic} konusunda seni zorlayan en kritik ayrimi tek cumleyle tanimla.`,
    `${profile.examType} sorularinda bugun hangi grammar tuzagina dusmeme hedefin var?`,
    `${profile.studentGoalScore} hedefine gore bugun hiz yerine hangi dogruluk noktasina odaklanman gerekiyor?`,
  ];
}

function createGrammarSessionTitle(profile: AiStudentProfile, blueprint: GrammarBlueprint) {
  return `${profile.examType} Grammar Focus - ${blueprint.topic} for ${profile.studentGoalScore}`;
}

function createGrammarGoalSnapshot(profile: AiStudentProfile, blueprint: GrammarBlueprint) {
  const targetLevel = inferTargetLevel(profile);
  return [
    `${profile.examType} odakli bu ogrenci su anda ${profile.studentLevel} seviyesinde ve hedefi ${profile.studentGoalScore}.`,
    blueprint.reasonTemplate
      .replace("{level}", profile.studentLevel)
      .replace("{goal}", profile.studentGoalScore),
    `Bu oturumun hedefi, ogrenciyi mevcut seviyeden yaklasik ${targetLevel} ihtiyacina tasiyacak daha kontrollu ve stratejik grammar kararlarina yoneltmektir.`,
  ].join(" ");
}

function createGrammarDailyGoal(profile: AiStudentProfile, blueprint: GrammarBlueprint) {
  return blueprint.dailyGoalTemplate.replace("{exam}", profile.examType);
}

function createGrammarTopicReason(profile: AiStudentProfile, blueprint: GrammarBlueprint) {
  return blueprint.reasonTemplate
    .replace("{level}", profile.studentLevel)
    .replace("{goal}", profile.studentGoalScore);
}

function createGrammarConceptExplanation(profile: AiStudentProfile, blueprint: GrammarBlueprint) {
  const languageNote =
    profile.languageOfExplanations === "English"
      ? "Acilamada teknik terimler English korunabilir."
      : profile.languageOfExplanations === "bilingual"
        ? "Ana kural Turkish, teknik etiketler English destekli sunulmali."
        : "Aciklamalar Turkish merkezli, sinav odakli ve net olmali.";

  return [
    blueprint.explanation,
    `Sinav onemi: ${profile.examType} hedefinde bu konu, sadece kural bilgisi degil baglam icinde yapi secimi ve tuzak farkindaligi olcer.`,
    `Sik hata alanlari: ${blueprint.commonMistakes.join(", ")}.`,
    languageNote,
  ].join(" ");
}

function createGrammarStrategyNotes(profile: AiStudentProfile, blueprint: GrammarBlueprint) {
  return [
    `Once anlam iliskisini bul, sonra grammar kalibini sec. ${profile.examType} sorularinda yuzeydeki kelimeye degil yapisal ipucuna bak.`,
    `Bugun ozellikle ${blueprint.commonMistakes[0]?.toLowerCase() ?? "yapi secimi"} konusunda kendi hatani yakalamaya calis.`,
    `${profile.dailyStudyTime} dakikalik blokta konu anlatimi, uygulama ve hata analizi sirasini bozma; hizdan once dogruluk kur.`,
  ];
}

function createGrammarPerformanceEvaluation(
  profile: AiStudentProfile,
  blueprint: GrammarBlueprint,
): GrammarPerformanceEvaluation {
  const currentScore = getLevelScore(profile.studentLevel);
  const targetScore = getLevelScore(inferTargetLevel(profile));
  const gapPenalty = Math.max(0, targetScore - currentScore);
  const accuracyBase = Math.max(4, 8 - gapPenalty);

  const rubric: GrammarPerformanceRubricItem[] = [
    {
      label: "Grammar Accuracy",
      score: clampRubricScore(accuracyBase),
      comment: "Temel dogruluk seviyesi mevcut hedefe yaklasiyor ancak zorlu tuzaklarda karar kalitesi dalgalanabiliyor.",
      recommendation: "Her yanlis soruda hangi kelimenin degil hangi yapinin secildigini not et.",
    },
    {
      label: "Rule Awareness",
      score: clampRubricScore(accuracyBase - 1),
      comment: "Kural bilgisi var, fakat kurali baglamla eslestirme hizinin artmasi gerekiyor.",
      recommendation: "Her aktiviteden sonra tek cumlelik kural ozeti yaz.",
    },
    {
      label: "Contextual Usage",
      score: clampRubricScore(accuracyBase - (blueprint.level === "C1" ? 2 : 1)),
      comment: "Baglam icinde structure secimi, hedef puan ile mevcut seviye arasindaki farki en net gosteren alandir.",
      recommendation: "Secenegi isaretlemeden once cumlenin mantik iliskisini isimlendir.",
    },
    {
      label: "Sentence Control",
      score: clampRubricScore(accuracyBase - 1),
      comment: "Transformation ve mini production adimlarinda sentence control duzenli pratikle hizla guclenebilir.",
      recommendation: "Bugunku mini production gorevini sesli okuyarak yapisal akisi kontrol et.",
    },
    {
      label: "Error Recognition",
      score: clampRubricScore(accuracyBase - 1),
      comment: "Hata tespiti gelisiyor; ancak benzer gorunen iki structure arasinda karar verirken ikinci kontrol gerekli.",
      recommendation: "Error correction sorularinda once hatali bolgeyi etiketle, sonra duzelt.",
    },
    {
      label: "Exam Readiness Relative to Target Score",
      score: clampRubricScore(accuracyBase - gapPenalty),
      comment: `Mevcut performans ${profile.studentGoalScore} hedefi icin dogru yonde, ancak ${blueprint.topic} alaninda daha tutarli otomasyon gerekiyor.`,
      recommendation: "Bu konuyu iki gun icinde ikinci kez, daha kisa ama daha hizli bir setle tekrar et.",
    },
  ];

  return {
    summary: `${blueprint.topic} oturumu, hedef puana giden grammar boslugunu dogrudan kapatmak icin secildi.`,
    targetScoreComment: `${profile.studentLevel} seviyesinden ${profile.studentGoalScore} hedefine giderken bu topic'te karar hizi ve hata farkindaligi birlikte yukseltilmeli.`,
    strongAreas: ["Calisma rutini", "Kural farkindaligi"],
    focusAreas: blueprint.commonMistakes,
    nextFocus: blueprint.id === "articles-prepositions" ? "Conditionals ve connector secimi" : blueprint.id === "conditionals" ? "Relative / reduced clause ayirimi" : "Formal grammar ve sentence transformation",
    rubric,
  };
}

function createGrammarPersonalizedNextStep(profile: AiStudentProfile, blueprint: GrammarBlueprint) {
  return `Yarin ${blueprint.commonMistakes[0]?.toLowerCase() ?? "bu konu"} uzerine 10 dakikalik hizli tekrar yap, sonra ${createGrammarPerformanceEvaluation(profile, blueprint).nextFocus.toLowerCase()} basligina gec.`;
}

async function tryProviderRewrite(input: string | AiPromptOptions) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const prompt = typeof input === "string" ? { userPrompt: input } : input;

  const baseUrl = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: prompt.temperature ?? 0.4,
        messages: [
          { role: "system", content: prompt.systemPrompt ?? "You are an academic English tutor." },
          { role: "user", content: prompt.userPrompt },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content;
    return typeof text === "string" ? text : null;
  } catch {
    return null;
  }
}

export async function getDailyVocabulary(
  input: Date | { date?: Date; profile?: Partial<AiStudentProfile> } = new Date(),
): Promise<VocabularyResponse> {
  const date = input instanceof Date ? input : input.date ?? new Date();
  const profile = mergeAiProfile(input instanceof Date ? undefined : input.profile);
  const seed = getDaySeed(date);
  const selectedBase = pickUnique(vocabularyPool, 10, seed);
  const selected = await createAiVocabularyExamples(selectedBase, profile);
  const reading = await createVocabularyReading(selected.map((item) => item.word));
  const topicLabel = profile.topicPreferences[0] ?? "Academic English";
  const performanceEvaluation = createDefaultRubric({ ...profile, focusSkill: "vocabulary" });

  return {
    generatedAt: date.toISOString(),
    model: process.env.AI_API_KEY ? "hybrid-ai" : "local-ai",
    dailyTarget: 10,
    sessionTitle: createSessionTitle(profile, "vocabulary", topicLabel),
    studentProfileSummary: createStudentProfileSummary(profile),
    dailyGoal: createDailyGoal(profile, "vocabulary"),
    warmUp: createWarmUp(profile, topicLabel),
    items: selected,
    reading,
    activities: createVocabularyActivities(selected),
    strategyNotes: createStrategyNotes(profile, "vocabulary"),
    performanceEvaluation,
    personalizedNextStep: createNextStep(profile, "vocabulary"),
  };
}

export async function getDailyReadingModule(options?: {
  date?: Date;
  interestTags?: string[];
  profile?: Partial<AiStudentProfile>;
}): Promise<ReadingModuleResponse> {
  const date = options?.date ?? new Date();
  const seed = getDaySeed(date);
  const interestTags = options?.interestTags ?? [];
  const profile = mergeAiProfile({
    focusSkill: "reading",
    topicPreferences: interestTags.length ? interestTags : undefined,
    ...options?.profile,
  });

  const prioritizedPool = [...readingPool].sort((left, right) => {
    const leftScore = interestTags.some((tag) => `${left.category} ${left.title}`.toLowerCase().includes(tag.toLowerCase())) ? 1 : 0;
    const rightScore = interestTags.some((tag) => `${right.category} ${right.title}`.toLowerCase().includes(tag.toLowerCase())) ? 1 : 0;
    return rightScore - leftScore;
  });

  const selectedCandidates = pickUnique(prioritizedPool, 3, seed);
  const passages = await Promise.all(
    selectedCandidates.map(async (item) => {
      const rewritten = await createAiReadingPassage(item, profile);
      return {
        ...rewritten,
        questions: await createAiReadingQuestions(rewritten, profile),
        studyPlan: createReadingPlan(profile.examType, profile),
      } satisfies ReadingPassage;
    })
  );

  const topicLabel = passages[0]?.category ?? profile.topicPreferences[0] ?? "Academic Reading";
  const performanceEvaluation = createDefaultRubric({ ...profile, focusSkill: "reading" });

  return {
    generatedAt: date.toISOString(),
    model: process.env.AI_API_KEY ? "hybrid-ai" : "local-ai",
    sessionTitle: createSessionTitle(profile, "reading", topicLabel),
    studentProfileSummary: createStudentProfileSummary(profile),
    dailyGoal: createDailyGoal(profile, "reading"),
    warmUp: createWarmUp(profile, topicLabel),
    passages,
    answerKey: createReadingAnswerKey(passages),
    strategyNotes: createStrategyNotes(profile, "reading"),
    performanceGuide: {
      skimFirst: "During the first read, identify paragraph function before chasing details.",
      markSignals: "Mark signals such as however, therefore, despite, and in contrast.",
      answerOrder: "Move in passage order when answering detail questions.",
      reviewWindow: "Rework incorrect items within 24 hours.",
    },
    performanceEvaluation,
    personalizedNextStep: createNextStep(profile, "reading"),
  };
}

export async function getDailyGrammarModule(
  input: Date | { date?: Date; profile?: Partial<AiStudentProfile> } = new Date(),
): Promise<GrammarModuleResponse> {
  const date = input instanceof Date ? input : input.date ?? new Date();
  const profile = mergeAiProfile(input instanceof Date ? undefined : input.profile);
  const seed = getDaySeed(date);
  const blueprint = selectGrammarBlueprint(profile, seed);

  return {
    generatedAt: date.toISOString(),
    model: process.env.AI_API_KEY ? "hybrid-ai" : "local-ai",
    sessionTitle: createGrammarSessionTitle(profile, blueprint),
    studentGoalSnapshot: createGrammarGoalSnapshot(profile, blueprint),
    dailyGoal: createGrammarDailyGoal(profile, blueprint),
    warmUp: createGrammarWarmUp(profile, blueprint.topic),
    focusTopic: blueprint.topic,
    topicReason: createGrammarTopicReason(profile, blueprint),
    conceptExplanation: createGrammarConceptExplanation(profile, blueprint),
    modelExamples: blueprint.examples,
    activitySet: blueprint.activitySet,
    strategyNotes: createGrammarStrategyNotes(profile, blueprint),
    performanceEvaluation: createGrammarPerformanceEvaluation(profile, blueprint),
    personalizedNextStep: createGrammarPersonalizedNextStep(profile, blueprint),
  };
}

export { createAiProfileOverridesFromStudentContext };
export type {
  AiStudentProfile,
  GrammarModuleResponse,
  PerformanceEvaluation,
  ReadingModuleResponse,
  ReadingPassage,
  ReadingQuestion,
  VocabularyActivity,
  VocabularyItem,
  VocabularyResponse,
};