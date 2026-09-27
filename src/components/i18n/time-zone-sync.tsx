"use client";

import { useEffect } from "react";

import { TIME_ZONE_COOKIE } from "@/src/i18n/config";

/**
 * Tarayıcının saat dilimini çereze yazar; sonraki isteklerde ders saatleri
 * sunucu saati yerine öğrencinin yerel saatinde gösterilir.
 */
export function TimeZoneSync({ current }: { current: string }) {
  useEffect(() => {
    try {
      const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (browserTimeZone && browserTimeZone !== current) {
        document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(browserTimeZone)}; path=/; max-age=31536000; samesite=lax`;
      }
    } catch {
      // Saat dilimi okunamazsa varsayılan (Europe/Istanbul) kullanılmaya devam eder.
    }
  }, [current]);

  return null;
}
