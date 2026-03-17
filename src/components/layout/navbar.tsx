import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/src/auth";
import { Button } from "@/src/components/common/button";
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0b0f]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="bilalhocayds logo"
            width={72}
            height={72}
            priority
            className="h-16 w-16 object-contain"
          />
          <div className="flex flex-col justify-center">
            <div className="text-lg font-black lowercase tracking-tight text-white leading-none">
              bilalhocayds
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              AI POWERED ENGLISH PLATFORM
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/#features" className="text-sm text-zinc-300 transition hover:text-white">
            Özellikler
          </Link>
          <Link href="/#system" className="text-sm text-zinc-300 transition hover:text-white">
            Sistem
          </Link>
          <Link href="/pricing" className="text-sm text-zinc-300 transition hover:text-white">
            Planlar
          </Link>
          <Link href="/live-classes" className="text-sm text-zinc-300 transition hover:text-white">
            Canlı Dersler
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Button href={dashboardHref}>Dashboard</Button>
              <NavSignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white">
                Giriş Yap
              </Link>
              <Button href="/register">Başla</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}