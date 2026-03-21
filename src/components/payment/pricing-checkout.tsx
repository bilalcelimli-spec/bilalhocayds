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
  includesExam: boolean;
  includedExamCount: number;
  includedExams: Array<{
    title: string;
    examType: string;
    price: number | null;
  }>;
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
        <div className="inline-flex max-w-full flex-wrap rounded-2xl border border-white/10 bg-white/5 p-1">
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

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const features = [
            plan.includesVocab && "Kelime modülü",
            plan.includesReading && "Reading modülü",
            plan.includesGrammar && "Grammar modülü",
            plan.includesAIPlanner && "AI çalışma planı",
            plan.includesExam && "Sınav modülü",
            plan.includedExamCount > 0 && `${plan.includedExamCount} seçili marketplace sınavı`,
            plan.includesLiveClass && "Haftada 4 saat canlı ders erişimi",
          ].filter((feature): feature is string => Boolean(feature));

          const displayPrice =
            billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
          const isHighlighted = plan.slug === "premium";
          const accentLine = isHighlighted
            ? "from-[#fff2b8] via-[#f2d875] to-[#d4a843]"
            : "from-white/70 via-white/20 to-transparent";
          const planTone = isHighlighted ? "Premium Plan" : plan.slug === "pro" ? "Yoğun Tempo" : "Başlangıç Ritmi";

          return (
            <div
              key={plan.id}
              className={[
                "group relative overflow-hidden rounded-[30px] p-6 md:p-7",
                isHighlighted
                  ? "border-2 border-amber-400/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_34%),linear-gradient(180deg,rgba(39,29,10,0.92),rgba(15,17,24,0.96))] shadow-[0_28px_80px_rgba(212,168,67,0.22)]"
                  : "border border-white/8 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] shadow-[0_24px_70px_rgba(0,0,0,0.24)]",
              ].join(" ")}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <div className={`absolute inset-x-10 top-0 h-32 bg-gradient-to-b ${accentLine} opacity-10 blur-3xl`} />
              </div>

              <div className={`mb-5 h-px w-full bg-gradient-to-r ${accentLine}`} />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${isHighlighted ? "text-amber-300" : "text-zinc-500"}`}>
                    {planTone}
                  </p>
                  <h2 className={`mt-3 break-words text-3xl font-black ${isHighlighted ? "text-amber-100" : "text-white"}`}>{plan.name}</h2>
                  <p className="mt-3 max-w-[22rem] text-sm leading-7 text-zinc-400">
                    {plan.description ?? "Sınav hazırlığını düzenli ve ölçülebilir şekilde yönetmek için tasarlanan çalışma planı."}
                  </p>
                </div>
                {isHighlighted ? (
                  <span className="w-fit rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
                    ★ Popüler
                  </span>
                ) : null}
              </div>

              <div className="relative mt-8 rounded-[24px] border border-white/8 bg-black/20 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Fiyatlandırma</p>
                    <p className={`mt-3 break-words text-4xl font-black ${isHighlighted ? "text-amber-300" : "text-white"}`}>{formatPrice(displayPrice)}</p>
                  </div>
                  <div className="w-fit rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left sm:text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Canlı Ders</p>
                    <p className="mt-1 text-sm font-semibold text-white">{plan.includesLiveClass ? "Dahil" : "Opsiyonel"}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  {billingCycle === "YEARLY" ? "yıllık ödeme" : "aylık ödeme"}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isHighlighted ? "bg-amber-400/20 text-amber-300" : "bg-white/10 text-zinc-300"
                    }`}>
                      ✓
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {plan.includedExams.length > 0 ? (
                <div className="mt-6 rounded-[24px] border border-emerald-500/15 bg-emerald-500/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Dahil Sınavlar</p>
                  <div className="mt-3 space-y-2">
                    {plan.includedExams.slice(0, 3).map((exam) => (
                      <div key={`${exam.title}-${exam.examType}`} className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-400/15 bg-black/20 px-3 py-2 text-xs text-emerald-100">
                        <span className="font-semibold text-white">{exam.title}</span>
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
                          {exam.examType}
                        </span>
                        {exam.price && exam.price > 0 ? (
                          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                            {formatPrice(exam.price)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                    {plan.includedExams.length > 3 ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                        +{plan.includedExams.length - 3} sınav
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-2 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
                  <span>Çalışma ritmi</span>
                  <span className={`font-semibold ${isHighlighted ? "text-amber-300" : "text-white"}`}>
                    {plan.includesAIPlanner ? "Yakından yönlendirmeli" : "Klasik akış"}
                  </span>
                </div>
                <div className="mt-2 flex flex-col gap-2 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
                  <span>Esneklik</span>
                  <span className={`font-semibold ${isHighlighted ? "text-amber-300" : "text-white"}`}>
                    Tek ders satış desteği
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  href={`/pricing/${plan.slug}?cycle=${billingCycle === "YEARLY" ? "yearly" : "monthly"}`}
                  className={`w-full rounded-2xl ${
                    isHighlighted
                      ? "bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] text-zinc-950 shadow-[0_20px_50px_rgba(212,168,67,0.28)] hover:brightness-105"
                      : "border-white/12 bg-white/6 text-white backdrop-blur-sm hover:bg-white/10"
                  }`}
                  disabled={!displayPrice || displayPrice <= 0}
                  variant={isHighlighted ? "primary" : "outline"}
                  size="lg"
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
