import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Layers3, Sparkles } from "lucide-react";
import { RegisterForm } from "@/src/components/common/register-form";

export default function RegisterPage() {
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
              Ücretsiz Kayıt
            </div>
            <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight text-white md:text-5xl">Hesabını oluştur, sisteme net bir başlangıç yap</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Kayıt ücretsizdir. Hesabını oluşturduktan sonra sana uygun planı seçebilir, AI modüllerini ve canlı ders akışını aynı merkezde kullanabilirsin.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
                    <BadgeCheck size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Anında hesap açılışı</p>
                    <p className="mt-1 text-xs leading-6 text-slate-400">Kayıt sonrası plan seçerek sistemde hemen ilerlemeye başlayabilirsin.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
                    <Layers3 size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Esnek başlangıç</p>
                    <p className="mt-1 text-xs leading-6 text-slate-400">Satın alma sırasında hesap oluşturulduysa, e-postana gelen şifreyle direkt giriş yapabilirsin.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Tek merkezli deneyim</p>
                    <p className="mt-1 text-xs leading-6 text-slate-400">Vocabulary, reading, grammar ve canlı ders ritmi tek panelde birleşir.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 text-sm text-slate-300">
              <span>Zaten hesabın var mı?</span>
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">Yeni Hesap</p>
            <h2 className="mt-3 text-3xl font-black text-white">Hesap Oluştur</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Ad, e-posta ve şifre ile saniyeler içinde kayıt ol. Kayıt sonrası giriş ekranına yönlendirilirsin.
            </p>
            <div className="mt-8">
              <RegisterForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}