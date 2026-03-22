import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";

import { ParseJobStatus, QuestionStatus, type ExamSectionType, type Prisma } from "@prisma/client";
import { PDFParse } from "pdf-parse";

import { prisma } from "@/lib/prisma";

const execFileAsync = promisify(execFile);

type ParsedQuestionDraft = {
  prompt: string;
  choices: string[];
  answer?: string;
  confidence: number;
  difficultyLabel?: string | null;
  topicTags: string[];
};

type ParsedSectionDraft = {
  title: string;
  description?: string | null;
  sectionType: ExamSectionType;
  passageText?: string | null;
  questions: ParsedQuestionDraft[];
};

type ParsedExamDraft = {
  parser: string;
  usedAi: boolean;
  usedOcr: boolean;
  warnings: string[];
  sections: ParsedSectionDraft[];
};

type ExtractionResult = {
  text: string;
  extractionMethod: "pdf-text" | "swift-ocr";
  usedOcr: boolean;
  pageCount: number | null;
  diagnostics: string[];
};

type ParsedQuestionBlock = {
  number: number;
  block: string;
  prefixText: string;
};

function clipText(text: string, limit: number) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}\n...[truncated]`;
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();
}

function countWords(text: string) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function sanitizeFileName(fileName: string) {
  const extension = extname(fileName) || ".pdf";
  const stem = basename(fileName, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "exam-source";

  return `${stem}${extension.toLowerCase()}`;
}

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return normalizeExtractedText(result.text ?? "");
  } finally {
    await parser.destroy();
  }
}

function looksLikeWeakPdfText(text: string) {
  const normalized = normalizeExtractedText(text);
  const wordCount = countWords(normalized);
  const averageWordLength = wordCount > 0 ? normalized.replace(/\s+/g, "").length / wordCount : 0;
  const questionMatches = normalized.match(/(^|\n)\s*\d{1,3}[).]/g)?.length ?? 0;

  return wordCount < 120 || averageWordLength < 2.5 || (questionMatches === 0 && normalized.length < 1200);
}

async function runSwiftPdfOcr(pdfPath: string) {
  const scriptPath = join(process.cwd(), "scripts", "pdf_ocr.swift");

  try {
    const { stdout } = await execFileAsync("swift", [scriptPath, pdfPath], {
      maxBuffer: 20 * 1024 * 1024,
    });

    const parsed = JSON.parse(stdout) as {
      text?: unknown;
      pageCount?: unknown;
    };

    const text = normalizeExtractedText(typeof parsed.text === "string" ? parsed.text : "");
    const pageCount = typeof parsed.pageCount === "number" && Number.isFinite(parsed.pageCount) ? parsed.pageCount : null;

    return text ? { text, pageCount } : null;
  } catch {
    return null;
  }
}

async function extractPdfTextWithFallback(buffer: Buffer, storedPdfPath: string): Promise<ExtractionResult> {
  const primaryText = await extractPdfText(buffer);
  const diagnostics: string[] = [];

  if (!looksLikeWeakPdfText(primaryText)) {
    return {
      text: primaryText,
      extractionMethod: "pdf-text",
      usedOcr: false,
      pageCount: null,
      diagnostics,
    };
  }

  diagnostics.push("Native PDF text extraction was weak; OCR fallback attempted.");

  const ocrResult = await runSwiftPdfOcr(storedPdfPath);
  if (ocrResult && ocrResult.text.length > primaryText.length) {
    diagnostics.push("macOS Vision OCR fallback produced a stronger text layer.");
    return {
      text: ocrResult.text,
      extractionMethod: "swift-ocr",
      usedOcr: true,
      pageCount: ocrResult.pageCount,
      diagnostics,
    };
  }

  diagnostics.push("OCR fallback did not improve the extraction result.");

  return {
    text: primaryText,
    extractionMethod: "pdf-text",
    usedOcr: false,
    pageCount: ocrResult?.pageCount ?? null,
    diagnostics,
  };
}

function deriveSectionHints(text: string) {
  const hints = [
    ["VOCABULARY", /vocabulary|closest meaning|word|synonym/i],
    ["GRAMMAR", /grammar|tense|clause|passive|relative/i],
    ["READING", /reading|paragraph|passage|main idea|inferred/i],
    ["TRANSLATION", /translation|translate|turkish|english/i],
    ["DIALOGUE", /dialogue|conversation|speaker/i],
  ] as const;

  return hints
    .filter(([, pattern]) => pattern.test(text))
    .map(([label]) => label);
}

function inferSectionType(title: string): ExamSectionType {
  const normalized = title.toLowerCase();

  if (normalized.includes("vocab") || normalized.includes("meaning") || normalized.includes("word")) return "VOCABULARY";
  if (normalized.includes("grammar") || normalized.includes("tense") || normalized.includes("clause")) return "GRAMMAR";
  if (normalized.includes("cloze")) return "CLOZE_TEST";
  if (normalized.includes("sentence")) return "SENTENCE_COMPLETION";
  if (normalized.includes("translation")) return "TRANSLATION_EN_TO_TR";
  if (normalized.includes("paragraph")) return "PARAGRAPH_COMPLETION";
  if (normalized.includes("reading") || normalized.includes("passage")) return "READING_COMPREHENSION";
  return "OTHER";
}

function sectionTitleFromType(sectionType: ExamSectionType) {
  switch (sectionType) {
    case "VOCABULARY":
      return "Vocabulary";
    case "GRAMMAR":
      return "Grammar";
    case "CLOZE_TEST":
      return "Cloze Test";
    case "SENTENCE_COMPLETION":
      return "Sentence Completion";
    case "TRANSLATION_EN_TO_TR":
      return "Translation";
    case "PARAGRAPH_COMPLETION":
      return "Paragraph Completion";
    case "READING_COMPREHENSION":
      return "Reading Comprehension";
    default:
      return "Imported Questions";
  }
}

function normalizeAnswerLetter(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const match = value.trim().toUpperCase().match(/[A-E]/);
  return match?.[0];
}

function normalizeChoiceText(choice: string, index: number) {
  const letter = ["A", "B", "C", "D", "E"][index] ?? "E";
  const normalized = choice.replace(/^[A-E][).:\-]\s*/i, "").trim();
  return normalized ? `${letter}) ${normalized}` : `${letter})`;
}

function cleanPassageText(text: string) {
  return normalizeExtractedText(
    text
      .replace(/read the following passage\s*(and answer.*)?/gi, "")
      .replace(/questions?\s*\d+\s*[-–]\s*\d+/gi, "")
      .replace(/aşağıdaki parçayı okuyunuz.*$/gim, "")
      .replace(/soruları cevaplayınız.*$/gim, "")
      .trim(),
  );
}

function extractAnswerKeyMap(text: string) {
  const answerMap = new Map<number, string>();

  const pairRegex = /(\d{1,3})\s*[-.):]?\s*([A-E])\b/g;
  for (const match of text.matchAll(pairRegex)) {
    const questionNumber = Number(match[1]);
    const answer = normalizeAnswerLetter(match[2]);
    if (Number.isFinite(questionNumber) && answer) {
      answerMap.set(questionNumber, answer);
    }
  }

  const denseLineRegex = /(?:^|\n)\s*((?:\d{1,3}\s*[A-E][,;\s]*){4,})/g;
  for (const lineMatch of text.matchAll(denseLineRegex)) {
    const line = lineMatch[1] ?? "";
    for (const pairMatch of line.matchAll(/(\d{1,3})\s*([A-E])/g)) {
      const questionNumber = Number(pairMatch[1]);
      const answer = normalizeAnswerLetter(pairMatch[2]);
      if (Number.isFinite(questionNumber) && answer) {
        answerMap.set(questionNumber, answer);
      }
    }
  }

  return answerMap;
}

function buildQuestionBlocks(extractedText: string) {
  const questionHeaderRegex = /^\s*(\d{1,3})[).]\s+/gm;
  const questionHeaders = Array.from(extractedText.matchAll(questionHeaderRegex));
  const blocks: ParsedQuestionBlock[] = [];
  let previousEnd = 0;

  for (const [index, header] of questionHeaders.entries()) {
    const number = Number(header[1]);
    const start = header.index ?? 0;
    const end = questionHeaders[index + 1]?.index ?? extractedText.length;
    const prefixText = extractedText.slice(previousEnd, start).trim();
    const block = extractedText.slice(start, end).trim();

    if (Number.isFinite(number) && block) {
      blocks.push({ number, block, prefixText });
    }

    previousEnd = end;
  }

  return blocks;
}

function extractPassageFromPrefix(prefixText: string, sectionType: ExamSectionType, prompt: string) {
  if (sectionType !== "READING_COMPREHENSION") {
    return null;
  }

  const normalizedPrefix = cleanPassageText(prefixText);
  if (!normalizedPrefix) {
    return null;
  }

  const hasPassageMarker = /read the following passage|according to the passage|paragrafa göre|aşağıdaki parçaya göre|passage/i.test(`${prefixText} ${prompt}`);
  const wordCount = countWords(normalizedPrefix);

  if (!hasPassageMarker && wordCount < 60) {
    return null;
  }

  return wordCount >= 35 ? normalizedPrefix : null;
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeQuestionDraft(value: unknown, fallbackConfidence: number): ParsedQuestionDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const prompt = String(record.prompt ?? record.question ?? "").trim();
  if (!prompt) {
    return null;
  }

  const rawChoices = Array.isArray(record.choices)
    ? record.choices
    : Array.isArray(record.options)
      ? record.options
      : [];

  const choices = rawChoices.map((choice) => String(choice ?? "").trim()).filter(Boolean).slice(0, 5);
  if (choices.length < 3) {
    return null;
  }

  while (choices.length < 5) {
    choices.push(choices[choices.length - 1] ?? "");
  }

  return {
    prompt,
    choices,
    answer: normalizeAnswerLetter(record.answer ?? record.correctAnswer),
    confidence: typeof record.confidence === "number" && Number.isFinite(record.confidence) ? Math.min(1, Math.max(0, record.confidence)) : fallbackConfidence,
    difficultyLabel: typeof record.difficultyLabel === "string" ? record.difficultyLabel.trim() || null : null,
    topicTags: Array.isArray(record.topicTags) ? record.topicTags.map((tag) => String(tag ?? "").trim()).filter(Boolean).slice(0, 6) : [],
  };
}

function normalizeSectionDraft(value: unknown, fallbackConfidence: number): ParsedSectionDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const title = String(record.title ?? record.name ?? "Imported Questions").trim() || "Imported Questions";
  const questionsSource = Array.isArray(record.questions) ? record.questions : [];
  const questions = questionsSource.map((question) => normalizeQuestionDraft(question, fallbackConfidence)).filter((question): question is ParsedQuestionDraft => Boolean(question));

  if (questions.length === 0) {
    return null;
  }

  return {
    title,
    description: typeof record.description === "string" ? record.description.trim() || null : null,
    sectionType: inferSectionType(typeof record.sectionType === "string" ? record.sectionType : title),
    passageText: typeof record.passageText === "string" ? record.passageText.trim() || null : null,
    questions,
  };
}

function applyAnswerKeyToSections(sections: ParsedSectionDraft[], answerKeyMap: Map<number, string>) {
  let questionIndex = 1;

  return sections.map((section) => ({
    ...section,
    questions: section.questions.map((question) => {
      const answer = question.answer ?? answerKeyMap.get(questionIndex);
      questionIndex += 1;

      return {
        ...question,
        answer,
      };
    }),
  }));
}

async function callAiExamParser(input: {
  examTitle: string;
  questionCountHint: number;
  extractedText: string;
  sectionHints: string[];
}) {
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
        temperature: 0.15,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You convert Turkish or English exam PDFs into a strict JSON structure for a YDS/YDT admin workspace. Preserve numbering, infer sensible sections, keep questions exam-grade, and return only valid JSON.",
          },
          {
            role: "user",
            content: [
              `Exam title: ${input.examTitle}`,
              `Expected question count: ${input.questionCountHint || 0}`,
              `Section hints: ${input.sectionHints.join(", ") || "none"}`,
              "Return JSON with this exact top-level schema:",
              '{"sections":[{"title":"...","description":"...","passageText":"optional","questions":[{"number":1,"prompt":"...","choices":["A) ...","B) ...","C) ...","D) ...","E) ..."],"answer":"A","difficultyLabel":"B2-C1","topicTags":["..."],"confidence":0.0}]}],"warnings":["..."]}',
              "Rules:",
              "- Keep exactly five choices when the source allows it.",
              "- If the answer key is missing, omit answer instead of inventing it.",
              "- Group consecutive questions under the same section title.",
              "- Do not include markdown or commentary.",
              "Source text:",
              clipText(input.extractedText, 32000),
            ].join("\n\n"),
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

    return extractJsonObject(rawContent);
  } catch {
    return null;
  }
}

function inferQuestionTypeText(block: string) {
  const sectionType = inferSectionType(block);
  return sectionTitleFromType(sectionType);
}

function parseChoicesFromBlock(block: string) {
  const optionRegex = /(?:^|\n)\s*([A-E])[).:\-]\s*([\s\S]*?)(?=(?:\n\s*[A-E][).:\-]\s)|$)/g;
  const matches = Array.from(block.matchAll(optionRegex));

  if (matches.length >= 3) {
    const choices = matches.map((match) => match[2].replace(/\n+/g, " ").replace(/\s+/g, " ").replace(/(?:answer|cevap)\s*[:\-].*$/i, "").trim());
    return {
      choices,
      firstOptionIndex: matches[0]?.index ?? -1,
    };
  }

  const inlineMatch = block.match(/\bA[).]\s*[\s\S]+\bB[).]\s*[\s\S]+\bC[).]\s*[\s\S]+/);
  if (!inlineMatch) {
    return { choices: [], firstOptionIndex: -1 };
  }

  const inlineRegex = /([A-E])[).]\s*([\s\S]*?)(?=(?:\s+[A-E][).]\s)|$)/g;
  const inlineChoices = Array.from(block.matchAll(inlineRegex)).map((match) => match[2].replace(/\s+/g, " ").trim());

  return {
    choices: inlineChoices,
    firstOptionIndex: inlineMatch.index ?? -1,
  };
}

function buildHeuristicDraft(extractedText: string, sectionHints: string[]): ParsedExamDraft {
  const questionBlocks = buildQuestionBlocks(extractedText);
  const sections = new Map<string, ParsedSectionDraft>();
  const warnings: string[] = [];

  for (const questionBlock of questionBlocks) {
    const block = questionBlock.block;
    const { choices, firstOptionIndex } = parseChoicesFromBlock(block);

    if (choices.length < 3 || firstOptionIndex === -1) {
      continue;
    }

    const prompt = block
      .slice(0, firstOptionIndex)
      .replace(/^\s*\d{1,3}[).]\s*/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!prompt) {
      continue;
    }

    const inferredTitle = inferQuestionTypeText(`${sectionHints.join(" ")} ${questionBlock.prefixText} ${prompt}`);
    const sectionType = inferSectionType(inferredTitle);
    const sectionTitle = sectionTitleFromType(sectionType);
    const answer = normalizeAnswerLetter(block.match(/(?:answer|correct answer|cevap)\s*[:\-]?\s*([A-E])/i)?.[1]);
    const passageText = extractPassageFromPrefix(questionBlock.prefixText, sectionType, prompt);
    const section = sections.get(sectionTitle) ?? {
      title: sectionTitle,
      description: null,
      sectionType,
      passageText: passageText,
      questions: [],
    };

    if (!section.passageText && passageText) {
      section.passageText = passageText;
    }

    section.questions.push({
      prompt,
      choices,
      answer,
      confidence: 0.58,
      difficultyLabel: null,
      topicTags: [],
    });
    sections.set(sectionTitle, section);
  }

  if (sections.size === 0) {
    warnings.push("Heuristic parser could not detect question blocks reliably.");
  }

  return {
    parser: "heuristic-exam-parser-v2",
    usedAi: false,
    usedOcr: false,
    warnings,
    sections: Array.from(sections.values()),
  };
}

async function buildParsedExamDraft(input: {
  examTitle: string;
  questionCountHint: number;
  extractedText: string;
  sectionHints: string[];
  usedOcr: boolean;
}) {
  const answerKeyMap = extractAnswerKeyMap(input.extractedText);
  const heuristicDraft = buildHeuristicDraft(input.extractedText, input.sectionHints);
  const aiRaw = await callAiExamParser({
    examTitle: input.examTitle,
    questionCountHint: input.questionCountHint,
    extractedText: input.extractedText,
    sectionHints: input.sectionHints,
  });

  const aiSections = Array.isArray(aiRaw?.sections)
    ? aiRaw.sections.map((section) => normalizeSectionDraft(section, 0.86)).filter((section): section is ParsedSectionDraft => Boolean(section))
    : [];
  const enrichedAiSections = applyAnswerKeyToSections(aiSections, answerKeyMap);
  const enrichedHeuristicSections = applyAnswerKeyToSections(heuristicDraft.sections, answerKeyMap);

  const aiWarnings = Array.isArray(aiRaw?.warnings) ? aiRaw.warnings.map((warning) => String(warning ?? "").trim()).filter(Boolean) : [];
  const heuristicQuestionCount = enrichedHeuristicSections.reduce((total, section) => total + section.questions.length, 0);
  const aiQuestionCount = enrichedAiSections.reduce((total, section) => total + section.questions.length, 0);
  const useAi = aiQuestionCount > 0 && aiQuestionCount >= Math.max(heuristicQuestionCount, Math.floor(input.questionCountHint * 0.5));

  return {
    parser: useAi ? "ai-exam-parser-v2" : heuristicDraft.parser,
    usedAi: useAi,
    usedOcr: input.usedOcr,
    warnings: [...(useAi ? aiWarnings : heuristicDraft.warnings)],
    sections: useAi ? enrichedAiSections : enrichedHeuristicSections,
  } satisfies ParsedExamDraft;
}

function buildIngestSnapshot(extractedText: string, fileName: string, checksum: string) {
  const questionMatches = extractedText.match(/(^|\n)\s*(\d{1,3})[\).]/g) ?? [];
  const lines = extractedText.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const sectionHints = deriveSectionHints(extractedText);

  return {
    ingestVersion: "ai-pdf-ingest-v1",
    fileName,
    checksum,
    characterCount: extractedText.length,
    wordCount: countWords(extractedText),
    lineCount: lines.length,
    estimatedQuestionCandidates: questionMatches.length,
    sectionHints,
    excerpt: extractedText.slice(0, 2500),
  };
}

async function getExamMeta(examId: string) {
  const exam = await prisma.examModule.findUnique({
    where: { id: examId },
    select: {
      id: true,
      title: true,
      isPublished: true,
      questionCount: true,
      activeVersionId: true,
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: { versionNumber: true },
      },
    },
  });

  if (!exam) {
    throw new Error("Sınav bulunamadı.");
  }

  return exam;
}

export async function ingestExamPdf(input: { examId: string; file: File; uploadedById?: string | null }) {
  const file = input.file;

  if (!file || file.size === 0) {
    throw new Error("PDF dosyası seçilmedi.");
  }

  const mimeType = file.type || "application/pdf";
  if (!mimeType.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Yalnızca PDF dosyaları yüklenebilir.");
  }

  const exam = await getExamMeta(input.examId);
  const buffer = Buffer.from(await file.arrayBuffer());
  const checksum = createHash("sha256").update(buffer).digest("hex");
  const safeFileName = sanitizeFileName(file.name);
  const targetDir = join(process.cwd(), "public", "uploads", "exams", input.examId);
  const storageKey = join("uploads", "exams", input.examId, `${Date.now()}-${safeFileName}`).replace(/\\/g, "/");
  const storedPdfPath = join(process.cwd(), "public", storageKey);

  await mkdir(targetDir, { recursive: true });
  await writeFile(storedPdfPath, buffer);

  const extraction = await extractPdfTextWithFallback(buffer, storedPdfPath);
  const extractedText = extraction.text;

  if (extractedText.length < 200) {
    throw new Error("PDF içinden yeterli metin çıkarılamadı. Native extraction ve OCR fallback sonrası metin hala çok kısa.");
  }

  const snapshot = buildIngestSnapshot(extractedText, file.name, checksum);
  const detectedAnswerKeyEntries = extractAnswerKeyMap(extractedText).size;
  const parsedDraft = await buildParsedExamDraft({
    examTitle: exam.title,
    questionCountHint: exam.questionCount,
    extractedText,
    sectionHints: snapshot.sectionHints,
    usedOcr: extraction.usedOcr,
  });
  const parsedQuestionCount = parsedDraft.sections.reduce((total, section) => total + section.questions.length, 0);
  const lowConfidenceCount = parsedDraft.sections.reduce((total, section) => total + section.questions.filter((question) => question.confidence < 0.72).length, 0);

  if (parsedQuestionCount === 0) {
    throw new Error("Yapılandırılmış soru çıkarımı başarısız oldu. PDF parse ekranında yeni bir dosya ile tekrar deneyin.");
  }

  if (exam.questionCount > 0 && parsedQuestionCount !== exam.questionCount) {
    parsedDraft.warnings.push(`Expected ${exam.questionCount} questions but parsed ${parsedQuestionCount}.`);
  }

  const questionConfidenceValues = parsedDraft.sections.flatMap((section) => section.questions.map((question) => question.confidence));
  const averageConfidence = questionConfidenceValues.length
    ? questionConfidenceValues.reduce((total, value) => total + value, 0) / questionConfidenceValues.length
    : 0.45;
  const parseConfidence = Math.min(0.99, Math.max(0.35, averageConfidence));
  const nextVersionNumber = (exam.versions[0]?.versionNumber ?? 0) + 1;
  const parseStatus = parsedDraft.warnings.length || lowConfidenceCount > 0 ? ParseJobStatus.NEEDS_REVIEW : ParseJobStatus.COMPLETED;
  const snapshotPayload = {
    ...snapshot,
    extractionMethod: extraction.extractionMethod,
    usedOcr: extraction.usedOcr,
    extractionDiagnostics: extraction.diagnostics,
    pageCount: extraction.pageCount,
    parser: parsedDraft.parser,
    usedAi: parsedDraft.usedAi,
    detectedAnswerKeyEntries,
    sectionCount: parsedDraft.sections.length,
    parsedQuestionCount,
    lowConfidenceCount,
    warnings: parsedDraft.warnings,
    structuredPreview: parsedDraft.sections.slice(0, 6).map((section) => ({
      title: section.title,
      questionCount: section.questions.length,
      hasPassage: Boolean(section.passageText),
    })),
  } satisfies Prisma.InputJsonValue;

  const persisted = await prisma.$transaction(async (tx) => {
    const version = await tx.examVersion.create({
      data: {
        examModuleId: input.examId,
        versionNumber: nextVersionNumber,
        label: `PDF import v${nextVersionNumber}`,
        parseJobStatus: ParseJobStatus.PROCESSING,
        isActive: true,
        createdById: input.uploadedById ?? null,
      },
      select: { id: true },
    });

    const asset = await tx.examAsset.create({
      data: {
        examVersionId: version.id,
        assetType: extraction.usedOcr ? "PDF_SOURCE_OCR" : "PDF_SOURCE",
        storageKey,
        originalFileName: file.name,
        mimeType,
        fileSizeBytes: buffer.byteLength,
        checksum,
        pageCount: extraction.pageCount,
        metadataJson: {
          ingestVersion: snapshot.ingestVersion,
          extractionMethod: extraction.extractionMethod,
          characterCount: snapshot.characterCount,
          wordCount: snapshot.wordCount,
          estimatedQuestionCandidates: snapshot.estimatedQuestionCandidates,
          sectionHints: snapshot.sectionHints,
        } satisfies Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    let globalQuestionNumber = 1;

    for (const [sectionIndex, section] of parsedDraft.sections.entries()) {
      const createdSection = await tx.examSection.create({
        data: {
          examModuleId: input.examId,
          examVersionId: version.id,
          sectionType: section.sectionType,
          title: section.title,
          description: section.description,
          displayOrder: sectionIndex + 1,
          questionStartNumber: globalQuestionNumber,
          questionEndNumber: globalQuestionNumber + section.questions.length - 1,
        },
      });

      const passageGroup = section.passageText
        ? await tx.examPassageGroup.create({
            data: {
              examModuleId: input.examId,
              examVersionId: version.id,
              sectionId: createdSection.id,
              title: `${section.title} Passage`,
              passageText: section.passageText,
              displayOrder: 1,
            },
            select: { id: true },
          })
        : null;

      for (const question of section.questions) {
        const optionValues = Array.from({ length: 5 }, (_, optionIndex) => normalizeChoiceText(question.choices[optionIndex] ?? "", optionIndex));

        await tx.examQuestion.create({
          data: {
            examModuleId: input.examId,
            examVersionId: version.id,
            sectionId: createdSection.id,
            passageGroupId: passageGroup?.id ?? null,
            questionNumber: globalQuestionNumber,
            displayOrder: globalQuestionNumber,
            sectionType: section.sectionType,
            questionText: question.prompt,
            optionA: optionValues[0],
            optionB: optionValues[1],
            optionC: optionValues[2],
            optionD: optionValues[3],
            optionE: optionValues[4],
            correctAnswer: question.answer ?? "A",
            parseConfidence: question.confidence,
            status: QuestionStatus.DRAFT,
            isVerified: false,
            topicTags: question.topicTags,
            difficultyLabel: question.difficultyLabel,
            createdById: input.uploadedById ?? null,
          },
        });

        globalQuestionNumber += 1;
      }
    }

    await tx.examParseJob.create({
      data: {
        examVersionId: version.id,
        status: parseStatus,
        provider: parsedDraft.parser,
        startedAt: new Date(),
        completedAt: new Date(),
        rawOutputJson: {
          ...snapshotPayload,
          extractedText,
        } satisfies Prisma.InputJsonValue,
        lowConfidenceCount,
        createdById: input.uploadedById ?? null,
      },
    });

    await tx.examVersion.update({
      where: { id: version.id },
      data: {
        sourcePdfAssetId: asset.id,
        parseJobStatus: parseStatus,
        parseConfidence,
        parsedSnapshotJson: {
          ...snapshotPayload,
          assetId: asset.id,
          versionNumber: nextVersionNumber,
          textPreview: extractedText.slice(0, 4000),
        } satisfies Prisma.InputJsonValue,
      },
    });

    await tx.examModule.update({
      where: { id: input.examId },
      data: {
        pdfOriginalAssetId: asset.id,
        activeVersionId: version.id,
        publicationStatus: exam.isPublished ? "PUBLISHED" : "READY",
      },
    });

    return {
      versionId: version.id,
      assetId: asset.id,
    };
  });

  return {
    versionId: persisted.versionId,
    assetId: persisted.assetId,
    parseConfidence,
    snapshot: snapshotPayload,
  };
}