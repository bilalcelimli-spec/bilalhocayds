"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/src/components/common/button";

type PlanDetailPurchaseProps = {
  plan: {
    id: string;
    slug: string;
    name: string;
    monthlyPrice: number | null;
    yearlyPrice: number | null;
  };
  initialCycle: "MONTHLY" | "YEARLY";
};

function formatPrice(price: number | null) {
  if (price === null || price <= 0) {
    return "Teklif al";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function PlanDetailPurchase({ plan, initialCycle }: PlanDetailPurchaseProps) {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">(initialCycle);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const amount = billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError("Bu plan için geçerli bir ödeme tutarı bulunmuyor.");
      return;
    }

    setPending(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/payment/paytr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: plan.id,
        planSlug: plan.slug,
        billingCycle,
        fullName,
        email,
        phone,
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      orderReference?: string;
      payment?: {
        redirectUrl?: string;
        token?: string;
        message?: string;
        status?: string;
      };
    };
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Satış işlemi başlatılamadı.");
      return;
    }

    const redirectUrl = typeof data.payment?.redirectUrl === "string"
      ? data.payment.redirectUrl
      : null;

    if (redirectUrl) {
      router.push(redirectUrl);
      return;
    }

    if (data.payment?.token) {
      setSuccess(
        data.payment.message ??
          "Ödeme oturumu oluşturuldu. Sağlayıcı token değeri hazır; canlı iframe/redirect tanımı ile bağlanabilir.",
      );
      return;
    }

    setSuccess(
      data.payment?.message ??
        "Satış süreci başlatıldı. Ödeme yönlendirmesi ve takip için sizinle iletişime geçilecektir.",
    );
  }

  return (
    <div className="sticky top-24 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Satış Paneli</p>
          <h3 className="mt-1 text-2xl font-black text-white">{plan.name}</h3>
        </div>
        <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              billingCycle === "MONTHLY" ? "bg-white text-zinc-950" : "text-slate-400"
            }`}
          >
            Aylık
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("YEARLY")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              billingCycle === "YEARLY" ? "bg-white text-zinc-950" : "text-slate-400"
            }`}
          >
            Yıllık
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Seçilen ödeme tipi</p>
        <p className="mt-3 text-4xl font-black text-white">{formatPrice(amount)}</p>
        <p className="mt-1 text-sm text-slate-400">
          {billingCycle === "YEARLY" ? "Yıllık paket satış akışı" : "Aylık paket satış akışı"}
        </p>
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs leading-6 text-amber-100/85">
          Canlı ders içeren paketlerde haftada 4 saatlik program akışı planlanır. İstersen tek tek canlı ders satın alma modeliyle ilerleyebilirsin.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ad Soyad"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-slate-500"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-slate-500"
          required
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefon"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-slate-500"
          required
        />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

        <Button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] text-zinc-950 shadow-[0_20px_50px_rgba(212,168,67,0.28)] hover:brightness-105" disabled={pending} size="lg">
          {pending ? "Satış başlatılıyor..." : "Satışı Başlat"}
        </Button>
      </form>
    </div>
  );
}
