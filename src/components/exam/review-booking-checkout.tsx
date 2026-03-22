"use client";

import { useState } from "react";

import type { ReviewSlotOption } from "@/src/lib/exam-review-bookings";

function resolvePaytrRedirectUrl(payment?: { redirectUrl?: string; token?: string }) {
  if (typeof payment?.redirectUrl === "string" && payment.redirectUrl.trim()) {
    return payment.redirectUrl;
  }

  if (typeof payment?.token === "string" && payment.token.trim()) {
    return `https://www.paytr.com/odeme/guvenli/${payment.token}`;
  }

  return null;
}

type ReviewBookingCheckoutProps = {
  attemptId: string;
  examTitle: string;
  amount: number;
  currency: string;
  incorrectCount: number;
  initialFullName: string;
  initialEmail: string;
  slotOptions: ReviewSlotOption[];
  initialPreferredSlot?: string;
  initialBookingNote?: string;
};

export function ReviewBookingCheckout({
  attemptId,
  examTitle,
  amount,
  currency,
  incorrectCount,
  initialFullName,
  initialEmail,
  slotOptions,
  initialPreferredSlot = "",
  initialBookingNote = "",
}: ReviewBookingCheckoutProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("");
  const [preferredSlot, setPreferredSlot] = useState(initialPreferredSlot);
  const [bookingNote, setBookingNote] = useState(initialBookingNote);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/payment/exam-review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attemptId,
        fullName,
        email,
        phone,
        preferredSlot,
        bookingNote,
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      payment?: { redirectUrl?: string; token?: string; message?: string };
    };

    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Review odemesi baslatilamadi.");
      return;
    }

    const redirectUrl = resolvePaytrRedirectUrl(data.payment);
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    setError(data.payment?.message ?? "PayTR yonlendirmesi olusturulamadi.");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Checkout</p>
      <h3 className="mt-3 text-2xl font-black text-white">{examTitle} review dersi</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-300">
        {incorrectCount} yanlis veya bos soru uzerinden birebir analiz oturumu baslatilir. Odeme alindiginda booking kaydi otomatik olarak olusur.
      </p>

      <div className="mt-5 grid gap-3">
        <input
          name="fullName"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Ad Soyad"
          required
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
        />
        <input
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-posta"
          required
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
        />
        <input
          name="phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Telefon"
          required
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
        />
        <select
          name="preferredSlot"
          value={preferredSlot}
          onChange={(event) => setPreferredSlot(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
        >
          <option value="">Uygun slot sec...</option>
          {slotOptions.map((slot) => (
            <option key={slot.value} value={slot.value}>
              {slot.label}
            </option>
          ))}
        </select>
        <textarea
          name="bookingNote"
          value={bookingNote}
          onChange={(event) => setBookingNote(event.target.value)}
          placeholder="Ek not veya odaklanilacak konu"
          rows={4}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Toplam</p>
        <p className="mt-2 text-3xl font-black text-white">{new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)}</p>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Checkout baslatiliyor..." : "PayTR ile odemeye gec"}
      </button>
    </form>
  );
}