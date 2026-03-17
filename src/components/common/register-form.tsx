"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Ad Soyad</label>
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <UserRound size={16} />
          </div>
          <input
            type="text"
            required
            className="w-full rounded-[22px] border border-white/12 bg-white/[0.04] px-12 py-3.5 text-white outline-none placeholder:text-slate-500 transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
            placeholder="Ad Soyad"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">E-posta</label>
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
        <label className="mb-2 block text-sm font-medium text-slate-300">Şifre</label>
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <LockKeyhole size={16} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            className="w-full rounded-[22px] border border-white/12 bg-white/[0.04] px-12 py-3.5 pr-14 text-white outline-none placeholder:text-slate-500 transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
            placeholder="En az 6 karakter"
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
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Şifre Tekrar</label>
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <LockKeyhole size={16} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            className="w-full rounded-[22px] border border-white/12 bg-white/[0.04] px-12 py-3.5 text-white outline-none placeholder:text-slate-500 transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
            placeholder="Şifreni tekrar gir"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      {error ? <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">{error}</p> : null}
      {success ? <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{success}</p> : null}

      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="font-semibold uppercase tracking-[0.18em] text-amber-300">Kayıt Akışı</span>
          <span className="text-slate-500">Hızlı başlangıç</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">Kayıt tamamlandığında giriş ekranına yönlendirilirsin ve hesabın hemen kullanılabilir olur.</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[22px] bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] px-5 py-3.5 font-bold text-zinc-950 shadow-[0_12px_30px_rgba(212,168,67,0.32)] transition hover:brightness-105 disabled:opacity-50"
      >
        {pending ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
      </button>
    </form>
  );
}
