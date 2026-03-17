"use client";

import { useState } from "react";

import { Button } from "@/src/components/common/button";

type PricingPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  includesLiveClass: boolean;
  includesAIPlanner: boolean;
  includesReading: boolean;
  includesGrammar: boolean;
  includesVocab: boolean;
};

type PricingCheckoutProps = {
  plans: PricingPlan[];
};

function formatPrice(price: number | null) {
  if (price === null) {
    return "Teklif al";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function PricingCheckout({ plans }: PricingCheckoutProps) {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  return (
    <>
      <div className="mt-8 flex items-center justify-center">
        <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              billingCycle === "MONTHLY"
                ? "bg-white text-zinc-900"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Aylık
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("YEARLY")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              billingCycle === "YEARLY"
                ? "bg-white text-zinc-900"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Yıllık
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const features = [
            plan.includesVocab && "Kelime modülü",
            plan.includesReading && "Reading modülü",
            plan.includesGrammar && "Grammar modülü",
            plan.includesAIPlanner && "AI çalışma planı",
            plan.includesLiveClass && "Haftada 4 saat canlı ders erişimi",
          ].filter((feature): feature is string => Boolean(feature));

          const displayPrice =
            billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
          const isHighlighted = plan.slug === "premium";

          return (
            <div
              key={plan.id}
              className={[
                "rounded-3xl p-6",
                isHighlighted
                  ? "border-2 border-amber-400/70 bg-gradient-to-b from-amber-400/8 to-zinc-900/60 shadow-[0_20px_60px_rgba(212,168,67,0.18)]"
                  : "border border-white/8 bg-zinc-900/50 shadow-[0_20px_60px_rgba(0,0,0,0.22)]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className={`text-2xl font-black ${isHighlighted ? "text-amber-100" : "text-white"}`}>{plan.name}</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    {plan.description ?? "Sınav hazırlığı için plan"}
                  </p>
                </div>
                {isHighlighted ? (
                  <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
                    ★ Popüler
                  </span>
                ) : null}
              </div>

              <div className="mt-6">
                <p className={`text-4xl font-black ${isHighlighted ? "text-amber-300" : "text-white"}`}>{formatPrice(displayPrice)}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {billingCycle === "YEARLY" ? "yıllık ödeme" : "aylık ödeme"}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      isHighlighted ? "bg-amber-400/20 text-amber-300" : "bg-white/10 text-zinc-400"
                    }`}>
                      ✓
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button
                  href={`/pricing/${plan.slug}?cycle=${billingCycle === "YEARLY" ? "yearly" : "monthly"}`}
                  className="w-full"
                  disabled={!displayPrice || displayPrice <= 0}
                  variant={isHighlighted ? "primary" : "outline"}
                >
                  {displayPrice && displayPrice > 0 ? "Bu Planla Başla" : "Teklif Al"}
                </Button>
                <p className="mt-3 text-center text-xs leading-5 text-zinc-500">
                  Tek tek canlı ders satın alma seçeneği ayrıca açıktır.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
