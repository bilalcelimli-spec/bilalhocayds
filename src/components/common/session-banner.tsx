"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

type SessionBannerProps = {
  userName: string;
  userEmail: string;
};

export function SessionBanner({ userName, userEmail }: SessionBannerProps) {
  const t = useTranslations("sessionBanner");

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">
      <p className="text-sm text-zinc-300">
        {t.rich("signedInAs", {
          name: () => <span className="font-semibold text-white">{userName || userEmail}</span>,
        })}
      </p>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex shrink-0 items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
      >
        <LogOut size={14} />
        {t("signOut")}
      </button>
    </div>
  );
}
