"use client";

import { CalendarDays, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/src/components/common/button";

type LiveClassSinglePurchaseProps = {
  liveClassId: string;
  title: string;
  description?: string | null;
  topicOutline?: string | null;
  scheduledAt: Date;
  durationMinutes: number;
  singlePrice: number | null;
};

function formatPrice(price: number | null) {
  if (price === null || price <= 0) {
    return "Planlanmadi";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

function resolvePaytrRedirectUrl(payment?: { redirectUrl?: string; token?: string }) {
  if (typeof payment?.redirectUrl === "string" && payment.redirectUrl.trim()) {
    return payment.redirectUrl;
  }

  if (typeof payment?.token === "string" && payment.token.trim()) {
    return `https://www.paytr.com/odeme/guvenli/${payment.token}`;
  }

  return null;
}

export function LiveClassSinglePurchase({
  liveClassId,
  title,
  description,
  topicOutline,
  scheduledAt,
  durationMinutes,
  singlePrice,
}: LiveClassSinglePurchaseProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const dateStr = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(scheduledAt));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!singlePrice || singlePrice <= 0) {
      setError("Bu ders icin tekil satin alim aktif degil.");
      return;
    }

    setPending(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/payment/live-class", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liveClassId, fullName, email, phone }),
    });

    const data = (await response.json()) as {
      error?: string;
      payment?: {
        redirectUrl?: string;
        token?: string;
        status?: string;
        message?: string;
      };
    };

    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Tek ders odeme baslatilamadi.");
      return;
    }

    const redirectUrl = resolvePaytrRedirectUrl(data.payment);

    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    if (data.payment?.token || data.payment?.status === "pending") {
      setSuccess(data.payment?.message ?? "Odeme oturumu olusturuldu. Lutfen yonlendirme adimini tamamlayin.");
      return;
    }

    setError(data.payment?.message ?? "Odeme yonlendirmesi olusturulamadi.");
  }

  return (
    <div className="rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.30)] backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">Tek Ders Satın Alım</p>
          <h3 className="mt-2 text-xl font-black text-white">Canlı oturuma doğrudan katılım</h3>
        </div>
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
          <Sparkles size={18} />
        </div>
      </div>

      {/* Ders özeti */}
      <div className="mb-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="mt-1 text-xs text-amber-300">{dateStr} · {durationMinutes} dk</p>
          </div>
          <span className="shrink-0 rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-300">
            {formatPrice(singlePrice)}
          </span>
        </div>
        {description ? (
          <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
        ) : null}
        {topicOutline ? (
          <p className="mt-2 text-xs text-zinc-500"><span className="text-zinc-400 font-medium">Konular:</span> {topicOutline}</p>
        ) : null}

        {/* Ne içeriyor açıklaması */}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <CalendarDays size={14} className="text-amber-300" />
              Oturum bilgisi
            </div>
            <p className="mt-2 text-xs leading-6 text-slate-400">Ders saatinde canlı katılım, ders sonrası kayıt erişimi ve soru-cevap hakkı.</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Mail size={14} className="text-amber-300" />
              Teslim akışı
            </div>
            <p className="mt-2 text-xs leading-6 text-slate-400">Ödeme onaylandıktan sonra ders bağlantısı e-posta adresine otomatik iletilir.</p>
          </div>
        </div>

        <div className="mt-4 border-t border-white/8 pt-3 space-y-1.5">
          <p className="text-xs font-semibold text-slate-300">Bu satın alıma dahil:</p>
          <ul className="space-y-1">
            {[
              "Canlı oturuma tam erişim",
              "Ders sonrası kayıt videosu",
              "Soru-cevap imkânı",
              "Satın alım sonrası e-posta ile ders bağlantısı",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-amber-400">✓</span> {item}
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs leading-6 text-emerald-100/85">
            <div className="flex items-center gap-2 font-semibold text-emerald-300">
              <ShieldCheck size={13} />
              Güvenli teslim
            </div>
            <p className="mt-1 text-emerald-100/80">
            Ödeme onaylanır onaylanmaz ders bağlantısı e-posta adresinize iletilecektir.
            </p>
          </div>
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold text-slate-300">Katılım bilgilerini gir</p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Ad Soyad"
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-amber-400/40"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-posta (ders linki buraya gönderilecek)"
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-amber-400/40"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Telefon"
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-amber-400/40"
        />

        {error ? <p className="text-xs text-red-300">{error}</p> : null}
        {success ? <p className="text-xs text-emerald-300">{success}</p> : null}

        <Button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] text-zinc-950 shadow-[0_20px_50px_rgba(212,168,67,0.28)] hover:brightness-105" disabled={pending || !singlePrice || singlePrice <= 0} size="lg">
          {pending ? "Yönlendiriliyor..." : `Derse Katıl · ${formatPrice(singlePrice)}`}
        </Button>
      </form>
    </div>
  );
}
