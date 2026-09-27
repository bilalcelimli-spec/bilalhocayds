# bilalhocayds

YDS / YOKDIL / YDT odakli, AI destekli ogrenme ve uyelik yonetimi platformu.

## Gelistirme

Gelistirme sunucusunu baslat:

```bash
npm run dev
```

Tarayicida `http://localhost:3000` adresini ac.

## Ortam Degiskenleri

Ornek degiskenler `.env.example` dosyasinda bulunur.

Gerekli temel alanlar:

```env
APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
PAYTR_MERCHANT_ID=your-merchant-id
PAYTR_MERCHANT_KEY=your-merchant-key
PAYTR_MERCHANT_SALT=your-merchant-salt
PAYTR_IFRAME_BASE_URL=https://www.paytr.com/odeme/guvenli/
CRON_SECRET=change-me
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
```

## Coklu Dil (i18n)

Arayuz `next-intl` ile Turkce (`tr`) ve Ingilizce (`en`) destekler. Dil su sirayla secilir:

1. URL oneki: `/en/...` veya `/tr/...` (middleware oneki kaldirip ayni sayfayi o dilde gosterir ve `NEXT_LOCALE` cerezini yazar)
2. `NEXT_LOCALE` cerezi (menudeki dil secicisi yazar; giris yapmis kullanicida `User.locale` da guncellenir)
3. Tarayicinin `Accept-Language` basligi
4. Varsayilan: `tr`

Tarihler `NEXT_TZ` cerezindeki saat dilimine gore gosterilir (tarayici otomatik yazar, varsayilan `Europe/Istanbul`).

- Metinler: `messages/tr.json`, `messages/en.json` (anahtarlar tip kontrolunden gecer; eksik anahtar derleme hatasi verir)
- Yapilandirma: `src/i18n/`
- Cevrilen alanlar: ogrencinin gordugu tum sayfalar (ana sayfa, fiyatlar, canli dersler/sinif, giris/kayit/sifre, ogrenci paneli ve alt sayfalari, vocabulary/reading/grammar modulleri, sinav akisi ve birebir inceleme), ilgili API mesajlari ve sifre sifirlama e-postasi.
- AI icerik dili: `User.locale` "en" ise gunluk icerik ve adaptive sinav aciklamalari Ingilizce istenir; Ingilizce arayuzde Turkce kelime karsiliklari gizlenir. AI kullanilamadiginda devreye giren yedek sablonlarin (grammar dahil) Ingilizce karsiliklari `src/lib/ai-content-en.ts` ve `src/lib/ai-content.ts` icindedir.
- E-postalar (sifre sifirlama, canli ders ve sinav satin alimi) alicinin `User.locale` diline ve `User.timezone` saat dilimine gore gonderilir; hesap yoksa Turkce / Istanbul saati kullanilir.
- SEO: tanitim sayfalari (ana sayfa, `/pricing`, `/pricing/[slug]`, `/live-classes`) Turkce icin oneksiz, Ingilizce icin `/en` onekli adreste yayinlanir; her birinde canonical ve `hreflang` (tr, en, x-default) etiketleri vardir ve site haritasi iki dili de listeler. Turkce sayfalarda admin panelindeki SEO ayarlari (baslik, aciklama, anahtar kelimeler, OG/Twitter, robots, canonical) uygulanir; Ingilizce baslik ve aciklamalar `messages/en.json` icindeki `seo` bolumundedir (`src/lib/page-metadata.ts`).
- Turkce kalanlar: admin ve ogretmen paneli, veritabanindan gelen icerik (plan adlari, ders basliklari).

## Platform Ici Canli Sinif

Canli dersler LiveKit tabanli kendi sanal sinifimizda (`/classroom/[dersId]`) yapilabilir. Kurulum, webhook ve erisim kurallari icin [docs/live-classroom-setup.md](docs/live-classroom-setup.md) dosyasina bak.

Saglik kontrolu: `GET /api/health` (veritabani baglantisini da dogrular).

## Gunluk Icerik Cron

Gunluk vocabulary, reading ve grammar iceriklerini ogrenci girisi olmadan onceden uretmek icin sunucu tarafinda su endpoint kullanilir:

```bash
POST /api/cron/daily-content
Authorization: Bearer $CRON_SECRET
```

Opsiyonel olarak belirli gun icin `date` query parametresi verilebilir:

```bash
/api/cron/daily-content?date=2026-03-22
```

Production kurulum ve scheduler notlari icin [docs/daily-content-cron-deploy.md](/Users/bilalcelimli/Desktop/bilalhocayds/docs/daily-content-cron-deploy.md) dosyasina bak.

## PayTR Canliya Alma Checklist

Detayli deployment notlari icin [docs/paytr-go-live-checklist.md](/Users/bilalcelimli/Desktop/bilalhocayds/docs/paytr-go-live-checklist.md) dosyasina bak.

1. `APP_URL` ve `NEXTAUTH_URL` degerlerini canli domain ile guncelle.
2. `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY` ve `PAYTR_MERCHANT_SALT` alanlarini PayTR panelindeki gercek bilgilerle doldur.
3. Iframe veya token akisi kullaniyorsan `PAYTR_IFRAME_BASE_URL` degerini PayTR dokumanindaki dogru URL ile eslestir.
4. PayTR panelinde basarili odeme donus adresini `/payment/success` olarak, basarisiz odeme donus adresini `/payment/failure` olarak tanimla.
5. PayTR callback adresini `/api/payment/paytr/callback` olarak tanimla.
6. Sunucunun `APP_URL` adresinden PayTR callback endpointine erisebildigini dogrula.
7. Test odemesinde `merchant_oid` degeriyle baslayan siparis referansinin callback sonrasi abonelik durumunu `ACTIVE` yaptigini kontrol et.
8. Basarisiz odemede callback sonrasi abonelik durumunun `PAST_DUE` oldugunu kontrol et.

## Plan ve Satis Akisi

1. Admin panelinden paketler olusturulur veya guncellenir.
2. Pricing ekraninda kullanici ilgili planin detay sayfasina gider.
3. Satis formu `/api/payment/paytr` uzerinden server-side fiyat dogrulamasi ile odeme baslatir.
4. Lead, abonelik ve muhasebe baglantilari ayni akista olusur.
5. Callback sonrasi abonelik durumu guncellenir.

## App Mimarisi

- Kanonik uygulama kaynaklari `src/app` altindadir.
- Root `app` klasoru yalnizca Next.js route giris noktalarini barindirir ve mumkun olan yerlerde `src/app` altindaki kanonik dosyalara re-export yapar.
- Kanonik API route kaynaklari `src/app/api` altindadir.
- Root `app/api` klasoru yalnizca route delegasyon katmanidir.
- Serbest kayit akisi `/api/register`, satin alma sonrasi hesap tamamlama akisi ise `/api/auth/register` uzerindedir.

## Tip Kontrolu

```bash
npx tsc --noEmit
```
