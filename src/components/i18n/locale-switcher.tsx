"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { setUserLocale } from "@/src/i18n/actions";
import { localeLabels, locales } from "@/src/i18n/config";

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label
      className={`inline-flex items-center gap-1.5 rounded-2xl border border-white/12 bg-white/[0.03] px-2.5 py-2 text-sm text-zinc-300 ${pending ? "opacity-60" : ""} ${className}`}
    >
      <Languages size={15} aria-hidden />
      <span className="sr-only">{t("change")}</span>
      <select
        value={locale}
        disabled={pending}
        aria-label={t("label")}
        onChange={(event) => {
          const next = event.target.value;
          startTransition(async () => {
            await setUserLocale(next);
            router.refresh();
          });
        }}
        className="cursor-pointer bg-transparent text-sm font-medium text-zinc-200 outline-none"
      >
        {locales.map((value) => (
          <option key={value} value={value} className="bg-zinc-900 text-white">
            {localeLabels[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
