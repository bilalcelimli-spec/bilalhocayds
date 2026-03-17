"use client";

import { ArrowRight, CheckCircle2, Mail, PhoneCall, ShieldCheck, Sparkles } from "lucide-react";
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
      <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(135deg,rgba(18,20,28,0.98),rgba(10,11,15,0.95)_45%,rgba(31,24,12,0.92))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.42)] md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)] opacity-40" />
        <div className="pointer-events-none absolute -right-16 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-amber-300/10" />
        <div className="pointer-events-none absolute left-20 top-10 h-24 w-24 rounded-full border border-white/10" />

        <div className="relative grid gap-8 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/35 bg-amber-400/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300 shadow-[0_0_24px_rgba(212,168,67,0.12)]">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Danışmanlık Talebi
            </div>
            <h2 className="mt-6 text-3xl font-black text-white md:text-5xl">
              Daha fazla bilgi almak ister misin?
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Bilgilerini bırak, danışmanımız sana en kısa sürede ulaşsın. En uygun planı, canlı ders ritmini ve başlama akışını birlikte netleştirelim.
            </p>

            <div className="mt-8 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 text-amber-300">
                    <PhoneCall size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Hızlı dönüş</p>
                    <p className="mt-1 text-xs leading-6 text-slate-400">Danışman ekibi en kısa sürede uygun plan ve başlangıç akışını paylaşır.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 text-amber-300">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Net yönlendirme</p>
                    <p className="mt-1 text-xs leading-6 text-slate-400">Canlı ders, modül kapsamı ve ödeme akışı tek görüşmede çerçevelenir.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Gizlilik güvencesi</p>
                    <p className="mt-1 text-xs leading-6 text-emerald-100/80">Bilgilerin yalnızca danışmanlık amacıyla kullanılır.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="rounded-[26px] border border-white/10 bg-[#0d1017]/90 p-5 md:p-6">
        {status === "success" ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="text-xl font-bold text-white">Talebiniz alındı!</h3>
            <p className="max-w-md text-slate-400">
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
          <>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">Hızlı Başvuru</p>
                <h3 className="mt-2 text-2xl font-black text-white">Seni arayalım, doğru planı birlikte netleştirelim</h3>
              </div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
                <Sparkles size={18} />
              </div>
            </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Ad</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Adınız"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
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
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
                />
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
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
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
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
                />
              </div>
            </div>

            {status === "error" && (
              <p className="text-sm text-red-400">{errorMsg}</p>
            )}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-xs text-slate-500 lg:max-w-sm">
              Bilgileriniz yalnızca danışmanlık amacıyla kullanılır ve üçüncü taraflarla paylaşılmaz.
              </p>
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-[0_12px_30px_rgba(212,168,67,0.35)] transition hover:brightness-105 disabled:opacity-60 lg:min-w-[220px]"
              >
                {status === "loading" ? "Gönderiliyor..." : "Beni Arayın"}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
          </>
        )}
            </div>
      </div>
      </div>
      </div>
    </section>
  );
}
