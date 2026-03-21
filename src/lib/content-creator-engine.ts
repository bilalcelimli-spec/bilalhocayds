import { PDFParse } from "pdf-parse";
import { Prisma } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

export const contentSourceTypes = ["TEXT", "WEB", "PDF", "VIDEO", "AUDIO", "DOCUMENT", "OTHER"] as const;

export type ContentSourceType = (typeof contentSourceTypes)[number];

export type ContentSourceInput = {
  title: string;
  sourceType: ContentSourceType;
  sourceUrl?: string;
  rawText?: string;
  styleNotes?: string;
  tags?: string[];
  mimeType?: string;
  file?: {
    name: string;
    type: string;
    buffer: Buffer;
  } | null;
};

export type ContentGenerationInput = {
  title: string;
  itemType: string;
  outputFormat: string;
  itemCount: number;
  instructions?: string;
  createdById?: string | null;
  sources: ContentSourceInput[];
};

export type GeneratedContentItem = {
  title: string;
  content: string;
  difficulty: string;
  tags: string[];
  sourceInspiration: string;
  answerKey?: string | null;
};

export type PublishedModule = "reading" | "grammar" | "vocabulary";

type NormalizedSource = {
  title: string;
  sourceType: ContentSourceType;
  sourceUrl: string | null;
  mimeType: string | null;
  rawText: string | null;
  extractedText: string;
  styleNotes: string | null;
  tags: string[];
  metadataJson: Prisma.InputJsonValue | null;
};

type AiPromptOptions = {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
};

function cleanText(value: string) {
  return value.replace(/\r/g, "").replace(/\t/g, " ").replace(/\s+/g, " ").trim();
}

function clipText(value: string, max = 4000) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function stripHtml(html: string) {
  return cleanText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
  );
}

function extractJsonArray(text: string) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function inferPublishedModule(itemType: string): PublishedModule | null {
  const normalized = itemType.toLowerCase();

  if (/(reading|passage|article|comprehension|text)/.test(normalized)) {
    return "reading";
  }

  if (/(grammar|modal|condition|clause|tense|preposition|article|voice|reported speech|inversion|gerund|infinitive)/.test(normalized)) {
    return "grammar";
  }

  if (/(vocab|vocabulary|lexis|collocation|idiom|phrasal|synonym|antonym|word formation|word)/.test(normalized)) {
    return "vocabulary";
  }

  return null;
}

export function normalizeGeneratedItems(value: unknown): GeneratedContentItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): GeneratedContentItem | null => {
      const title = typeof entry?.title === "string" ? cleanText(entry.title) : "";
      const content = typeof entry?.content === "string" ? cleanText(entry.content) : "";
      const difficulty = typeof entry?.difficulty === "string" ? cleanText(entry.difficulty) : "B2-C1";
      const tags = Array.isArray(entry?.tags)
        ? entry.tags
            .map((tag: unknown) => (typeof tag === "string" ? cleanText(tag) : ""))
            .filter((tag: string) => tag.length > 0)
            .slice(0, 8)
        : [];
      const sourceInspiration = typeof entry?.sourceInspiration === "string" ? cleanText(entry.sourceInspiration) : "Source cluster";
      const answerKey = typeof entry?.answerKey === "string" ? cleanText(entry.answerKey) : null;

      if (!title || !content) {
        return null;
      }

      return {
        title,
        content,
        difficulty,
        tags,
        sourceInspiration,
        answerKey,
      };
    })
    .filter((item: GeneratedContentItem | null): item is GeneratedContentItem => Boolean(item));
}

export async function getPublishedContentByModule(module: PublishedModule, limit = 6) {
  const runs = await prisma.contentGenerationRun.findMany({
    where: {
      status: "COMPLETED",
      isApproved: true,
      isPublished: true,
    },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      itemType: true,
      outputFormat: true,
      styleAnalysis: true,
      generatedItemsJson: true,
      generatedText: true,
      publishedAt: true,
    },
  });

  return runs
    .filter((run) => inferPublishedModule(run.itemType) === module)
    .slice(0, limit)
    .map((run) => ({
      ...run,
      items: normalizeGeneratedItems(run.generatedItemsJson),
    }));
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4);
}

function getDominantTerms(texts: string[]) {
  const stopwords = new Set([
    "that", "with", "from", "this", "have", "will", "into", "their", "about", "there",
    "which", "while", "where", "would", "could", "should", "been", "were", "them", "than",
    "olarak", "ancak", "çünkü", "gibi", "daha", "bile", "olan", "olanlar", "için", "veya",
    "bir", "iki", "üç", "the", "and", "for", "your", "ours", "they", "also", "after",
  ]);

  const counts = new Map<string, number>();
  for (const text of texts) {
    for (const token of tokenize(text)) {
      if (stopwords.has(token)) {
        continue;
      }
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([term]) => term);
}

function analyzeSourceStyle(sources: NormalizedSource[]) {
  const combinedTexts = sources.map((source) => source.extractedText);
  const dominantTerms = getDominantTerms(combinedTexts);
  const averageLength = Math.round(
    combinedTexts.reduce((sum, text) => sum + text.length, 0) / Math.max(combinedTexts.length, 1),
  );

  return [
    `Kaynak sayısı: ${sources.length}`,
    `Baskın kaynak tipleri: ${dedupe(sources.map((source) => source.sourceType)).join(", ")}`,
    `Ortalama çıkarılan metin uzunluğu: ${averageLength} karakter`,
    dominantTerms.length ? `Baskın kavramlar: ${dominantTerms.join(", ")}` : "Baskın kavram çıkarılamadı.",
    `Stil notları: ${sources.map((source) => source.styleNotes).filter(Boolean).join(" | ") || "Ek stil notu verilmedi."}`,
  ].join("\n");
}

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    return cleanText(textResult.text ?? "");
  } finally {
    await parser.destroy();
  }
}

async function fetchRemoteText(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Kaynak indirilemedi: ${url}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/pdf")) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      text: await extractPdfText(buffer),
      mimeType: contentType,
      metadataJson: { fetchedFrom: url, contentType },
    };
  }

  const html = await response.text();
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);

  return {
    text: stripHtml(html),
    mimeType: contentType || "text/html",
    metadataJson: {
      fetchedFrom: url,
      contentType,
      pageTitle: titleMatch ? cleanText(titleMatch[1]) : null,
    },
  };
}

async function normalizeSource(source: ContentSourceInput): Promise<NormalizedSource> {
  const title = cleanText(source.title) || cleanText(source.sourceUrl ?? "") || source.file?.name || "Untitled source";
  const rawText = cleanText(source.rawText ?? "") || null;
  const styleNotes = cleanText(source.styleNotes ?? "") || null;
  const tags = dedupe(source.tags ?? []);

  if (source.file) {
    const isPdf = source.sourceType === "PDF" || source.file.type.includes("pdf");
    const extractedText = isPdf
      ? await extractPdfText(source.file.buffer)
      : cleanText(source.file.buffer.toString("utf8"));

    return {
      title,
      sourceType: source.sourceType,
      sourceUrl: cleanText(source.sourceUrl ?? "") || null,
      mimeType: source.file.type || source.mimeType || null,
      rawText,
      extractedText: clipText(rawText ? `${rawText}\n\n${extractedText}` : extractedText, 12000),
      styleNotes,
      tags,
      metadataJson: {
        fileName: source.file.name,
        fileSize: source.file.buffer.byteLength,
      },
    };
  }

  if (source.sourceUrl && ["WEB", "PDF", "VIDEO", "AUDIO", "DOCUMENT", "OTHER"].includes(source.sourceType)) {
    try {
      const remote = await fetchRemoteText(source.sourceUrl);
      const joined = [rawText, remote.text].filter(Boolean).join("\n\n");
      return {
        title,
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
        mimeType: source.mimeType ?? remote.mimeType ?? null,
        rawText,
        extractedText: clipText(cleanText(joined), 12000),
        styleNotes,
        tags,
        metadataJson: remote.metadataJson,
      };
    } catch {
      if (rawText) {
        return {
          title,
          sourceType: source.sourceType,
          sourceUrl: source.sourceUrl,
          mimeType: source.mimeType ?? null,
          rawText,
          extractedText: clipText(rawText, 12000),
          styleNotes,
          tags,
          metadataJson: { fetchedFrom: source.sourceUrl, fallback: "rawText" },
        };
      }
    }
  }

  const extractedText = rawText || cleanText(`Source: ${title}. URL: ${source.sourceUrl ?? "n/a"}. Style notes: ${styleNotes ?? "n/a"}.`);

  return {
    title,
    sourceType: source.sourceType,
    sourceUrl: cleanText(source.sourceUrl ?? "") || null,
    mimeType: source.mimeType ?? null,
    rawText,
    extractedText: clipText(extractedText, 12000),
    styleNotes,
    tags,
    metadataJson: null,
  };
}

async function callAi(input: AiPromptOptions) {
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
        temperature: input.temperature ?? 0.45,
        messages: [
          {
            role: "system",
            content:
              input.systemPrompt ??
              "You are a content creator engine specialized in analyzing source materials and generating original educational items.",
          },
          { role: "user", content: input.userPrompt },
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

function createFallbackItems(input: ContentGenerationInput, sources: NormalizedSource[], styleAnalysis: string) {
  const excerpts = sources.map((source) => clipText(source.extractedText, 320));

  return Array.from({ length: input.itemCount }, (_, index) => ({
    title: `${input.itemType} ${index + 1}`,
    content: cleanText(
      `Kaynak analizi: ${styleAnalysis}. Özgün görev: ${input.itemType} üret. İlham özeti: ${excerpts[index % excerpts.length] ?? excerpts[0] ?? "Kaynak özeti yok."}`,
    ),
    difficulty: "B2-C1",
    tags: dedupe(sources.flatMap((source) => source.tags)).slice(0, 6),
    sourceInspiration: sources[index % sources.length]?.title ?? "Source cluster",
    answerKey: null,
  }));
}

function renderGeneratedItemsMarkdown(items: GeneratedContentItem[]) {
  return items
    .map((item, index) => {
      const parts = [
        `## ${index + 1}. ${item.title}`,
        item.content,
        `Difficulty: ${item.difficulty}`,
        item.tags.length ? `Tags: ${item.tags.join(", ")}` : null,
        `Inspired by: ${item.sourceInspiration}`,
        item.answerKey ? `Answer Key: ${item.answerKey}` : null,
      ].filter(Boolean);

      return parts.join("\n\n");
    })
    .join("\n\n---\n\n");
}

export async function generateContentFromSources(input: ContentGenerationInput) {
  const normalizedSources = await Promise.all(input.sources.map((source) => normalizeSource(source)));
  const styleAnalysis = analyzeSourceStyle(normalizedSources);

  const savedSources = await Promise.all(
    normalizedSources.map((source) =>
      prisma.contentSource.create({
        data: {
          title: source.title,
          sourceType: source.sourceType,
          sourceUrl: source.sourceUrl,
          mimeType: source.mimeType,
          rawText: source.rawText,
          extractedText: source.extractedText,
          styleNotes: source.styleNotes,
          tags: source.tags,
          metadataJson: source.metadataJson ?? Prisma.JsonNull,
          createdById: input.createdById ?? null,
        },
      }),
    ),
  );

  const run = await prisma.contentGenerationRun.create({
    data: {
      title: input.title,
      status: "PROCESSING",
      itemType: input.itemType,
      outputFormat: input.outputFormat,
      itemCount: input.itemCount,
      sourceIds: savedSources.map((source) => source.id),
      sourceSnapshotJson: normalizedSources as Prisma.InputJsonValue,
      styleAnalysis,
      instructions: input.instructions ?? null,
      createdById: input.createdById ?? null,
    },
  });

  try {
    const sourceBlocks = normalizedSources
      .map((source, index) => {
        return [
          `Source ${index + 1}`,
          `Title: ${source.title}`,
          `Type: ${source.sourceType}`,
          `URL: ${source.sourceUrl ?? "n/a"}`,
          `Tags: ${source.tags.join(", ") || "n/a"}`,
          `Style Notes: ${source.styleNotes ?? "n/a"}`,
          `Extracted Text Excerpt: ${clipText(source.extractedText, 2500)}`,
        ].join("\n");
      })
      .join("\n\n");

    const aiText = await callAi({
      systemPrompt:
        "You are BilalHocaYDS Content Creator Engine. Analyze the supplied sources for tone, difficulty, structure, and recurring patterns. Produce original educational items inspired by the sources without copying or paraphrasing too closely.",
      userPrompt: [
        "Return only a JSON array.",
        `Generation title: ${input.title}`,
        `Target item type: ${input.itemType}`,
        `Requested output format: ${input.outputFormat}`,
        `Item count: ${input.itemCount}`,
        `Custom instructions: ${input.instructions?.trim() || "None"}`,
        `Local style analysis:\n${styleAnalysis}`,
        "Every item must follow this schema exactly:",
        '[{"title":"...","content":"...","difficulty":"...","tags":["..."],"sourceInspiration":"...","answerKey":"... or null"}]',
        "Requirements:",
        "- Keep items original and exam-grade.",
        "- Preserve the genre, difficulty, and pedagogy of the sources.",
        "- Do not mention being AI-generated.",
        "- Avoid copying source sentences.",
        "- Make each item self-contained and production ready.",
        sourceBlocks,
      ].join("\n\n"),
      temperature: 0.5,
    });

    const parsed = aiText ? extractJsonArray(aiText) : null;
    const items = parsed ? normalizeGeneratedItems(parsed) : [];

    const generatedItems = items && items.length >= 1 ? items.slice(0, input.itemCount) : createFallbackItems(input, normalizedSources, styleAnalysis);
    const generatedText = renderGeneratedItemsMarkdown(generatedItems);

    const updatedRun = await prisma.contentGenerationRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        generatedItemsJson: generatedItems as Prisma.InputJsonValue,
        generatedText,
      },
    });

    return {
      run: updatedRun,
      sources: savedSources,
      generatedItems,
      generatedText,
      styleAnalysis,
      model: process.env.AI_API_KEY ? "hybrid-ai" : "local-fallback",
    };
  } catch (error) {
    await prisma.contentGenerationRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        generatedText: error instanceof Error ? error.message : "Unknown content generation error",
      },
    });
    throw error;
  }
}