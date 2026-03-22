"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard";

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setPending(false);

    if (result?.error) {
      setError("E-posta veya şifre hatalı. Lütfen kontrol et.");
      return;
    }

    window.location.assign(result?.url || callbackUrl);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          E-posta
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <Mail size={16} />
          </div>
          <input
            type="email"
            required
            className="w-full rounded-[22px] border border-white/12 bg-white/[0.04] px-12 py-3.5 text-white outline-none placeholder:text-slate-500 transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
            placeholder="ornek@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Şifre
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <LockKeyhole size={16} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            className="w-full rounded-[22px] border border-white/12 bg-white/[0.04] px-12 py-3.5 pr-16 text-white outline-none placeholder:text-slate-500 transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
            placeholder="Şifreniz"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:text-white"
            tabIndex={-1}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <div className="mt-3 flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-amber-300 transition hover:text-amber-200 hover:underline">
            Şifremi unuttum
          </Link>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">{error}</p>
      ) : null}

      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="font-semibold uppercase tracking-[0.18em] text-amber-300">Oturum Açma</span>
          <span className="text-slate-500">Güvenli giriş</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">Giriş yaptıktan sonra doğrudan öğrenci paneline yönlendirilirsin.</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[22px] bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] px-5 py-3.5 font-bold text-zinc-950 shadow-[0_12px_30px_rgba(212,168,67,0.32)] transition hover:brightness-105 disabled:opacity-50"
      >
        {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}