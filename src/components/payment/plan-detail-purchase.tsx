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
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Satış Paneli</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">{plan.name}</h3>
        </div>
        <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              billingCycle === "MONTHLY" ? "bg-slate-950 text-white" : "text-slate-500"
            }`}
          >
            Aylık
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("YEARLY")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              billingCycle === "YEARLY" ? "bg-slate-950 text-white" : "text-slate-500"
            }`}
          >
            Yıllık
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">Seçilen ödeme tipi</p>
        <p className="mt-1 text-3xl font-black text-slate-950">{formatPrice(amount)}</p>
        <p className="mt-1 text-sm text-slate-600">
          {billingCycle === "YEARLY" ? "Yıllık paket satış akışı" : "Aylık paket satış akışı"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ad Soyad"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 outline-none"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 outline-none"
          required
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefon"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950 outline-none"
          required
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Satış başlatılıyor..." : "Satışı Başlat"}
        </Button>
      </form>
    </div>
  );
}
