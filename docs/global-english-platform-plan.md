# Global İngilizce Platformu — Dönüşüm Planı

> Hedef: bilalhocayds'i YDS/YÖKDİL/YDT odaklı Türkçe bir hazırlık sitesinden, **platform içinde canlı online derslerin yapıldığı**, dünya çapında öğrenci ve öğretmene hizmet veren bir İngilizce öğrenme pazaryerine dönüştürmek.

---

## 0. Mevcut Durum (kod incelemesinden)

| Alan | Bugün | Global hedef için eksik |
|---|---|---|
| Stack | Next.js 16 (App Router), React 19, Prisma 7 + PostgreSQL, NextAuth v4, Tailwind 4 | Yeterli; ölçek için cache/queue/realtime katmanı eklenmeli |
| Canlı ders | `LiveClass` modeli yalnızca harici `meetingLink` (Zoom/Meet) tutuyor (`src/lib/meeting-platform.ts`) | Platform içi video sınıf, öğretmen ilişkisi, kapasite, kayıt, yoklama yok |
| Öğretmen | `TeacherProfile` (bio, expertise) — `LiveClass` ile ilişkisi yok | Öğretmen onboarding, müsaitlik takvimi, ücretlendirme, ödeme dağıtımı yok |
| Dil / bölge | `<html lang="tr">`, tüm UI metinleri Türkçe hard-coded, `date-fns/locale/tr` | i18n altyapısı, çok dilli UI, saat dilimi yönetimi yok |
| Ödeme | PayTR (TRY), iyzico yardımcıları; `stripe` bağımlılığı var ama kullanılmıyor | Çoklu para birimi, uluslararası kart, abonelik yenileme, vergi (VAT) yok |
| İçerik | YDS/YDT sınav modülü, AI reading/grammar/vocab, günlük içerik cron'u | CEFR (A1–C2) müfredatı, IELTS/TOEFL/genel İngilizce/Business yolları yok |
| AI | Çok sağlayıcılı katman (`src/lib/ai/client.ts`: OpenAI, Anthropic, Gemini) | Konuşma pratiği, telaffuz, yazma değerlendirme, ders özeti gibi özellikler |
| Altyapı | Render (tek web + cron), `healthCheckPath: /api/health` tanımlı ama route yok | Health endpoint, CDN, çok bölgeli dağıtım, izleme/loglama |
| Uyum | — | GDPR/KVKK, çerez onayı, veri silme/dışa aktarma, çocuk kullanıcı politikası |

**Korunacak güçlü yanlar:** adaptif sınav motoru, AI içerik üretim motoru, özellik bazlı erişim (`StudentFeatureAccess`), plan yönetimi, admin paneli.

---

## 1. Ürün Vizyonu ve Konumlandırma

**Üç ürün ayağı:**
1. **Canlı Dersler (çekirdek):** Birebir (1:1) ve küçük grup (2–8 kişi) dersler, platform içi sanal sınıf.
2. **Kendi Kendine Öğrenme:** CEFR seviyeli AI destekli reading/grammar/vocab/listening/speaking + sınav hazırlık (YDS, YÖKDİL, IELTS, TOEFL, PTE, Cambridge).
3. **Öğretmen Pazaryeri:** Doğrulanmış öğretmenlerin profil, takvim ve fiyat belirleyip ders sattığı yapı (platform komisyonu alır).

**Hedef pazar sırası:** Türkiye (mevcut) → MENA + Orta Asya (Türkçe/Arapça/Rusça konuşan öğrenciler) → Latin Amerika + Güneydoğu Asya → global.

**Gelir modelleri:** abonelik (AI modülleri + grup dersleri), ders paketleri/kredi, 1:1 ders komisyonu (%15–25), kurumsal (B2B) lisans, sınav marketplace (mevcut).

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
- **Saat dilimi:** tüm tarihler UTC saklanır; `User.timezone` alanı; `date-fns-tz` ile gösterim. Ders saatleri öğrenci/öğretmen yerel saatinde.
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
- MVP: video/ses, ekran paylaşımı, sohbet, el kaldırma, öğretmen moderasyonu (sessize alma, çıkarma), bekleme odası, cihaz testi.
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
  teacherId       String?    // TeacherProfile ilişkisi
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

### Faz 3 — Öğretmen Pazaryeri (6–8 hafta)
- **Öğretmen başvuru & onboarding:** kimlik, sertifika (CELTA/DELTA/TESOL), tanıtım videosu, deneme dersi; admin onay akışı.
- `TeacherProfile` genişletme: `headline`, `languagesSpoken`, `specialties[]` (IELTS, Business, Kids...), `hourlyRate`, `currency`, `timezone`, `videoIntroUrl`, `rating`, `verificationStatus`.
- **Müsaitlik & rezervasyon:** `TeacherAvailability` (haftalık tekrar eden slotlar, UTC), `Booking` (çakışma kontrolü DB transaction + unique index), iptal/yeniden planlama politikaları, hatırlatma e-postaları/push (24s, 1s önce).
- Mevcut `ExamReviewBooking` akışı bu genel booking altyapısına taşınır.
- **Arama & keşif:** fiyat, dil, uzmanlık, müsaitlik, puan filtreleri; öğretmen profil sayfası (SEO'lu).
- **Değerlendirme:** `Review` modeli (ders sonrası puan + yorum), kötüye kullanım raporlama.
- **Öğretmen ödemeleri:** Stripe Connect (Express) ile otomatik payout; platform komisyonu; öğretmen kazanç paneli.
- Ders içi mesajlaşma (öğrenci–öğretmen), dosya paylaşımı.

### Faz 4 — Global Ödeme ve Faturalama (3–4 hafta, Faz 2–3 ile paralel)
- **Stripe** (zaten bağımlılıkta) → uluslararası ana sağlayıcı: Checkout, Billing (abonelik yenileme), Stripe Tax (VAT/GST), Apple/Google Pay, yerel yöntemler (iDEAL, Pix, SEPA...).
- **PayTR/iyzico** → Türkiye'de TRY ödemeleri için korunur. `lib/payment/` altında `PaymentProvider` arayüzü ile soyutla; ülke/para birimine göre yönlendir.
- Çok para birimi: fiyatlar `PlanPrice { planId, currency, amount }` tablosunda (bölgesel fiyatlandırma / satın alma gücü paritesi).
- **Kredi sistemi:** `CreditWallet` + `CreditTransaction` (ders paketleri, iade, promosyon).
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
- **Çocuk güvenliği:** 13/16 yaş altı için ebeveyn onayı (COPPA/GDPR-K), çocuk derslerinin kaydı zorunlu, öğretmen arka plan kontrolü.
- **Ders kaydı onayı:** kayıt başlamadan tüm katılımcılara bildirim/onay.
- Auth güçlendirme: e-posta doğrulama, Google/Apple OAuth, 2FA (öğretmen/admin için zorunlu), oturum yönetimi.
- Rol/izin modelinin genişletilmesi: `STUDENT`, `TEACHER`, `ADMIN` + `ORG_ADMIN`, `SUPPORT`.
- Rate limit'in Redis'e taşınması, webhook imza doğrulaması, içerik moderasyonu (sohbet + AI çıktıları).

---

## 4. Önerilen Teknik Mimari (hedef)

```
                 ┌────────── Cloudflare (CDN, WAF, DNS) ──────────┐
                 │                                                 │
   Web (Next.js, /[locale])            Mobile (Expo)          Admin/Teacher paneli
                 │                         │
                 └──────────► API katmanı (Next.js route handlers, /api/v1)
                                   │
   ┌───────────┬──────────────┬────┴─────────┬──────────────┬──────────────┐
 PostgreSQL   Redis         Kuyruk          LiveKit Cloud  Stripe / PayTR  AI katmanı
 (Prisma,    (cache,        (BullMQ/        (SFU, Egress   (ödeme,         (OpenAI /
  replica)    rate-limit)    Inngest)        kayıt, Agents) Connect)        Anthropic / Gemini)
                                   │              │
                              R2/S3 depolama ◄────┘ (kayıtlar, materyaller)
```

---

## 5. Zaman Çizelgesi (özet)

| Ay | Teslimat |
|---|---|
| 1 | Faz 0 tamam; i18n altyapısı + EN/TR |
| 2–3 | Platform içi sanal sınıf MVP (LiveKit), grup dersleri, Stripe entegrasyonu |
| 4–5 | Öğretmen pazaryeri (onboarding, müsaitlik, 1:1 rezervasyon, Stripe Connect), kayıt + beyaz tahta |
| 6 | Global beta lansmanı (EN/TR/AR), CEFR yerleştirme testi, IELTS modülü |
| 7–9 | AI Speaking Partner, mobil uygulama, B2B paneli, ek diller |
| 10–12 | Ölçekleme, çok bölge, büyüme kampanyaları |

---

## 6. Başarı Metrikleri (KPI)

- Aylık aktif öğrenci (MAU), ülke dağılımı
- Ders tamamlama oranı, ders başı teknik sorun oranı (< %2), ortalama bağlantı kalitesi
- Deneme dersi → ücretli dönüşüm oranı
- Öğretmen doluluk oranı ve öğretmen elde tutma
- Öğrenci ortalama puanı (hedef ≥ 4.7/5), NPS
- MRR, LTV/CAC, iade oranı

---

## 7. Riskler ve Önlemler

| Risk | Önlem |
|---|---|
| Video maliyetlerinin hızlı artması | Dakika bazlı maliyet izleme; ölçek büyüyünce self-hosted LiveKit'e geçiş |
| Bölgesel bağlantı kalitesi | LiveKit global edge, düşük bant genişliği modu (yalnızca ses), simulcast |
| Öğretmen kalitesi / güven | Sıkı onboarding, deneme dersi, puanlama, kötüye kullanım raporlama |
| Ödeme dolandırıcılığı & chargeback | Stripe Radar, ders sonrası ödeme serbest bırakma (escrow benzeri bekleme) |
| Yasal uyum (çok ülke) | Stripe Tax, bölgesel hukuk danışmanlığı, ülke bazlı özellik bayrakları |
| Mevcut TR kullanıcılarının etkilenmesi | Özellik bayrakları, `/tr` rotasının korunması, eski `meetingLink` akışının desteği |

---

## 8. İlk Sprint İçin Somut İşler

1. `src/app/api/health/route.ts` ekle.
2. CI: GitHub Actions — `npm ci`, `npm run lint`, `npx tsc --noEmit`.
3. `next-intl` kurulumu, `[locale]` segmenti, ana sayfa + navbar + footer metinlerinin çevrilmesi.
4. `User`'a `locale`, `timezone`, `country` alanları (migration).
5. LiveKit hesabı + `POST /api/classroom/[id]/token` + `/classroom/[id]` prototip sayfası (öğretmen + 1 öğrenci).
6. `LiveClass` ↔ `TeacherProfile` ilişkisi ve `ClassEnrollment` modeli.
7. `PaymentProvider` arayüzü; Stripe Checkout ile tek seferlik ders satın alma prototipi.
