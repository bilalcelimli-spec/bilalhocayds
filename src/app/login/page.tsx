import Link from "next/link";
import { LoginForm } from "@/src/components/common/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto grid min-h-[82vh] max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <section className="rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">
          Welcome Back
        </p>
        <h1 className="mt-4 text-3xl font-black text-white">Giriş Yap</h1>
        <p className="mt-3 text-sm leading-7 text-zinc-300">
          Bilalhocayds hesabına giriş yap ve çalışma planına kaldığın yerden devam et.
        </p>

        <p className="mt-6 text-sm text-zinc-300">
          Hesabın yok mu?{" "}
          <Link href="/register" className="font-semibold text-white">
            Kayıt ol
          </Link>
        </p>

      </section>

      <section className="rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <h2 className="text-2xl font-black text-white">Hesabına Gir</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Email ve şifrenle güvenli şekilde oturum aç.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </div>
  );
}