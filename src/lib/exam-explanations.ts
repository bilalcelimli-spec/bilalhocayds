import { ExplanationSourceType, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const EXAM_EXPLANATION_PROMPT_VERSION = "exam-review-v1";

export type ExamExplanationPayload = {
  shortReason: string;
  detailed: string;
  examTip: string;
  sourceType: "AI" | "HYBRID" | "MANUAL";
};

function parseStoredExplanation(content: Prisma.JsonValue | null | undefined): Omit<ExamExplanationPayload, "sourceType"> | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return null;
  }

  const record = content as Record<string, unknown>;
  const shortReason = typeof record.shortReason === "string" ? record.shortReason.trim() : "";
  const detailed = typeof record.detailed === "string" ? record.detailed.trim() : "";
  const examTip = typeof record.examTip === "string" ? record.examTip.trim() : "";

  if (!shortReason && !detailed && !examTip) {
    return null;
  }

  return {
    shortReason: shortReason || "Bu soru için değerlendirme hazırlandı.",
    detailed: detailed || "Detaylı açıklama bulunamadı.",
    examTip: examTip || "Soru kökünü ve şıkları birlikte analiz et.",
  };
}

function createFallbackExplanation(input: {
  examTitle: string;
  sectionTitle: string;
  questionText: string;
  correctAnswer: string;
  selectedAnswer: string | null;
  manualExplanation: string | null;
}): ExamExplanationPayload {
  const chosenAnswer = input.selectedAnswer ?? "Boş";
  const manual = input.manualExplanation?.trim();

  return {
    shortReason:
      chosenAnswer === input.correctAnswer
        ? `${input.sectionTitle} bölümünde doğru karar verilmiş.`
        : `Seçilen cevap ${chosenAnswer}, doğru cevap ise ${input.correctAnswer}. Kritik ayrım soru kökündeki bağlam sinyalinde.`,
    detailed:
      manual ||
      `${input.examTitle} içindeki bu ${input.sectionTitle.toLowerCase()} sorusunda doğru seçenek ${input.correctAnswer} çünkü soru kökü ve seçenekler birlikte okunduğunda bağlam akışı bu cevabı destekliyor. Yanlış seçimler yüzeysel anahtar kelime eşleşmesiyle cazip görünse de anlam akışını tam karşılamıyor. Soru metni: ${input.questionText}`,
    examTip:
      input.sectionTitle.toLowerCase().includes("reading")
        ? "Reading sorularında tek kelime eşleşmesi yerine paragrafın amacı ve cümleler arası ilişkiyi takip et."
        : "Önce soru kökündeki kuralı netleştir, sonra her şıkkı o kurala göre ele.",
    sourceType: manual ? "HYBRID" : "MANUAL",
  };
}

async function callAiForExplanation(input: {
  examTitle: string;
  sectionTitle: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  manualExplanation: string | null;
}) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const baseUrl = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You are an elite YDS exam coach. Return strict JSON with keys shortReason, detailed, examTip. Write the explanation in Turkish. Be concrete, concise, and exam-oriented.",
        },
        {
          role: "user",
          content: [
            `Exam: ${input.examTitle}`,
            `Section: ${input.sectionTitle}`,
            `Question: ${input.questionText}`,
            `Options: ${input.options.join(" | ")}`,
            `Correct answer: ${input.correctAnswer}`,
            `Student answer: ${input.selectedAnswer ?? "Boş"}`,
            input.manualExplanation ? `Manual explanation: ${input.manualExplanation}` : "Manual explanation: yok",
            "Explain why the correct option is correct, why the student's answer is weak if wrong, and add a short exam technique tip.",
          ].join("\n"),
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  const rawContent = json?.choices?.[0]?.message?.content;
  if (typeof rawContent !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(rawContent) as Record<string, unknown>;
    const shortReason = typeof parsed.shortReason === "string" ? parsed.shortReason.trim() : "";
    const detailed = typeof parsed.detailed === "string" ? parsed.detailed.trim() : "";
    const examTip = typeof parsed.examTip === "string" ? parsed.examTip.trim() : "";

    if (!shortReason || !detailed || !examTip) {
      return null;
    }

    return {
      shortReason,
      detailed,
      examTip,
      sourceType: input.manualExplanation?.trim() ? "HYBRID" : "AI",
    } satisfies ExamExplanationPayload;
  } catch {
    return null;
  }
}

async function ensureQuestionExplanation(input: {
  examTitle: string;
  examQuestionId: string;
  questionText: string;
  sectionTitle: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  manualExplanation: string | null;
  existingExplanation?: { contentJson: Prisma.JsonValue; sourceType: ExplanationSourceType } | null;
}) {
  const stored = parseStoredExplanation(input.existingExplanation?.contentJson);
  if (stored) {
    return {
      ...stored,
      sourceType: input.existingExplanation?.sourceType === ExplanationSourceType.HYBRID ? "HYBRID" : input.existingExplanation?.sourceType === ExplanationSourceType.MANUAL ? "MANUAL" : "AI",
    } satisfies ExamExplanationPayload;
  }

  const generated =
    (await callAiForExplanation({
      examTitle: input.examTitle,
      sectionTitle: input.sectionTitle,
      questionText: input.questionText,
      options: input.options,
      correctAnswer: input.correctAnswer,
      selectedAnswer: input.selectedAnswer,
      manualExplanation: input.manualExplanation,
    })) ??
    createFallbackExplanation({
      examTitle: input.examTitle,
      sectionTitle: input.sectionTitle,
      questionText: input.questionText,
      correctAnswer: input.correctAnswer,
      selectedAnswer: input.selectedAnswer,
      manualExplanation: input.manualExplanation,
    });

  await prisma.examQuestionExplanation.upsert({
    where: {
      examQuestionId_languageCode_promptVersion: {
        examQuestionId: input.examQuestionId,
        languageCode: "tr",
        promptVersion: EXAM_EXPLANATION_PROMPT_VERSION,
      },
    },
    update: {
      contentJson: generated as unknown as Prisma.InputJsonValue,
      sourceType:
        generated.sourceType === "HYBRID"
          ? ExplanationSourceType.HYBRID
          : generated.sourceType === "MANUAL"
            ? ExplanationSourceType.MANUAL
            : ExplanationSourceType.AI,
      isActive: true,
      generatedAt: new Date(),
    },
    create: {
      examQuestionId: input.examQuestionId,
      languageCode: "tr",
      promptVersion: EXAM_EXPLANATION_PROMPT_VERSION,
      contentJson: generated as unknown as Prisma.InputJsonValue,
      sourceType:
        generated.sourceType === "HYBRID"
          ? ExplanationSourceType.HYBRID
          : generated.sourceType === "MANUAL"
            ? ExplanationSourceType.MANUAL
            : ExplanationSourceType.AI,
      isActive: true,
      generatedAt: new Date(),
    },
  });

  return generated;
}

export async function ensureAttemptExplanationsForUser(userId: string, attemptId: string) {
  const attempt = await prisma.examAttempt.findFirst({
    where: {
      id: attemptId,
      studentId: userId,
      status: {
        in: ["SUBMITTED", "AUTO_SUBMITTED"],
      },
    },
    include: {
      examModule: {
        select: {
          title: true,
          aiExplanationEnabled: true,
        },
      },
      answers: {
        orderBy: { question: { displayOrder: "asc" } },
        include: {
          question: {
            include: {
              section: {
                select: {
                  title: true,
                },
              },
              explanations: {
                where: {
                  languageCode: "tr",
                  isActive: true,
                },
                orderBy: { updatedAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }

  if (!attempt.examModule.aiExplanationEnabled) {
    return new Map<string, ExamExplanationPayload>();
  }

  const explanationEntries = await Promise.all(
    attempt.answers.map(async (answer) => {
      const explanation = await ensureQuestionExplanation({
        examTitle: attempt.examModule.title,
        examQuestionId: answer.question.id,
        questionText: answer.question.questionText,
        sectionTitle: answer.question.section.title,
        options: [answer.question.optionA, answer.question.optionB, answer.question.optionC, answer.question.optionD, answer.question.optionE],
        correctAnswer: answer.question.correctAnswer,
        selectedAnswer: answer.selectedAnswer,
        manualExplanation: answer.question.manualExplanation,
        existingExplanation: answer.question.explanations[0] ?? null,
      });

      return [answer.question.id, explanation] as const;
    }),
  );

  return new Map(explanationEntries);
}