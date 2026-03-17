import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/src/auth";

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

async function callAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "Sen deneyimli bir Türkçe SEO uzmanısın. Eğitim ve e-öğrenme sektöründe uzmansın. " +
              "Google'ın E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) kriterlerini göz önünde bulundurarak " +
              "TR pazarı için optimize edilmiş, doğal dilde, tıklama oranını artıracak SEO metinleri yazarsın. " +
              "Her zaman sadece JSON formatında cevap verirsin, başka hiçbir şey eklemezsin.",
          },
          { role: "user", content: prompt },
        ],
      }),
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
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

  if (!aiResponse) {
    // AI yoksa temel öneriler üret
    return NextResponse.json({
      aiAvailable: false,
      suggestions: {
        primaryKeyword: currentPrimaryKeyword ?? pageLabel,
        secondaryKeywords:
          currentSecondaryKeywords ??
          "yds hazırlık, yökdil hazırlık, ydt hazırlık, online İngilizce, sınav İngilizcesi",
        searchIntent: currentSearchIntent ?? "commercial",
        title: currentTitle ?? `${pageLabel} | Bilal Hoca YDS`,
        description:
          currentDescription ??
          `YDS, YÖKDİL ve YDT sınavına hazırlanmak için Bilal Hoca'nın AI destekli platformunu keşfet. ${pageLabel} modülü ile sınava adım at.`,
        keywords:
          currentKeywords ??
          "YDS hazırlık, YÖKDİL, YDT, online İngilizce, canlı ders, AI öğrenme",
        ogTitle: currentTitle ?? `${pageLabel} | Bilal Hoca YDS`,
        ogDescription:
          currentDescription ??
          `Bilal Hoca ile YDS'ye hazırlan. AI destekli kişisel plan, günlük görevler ve canlı dersler.`,
        twitterTitle: currentTitle ?? `${pageLabel} | Bilal Hoca YDS`,
        twitterDescription:
          currentDescription ??
          `Bilal Hoca YDS platformunda ${pageLabel} sayfasını keşfet ve sınava daha planlı hazırlan.`,
        ogType: "website",
        twitterCard: "summary_large_image",
        schemaType: "WebPage",
        robotsDirectives: "max-image-preview:large, max-snippet:-1",
        breadcrumbTitle: pageLabel,
        changeFrequency: "weekly",
        sitemapPriority: pageKey === "home" ? 1 : 0.8,
        analysis: {
          titleScore: null,
          improvements: [
            "AI API anahtarı tanımlanmadığı için detaylı analiz yapılamadı.",
            "Render Dashboard'dan AI_API_KEY env var'ını ekle.",
          ],
        },
      },
    });
  }

  try {
    // Extract JSON from AI response (might have extra text)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const suggestions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ aiAvailable: true, suggestions });
  } catch {
    return NextResponse.json({ aiAvailable: true, raw: aiResponse, suggestions: null });
  }
}
