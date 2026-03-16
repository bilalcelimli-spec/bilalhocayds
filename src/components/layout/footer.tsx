import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#081120]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-xl font-black text-white">bilalhocayds</h3>
            <p className="mt-3 max-w-sm text-sm leading-7 text-slate-400">
              YDS, YÖKDİL ve YDT için AI destekli kişiselleştirilmiş çalışma
              platformu. Günlük kelime, reading, grammar ve canlı ders sistemi
              tek merkezde.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
              Platform
            </h4>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <Link href="/vocabulary" className="text-slate-400 transition hover:text-white">
                  AI Vocabulary
                </Link>
              </div>
              <div>
                <Link href="/reading" className="text-slate-400 transition hover:text-white">
                  AI Reading
                </Link>
              </div>
              <div>
                <Link href="/grammar" className="text-slate-400 transition hover:text-white">
                  AI Grammar
                </Link>
              </div>
              <div>
                <Link href="/live-classes" className="text-slate-400 transition hover:text-white">
                  Canlı Dersler
                </Link>
              </div>
              <div>
                <Link href="/pricing" className="text-slate-400 transition hover:text-white">
                  Planlar &amp; Fiyatlar
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
              <div>
                <Link href="/dashboard" className="text-slate-400 transition hover:text-white">
                  Öğrenci Paneli
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 BilalHocayds. Tüm hakları saklıdır.</span>
          <span className="text-xs">
            Bilal Hoca&apos;nın sınav tecrübesi × yapay zekânın gücü
          </span>
        </div>
      </div>
    </footer>
  );
}
