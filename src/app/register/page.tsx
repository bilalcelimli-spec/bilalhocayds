import Link from "next/link";
import { RegisterForm } from "@/src/components/common/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto grid min-h-[82vh] max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <section className="rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">
          Start Now
        </p>
        <h1 className="mt-4 text-3xl font-black text-white">Kayıt Ol</h1>
        <p className="mt-3 text-sm leading-7 text-zinc-300">
          Yeni hesap oluştur, rolünü belirle ve AI destekli çalışma akışını başlat.
        </p>

        <div className="mt-6 rounded-2xl border border-white/15 bg-black/30 p-4">
          <p className="text-sm text-zinc-200">
            Kayıt sonrası sistem seni öğrenci (kullanıcı) olarak başlatır. Eğitmen ve
            admin rolleri panel üzerinden atanabilir.
          </p>
        </div>

        <p className="mt-6 text-sm text-zinc-300">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-semibold text-white">
            Giriş yap
          </Link>
        </p>

      </section>

      <section className="rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <h2 className="text-2xl font-black text-white">Hesap Oluştur</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Ad, email ve şifre ile hızlıca kayıt ol.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </section>
    </div>
  );
}