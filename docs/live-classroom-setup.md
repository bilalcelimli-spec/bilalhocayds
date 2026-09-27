# Platform İçi Canlı Sınıf (LiveKit) Kurulumu

Canlı dersler artık Zoom/Meet linkine ek olarak sitenin kendi sanal sınıfında (`/classroom/[dersId]`) yapılabilir. Video altyapısı [LiveKit](https://livekit.io) üzerindedir.

## 1. LiveKit hesabı

1. [cloud.livekit.io](https://cloud.livekit.io) üzerinde proje oluştur.
2. **Settings → Keys** bölümünden bir API key/secret oluştur.
3. Proje URL'sini not al (ör. `wss://bilalhoca-xxxx.livekit.cloud`).

## 2. Ortam değişkenleri

```env
LIVEKIT_URL=wss://bilalhoca-xxxx.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

Render'da web servisine ekle. Değişkenler tanımlı değilse sınıf sayfası "altyapı yapılandırılmadı" mesajı gösterir; harici link (Zoom/Meet) akışı etkilenmez.

> Not: Content-Security-Policy `*.livekit.cloud` adreslerine zaten izin verir. Kendi sunucunda (self-hosted) LiveKit çalıştırırsan `LIVEKIT_URL` değişkeninin **build sırasında** da tanımlı olması gerekir; CSP bu adresi build anında ekler.

## 3. Webhook (yoklama ve ders durumu)

LiveKit panelinde **Settings → Webhooks** altında şu adresi ekle (imzalama için yukarıdaki API key seçilmeli):

```
https://<site-adresi>/api/webhooks/livekit
```

Webhook ile:
- `room_started` → ders durumu **LIVE** olur,
- `participant_joined` / `participant_left` → `LiveClassAttendance` tablosuna giriş/çıkış ve süre yazılır,
- `room_finished` → ders **ENDED** olur, açık katılım kayıtları kapatılır.

## 4. Ders oluşturma

Admin → **Canlı Ders Yönetimi** formunda:

| Alan | Açıklama |
|---|---|
| Sınıf altyapısı | **Platform içi sınıf** (LiveKit) veya **Harici link** (Zoom/Meet) |
| Ders tipi | **Grup dersi** (öğrenciler kamera/mikrofon açabilir), **Birebir ders** (yalnızca o dersi satın alan öğrenci), **Webinar** (öğrenciler izler, sohbetten yazar) |
| Kontenjan | Aynı anda sınıfta bulunabilecek en fazla öğrenci (boş = sınırsız) |
| Durum | Planlandı / Canlı / Bitti / İptal (webhook otomatik günceller) |

## 5. Erişim kuralları

- **Admin/Öğretmen (Bilal Hoca):** her zaman "host" olarak girer (moderasyon, kayıt yetkisi).
- **Öğrenci:** ders başlangıcından 15 dk önce ile ders bitişinden 60 dk sonrası arasında girebilir. Erişim için:
  - canlı ders içeren aktif plan **veya** admin tarafından açılmış canlı ders erişimi **veya** o derse ait ödenmiş tek ders satın alımı,
  - **birebir** derslerde yalnızca o derse ait ödenmiş satın alım.
- Kurallar `src/lib/live-class-access.ts` içindedir.

## İlgili dosyalar

- `src/lib/livekit.ts` — token üretimi, rol bazlı yetkiler, webhook alıcısı
- `src/app/api/classroom/[classId]/token/route.ts` — sınıf token'ı
- `src/app/api/webhooks/livekit/route.ts` — yoklama ve ders durumu
- `src/app/classroom/[classId]/page.tsx`, `src/components/classroom/classroom-room.tsx` — sınıf arayüzü
