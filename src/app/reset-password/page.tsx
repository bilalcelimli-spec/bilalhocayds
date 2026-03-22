import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

import { ResetPasswordForm } from "@/src/components/common/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(212,168,67,0.14),transparent_55%)]" />
      <div className="mx-auto grid min-h-[82vh] max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(135deg,rgba(18,20,28,0.98),rgba(10,11,15,0.95)_45%,rgba(31,24,12,0.92))] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.28)] md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)] opacity-40" />
          <div className="pointer-events-none absolute -right-8 top-12 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/35 bg-amber-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Yeni Şifre
            </div>
            <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight text-white md:text-5xl">Güvenli bir yeni şifre belirle</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Geçerli sıfırlama bağlantın varsa yeni şifreni tanımla ve hesabına tekrar erişim kazan.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Tek kullanımlık işlem</p>
                    <p className="mt-1 text-xs leading-6 text-slate-400">Bağlantı kullanıldığında aynı token tekrar geçersiz olur.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
                    <LockKeyhole size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Eski şifre iptal edilir</p>
                    <p className="mt-1 text-xs leading-6 text-slate-400">Güncelleme sonrası sadece yeni şifren geçerli kalır.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-amber-400/20 bg-amber-400/10 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
                  <KeyRound size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Önemli</p>
                  <p className="mt-2 text-sm leading-7 text-amber-100/85">
                    Şifre değişikliği tamamlandığında aynı link tekrar kullanılamaz. Gerekirse yeni bir sıfırlama talebi oluştur.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 text-sm text-slate-300">
              <span>Giriş ekranına dönmek ister misin?</span>
              <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-white transition hover:text-amber-300">
                Giriş yap
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.28)] md:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
          <div className="pointer-events-none absolute -left-8 bottom-10 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">Şifre Güncelleme</p>
            <h2 className="mt-3 text-3xl font-black text-white">Yeni Şifreni Tanımla</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Bağlantı geçerliyse aşağıdan yeni şifreni belirleyebilirsin.
            </p>
            <div className="mt-8">
              <Suspense
                fallback={
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-slate-300">
                    Sıfırlama ekranı hazırlanıyor...
                  </div>
                }
              >
                <ResetPasswordForm />
              </Suspense>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}