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
```

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

## Tip Kontrolu

```bash
npx tsc --noEmit
```
