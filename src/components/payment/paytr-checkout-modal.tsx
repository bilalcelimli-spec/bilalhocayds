"use client";

import { useState } from "react";
import { Button } from "@/src/components/common/button";

type PaytrCheckoutModalProps = {
  open: boolean;
  plan: {
    id: string;
    slug: string;
    name: string;
    monthlyPrice: number | null;
    yearlyPrice: number | null;
  } | null;
  billingCycle: "MONTHLY" | "YEARLY";
  onClose: () => void;
};

type CheckoutFormState = {
  fullName: string;
  email: string;
  phone: string;
};

export default function PaytrCheckoutModal({
  open,
  plan,
  billingCycle,
  onClose,
}: PaytrCheckoutModalProps) {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const amount =
    billingCycle === "YEARLY" ? plan?.yearlyPrice ?? null : plan?.monthlyPrice ?? null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev: CheckoutFormState) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!plan || !amount || amount <= 0) {
      return;
    }

    setPending(true);
    setError("");

    const response = await fetch("/api/payment/paytr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: plan.id,
        planSlug: plan.slug,
        billingCycle,
        ...form,
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      payment?: { redirectUrl?: string; token?: string; message?: string };
    };
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Ödeme başlatılırken bir hata oluştu.");
      return;
    }

    const redirectUrl = data.payment?.redirectUrl;
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    setSubmitted(true);
  }

  if (!open || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-xl bg-white p-6 w-full max-w-md">
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold mb-4">Satın Al</h2>
            <p className="mb-2 text-sm text-zinc-600">
              {plan.name} · {billingCycle === "YEARLY" ? "Yıllık" : "Aylık"} · ₺
              {amount?.toFixed(0)}
            </p>
            <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Ad Soyad" className="mb-2 w-full p-2 border rounded" required />
            <input name="email" value={form.email} onChange={handleChange} placeholder="E-posta" className="mb-2 w-full p-2 border rounded" required />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Telefon" className="mb-4 w-full p-2 border rounded" required />
            {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={pending}>{pending ? "Başlatılıyor..." : "Ödeme Yap"}</Button>
            <Button type="button" variant="secondary" onClick={onClose} className="ml-2">İptal</Button>
          </form>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Teşekkürler!</h2>
            <p>Ödeme işleminiz başlatıldı. Satış temsilcimiz sizinle iletişime geçecektir.</p>
            <Button className="mt-4" onClick={onClose}>Kapat</Button>
          </div>
        )}
      </div>
    </div>
  );
}
