"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

export function NavSignOutButton() {
  const t = useTranslations("nav");

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-2 whitespace-nowrap rounded-2xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-red-400/30 hover:bg-red-500/8 hover:text-red-400"
      title={t("signOutTitle")}
    >
      <LogOut size={15} />
      <span className="hidden sm:inline">{t("signOut")}</span>
    </button>
  );
}
