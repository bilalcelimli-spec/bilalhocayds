"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("E-posta veya şifre hatalı. Lütfen kontrol et.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          E-posta
        </label>
        <input
          type="email"
          required
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
          placeholder="ornek@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Şifre
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 pr-16 text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
            placeholder="Şifreniz"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            tabIndex={-1}
          >
            {showPassword ? "Gizle" : "Göster"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-400">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-amber-400 px-5 py-3 font-bold text-zinc-900 shadow-[0_4px_20px_rgba(212,168,67,0.3)] transition hover:bg-amber-300 disabled:opacity-50"
      >
        {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}