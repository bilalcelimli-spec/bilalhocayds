import { getDailyRssNews } from "@/src/lib/rss-news";

type VocabularyItem = {
  word: string;
  level: "B2" | "C1" | "C2";
  trMeaning: string;
  examples: Array<{ en: string; tr: string }>;
};

type ReadingQuestion = {
  type: "main-idea" | "detail" | "inference" | "vocabulary" | "tone";
  question: string;
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

type GrammarQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type GrammarModule = {
  topic: string;
  level: "B1" | "B2" | "C1";
  objective: string;
  explanation: string;
  examples: Array<{ en: string; tr: string }>;
  commonMistakes: string[];
  questions: GrammarQuestion[];
  studyPlan: string[];
};

const vocabularyPool: Omit<VocabularyItem, "examples">[] = [
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
    source: "BBC Future",
    category: "Technology",
    title: "How AI Tutors Are Reshaping Classroom Time",
    passage:
      "Schools in several countries are testing AI tutoring systems to support students outside regular class hours. Teachers report that the biggest benefit is not the speed of feedback, but the ability to identify recurring learning gaps. However, researchers warn that unequal access to devices could widen the achievement gap unless schools provide shared infrastructure. The current consensus is that AI tutors work best when they are combined with teacher-led instruction and regular progress checks.",
    summary:
      "AI tutoring can improve support quality, but only under equitable access and teacher supervision.",
    keyVocabulary: ["recurring", "infrastructure", "consensus", "equitable", "supervision"],
  },
  {
    source: "Reuters",
    category: "Economy",
    title: "Cities Expand Public Transport to Cut Urban Emissions",
    passage:
      "Several metropolitan authorities announced long-term transport plans focused on rail upgrades and electric bus networks. Officials expect the shift to lower urban emissions and reduce commuting costs over time. Critics argue that implementation schedules are too optimistic and depend on uncertain funding cycles. Policy analysts note that phased investments with measurable milestones usually produce more stable outcomes than large one-time projects.",
    summary:
      "Public transport expansion may reduce emissions, but funding realism and phased planning are key.",
    keyVocabulary: ["metropolitan", "implementation", "uncertain", "phased", "milestones"],
  },
  {
    source: "The Guardian",
    category: "Society",
    title: "Why Micro-Learning Habits Improve Long-Term Retention",
    passage:
      "Education specialists increasingly recommend short, frequent study sessions instead of occasional intensive sessions. According to recent surveys, students who break content into focused blocks show stronger retention after four weeks. The approach is particularly effective when each session ends with active recall tasks. Experts stress that consistency matters more than duration, especially for language learners preparing for high-stakes exams.",
    summary:
      "Frequent short sessions with recall tasks create better long-term retention than cramming.",
    keyVocabulary: ["retention", "intensive", "focused", "consistency", "high-stakes"],
  },
  {
    source: "Nature Briefing",
    category: "Science",
    title: "Heat-Resilient Crops Show Promise in Dry Regions",
    passage:
      "Agricultural scientists have developed crop varieties that maintain yield under prolonged heat stress. Early field data suggest that these varieties can reduce seasonal losses in drought-prone regions. Still, the researchers caution that seed distribution and farmer training remain major bottlenecks. They emphasize that biological innovation must be paired with policy support and local adaptation strategies.",
    summary:
      "Heat-resilient crops could reduce losses, but distribution and training challenges remain.",
    keyVocabulary: ["prolonged", "yield", "drought-prone", "bottlenecks", "adaptation"],
  },
  {
    source: "MIT Technology Review",
    category: "Innovation",
    title: "Small Firms Adopt Automation in Unexpected Workflows",
    passage:
      "Automation tools are no longer limited to large enterprises with dedicated engineering teams. Interviews with small firms indicate that teams now automate repetitive communication and reporting tasks with minimal setup. Managers say the main benefit is reduced context-switching rather than staff reduction. Analysts caution that workflow redesign and clear accountability are necessary to avoid hidden operational risks.",
    summary:
      "Small firms gain efficiency from automation, but governance and workflow design are essential.",
    keyVocabulary: ["enterprises", "repetitive", "context-switching", "accountability", "operational"],
  },
];

const grammarPool: GrammarModule[] = [
  {
    topic: "Relative Clauses",
    level: "B2",
    objective: "Defining ve non-defining relative clause yapılarını ayırt etmek",
    explanation:
      "Defining relative clauses, ismi tanımlar ve cümleden çıkarıldığında anlam bozulur. Non-defining clauses ise ek bilgi verir ve virgülle ayrılır. Which, who, that, whose ve where kullanımını cümledeki işleve göre seçmek gerekir.",
    examples: [
      { en: "The student who solved the problem won a prize.", tr: "Problemi çözen öğrenci ödül kazandı." },
      { en: "My laptop, which I bought last year, is already slow.", tr: "Geçen yıl aldığım dizüstü bilgisayarım şimdiden yavaş." },
    ],
    commonMistakes: [
      "Non-defining clause içinde that kullanmak",
      "Gerekli virgülleri unutmak",
      "People ve things için zamiri karıştırmak",
    ],
    questions: [
      {
        question: "Choose the correct option: The book ___ I borrowed was very informative.",
        options: ["who", "which", "where", "whose"],
        answer: "which",
        explanation: "Book bir nesnedir, bu nedenle which kullanılır.",
      },
      {
        question: "Choose the correct option: Mr. Lee, ___ teaches physics, won an award.",
        options: ["that", "who", "where", "whose"],
        answer: "who",
        explanation: "Non-defining clause ve kişi olduğu için who kullanılır.",
      },
    ],
    studyPlan: [
      "10 dk konu özeti",
      "10 dk örnek cümle analizi",
      "10 dk çoktan seçmeli pratik",
      "5 dk yanlışların tekrar notu",
    ],
  },
  {
    topic: "Conditionals (0-1-2-3)",
    level: "C1",
    objective: "Koşul türlerini anlam ilişkisine göre doğru kullanmak",
    explanation:
      "Zero conditional genel gerçeklerden bahseder. First conditional geleceğe dönük olası sonuçları ifade eder. Second ve third conditional, gerçek dışı veya geçmişte gerçekleşmemiş durumları anlatır. YDS sorularında zaman uyumu ve anlam uyumu birlikte test edilir.",
    examples: [
      { en: "If you heat water to 100°C, it boils.", tr: "Suyu 100 dereceye ısıtırsan kaynar." },
      { en: "If I had known, I would have called you.", tr: "Bilseydim seni arardım." },
    ],
    commonMistakes: [
      "If clause içinde will kullanmak",
      "Second ve third conditional yapılarını karıştırmak",
      "Gerçeklik durumuna uygun tense seçmemek",
    ],
    questions: [
      {
        question: "If she ___ earlier, she would have caught the train.",
        options: ["left", "had left", "would leave", "has left"],
        answer: "had left",
        explanation: "Third conditional yapısında if clause past perfect alır.",
      },
      {
        question: "If it rains tomorrow, we ___ the event indoors.",
        options: ["held", "would hold", "will hold", "hold"],
        answer: "will hold",
        explanation: "First conditional: if + present simple, will + base verb.",
      },
    ],
    studyPlan: [
      "8 dk conditional türlerini tabloyla tekrar et",
      "12 dk örnek cümle dönüşüm çalışması",
      "10 dk test çözümü",
      "5 dk yanlış analiz notu",
    ],
  },
  {
    topic: "Conjunctions and Linkers",
    level: "B2",
    objective: "Bağlaçları anlam ilişkisine göre seçebilmek",
    explanation:
      "Although, whereas, however, therefore ve moreover gibi bağlaçlar cümledeki mantıksal ilişkiyi belirler. YDS bağlaç sorularında ana strateji, cümleler arası neden-sonuç, zıtlık ve ekleme ilişkisinin net tespitidir.",
    examples: [
      { en: "Although the task was difficult, the team finished it on time.", tr: "Görev zor olmasına rağmen ekip onu zamanında bitirdi." },
      { en: "The roads were closed; therefore, we postponed the trip.", tr: "Yollar kapalıydı; bu nedenle geziyi erteledik." },
    ],
    commonMistakes: [
      "Zıtlık ve neden-sonuç bağlaçlarını karıştırmak",
      "Noktalama ve bağlaç ilişkisini ihmal etmek",
      "Cümle başı ve cümle içi linker kullanımını ayıramamak",
    ],
    questions: [
      {
        question: "The data were limited; ___, the researchers drew cautious conclusions.",
        options: ["however", "therefore", "because", "unless"],
        answer: "therefore",
        explanation: "İkinci bölüm sonuç bildiriyor, bu yüzden therefore uygun.",
      },
      {
        question: "___ the weather was poor, the match continued.",
        options: ["Because", "Although", "Therefore", "Moreover"],
        answer: "Although",
        explanation: "Zıtlık ilişkisi kurulduğu için although gerekir.",
      },
    ],
    studyPlan: [
      "10 dk bağlaç-anlam eşleştirme",
      "10 dk cümle tamamlama",
      "10 dk mini test",
      "5 dk yanlışların sınıflandırılması",
    ],
  },
];

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

async function createVocabularyReading(words: string[]) {
  const aiText = await tryProviderRewrite(
    [
      "Write one English reading passage for Turkish YDS learners.",
      "Length: 130-170 words.",
      "Use all of these words naturally in the passage:",
      words.join(", "),
      "Return only the passage text without title or bullet points.",
    ].join("\n")
  );

  const fallback = `Students preparing for YDS often need a coherent routine to improve academic reading speed. In our program, learners allocate short sessions for vocabulary and use each new term in context. They first review prevalent themes in recent exam texts, then identify any implicit assumption behind the writer's argument. This method helps them justify answers with evidence instead of intuition. Even when time constraints make revision difficult, a substantial improvement is still feasible if students follow a consistent plan. Teachers also encourage learners to mitigate stress by using a brief checklist before each practice test. As a subsequent step, students compare their mistakes and build a comprehensive notebook to track progress. Although setbacks are inevitable, this strategy supports resilient study habits and leads to more confident performance.`;

  return {
    title: "Daily Reading: Vocabulary in Context",
    passage: aiText ?? fallback,
    words,
  };
}

function createReadingQuestions(passage: Omit<ReadingPassage, "questions" | "studyPlan">): ReadingQuestion[] {
  return [
    {
      type: "main-idea",
      question: `What is the central claim of the passage titled "${passage.title}"?`,
    },
    {
      type: "detail",
      question: "Which specific implementation challenge is highlighted by the author?",
    },
    {
      type: "inference",
      question: "What can be inferred about long-term outcomes if current recommendations are ignored?",
    },
    {
      type: "vocabulary",
      question: `In context, which meaning of "${passage.keyVocabulary[0]}" best fits the paragraph?`,
    },
    {
      type: "tone",
      question: "Is the author's tone primarily optimistic, cautious, or critical? Justify briefly.",
    },
  ];
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

async function createAiReadingQuestions(passage: Omit<ReadingPassage, "questions" | "studyPlan">) {
  const aiText = await tryProviderRewrite(
    [
      "Create 5 comprehension questions in Turkish for the passage.",
      "Return a JSON array only.",
      "Each item must be: {\"type\":\"main-idea|detail|inference|vocabulary|tone\",\"question\":\"...\"}",
      `Title: ${passage.title}`,
      `Passage: ${passage.passage}`,
    ].join("\n")
  );

  if (!aiText) {
    return createReadingQuestions(passage);
  }

  const parsed = extractJsonArray(aiText);
  if (!parsed) {
    return createReadingQuestions(passage);
  }

  const allowedTypes = new Set(["main-idea", "detail", "inference", "vocabulary", "tone"]);
  const normalized = parsed
    .map((item) => {
      const type = typeof item?.type === "string" ? item.type : "detail";
      const question = typeof item?.question === "string" ? item.question.trim() : "";
      if (!allowedTypes.has(type) || question.length < 8) {
        return null;
      }
      return { type: type as ReadingQuestion["type"], question };
    })
    .filter((item): item is ReadingQuestion => Boolean(item));

  return normalized.length >= 3 ? normalized.slice(0, 5) : createReadingQuestions(passage);
}

function createReadingPlan(source: string) {
  return [
    `3 dk: Baslik ve kaynak (${source}) uzerinden konu tahmini yap.`,
    "8 dk: Metni aktif not alarak oku, gecis ifadelerini isaretle.",
    "6 dk: Ana fikir + destekleyici fikirleri 3 maddede ozetle.",
    "8 dk: Comprehension sorularini coz ve yanitlarini kanitla.",
    "5 dk: Yeni kelimelerle iki ornek cumle yaz.",
  ];
}

async function tryProviderRewrite(prompt: string) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return null;
  }

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
        temperature: 0.4,
        messages: [
          { role: "system", content: "You are an academic English tutor." },
          { role: "user", content: prompt },
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

export async function getDailyVocabulary(date = new Date()) {
  const seed = getDaySeed(date);
  const selected = pickUnique(vocabularyPool, 10, seed).map(
    (item) =>
      ({
        ...item,
        examples: createVocabularyExamples(item.word, item.trMeaning),
      }) satisfies VocabularyItem
  );
  const reading = await createVocabularyReading(selected.map((item) => item.word));

  return {
    generatedAt: date.toISOString(),
    model: process.env.AI_API_KEY ? "hybrid-ai" : "local-ai",
    dailyTarget: 10,
    items: selected,
    reading,
  };
}

export async function getDailyReadingModule(options?: {
  date?: Date;
  interestTags?: string[];
}) {
  const date = options?.date ?? new Date();
  const seed = getDaySeed(date);
  const interestTags = options?.interestTags ?? [];

  const rssNews = await getDailyRssNews({
    interestTags,
    seed,
    limit: 3,
  });

  let passages: ReadingPassage[];

  if (rssNews.length > 0) {
    passages = await Promise.all(
      rssNews.map(async (item) => {
        const basePassage = {
          source: item.source,
          sourceUrl: item.url,
          category: item.category,
          title: item.title,
          passage: item.summary,
          summary: item.summary,
          keyVocabulary: item.summary
            .split(/\W+/)
            .map((word) => word.toLowerCase())
            .filter((word) => word.length >= 7)
            .slice(0, 5),
        };

        const questions = await createAiReadingQuestions(basePassage);
        return {
          ...basePassage,
          questions,
          studyPlan: createReadingPlan(item.source),
        } satisfies ReadingPassage;
      })
    );
  } else {
    const selected = pickUnique(readingPool, 3, seed);
    passages = selected.map((item) => ({
      ...item,
      questions: createReadingQuestions(item),
      studyPlan: createReadingPlan(item.source),
    }));
  }

  return {
    generatedAt: date.toISOString(),
    model: process.env.AI_API_KEY ? "hybrid-ai-rss" : "local-rss",
    passages,
    performanceGuide: {
      skimFirst: "Ilk okumada detay yerine paragraf fonksiyonunu bul.",
      markSignals: "However, therefore, despite gibi sinyal kelimeleri isaretle.",
      answerOrder: "Detay sorularinda metin sirasina gore ilerle.",
      reviewWindow: "Yanlis sorulari 24 saat icinde tekrar coz.",
    },
  };
}

export async function getDailyGrammarModule(date = new Date()) {
  const seed = getDaySeed(date);
  const index = seed % grammarPool.length;
  const selected = grammarPool[index];

  const aiHint = await tryProviderRewrite(
    `Give one short strategy note in Turkish for YDS grammar topic: ${selected.topic}. Keep it under 35 words.`
  );

  return {
    generatedAt: date.toISOString(),
    model: process.env.AI_API_KEY ? "hybrid-ai" : "local-ai",
    module: selected,
    aiCoachNote:
      aiHint ??
      "Yanlis yaptigin sorularda once zaman/bağlaç ilişkisini bul, sonra seçenekleri eleme yöntemiyle daralt.",
  };
}

export type { GrammarModule, ReadingPassage, VocabularyItem };