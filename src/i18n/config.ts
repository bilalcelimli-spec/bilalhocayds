export const locales = ["tr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "tr";
export const defaultTimeZone = "Europe/Istanbul";

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const TIME_ZONE_COOKIE = "NEXT_TZ";

export const localeLabels: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Accept-Language başlığından desteklenen ilk dili seçer (ör. "en-GB,en;q=0.9,tr;q=0.8"). */
export function matchAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { base: tag.trim().toLowerCase().split("-")[0], q: Number.isFinite(q) ? q : 0 };
    })
    .filter((item) => item.base && item.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const candidate of candidates) {
    if (isLocale(candidate.base)) return candidate.base;
  }
  return null;
}

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
