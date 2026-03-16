import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendLiveClassPurchaseEmail({
  to,
  fullName,
  classTitle,
  scheduledAt,
  durationMinutes,
  meetingLink,
  topicOutline,
}: {
  to: string;
  fullName: string;
  classTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingLink?: string | null;
  topicOutline?: string | null;
}) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[mail] SMTP env vars not configured, skipping email.");
    return;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@bilalhocayds.com";

  const dateStr = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(scheduledAt);

  const meetingSection = meetingLink
    ? `
      <div style="margin:24px 0;padding:16px 20px;background:#1c1a10;border:1px solid #b45309;border-radius:12px;">
        <p style="margin:0 0 8px;font-size:13px;color:#fbbf24;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Ders Bağlantısı</p>
        <a href="${meetingLink}" style="color:#fde68a;font-size:15px;word-break:break-all;">${meetingLink}</a>
        <p style="margin:10px 0 0;font-size:12px;color:#a1a1aa;">Ders saatinde bu bağlantıya tıklayarak derse katılabilirsin.</p>
      </div>`
    : `<p style="color:#a1a1aa;font-size:13px;margin:16px 0;">Ders bağlantısı, ders saatinden önce bu adrese gönderilecektir.</p>`;

  const topicSection = topicOutline
    ? `<div style="margin:16px 0;"><p style="font-size:13px;color:#fbbf24;font-weight:600;margin-bottom:6px;">Konu Başlıkları</p><p style="font-size:14px;color:#d4d4d8;">${topicOutline}</p></div>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:13px;font-weight:700;letter-spacing:.15em;color:#fbbf24;text-transform:uppercase;margin:0;">Bilal Hoca YDS/YDT</p>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:20px;padding:32px;">
      <div style="display:inline-block;background:#451a03;border:1px solid #92400e;border-radius:999px;padding:4px 14px;font-size:12px;font-weight:600;color:#fbbf24;margin-bottom:20px;">
        ✓ Ders Satın Alımı Onaylandı
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">Merhaba, ${fullName}!</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">
        <strong style="color:#fde68a;">${classTitle}</strong> oturumuna katılımın onaylandı.
      </p>

      <div style="background:#27272a;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#71717a;width:40%;">Ders</td>
            <td style="padding:6px 0;font-size:14px;color:#fff;font-weight:600;">${classTitle}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#71717a;">Tarih &amp; Saat</td>
            <td style="padding:6px 0;font-size:14px;color:#fff;font-weight:600;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#71717a;">Süre</td>
            <td style="padding:6px 0;font-size:14px;color:#fff;font-weight:600;">${durationMinutes} dakika</td>
          </tr>
        </table>
      </div>

      ${topicSection}
      ${meetingSection}

      <p style="font-size:13px;color:#71717a;line-height:1.6;margin-top:24px;">
        Herhangi bir sorun yaşarsan <a href="mailto:${from}" style="color:#fbbf24;">${from}</a> adresine yazabilirsin.
      </p>
    </div>
    <p style="text-align:center;font-size:12px;color:#52525b;margin-top:24px;">
      © ${new Date().getFullYear()} Bilal Hoca YDS/YDT Platformu
    </p>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Bilal Hoca YDS" <${from}>`,
    to,
    subject: `✅ Ders Onayı: ${classTitle}`,
    html,
  });
}
