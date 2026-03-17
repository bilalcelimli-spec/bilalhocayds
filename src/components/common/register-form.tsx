"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setPending(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, interestTags: [], priorityTags: [] }),
    });

    const data = await res.json() as { error?: string; message?: string };
    setPending(false);

    if (!res.ok) {
      setError(data.error ?? "Kayıt sırasında hata oluştu.");
      return;
    }

    setSuccess("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsun...");
    setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Ad Soyad</label>
        <input
          type="text"
          required
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
          placeholder="Ad Soyad"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">E-posta</label>
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
        <label className="mb-2 block text-sm font-medium text-slate-300">Şifre</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 pr-12 text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
            placeholder="En az 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            tabIndex={-1}
          >
            {showPassword ? "Gizle" : "Göster"}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Şifre Tekrar</label>
        <input
          type={showPassword ? "text" : "password"}
          required
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
          placeholder="Şifreni tekrar gir"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-green-400">{success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-amber-400 px-5 py-3 font-bold text-zinc-900 shadow-[0_4px_20px_rgba(212,168,67,0.3)] transition hover:bg-amber-300 disabled:opacity-50"
      >
        {pending ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
      </button>
    </form>
  );
}
