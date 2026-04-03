#!/usr/bin/env node
// Render cron trigger — called daily at 03:00 UTC (06:00 Istanbul UTC+3)
// Required env vars: SITE_URL, CRON_SECRET

const siteUrl = process.env.SITE_URL;
const cronSecret = process.env.CRON_SECRET;

if (!siteUrl || !cronSecret) {
  console.error("[cron] SITE_URL and CRON_SECRET must be set");
  process.exit(1);
}

const url = `${siteUrl}/api/cron/daily-content?mode=regenerate`;
console.log(`[cron] POST ${url}`);

const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${cronSecret}`,
    "Content-Type": "application/json",
  },
});

const body = await response.json().catch(() => ({}));
console.log(`[cron] status=${response.status}`, JSON.stringify(body, null, 2));

if (!response.ok) {
  console.error("[cron] failed — non-2xx response");
  process.exit(1);
}
