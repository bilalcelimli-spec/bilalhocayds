import Link from "next/link";
import { RegisterForm } from "@/src/components/common/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto grid min-h-[82vh] max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <section className="rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
          Üretsiz Kayıt
        </p>
        <h1 className="mt-4 text-3xl font-black text-white">Hesap Oluştur</h1>
        <p className="mt-3 text-sm leading-7 text-zinc-300">
          Hesap oluşturmak ücretsizdir. Çalışma modüllerine erişim için bir plan satın alman yeterli.
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <span className="mt-0.5 text-amber-400">✓</span>
            <p className="text-sm text-zinc-300">Kayıt sonrası plan seçerek hemen başlayabilirsin.</p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <span className="mt-0.5 text-amber-400">✓</span>
            <p className="text-sm text-zinc-300">Satın alma sırasında hesap oluştulduysa, e-postana gelen şifreyle direkt giriş yapabilirsin.</p>
          </div>
        </div>

        <p className="mt-6 text-sm text-zinc-300">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-semibold text-white hover:text-amber-300">
            Giriş yap
          </Link>
        </p>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <h2 className="text-2xl font-black text-white">Hesap Oluştur</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Ad, e-posta ve şifre ile saniyeler içinde kayıt ol.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </section>
    </div>
  );
}