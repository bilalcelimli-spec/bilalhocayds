"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function NavSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.03] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-red-400/30 hover:bg-red-500/8 hover:text-red-400"
      title="Çıkış Yap"
    >
      <LogOut size={15} />
      <span className="hidden sm:inline">Çıkış</span>
    </button>
  );
}
