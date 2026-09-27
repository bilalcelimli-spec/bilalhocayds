import nodemailer from "nodemailer";
import { getTranslations } from "next-intl/server";

import { defaultLocale, isLocale } from "@/src/i18n/config";

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveEmailLocale(locale?: string | null) {
  return isLocale(locale) ? locale : defaultLocale;
}

export async function sendLiveClassPurchaseEmail({
  to,
  fullName,
  classTitle,
  scheduledAt,
  durationMinutes,
  meetingLink,
  classroomUrl,
  topicOutline,
  locale,
  timeZone,
}: {
  to: string;
  fullName: string;
  classTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingLink?: string | null;
  /** Platform içi (LiveKit) derslerde öğrencinin sınıfa gireceği adres. */
  classroomUrl?: string | null;
  topicOutline?: string | null;
  locale?: string | null;
  timeZone?: string | null;
}) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[mail] SMTP env vars not configured, skipping email.");
    return;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@bilalhocayds.com";
  const emailLocale = resolveEmailLocale(locale);
  const [t, tCommon] = await Promise.all([
    getTranslations({ locale: emailLocale, namespace: "emails.liveClass" }),
    getTranslations({ locale: emailLocale, namespace: "emails" }),
  ]);
  const safeTitle = escapeHtml(classTitle);
  const safeName = escapeHtml(fullName);

  const intlLocale = emailLocale === "en" ? "en-GB" : "tr-TR";
  const recipientTimeZone = timeZone || "Europe/Istanbul";
  const zoneLabel =
    new Intl.DateTimeFormat(intlLocale, { timeZone: recipientTimeZone, timeZoneName: "short" })
      .formatToParts(scheduledAt)
      .find((part) => part.type === "timeZoneName")?.value ?? recipientTimeZone;
  const dateStr = `${new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: recipientTimeZone,
  }).format(scheduledAt)} (${zoneLabel})`;

  const meetingSection = classroomUrl
    ? `
      <div style="margin:24px 0;padding:16px 20px;background:#1c1a10;border:1px solid #b45309;border-radius:12px;">
        <p style="margin:0 0 8px;font-size:13px;color:#fbbf24;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">${t("classroomTitle")}</p>
        <p style="margin:0 0 14px;font-size:13px;color:#d4d4d8;line-height:1.6;">${t("classroomText")}</p>
        <a href="${classroomUrl}" style="display:inline-block;background:#f1d56d;color:#18181b;font-size:14px;font-weight:800;padding:10px 18px;border-radius:10px;text-decoration:none;">${t("classroomButton")}</a>
      </div>`
    : meetingLink
      ? `
      <div style="margin:24px 0;padding:16px 20px;background:#1c1a10;border:1px solid #b45309;border-radius:12px;">
        <p style="margin:0 0 8px;font-size:13px;color:#fbbf24;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">${t("linkTitle")}</p>
        <a href="${meetingLink}" style="color:#fde68a;font-size:15px;word-break:break-all;">${meetingLink}</a>
        <p style="margin:10px 0 0;font-size:12px;color:#a1a1aa;">${t("linkText")}</p>
      </div>`
      : `<p style="color:#a1a1aa;font-size:13px;margin:16px 0;">${t("linkLater")}</p>`;

  const topicSection = topicOutline
    ? `<div style="margin:16px 0;"><p style="font-size:13px;color:#fbbf24;font-weight:600;margin-bottom:6px;">${t("topics")}</p><p style="font-size:14px;color:#d4d4d8;">${escapeHtml(topicOutline)}</p></div>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="${emailLocale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:13px;font-weight:700;letter-spacing:.15em;color:#fbbf24;text-transform:uppercase;margin:0;">${tCommon("brand")}</p>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:20px;padding:32px;">
      <div style="display:inline-block;background:#451a03;border:1px solid #92400e;border-radius:999px;padding:4px 14px;font-size:12px;font-weight:600;color:#fbbf24;margin-bottom:20px;">
        ${t("badge")}
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">${t("greeting", { name: safeName })}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">
        ${t.markup("confirmed", { title: safeTitle, strong: (chunks) => `<strong style="color:#fde68a;">${chunks}</strong>` })}
      </p>

      <div style="background:#27272a;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#71717a;width:40%;">${t("class")}</td>
            <td style="padding:6px 0;font-size:14px;color:#fff;font-weight:600;">${safeTitle}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#71717a;">${escapeHtml(t("dateTime"))}</td>
            <td style="padding:6px 0;font-size:14px;color:#fff;font-weight:600;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#71717a;">${t("duration")}</td>
            <td style="padding:6px 0;font-size:14px;color:#fff;font-weight:600;">${t("minutes", { count: durationMinutes })}</td>
          </tr>
        </table>
      </div>

      ${topicSection}
      ${meetingSection}

      <p style="font-size:13px;color:#71717a;line-height:1.6;margin-top:24px;">
        ${tCommon("support", { email: `<a href="mailto:${from}" style="color:#fbbf24;">${from}</a>` })}
      </p>
    </div>
    <p style="text-align:center;font-size:12px;color:#52525b;margin-top:24px;">
      © ${new Date().getFullYear()} ${tCommon("brand")}
    </p>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Bilal Hoca" <${from}>`,
    to,
    subject: t("subject", { title: classTitle }),
    html,
  });
}

export async function sendExamPurchaseEmail({
	to,
	fullName,
	examTitle,
	examType,
	questionCount,
	durationMinutes,
	price,
	loginUrl,
	locale,
}: {
	to: string;
	fullName: string;
	examTitle: string;
	examType: string;
	questionCount: number;
	durationMinutes: number;
	price: number;
	loginUrl: string;
	locale?: string | null;
}) {
	const transporter = createTransporter();
	if (!transporter) {
		console.warn("[mail] SMTP env vars not configured, skipping exam email.");
		return;
	}

	const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@bilalhocayds.com";
	const emailLocale = resolveEmailLocale(locale);
	const [t, tCommon] = await Promise.all([
		getTranslations({ locale: emailLocale, namespace: "emails.examPurchase" }),
		getTranslations({ locale: emailLocale, namespace: "emails" }),
	]);
	const safeTitle = escapeHtml(examTitle);
	const amount = new Intl.NumberFormat(emailLocale === "en" ? "en-GB" : "tr-TR", {
		style: "currency",
		currency: "TRY",
		maximumFractionDigits: 0,
	}).format(price);

	const row = (label: string, value: string) =>
		`<tr><td style="padding:6px 0;font-size:13px;color:#71717a;width:40%;">${label}</td><td style="padding:6px 0;font-size:14px;color:#fff;font-weight:600;">${value}</td></tr>`;

	const html = `
<!DOCTYPE html>
<html lang="${emailLocale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:13px;font-weight:700;letter-spacing:.15em;color:#34d399;text-transform:uppercase;margin:0;">${tCommon("brand")}</p>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:20px;padding:32px;">
      <div style="display:inline-block;background:#064e3b;border:1px solid #047857;border-radius:999px;padding:4px 14px;font-size:12px;font-weight:600;color:#6ee7b7;margin-bottom:20px;">
        ${t("badge")}
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">${t("greeting", { name: escapeHtml(fullName) })}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">
        ${t.markup("confirmed", { title: safeTitle, strong: (chunks) => `<strong style="color:#d1fae5;">${chunks}</strong>` })}
      </p>

      <div style="background:#27272a;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row(t("exam"), safeTitle)}
          ${row(t("type"), escapeHtml(examType))}
          ${row(t("questions"), String(questionCount))}
          ${row(t("duration"), t("minutes", { count: durationMinutes }))}
          ${row(t("amount"), amount)}
        </table>
      </div>

      <a href="${loginUrl}" style="display:block;text-align:center;background:#10b981;color:#04130d;font-size:15px;font-weight:700;padding:14px 24px;border-radius:12px;text-decoration:none;margin-bottom:24px;">${t("button")}</a>

      <p style="font-size:12px;color:#52525b;line-height:1.6;margin:0;">
        ${t("afterLogin")}
        ${tCommon("support", { email: `<a href="mailto:${from}" style="color:#34d399;">${from}</a>` })}
      </p>
    </div>
  </div>
</body>
</html>`;

	await transporter.sendMail({
		from: `"Bilal Hoca" <${from}>`,
		to,
		subject: t("subject", { title: examTitle }),
		html,
	});
}

export async function sendWelcomeEmail({
  to,
  fullName,
  password,
  planName,
  billingCycle,
  loginUrl,
}: {
  to: string;
  fullName: string;
  password: string;
  planName: string;
  billingCycle: "MONTHLY" | "YEARLY";
  loginUrl: string;
}) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[mail] SMTP env vars not configured, skipping welcome email.");
    return;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@bilalhocayds.com";
  const cycleLabel = billingCycle === "YEARLY" ? "Yıllık" : "Aylık";

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
      <div style="display:inline-block;background:#14532d;border:1px solid #166534;border-radius:999px;padding:4px 14px;font-size:12px;font-weight:600;color:#86efac;margin-bottom:20px;">
        🎉 Hesabın Oluşturuldu
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">Hoş geldin, ${fullName}!</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">
        <strong style="color:#fde68a;">${planName} (${cycleLabel})</strong> planın aktif edildi. Aşağıdaki bilgilerle giriş yapabilirsin.
      </p>

      <div style="background:#27272a;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#71717a;width:40%;">E-posta</td>
            <td style="padding:8px 0;font-size:14px;color:#fff;font-weight:600;">${to}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#71717a;">Şifre</td>
            <td style="padding:8px 0;">
              <span style="display:inline-block;background:#3f3f46;border:1px solid #52525b;border-radius:8px;padding:4px 12px;font-size:15px;font-weight:700;color:#fde68a;letter-spacing:.05em;font-family:monospace;">${password}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#71717a;">Plan</td>
            <td style="padding:8px 0;font-size:14px;color:#fff;font-weight:600;">${planName} · ${cycleLabel}</td>
          </tr>
        </table>
      </div>

      <a href="${loginUrl}" style="display:block;text-align:center;background:#b45309;color:#fff;font-size:15px;font-weight:700;padding:14px 24px;border-radius:12px;text-decoration:none;margin-bottom:24px;">Platforma Giriş Yap →</a>

      <p style="font-size:12px;color:#52525b;line-height:1.6;margin:0;">
        Güvenliğin için giriş yaptıktan sonra şifreni değiştirmeni öneririz.
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
    subject: `🎉 Hoş geldin! Hesabın hazır — ${planName}`,
    html,
  });
}

export async function sendPasswordResetEmail({
  to,
  fullName,
  resetUrl,
  locale,
}: {
  to: string;
  fullName: string;
  resetUrl: string;
  locale?: string | null;
}) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[mail] SMTP env vars not configured, skipping password reset email.");
    return;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@bilalhocayds.com";
  const emailLocale = isLocale(locale) ? locale : defaultLocale;
  const t = await getTranslations({ locale: emailLocale, namespace: "emails.passwordReset" });

  const html = `
<!DOCTYPE html>
<html lang="${emailLocale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:13px;font-weight:700;letter-spacing:.15em;color:#fbbf24;text-transform:uppercase;margin:0;">Bilal Hoca</p>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:20px;padding:32px;">
      <div style="display:inline-block;background:#451a03;border:1px solid #92400e;border-radius:999px;padding:4px 14px;font-size:12px;font-weight:600;color:#fbbf24;margin-bottom:20px;">
        ${t("badge")}
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">${t("greeting", { name: fullName })}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">
        ${t("intro")}
      </p>

      <a href="${resetUrl}" style="display:block;text-align:center;background:#f1d56d;color:#18181b;font-size:15px;font-weight:800;padding:14px 24px;border-radius:12px;text-decoration:none;margin-bottom:20px;">
        ${t("button")}
      </a>

      <p style="margin:0 0 16px;font-size:13px;color:#71717a;line-height:1.7;">
        ${t("validity")}
      </p>

      <div style="background:#27272a;border-radius:12px;padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#fbbf24;">${t("fallbackTitle")}</p>
        <a href="${resetUrl}" style="color:#fde68a;font-size:13px;word-break:break-all;">${resetUrl}</a>
      </div>

      <p style="font-size:12px;color:#52525b;line-height:1.6;margin:24px 0 0;">
        ${t("support", { email: `<a href="mailto:${from}" style="color:#fbbf24;">${from}</a>` })}
      </p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Bilal Hoca" <${from}>`,
    to,
    subject: t("subject"),
    html,
  });
}
