# Daily Content Cron Deployment

Bu endpoint, ogrenci giris yapmadan da gunluk vocabulary, reading ve grammar iceriklerini onceden uretmek icin kullanilir.

## Gerekli Ortam Degiskenleri

Asagidaki alanlari production ortaminda tanimla:

```env
CRON_SECRET=uzun-ve-rastgele-bir-deger
AI_API_KEY=...
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

Notlar:

- `CRON_SECRET`, `NEXTAUTH_SECRET` ile ayni olmamali.
- En az 32 byte rastgele bir deger kullan.
- Endpoint su sekilde korunur: `Authorization: Bearer $CRON_SECRET`

Ornek secret uretimi:

```bash
openssl rand -hex 32
```

## Endpoint

```bash
POST /api/cron/daily-content
Authorization: Bearer $CRON_SECRET
```

Opsiyonel tarih parametresi:

```bash
POST /api/cron/daily-content?date=2026-03-22
```

## Beklenen Davranis

- Yalnizca erişimi olan ogrenciler icin icerik uretilir.
- Ayni gun icin yeniden cagrildiginda mevcut kayitlar kullanilir.
- Eksik hedef puani gibi profil bosluklari cron akisini artik durdurmaz.

## Scheduler Ornekleri

Herhangi bir scheduler su istegi gonderebiliyorsa yeterlidir.

### Cron + curl

```bash
curl -fsS -X POST "https://your-domain.com/api/cron/daily-content" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Render Uzerinde

Eger uygulama Render'da calisiyorsa iki tip yaklasim uygundur:

1. Ayrı bir cron job olusturup yukaridaki `curl` komutunu calistirmak
2. Harici bir scheduler kullanip endpoint'e `POST` atmak

Render ortam degiskenlerine en az su alanlari ekle:

```env
CRON_SECRET=...
AI_API_KEY=...
```

## Onerilen Zamanlama

Turkiye odakli kullanim icin gunde 1 kez, gece veya sabah erken saatlerde tetiklemek yeterlidir.

Ornek:

- Her gun 05:00 Europe/Istanbul
- Her gun 06:00 Europe/Istanbul

## Dogrulama

Basarili cevap ornegi:

```json
{
  "ok": true,
  "dayKey": "2026-03-22",
  "totalStudents": 8,
  "generatedStudents": 6
}
```

Yetkisiz istek beklenen sekilde su cevabi doner:

```json
{
  "error": "Unauthorized"
}
```