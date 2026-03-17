import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070b11]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(135deg,rgba(18,20,28,0.98),rgba(10,11,15,0.95)_45%,rgba(31,24,12,0.92))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)] opacity-40" />
          <div className="pointer-events-none absolute -right-12 top-10 h-36 w-36 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/35 bg-amber-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              BilalHocayds
            </div>
            <h3 className="mt-4 text-2xl font-black text-white md:text-3xl">AI destekli YDS hazırlığında net, güçlü ve tek merkezli sistem</h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
              YDS, YÖKDİL ve YDT için günlük çalışma modülleri, AI planlama ve canlı ders akışı tek omurgada ilerler.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">AI Planlama</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">Haftada 4 Saat Canlı Ders</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">Tek Ders Satışı</span>
            </div>
          </div>

          <div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
                  Hızlı Erişim
                </h4>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <Link href="/pricing" className="text-slate-400 transition hover:text-white">
                      Planlar &amp; Fiyatlar
                    </Link>
                  </div>
                  <div>
                    <Link href="/live-classes" className="text-slate-400 transition hover:text-white">
                      Canlı Dersler
                    </Link>
                  </div>
                  <div>
                    <Link href="/dashboard" className="text-slate-400 transition hover:text-white">
                      Öğrenci Paneli
                    </Link>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
                  Hesap
                </h4>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <Link href="/register" className="text-slate-400 transition hover:text-white">
                      Kayıt Ol
                    </Link>
                  </div>
                  <div>
                    <Link href="/login" className="text-slate-400 transition hover:text-white">
                      Giriş Yap
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">Kısa Not</p>
              <p className="mt-2 text-sm leading-7 text-amber-100/85">
                Bilal Hoca&apos;nın sınav tecrübesi ile yapay zekânın hızını aynı çalışma omurgasında birleştiriyoruz.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 BilalHocayds. Tüm hakları saklıdır.</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
            Bilal Hoca&apos;nın sınav tecrübesi × yapay zekânın gücü
          </span>
        </div>
        </div>
      </div>
    </footer>
  );
}
