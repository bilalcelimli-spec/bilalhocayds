"use client";

import { useState } from "react";

type FormState = {
  name: string;
  surname: string;
  phone: string;
  email: string;
};

export function LeadCaptureSection() {
  const [form, setForm] = useState<FormState>({ name: "", surname: "", phone: "", email: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, plan: "Danışmanlık Talebi" }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Bir hata oluştu.");
      }

      setStatus("success");
      setForm({ name: "", surname: "", phone: "", email: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Bir hata oluştu.");
    }
  }

  return (
    <section id="iletisim" className="mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 h-px w-24 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        <h2 className="text-3xl font-black text-white md:text-4xl">
          Daha fazla bilgi almak ister misin?
        </h2>
        <p className="mt-4 text-lg leading-8 text-slate-400">
          Bilgilerini bırak, danışmanımız seni en kısa sürede arasın.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-xl rounded-[32px] border border-white/10 bg-zinc-900/60 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        {status === "success" ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/15 text-3xl">
              ✓
            </div>
            <h3 className="text-xl font-bold text-white">Talebiniz alındı!</h3>
            <p className="text-slate-400">
              Danışmanımız en kısa sürede sizinle iletişime geçecek.
            </p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-2 text-sm font-semibold text-amber-400 hover:text-amber-300"
            >
              Yeni bir talep oluştur
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Ad</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Adınız"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Soyad</label>
                <input
                  name="surname"
                  value={form.surname}
                  onChange={handleChange}
                  placeholder="Soyadınız"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Telefon</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="05XX XXX XX XX"
                required
                type="tel"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                E-posta <span className="text-slate-500">(isteğe bağlı)</span>
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ornek@mail.com"
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-400">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-2 w-full rounded-2xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-zinc-900 shadow-[0_4px_20px_rgba(212,168,67,0.35)] transition hover:bg-amber-300 disabled:opacity-60"
            >
              {status === "loading" ? "Gönderiliyor..." : "Beni Arayın"}
            </button>

            <p className="text-center text-xs text-slate-500">
              Bilgileriniz yalnızca danışmanlık amacıyla kullanılır ve üçüncü taraflarla paylaşılmaz.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
