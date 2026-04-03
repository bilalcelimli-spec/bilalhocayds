import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/auth";
import { callAiChatCompletion, extractJsonTextFromContent } from "@/src/lib/ai-client";
import { buildAiApiResponse } from "@/src/lib/ai-api-response";

const bodySchema = z.object({
  pageKey: z.string().min(1),
  pageLabel: z.string().min(1),
  pagePath: z.string().optional(),
  currentTitle: z.string().optional(),
  currentDescription: z.string().optional(),
  currentKeywords: z.string().optional(),
  currentPrimaryKeyword: z.string().optional(),
  currentSecondaryKeywords: z.string().optional(),
  currentSearchIntent: z.string().optional(),
  context: z.string().optional(), // extra page context the admin provides
});

const PAGE_CONTEXTS: Record<string, string> = {
  home: "YDS/YÖKDİL/YDT hazırlık platformu — AI destekli kişisel çalışma planı, günlük vocabulary, reading, grammar modülleri ve canlı dersler. Hedef kitle: Türkiye'deki üniversite öğrencileri ve YDS sınavına hazırlananlar.",
  pricing: "Platform üyelik planları: Basic (vocabulary+grammar), Pro (tüm modüller+AI plan), Premium (tüm modüller+canlı dersler+AI plan). Aylık abonelik, yıllık indirim seçeneği var.",
  "live-classes": "Bilal Hoca'nın haftalık canlı YDS dersleri. Üyeler ve üye olmayanlar tek seferlik satın alım yapabilir. Okuma, gramer, vocabulary odaklı oturumlar.",
  grammar: "AI destekli gramer modülü. Her gün yeni gramer konusu, soru bankası ve açıklamalar.",
  vocabulary: "Günlük vocabulary modülü. B2-C2 seviyesi YDS kelimeleri, örnek cümleler ve AI destekli içerik.",
  reading: "Reading modülü — günlük okuma parçaları, anlama soruları ve AI destekli analiz.",
  dashboard: "Öğrenci kontrol paneli — günlük görevler, ilerleme takibi, yaklaşan dersler.",
  login: "Giriş sayfası — Bilal Hoca YDS platformuna üye girişi.",
  register: "Kayıt ol sayfası — YDS hazırlık platformuna ücretsiz kayıt.",
};

type SeoSuggestionShape = {
  primaryKeyword?: string;
  secondaryKeywords?: string;
  searchIntent?: string;
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  ogType?: string;
  twitterCard?: string;
  schemaType?: string;
  robotsDirectives?: string;
  breadcrumbTitle?: string;
  changeFrequency?: string;
  sitemapPriority?: number;
  analysis?: Record<string, unknown>;
};

function buildFallbackSuggestions(input: {
  pageKey: string;
  pageLabel: string;
  currentTitle?: string;
  currentDescription?: string;
  currentKeywords?: string;
  currentPrimaryKeyword?: string;
  currentSecondaryKeywords?: string;
  currentSearchIntent?: string;
}): SeoSuggestionShape {
  return {
    primaryKeyword: input.currentPrimaryKeyword ?? input.pageLabel,
    secondaryKeywords:
      input.currentSecondaryKeywords ??
      "yds hazırlık, yökdil hazırlık, ydt hazırlık, online Ingilizce, sınav Ingilizcesi",
    searchIntent: input.currentSearchIntent ?? "commercial",
    title: input.currentTitle ?? `${input.pageLabel} | Bilal Hoca YDS`,
    description:
      input.currentDescription ??
      `YDS, YÖKDİL ve YDT sınavına hazırlanmak için Bilal Hoca'nın AI destekli platformunu keşfet. ${input.pageLabel} modülü ile sınava adım at.`,
    keywords:
      input.currentKeywords ??
      "YDS hazırlık, YÖKDİL, YDT, online Ingilizce, canlı ders, AI öğrenme",
    ogTitle: input.currentTitle ?? `${input.pageLabel} | Bilal Hoca YDS`,
    ogDescription:
      input.currentDescription ??
      "Bilal Hoca ile YDS'ye hazırlan. AI destekli kişisel plan, günlük görevler ve canlı dersler.",
    twitterTitle: input.currentTitle ?? `${input.pageLabel} | Bilal Hoca YDS`,
    twitterDescription:
      input.currentDescription ??
      `Bilal Hoca YDS platformunda ${input.pageLabel} sayfasını keşfet ve sınava daha planlı hazırlan.`,
    ogType: "website",
    twitterCard: "summary_large_image",
    schemaType: "WebPage",
    robotsDirectives: "max-image-preview:large, max-snippet:-1",
    breadcrumbTitle: input.pageLabel,
    changeFrequency: "weekly",
    sitemapPriority: input.pageKey === "home" ? 1 : 0.8,
    analysis: {
      titleScore: null,
      improvements: [
        "AI API anahtarı tanımlanmadığı için detaylı analiz yapılamadı.",
        "Render Dashboard'dan AI_API_KEY env var'ını ekle.",
      ],
    },
  };
}

function assessSeoSuggestionQuality(suggestion: SeoSuggestionShape) {
  const checks: string[] = [];
  const title = (suggestion.title ?? "").trim();
  const description = (suggestion.description ?? "").trim();
  const primaryKeyword = (suggestion.primaryKeyword ?? "").trim();
  const schemaType = (suggestion.schemaType ?? "").trim();

  if (title.length >= 35 && title.length <= 70) {
    checks.push("Title length is in SEO target range.");
  } else {
    checks.push("Title length is outside SEO target range (35-70).");
  }

  if (description.length >= 120 && description.length <= 180) {
    checks.push("Description length is in SEO target range.");
  } else {
    checks.push("Description length is outside SEO target range (120-180).");
  }

  if (primaryKeyword.length > 0) {
    checks.push("Primary keyword is present.");
  } else {
    checks.push("Primary keyword is missing.");
  }

  if (schemaType.length > 0) {
    checks.push("Schema type is present.");
  } else {
    checks.push("Schema type is missing.");
  }

  const penalties = [
    title.length < 35 || title.length > 70 ? 18 : 0,
    description.length < 120 || description.length > 180 ? 18 : 0,
    primaryKeyword.length === 0 ? 22 : 0,
    schemaType.length === 0 ? 22 : 0,
  ].reduce((sum, value) => sum + value, 0);

  const qualityScore = Math.max(0, 100 - penalties);
  return {
    qualityScore,
    qualityChecks: checks,
  };
}

async function callAI(prompt: string) {
  const completion = await callAiChatCompletion({
    systemPrompt:
      "Sen deneyimli bir Türkçe SEO uzmanısın. Eğitim ve e-öğrenme sektöründe uzmansın. " +
      "Google'ın E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) kriterlerini göz önünde bulundurarak " +
      "TR pazarı için optimize edilmiş, doğal dilde, tıklama oranını artıracak SEO metinleri yazarsın. " +
      "Her zaman sadece JSON formatında cevap verirsin, başka hiçbir şey eklemezsin.",
    userPrompt: prompt,
    temperature: 0.3,
    responseFormat: "json_object",
  });

  return completion;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });
  }

  const {
    pageKey,
    pageLabel,
    pagePath,
    currentTitle,
    currentDescription,
    currentKeywords,
    currentPrimaryKeyword,
    currentSecondaryKeywords,
    currentSearchIntent,
    context,
  } = parsed.data;

  const pageContext = PAGE_CONTEXTS[pageKey] ?? `"${pageLabel}" sayfası`;
  const extraContext = context ? `\nEk bağlam: ${context}` : "";

  const prompt = `
Aşağıdaki sayfa için Google arama motoru optimizasyonu (SEO) önerileri üret.

Sayfa: ${pageLabel} (key: ${pageKey})
Path: ${pagePath ?? `/${pageKey}`}
Platform: Bilal Hoca YDS/YÖKDİL/YDT Hazırlık Platformu (bilalhocayds.com)
Sayfa içeriği: ${pageContext}${extraContext}

${currentTitle ? `Mevcut title: ${currentTitle}` : ""}
${currentDescription ? `Mevcut description: ${currentDescription}` : ""}
${currentKeywords ? `Mevcut keywords: ${currentKeywords}` : ""}
${currentPrimaryKeyword ? `Mevcut primary keyword: ${currentPrimaryKeyword}` : ""}
${currentSecondaryKeywords ? `Mevcut secondary keywords: ${currentSecondaryKeywords}` : ""}
${currentSearchIntent ? `Mevcut search intent: ${currentSearchIntent}` : ""}

Lütfen aşağıdaki JSON formatında tam ve optimize edilmiş öneriler sun:
{
  "primaryKeyword": "Ana hedef anahtar kelime",
  "secondaryKeywords": "virgülle ayrılmış destekleyici anahtar kelimeler",
  "searchIntent": "informational | commercial | navigational | transactional",
  "title": "60 karakterden kısa, anahtar kelime içeren başlık",
  "description": "150-160 karakter arası, CTA içeren meta description",
  "keywords": "virgülle ayrılmış 8-12 anahtar kelime",
  "ogTitle": "Open Graph için sosyal medyada paylaşım başlığı",
  "ogDescription": "Open Graph açıklaması (120-150 karakter)",
  "twitterTitle": "Twitter/X paylaşım başlığı",
  "twitterDescription": "Twitter/X açıklaması",
  "ogType": "website | article | course | product",
  "twitterCard": "summary_large_image",
  "schemaType": "WebSite | Course | Article | FAQPage | Product",
  "robotsDirectives": "max-image-preview:large, max-snippet:-1",
  "breadcrumbTitle": "Breadcrumb'da görünecek kısa isim",
  "changeFrequency": "daily | weekly | monthly",
  "sitemapPriority": 0.8,
  "analysis": {
    "titleScore": 85,
    "descriptionScore": 78,
    "keywordDensityNotes": "Önerilen anahtar kelime yoğunluğu hakkında not",
    "competitorInsight": "Bu sayfa için rekabet durumu ve öneriler",
    "improvements": ["Öneri 1", "Öneri 2", "Öneri 3"],
    "targetKeywords": ["birincil anahtar kelime", "ikincil anahtar kelime"],
    "estimatedCtr": "Tahmini tıklama oranı yorumu",
    "serp": "Bu sayfanın SERP'te nasıl görüneceğine dair yorum"
  },
  "schemaMarkup": {
    "@context": "https://schema.org",
    "@type": "uygun schema tipi",
    "name": "...",
    "description": "..."
  }
}
`;

  const aiResponse = await callAI(prompt);

  if (!aiResponse.ok || !aiResponse.rawText) {
    const failureReason = aiResponse.ok ? "seo_local_fallback" : aiResponse.errorType ?? "seo_local_fallback";
    const failureType = aiResponse.ok ? "seo_local_fallback" : aiResponse.errorType;

    // AI yoksa temel öneriler üret
    return NextResponse.json(
      buildAiApiResponse({
        data: {
          aiAvailable: false,
          suggestions: buildFallbackSuggestions({
            pageKey,
            pageLabel,
            currentTitle,
            currentDescription,
            currentKeywords,
            currentPrimaryKeyword,
            currentSecondaryKeywords,
            currentSearchIntent,
          }),
        },
        ai: {
          model: aiResponse.model,
          providerAvailable: aiResponse.providerAvailable,
          traceId: aiResponse.traceId,
          latencyMs: aiResponse.latencyMs,
          attempts: aiResponse.attempts,
          usedFallback: true,
          fallbackReason: failureReason,
          errorType: failureType,
          qualityScore: 35,
          qualityChecks: ["Provider response unavailable; local fallback suggestions were used."],
        },
      }),
    );
  }

  try {
    const jsonText = extractJsonTextFromContent(aiResponse.rawText);
    if (!jsonText) throw new Error("No JSON in response");
    const suggestions = JSON.parse(jsonText) as SeoSuggestionShape;
    const quality = assessSeoSuggestionQuality(suggestions);
    const failedQualityGate = quality.qualityScore < 70;

    if (failedQualityGate) {
      return NextResponse.json(
        buildAiApiResponse({
          data: {
            aiAvailable: false,
            suggestions: buildFallbackSuggestions({
              pageKey,
              pageLabel,
              currentTitle,
              currentDescription,
              currentKeywords,
              currentPrimaryKeyword,
              currentSecondaryKeywords,
              currentSearchIntent,
            }),
          },
          ai: {
            model: aiResponse.model,
            providerAvailable: aiResponse.providerAvailable,
            traceId: aiResponse.traceId,
            latencyMs: aiResponse.latencyMs,
            attempts: aiResponse.attempts,
            usedFallback: true,
            fallbackReason: "quality_threshold_not_met",
            errorType: null,
            qualityScore: quality.qualityScore,
            qualityChecks: quality.qualityChecks,
          },
        }),
      );
    }

    return NextResponse.json(
      buildAiApiResponse({
        data: { aiAvailable: true, suggestions },
        ai: {
          model: aiResponse.model,
          providerAvailable: aiResponse.providerAvailable,
          traceId: aiResponse.traceId,
          latencyMs: aiResponse.latencyMs,
          attempts: aiResponse.attempts,
          usedFallback: false,
          fallbackReason: null,
          errorType: null,
          qualityScore: quality.qualityScore,
          qualityChecks: quality.qualityChecks,
        },
      }),
    );
  } catch {
    return NextResponse.json(
      buildAiApiResponse({
        data: { aiAvailable: true, raw: aiResponse.rawText, suggestions: null },
        ai: {
          model: aiResponse.model,
          providerAvailable: aiResponse.providerAvailable,
          traceId: aiResponse.traceId,
          latencyMs: aiResponse.latencyMs,
          attempts: aiResponse.attempts,
          usedFallback: true,
          fallbackReason: "invalid_json_response",
          errorType: "invalid_json_response",
          qualityScore: 20,
          qualityChecks: ["AI response could not be parsed as valid JSON."],
        },
      }),
    );
  }
}
