# Global İngilizce Platformu — Dönüşüm Planı

> Hedef: bilalhocayds'i YDS/YÖKDİL/YDT odaklı Türkçe bir hazırlık sitesinden, **platform içinde canlı online derslerin yapıldığı**, dünya çapında öğrencilere hizmet veren bir İngilizce platformuna dönüştürmek.
>
> **Kapsam kararı:** Bu, **tek eğitmenli (Bilal Hoca) bir marka platformudur** — öğretmen pazaryeri, dış öğretmen başvurusu, komisyon veya öğretmen ödemesi yoktur. Tüm dersler, içerik ve fiyatlandırma Bilal Hoca ve admin paneli tarafından yönetilir.

---

## 0. Mevcut Durum (kod incelemesinden)

| Alan | Bugün | Global hedef için eksik |
|---|---|---|
| Stack | Next.js 16 (App Router), React 19, Prisma 7 + PostgreSQL, NextAuth v4, Tailwind 4 | Yeterli; ölçek için cache/queue/realtime katmanı eklenmeli |
| Canlı ders | `LiveClass` modeli yalnızca harici `meetingLink` (Zoom/Meet) tutuyor (`src/lib/meeting-platform.ts`) | Platform içi video sınıf, ders tipi, kapasite, kayıt, yoklama yok |
| Eğitmen | Tek eğitmen (Bilal Hoca); `TEACHER`/`ADMIN` rolleri mevcut | Bilal Hoca için müsaitlik takvimi, birebir ders rezervasyonu, ders yönetim paneli yok |
| Dil / bölge | `<html lang="tr">`, tüm UI metinleri Türkçe hard-coded, `date-fns/locale/tr` | i18n altyapısı, çok dilli UI, saat dilimi yönetimi yok |
| Ödeme | PayTR (TRY), iyzico yardımcıları; `stripe` bağımlılığı var ama kullanılmıyor | Çoklu para birimi, uluslararası kart, abonelik yenileme, vergi (VAT) yok |
| İçerik | YDS/YDT sınav modülü, AI reading/grammar/vocab, günlük içerik cron'u | CEFR (A1–C2) müfredatı, IELTS/TOEFL/genel İngilizce/Business yolları yok |
| AI | Çok sağlayıcılı katman (`src/lib/ai/client.ts`: OpenAI, Anthropic, Gemini) | Konuşma pratiği, telaffuz, yazma değerlendirme, ders özeti gibi özellikler |
| Altyapı | Render (tek web + cron), `healthCheckPath: /api/health` tanımlı ama route yok | Health endpoint, CDN, çok bölgeli dağıtım, izleme/loglama |
| Uyum | — | GDPR/KVKK, çerez onayı, veri silme/dışa aktarma, çocuk kullanıcı politikası |

**Korunacak güçlü yanlar:** adaptif sınav motoru, AI içerik üretim motoru, özellik bazlı erişim (`StudentFeatureAccess`), plan yönetimi, admin paneli.

---

## 1. Ürün Vizyonu ve Konumlandırma

**Konum:** "Bilal Hoca ile İngilizce" — kişisel marka odaklı, tek eğitmenli, global erişimli online İngilizce okulu.

**Üç ürün ayağı:**
1. **Bilal Hoca ile Canlı Dersler (çekirdek):** Grup dersleri, webinar/kamp formatı (büyük katılımlı) ve sınırlı sayıda birebir (1:1) premium ders — hepsi platform içi sanal sınıfta.
2. **Kendi Kendine Öğrenme:** CEFR seviyeli AI destekli reading/grammar/vocab/listening/speaking + sınav hazırlık (YDS, YÖKDİL, IELTS, TOEFL, PTE, Cambridge).
3. **Kayıtlı Kurslar & Arşiv:** Canlı derslerin kayıtlarından oluşan, satın alınabilir/abonelikle erişilebilen video kurslar (Bilal Hoca'nın zamanını ölçeklemenin ana yolu).

**Hedef pazar sırası:** Türkiye (mevcut) → MENA + Orta Asya (Türkçe/Arapça/Rusça konuşan öğrenciler) → Latin Amerika + Güneydoğu Asya → global.

**Gelir modelleri:** abonelik (AI modülleri + grup dersleri + kayıt arşivi), tek seferlik canlı ders/kamp satışı, premium 1:1 ders paketleri, kayıtlı kurs satışı, kurumsal (B2B) grup eğitimleri, sınav marketplace (mevcut).

**Ölçek stratejisi:** Tek eğitmen olduğundan büyüme; (a) büyük katılımlı canlı derslerle (webinar modu, 100+ kişi), (b) kayıtların kurslaştırılmasıyla, (c) AI modüllerinin (speaking partner, yazma değerlendirme) Bilal Hoca'nın yöntemiyle eğitilmesiyle sağlanır.

---

## 2. Faz Planı

### Faz 0 — Temel Sağlamlaştırma (2–3 hafta)
- `GET /api/health` route'u ekle (render.yaml zaten bekliyor).
- Root `app/` ↔ `src/app/` ikili yapısını sadeleştir (tek kaynak).
- Hata izleme (Sentry), yapılandırılmış log, uptime izleme.
- Test altyapısı: Vitest (unit) + Playwright (E2E) + GitHub Actions CI (lint, `tsc --noEmit`, test).
- Prisma migration hijyeni (aynı isimli çift migration'lar: `add_student_interests`, `add_live_class_purchase_tracking`).
- Redis (Upstash vb.) — rate-limit, session cache, kuyruk için.

### Faz 1 — Uluslararasılaşma (i18n) (3–4 hafta)
- **Kütüphane:** `next-intl` (App Router ile uyumlu). Route yapısı: `/[locale]/...` (`/en`, `/tr`, `/ar`, `/es`...).
- Tüm hard-coded Türkçe metinleri `messages/{locale}.json` dosyalarına taşı. Başlangıç dilleri: **EN (varsayılan), TR**; ardından AR (RTL desteği), ES, RU, PT.
- `middleware.ts`: dil algılama (Accept-Language + cookie), mevcut auth middleware ile birleştirme.
- **Saat dilimi:** tüm tarihler UTC saklanır; `User.timezone` alanı; `date-fns-tz` ile gösterim. Ders saatleri öğrencinin yerel saatinde (Bilal Hoca paneli İstanbul saatiyle).
- `User` modeline: `locale`, `timezone`, `country`, `nativeLanguage`.
- SEO: `hreflang`, dil bazlı sitemap (`src/app/sitemap.ts`), `SeoConfig`'e locale boyutu.
- AI içerik promptlarında açıklama dili = öğrencinin ana dili (şu an `meaningTr` sabit → `translations Json` yapısına geçiş).

### Faz 2 — Platform İçi Canlı Ders Altyapısı (6–8 hafta) ⭐ çekirdek
**Video altyapısı seçimi (öneri: yönetilen WebRTC SFU):**

| Seçenek | Artı | Eksi |
|---|---|---|
| **LiveKit Cloud** (önerilen) | Açık kaynak, self-host'a geçiş yolu, React SDK, kayıt (Egress), global edge | Kendi UI'ını yazmak gerekir (hazır bileşenler var) |
| Daily.co | Çok hızlı entegrasyon, hazır prebuilt UI | Dakika maliyeti yüksek, vendor lock-in |
| 100ms / Agora | Güçlü Asya kapsaması | Lock-in, SDK karmaşıklığı |
| Zoom Video SDK | Marka güveni | Pahalı, kısıtlı özelleştirme |

**Sanal sınıf özellikleri (MVP → V2):**
- MVP: video/ses, ekran paylaşımı, sohbet, el kaldırma, Bilal Hoca moderasyonu (sessize alma, çıkarma, öğrenciye söz verme), bekleme odası, cihaz testi.
- **Webinar modu:** Bilal Hoca yayında, öğrenciler izleyici; el kaldıran öğrenci sahneye alınır (yüzlerce katılımcı için).
- V1: ortak **beyaz tahta** (tldraw / Excalidraw), PDF/slayt paylaşımı, bulut **kayıt** (→ mevcut `live-recordings` modülüne bağlanır), otomatik yoklama.
- V2: breakout rooms, canlı quiz/anket (mevcut soru bankasından), **AI ders notu & özet** (transkript → ders sonrası kelime listesi + ödev), canlı altyazı/çeviri.

**Teknik akış:**
1. `POST /api/classroom/[sessionId]/token` → yetki kontrolü (satın alma/abonelik/rol) → LiveKit JWT (kısa ömürlü, oda + rol izinleri).
2. `/classroom/[sessionId]` sayfası → `@livekit/components-react` ile sınıf UI.
3. LiveKit webhook'ları → `POST /api/webhooks/livekit` → katılım/yoklama, kayıt tamamlandı olayları.
4. Kayıtlar → S3/R2 depolama + imzalı URL ile oynatma (mevcut `hasLiveRecordingsAccess` kontrolü).

**Veri modeli (yeni / değişen):**
```prisma
model LiveClass {            // mevcut → genişlet
  type            ClassType  // ONE_ON_ONE | GROUP | WEBINAR
  capacity        Int
  cefrLevel       String?
  language        String     @default("en")
  roomProvider    String     @default("livekit") // "external" = eski meetingLink akışı
  roomName        String?    @unique
  status          ClassStatus // SCHEDULED | LIVE | ENDED | CANCELLED
  currency        String     @default("USD")
}
model ClassEnrollment   { liveClassId, userId, status, creditsUsed }
model ClassAttendance   { liveClassId, userId, joinedAt, leftAt, durationSec }
model ClassRecording    { liveClassId, storageKey, durationSec, status }
model ClassMaterial     { liveClassId, type, url }
```
- Geriye uyumluluk: `meetingLink` doluysa eski Zoom/Meet akışı çalışmaya devam eder.

### Faz 3 — Bilal Hoca Ders Takvimi & Birebir Rezervasyon (3–4 hafta)
- **Müsaitlik yönetimi:** Admin/öğretmen panelinden Bilal Hoca'nın haftalık uygun saatleri (`InstructorAvailability`, UTC saklanır), tatil/bloke günler.
- **Birebir rezervasyon:** Öğrenci kendi saat diliminde boş slotu seçer → ödeme/kredi → otomatik sınıf odası oluşur. Çakışma kontrolü (transaction + unique index), iptal/yeniden planlama kuralları (ör. 24 saat öncesine kadar).
- Mevcut `ExamReviewBooking` akışı bu ortak rezervasyon altyapısına taşınır.
- **Hatırlatmalar:** e-posta + push (24 saat ve 1 saat önce), takvime ekle (.ics / Google Calendar).
- **Ders yönetim paneli (`/teacher`):** günün dersleri, katılımcı listesi, ders notları, ödev atama, kayıt yönetimi.
- **Grup ders takvimi:** kamp/dönem programları (ör. "8 haftalık IELTS kampı"), kontenjan ve bekleme listesi.
- **Ders sonrası:** öğrenci geri bildirimi (yalnızca iç kalite takibi için), otomatik ödev ve ders özeti.

### Faz 4 — Global Ödeme ve Faturalama (3–4 hafta, Faz 2–3 ile paralel)
- **Stripe** (zaten bağımlılıkta) → uluslararası ana sağlayıcı: Checkout, Billing (abonelik yenileme), Stripe Tax (VAT/GST), Apple/Google Pay, yerel yöntemler (iDEAL, Pix, SEPA...).
- **PayTR/iyzico** → Türkiye'de TRY ödemeleri için korunur. `lib/payment/` altında `PaymentProvider` arayüzü ile soyutla; ülke/para birimine göre yönlendir.
- Öğretmen ödemesi/komisyon **yok** — tüm gelir tek hesaba; Stripe Connect gerekmez.
- Çok para birimi: fiyatlar `PlanPrice { planId, currency, amount }` tablosunda (bölgesel fiyatlandırma / satın alma gücü paritesi).
- **Kredi sistemi:** `CreditWallet` + `CreditTransaction` (birebir ders paketleri, grup ders girişleri, iade, promosyon).
- Webhook idempotency, fatura PDF, iade akışı, dolandırıcılık kontrolü (Stripe Radar).
- `Float` fiyat alanları → `Decimal` veya kuruş cinsinden `Int`'e geçiş.

### Faz 5 — Global Müfredat ve AI Özellikleri (sürekli)
- **CEFR tabanlı müfredat:** A1–C2 kurslar → üniteler → dersler; mevcut reading/grammar/vocab içerikleri CEFR etiketiyle eşlenir.
- **Seviye tespit sınavı:** mevcut 50 soruluk YDS quiz'i + adaptif motor → genel CEFR yerleştirme testi.
- **Yeni sınav yolları:** IELTS, TOEFL iBT, PTE, Cambridge (mevcut `ExamModule` altyapısı yeniden kullanılır).
- **AI Speaking Partner:** gerçek zamanlı sesli sohbet (LiveKit Agents + LLM + TTS/STT), seviyeye göre konuşma, hata geri bildirimi.
- **Telaffuz değerlendirme**, **yazma (essay) puanlama** (mevcut `adaptive/writing` genişletilir), listening modülü.
- **Ders sonrası AI:** transkriptten özet, yeni kelimeler → kişisel vocab destesine (spaced repetition).
- Oyunlaştırma: seri (streak), XP, lig tablosu, rozetler, sertifikalar (doğrulanabilir URL).

### Faz 6 — Mobil, Ölçek ve Büyüme (sürekli)
- Mevcut `/api/mobile/*` uçlarını versiyonla (`/api/v1`); React Native/Expo uygulaması (sınıf için LiveKit RN SDK).
- PWA + push bildirimleri.
- **Altyapı:** Vercel veya Render çok bölge + Cloudflare CDN; PostgreSQL okuma replikaları (Neon/Supabase/RDS); arka plan işleri için kuyruk (BullMQ/Inngest) — cron worker buraya taşınır; nesne depolama (Cloudflare R2).
- **Analitik:** PostHog (ürün), gelir panosu, huni analizi; A/B testleri.
- **Büyüme:** referans programı, affiliate, ücretsiz deneme dersi, çok dilli blog/SEO içerik (AI içerik motoru ile), kurumsal (B2B) panel — şirket/okul yöneticisi, toplu lisans, raporlama.

---

## 3. Güvenlik, Uyum ve Güven

- **GDPR / KVKK / CCPA:** çerez onayı, gizlilik politikası (çok dilli), veri dışa aktarma & hesap silme uç noktaları, veri işleme sözleşmeleri (LiveKit, Stripe, AI sağlayıcıları).
- **Çocuk güvenliği:** 13/16 yaş altı için ebeveyn onayı (COPPA/GDPR-K), çocuk derslerinin kaydı zorunlu.
- **Ders kaydı onayı:** kayıt başlamadan tüm katılımcılara bildirim/onay.
- Auth güçlendirme: e-posta doğrulama, Google/Apple OAuth, 2FA (admin/eğitmen hesabı için zorunlu), oturum yönetimi.
- Rol modeli: `STUDENT`, `TEACHER` (Bilal Hoca), `ADMIN` + ihtiyaç halinde `ASSISTANT` (ders asistanı/moderatör — ders vermez, sadece sınıf moderasyonu ve destek) ve `ORG_ADMIN` (kurumsal müşteri).
- Rate limit'in Redis'e taşınması, webhook imza doğrulaması, içerik moderasyonu (sohbet + AI çıktıları).

---

## 4. Önerilen Teknik Mimari (hedef)

```
                 ┌────────── Cloudflare (CDN, WAF, DNS) ──────────┐
                 │                                                 │
   Web (Next.js, /[locale])            Mobile (Expo)          Admin/Eğitmen paneli
                 │                         │
                 └──────────► API katmanı (Next.js route handlers, /api/v1)
                                   │
   ┌───────────┬──────────────┬────┴─────────┬──────────────┬──────────────┐
 PostgreSQL   Redis         Kuyruk          LiveKit Cloud  Stripe / PayTR  AI katmanı
 (Prisma,    (cache,        (BullMQ/        (SFU, Egress   (ödeme,         (OpenAI /
  replica)    rate-limit)    Inngest)        kayıt, Agents) abonelik)       Anthropic / Gemini)
                                   │              │
                              R2/S3 depolama ◄────┘ (kayıtlar, materyaller)
```

---

## 5. Zaman Çizelgesi (özet)

| Ay | Teslimat |
|---|---|
| 1 | Faz 0 tamam; i18n altyapısı + EN/TR |
| 2–3 | Platform içi sanal sınıf MVP (LiveKit), grup dersleri, Stripe entegrasyonu |
| 4–5 | Bilal Hoca takvimi + birebir rezervasyon, webinar modu, kayıt + beyaz tahta, kayıtlı kurs vitrini |
| 6 | Global beta lansmanı (EN/TR/AR), CEFR yerleştirme testi, IELTS modülü |
| 7–9 | AI Speaking Partner, mobil uygulama, B2B paneli, ek diller |
| 10–12 | Ölçekleme, çok bölge, büyüme kampanyaları |

---

## 6. Başarı Metrikleri (KPI)

- Aylık aktif öğrenci (MAU), ülke dağılımı
- Ders tamamlama oranı, ders başı teknik sorun oranı (< %2), ortalama bağlantı kalitesi
- Deneme dersi → ücretli dönüşüm oranı
- Bilal Hoca'nın ders doluluk oranı, canlı ders başına katılımcı sayısı
- Kayıtlı kurs satışları / canlı ders gelirine oranı (ölçeklenme göstergesi)
- Öğrenci memnuniyeti (hedef ≥ 4.7/5), NPS
- MRR, LTV/CAC, iade oranı

---

## 7. Riskler ve Önlemler

| Risk | Önlem |
|---|---|
| Video maliyetlerinin hızlı artması | Dakika bazlı maliyet izleme; ölçek büyüyünce self-hosted LiveKit'e geçiş |
| Bölgesel bağlantı kalitesi | LiveKit global edge, düşük bant genişliği modu (yalnızca ses), simulcast |
| Tek eğitmen darboğazı (zaman, hastalık, izin) | Webinar modu, kayıtlı kurslar, AI pratik modülleri, gerekirse moderatör asistan |
| Ödeme dolandırıcılığı & chargeback | Stripe Radar, 3D Secure, net iade politikası |
| Yasal uyum (çok ülke) | Stripe Tax, bölgesel hukuk danışmanlığı, ülke bazlı özellik bayrakları |
| Mevcut TR kullanıcılarının etkilenmesi | Özellik bayrakları, `/tr` rotasının korunması, eski `meetingLink` akışının desteği |

---

## 8. İlk Sprint İçin Somut İşler

**Durum (Sprint 1):** ✅ 1, 2, 4, 5, 6 tamamlandı — platform içi sınıf (LiveKit), webhook ile yoklama, `/api/health`, CI, `User.locale/timezone/country`. Kurulum: [live-classroom-setup.md](live-classroom-setup.md). ✅ Reading tabloları için eksik migration eklendi.

**Durum (Sprint 2):** 🟡 3 kısmen — `next-intl` altyapısı (TR/EN, çerez + Accept-Language, kullanıcı tercihi, tarayıcı saat dilimi), navbar/footer/giriş/sınıf çevrildi. URL önekli (`/en`) SEO sayfaları ve kalan sayfaların çevirisi sırada. ⏳ 7 (Stripe).


1. `src/app/api/health/route.ts` ekle.
2. CI: GitHub Actions — `npm ci`, `npm run lint`, `npx tsc --noEmit`.
3. `next-intl` kurulumu, `[locale]` segmenti, ana sayfa + navbar + footer metinlerinin çevrilmesi.
4. `User`'a `locale`, `timezone`, `country` alanları (migration).
5. LiveKit hesabı + `POST /api/classroom/[id]/token` + `/classroom/[id]` prototip sayfası (Bilal Hoca + 1 öğrenci).
6. `LiveClass` genişletmesi (`type`, `capacity`, `roomName`, `status`) ve `ClassEnrollment` modeli.
7. `PaymentProvider` arayüzü; Stripe Checkout ile tek seferlik ders satın alma prototipi.
