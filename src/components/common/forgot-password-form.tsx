"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? "Istek gonderilemedi.");
        return;
      }

      setSuccess(data.message ?? "Sifirlama baglantisi gonderildi.");
      setEmail("");
    } catch {
      setError("Baglanti kurulamadi. Lutfen tekrar dene.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">E-posta</label>
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <Mail size={16} />
          </div>
          <input
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-[22px] border border-white/12 bg-white/[0.04] px-12 py-3.5 text-white outline-none placeholder:text-slate-500 transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
            placeholder="ornek@mail.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">{error}</p>
      ) : null}

      {success ? (
        <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">{success}</p>
      ) : null}

      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="font-semibold uppercase tracking-[0.18em] text-amber-300">Sifirlama Linki</span>
          <span className="text-slate-500">1 saat gecerli</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Kayitli e-posta adresini gir. Gecerli bir hesabin varsa yeni sifreni belirlemen icin baglanti gondeririz.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] px-5 py-3.5 font-bold text-zinc-950 shadow-[0_12px_30px_rgba(212,168,67,0.32)] transition hover:brightness-105 disabled:opacity-50"
      >
        <Send size={16} />
        {pending ? "Baglanti gonderiliyor..." : "Sifirlama Baglantisi Gonder"}
      </button>

      <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white">
        <ArrowLeft size={16} />
        Giris ekranina don
      </Link>
    </form>
  );
}