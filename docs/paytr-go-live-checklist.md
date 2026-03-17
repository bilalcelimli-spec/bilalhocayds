# PayTR Canliya Alma Checklist

Bu dokuman, PayTR odeme akisinin canliya alinmasindan once dogrulanmasi gereken teknik ve operasyonel maddeleri tek yerde toplar.

## 1. Ortam Degiskenleri

Canli ortamda asagidaki alanlarin dogru oldugunu kontrol et:

```env
APP_URL=https://www.bilalhocayds.com
NEXTAUTH_URL=https://www.bilalhocayds.com
PAYTR_MERCHANT_ID=...
PAYTR_MERCHANT_KEY=...
PAYTR_MERCHANT_SALT=...
PAYTR_IFRAME_BASE_URL=https://www.paytr.com/odeme/guvenli/
```

Kontrol notlari:

1. `APP_URL` ve `NEXTAUTH_URL` canli domain ile eslesmeli.
2. `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY` ve `PAYTR_MERCHANT_SALT` PayTR panelindeki gercek canli bilgiler olmali.
3. `PAYTR_IFRAME_BASE_URL` PayTR dokumanindaki kullandigin iframe veya token akisiyla birebir uyumlu olmali.

## 2. PayTR Panel Ayarlari

PayTR panelinde su URL'leri tanimla:

1. Basarili odeme donus adresi: `/payment/success`
2. Basarisiz odeme donus adresi: `/payment/failure`
3. Callback adresi: `/api/payment/paytr/callback`

Canli domain ile birlikte tam URL'ler:

1. `https://www.bilalhocayds.com/payment/success`
2. `https://www.bilalhocayds.com/payment/failure`
3. `https://www.bilalhocayds.com/api/payment/paytr/callback`

## 3. Kod Akişi Referansi

Odeme baslatma ve callback guncelleme mantigi su dosyalarda:

1. [lib/payment/paytr-checkout.ts](/Users/bilalcelimli/Desktop/bilalhocayds/lib/payment/paytr-checkout.ts)
2. [src/app/api/payment/paytr/route.ts](/Users/bilalcelimli/Desktop/bilalhocayds/src/app/api/payment/paytr/route.ts)
3. [src/app/api/payment/paytr/callback/route.ts](/Users/bilalcelimli/Desktop/bilalhocayds/src/app/api/payment/paytr/callback/route.ts)
4. [src/components/payment/plan-detail-purchase.tsx](/Users/bilalcelimli/Desktop/bilalhocayds/src/components/payment/plan-detail-purchase.tsx)

Davranis ozeti:

1. Pricing detay ekranindaki satis formu `/api/payment/paytr` endpointini cagirir.
2. Sunucu tarafinda plan fiyat dogrulamasi veritabanindan yapilir.
3. Lead ve subscription kaydi ayni akista olusur veya guncellenir.
4. Callback sonrasi `merchant_oid` `sub:` ile basliyorsa abonelik durumu guncellenir.
5. Basarili callback aboneligi `ACTIVE`, basarisiz callback `PAST_DUE` durumuna tasir.

## 4. Canli Erisilebilirlik Kontrolleri

Asagidaki komutlarla deploy edilen route'larin erisilebilir oldugunu hizlica test edebilirsin:

```bash
curl -s -o /dev/null -w "%{http_code}" https://www.bilalhocayds.com/payment/success
curl -s -o /dev/null -w "%{http_code}" https://www.bilalhocayds.com/payment/failure
curl -s -o /dev/null -w "%{http_code}" https://www.bilalhocayds.com/api/payment/paytr/callback
```

Beklenen sonuc:

1. Success ve failure sayfalari `200` donmeli.
2. Callback route `GET` isteginde `405` donebilir; bu normaldir.
3. Callback route form-encoded `POST` istegini alabiliyor olmali.

Form-encoded test ornegi:

```bash
curl -s -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'merchant_oid=sub:test&status=success&total_amount=100&hash=invalid' \
  -o /dev/null -w "%{http_code}" \
  https://www.bilalhocayds.com/api/payment/paytr/callback
```

Bu istekte `400` donmesi genellikle route'un canli oldugunu ve hash dogrulama asamasina geldigini gosterir.

## 5. Test Odeme Senaryolari

Canliya almadan once en az iki senaryo dogrula:

### Basarili Odeme

1. Admin panelinden aktif bir plan oldugunu kontrol et.
2. Pricing ekranindan ilgili planin detay sayfasina git.
3. Satis formu ile odeme baslat.
4. PayTR callback sonrasi ilgili subscription kaydinin `ACTIVE` oldugunu kontrol et.
5. `merchant_oid` degerinin `sub:` ile basladigini dogrula.

### Basarisiz Odeme

1. Basarisiz veya yarida kesilen bir odeme akisi tetikle.
2. Callback sonrasi subscription kaydinin `PAST_DUE` oldugunu kontrol et.
3. Gerekirse muhasebe ekranindan kaydin beklendigi gibi gorundugunu dogrula.

## 6. Plan ve Satis Akisi

Beklenen operasyonel akiş:

1. Admin panelinden paketler olusturulur veya guncellenir.
2. Pricing ekraninda kullanici ilgili planin detay sayfasina gider.
3. Satis formu `/api/payment/paytr` uzerinden server-side fiyat dogrulamasi ile odeme baslatir.
4. Lead, abonelik ve muhasebe baglantilari ayni akista olusur.
5. Callback sonrasi abonelik durumu guncellenir.

## 7. Tip Kontrolu

Canliya almadan once tip kontrolunu calistir:

```bash
npx tsc --noEmit
```

## 8. Guvenlik Notu

Gercek API key, merchant key veya salt degerlerini repo icinde paylasma. Ornek ortam dosyalari yalnizca placeholder icermeli.