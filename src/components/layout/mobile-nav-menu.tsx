"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";

import { Button } from "@/src/components/common/button";
import { NavSignOutButton } from "@/src/components/layout/nav-sign-out-button";

type MobileNavMenuProps = {
  dashboardHref: string;
  isAuthenticated: boolean;
};

const navItems = [
  { href: "/#features", label: "Özellikler" },
  { href: "/#system", label: "Sistem" },
  { href: "/pricing", label: "Planlar" },
  { href: "/live-classes", label: "Canlı Dersler" },
];

export function MobileNavMenu({ dashboardHref, isAuthenticated }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.98),rgba(12,14,20,0.96))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />

          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/12 hover:bg-white/[0.06] hover:text-white"
              >
                <span>{item.label}</span>
                <ArrowUpRight size={15} className="text-amber-300" />
              </Link>
            ))}
          </div>

          <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">Hızlı Erişim</p>

            {isAuthenticated ? (
              <div className="mt-4 flex flex-col gap-3">
                <Button
                  href={dashboardHref}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] text-zinc-950 shadow-[0_12px_30px_rgba(212,168,67,0.28)] hover:brightness-105"
                >
                  Dashboard
                </Button>
                <div className="flex justify-end">
                  <NavSignOutButton />
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Button href="/login" variant="outline" className="w-full rounded-2xl border-white/12 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08]">
                  Giriş Yap
                </Button>
                <Button
                  href="/register"
                  className="w-full rounded-2xl bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] text-zinc-950 shadow-[0_12px_30px_rgba(212,168,67,0.28)] hover:brightness-105"
                >
                  Başla
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}