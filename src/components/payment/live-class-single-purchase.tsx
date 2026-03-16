"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/src/components/common/button";

type LiveClassSinglePurchaseProps = {
  liveClassId: string;
  title: string;
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

export function LiveClassSinglePurchase({
  liveClassId,
  title,
  singlePrice,
}: LiveClassSinglePurchaseProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!singlePrice || singlePrice <= 0) {
      setError("Bu ders icin tekil satin alim aktif degil.");
      return;
    }

    setPending(true);
    setError("");

    const response = await fetch("/api/payment/live-class", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        liveClassId,
        fullName,
        email,
        phone,
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      payment?: {
        redirectUrl?: string;
        message?: string;
      };
    };

    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Tek ders odeme baslatilamadi.");
      return;
    }

    if (data.payment?.redirectUrl) {
      router.push(data.payment.redirectUrl);
      return;
    }

    setError(data.payment?.message ?? "Odeme yonlendirmesi olusturulamadi.");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/45 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Tek ders katilim</p>
        <span className="rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
          {formatPrice(singlePrice)}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400">{title} oturumuna yillik uyelik olmadan dogrudan katilabilirsin.</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Ad Soyad"
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-posta"
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Telefon"
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
        />

        {error ? <p className="text-xs text-red-300">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={pending || !singlePrice || singlePrice <= 0}>
          {pending ? "Yonlendiriliyor..." : "Tek Ders Satin Al"}
        </Button>
      </form>
    </div>
  );
}
