import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Sparkles } from "lucide-react";

import { authOptions } from "@/src/auth";
import { Button } from "@/src/components/common/button";
import { MobileNavMenu } from "@/src/components/layout/mobile-nav-menu";
import { NavSignOutButton } from "@/src/components/layout/nav-sign-out-button";

export async function Navbar() {
  const session = await getServerSession(authOptions);
  const dashboardHref =
    session?.user?.role === "ADMIN"
      ? "/admin"
      : session?.user?.role === "TEACHER"
        ? "/teacher"
        : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090b10]/78 backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
        <div className="relative overflow-visible rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-4 py-3 shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl md:px-5">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)] opacity-40" />
          <div className="pointer-events-none absolute right-6 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-amber-400/8 blur-2xl" />

          <div className="relative flex items-center justify-between gap-4">
            <Link href="/" className="flex min-w-0 items-center gap-3 md:gap-4">
              <Image
                src="/logo.png"
                alt="bilalhocayds logo"
                width={72}
                height={72}
                priority
                className="h-12 w-12 object-contain md:h-14 md:w-14"
              />
              <div className="flex min-w-0 flex-col justify-center">
                <div className="truncate text-lg font-black lowercase leading-none tracking-tight text-white md:text-xl">
                  bilalhocayds
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  <span className="hidden sm:inline">AI Powered ENGLISH Platform</span>
                  <span className="hidden h-1 w-1 rounded-full bg-amber-400 sm:inline-block" />
                  <span className="hidden sm:inline text-amber-300">PREMIUM Learning Flow</span>
                </div>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {[
                { href: "/#features", label: "Özellikler" },
                { href: "/#system", label: "Sistem" },
                { href: "/pricing", label: "Planlar" },
                { href: "/live-classes", label: "Canlı Dersler" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-transparent px-4 py-2 text-sm text-zinc-300 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:gap-3 lg:flex">
              {session?.user ? (
                <>
                  <Button href={dashboardHref} className="rounded-2xl bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] text-zinc-950 shadow-[0_12px_30px_rgba(212,168,67,0.28)] hover:brightness-105">
                    Dashboard
                  </Button>
                  <NavSignOutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-zinc-300 transition hover:text-white">
                    Giriş Yap
                  </Link>
                  <Button href="/register" className="rounded-2xl bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] text-zinc-950 shadow-[0_12px_30px_rgba(212,168,67,0.28)] hover:brightness-105">
                    Başla
                  </Button>
                </>
              )}
            </div>

            <MobileNavMenu dashboardHref={dashboardHref} isAuthenticated={Boolean(session?.user)} />
          </div>

          <div className="relative mt-3 hidden items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-2 text-xs text-zinc-400 md:flex lg:hidden">
            <div className="flex items-center gap-2 uppercase tracking-[0.18em] text-amber-300">
              <Sparkles size={12} />
              Hızlı Geçiş
            </div>
            <div className="flex items-center gap-4">
              <Link href="/#features" className="hover:text-white transition">Özellikler</Link>
              <Link href="/pricing" className="hover:text-white transition">Planlar</Link>
              <Link href="/live-classes" className="hover:text-white transition">Canlı Dersler</Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}