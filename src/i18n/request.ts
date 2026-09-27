import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  defaultLocale,
  defaultTimeZone,
  isLocale,
  isValidTimeZone,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  matchAcceptLanguage,
  TIME_ZONE_COOKIE,
} from "@/src/i18n/config";

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  // getTranslations({ locale }) ile açıkça istenen dil (ör. e-postalarda alıcının dili) önceliklidir.
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const urlLocale = headerStore.get(LOCALE_HEADER);
  const locale = isLocale(explicitLocale)
    ? explicitLocale
    : isLocale(urlLocale)
      ? urlLocale
      : isLocale(cookieLocale)
      ? cookieLocale
      : (matchAcceptLanguage(headerStore.get("accept-language")) ?? defaultLocale);

  const cookieTimeZone = cookieStore.get(TIME_ZONE_COOKIE)?.value;
  const timeZone = isValidTimeZone(cookieTimeZone) ? cookieTimeZone : defaultTimeZone;

  return {
    locale,
    timeZone,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
