import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowUpRight, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";

import { prisma } from "@/src/lib/prisma";
import PlanDetailPurchase from "@/src/components/payment/plan-detail-purchase";
import { buildPublicPageMetadata } from "@/src/lib/page-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ cycle?: string }>;
};

const testimonialItems = [
  { name: "Zeynep A.", roleKey: "t1Role", quoteKey: "t1Quote" },
  { name: "Mert K.", roleKey: "t2Role", quoteKey: "t2Quote" },
  { name: "Elif T.", roleKey: "t3Role", quoteKey: "t3Quote" },
] as const;

const faqItems = [
  { questionKey: "faq1Q", answerKey: "faq1A" },
  { questionKey: "faq2Q", answerKey: "faq2A" },
  { questionKey: "faq3Q", answerKey: "faq3A" },
  { questionKey: "faq4Q", answerKey: "faq4A" },
  { questionKey: "faq5Q", answerKey: "faq5A" },
] as const;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const plan = await prisma.plan
    .findFirst({ where: { slug, isActive: true }, select: { name: true, description: true } })
    .catch(() => null);

  if (!plan) {
    return { robots: { index: false } };
  }

  return buildPublicPageMetadata({
    pageKey: "plan-detail",
    path: `/pricing/${slug}`,
    values: { plan: plan.name },
    description: plan.description,
  });
}

export default async function PricingDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialCycle = resolvedSearchParams?.cycle === "yearly" ? "YEARLY" : "MONTHLY";
  const [t, formatter] = await Promise.all([getTranslations("planDetail"), getFormatter()]);
  const testimonials = testimonialItems.map((item) => ({ name: item.name, role: t(item.roleKey), quote: t(item.quoteKey) }));
  const faqs = faqItems.map((item) => ({ question: t(item.questionKey), answer: t(item.answerKey) }));

  const plan = await prisma.plan.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      monthlyPrice: true,
      yearlyPrice: true,
      includesLiveClass: true,
      includesAIPlanner: true,
      includesReading: true,
      includesGrammar: true,
      includesVocab: true,
      includesExam: true,
      examModules: {
        select: {
          examModule: {
            select: {
              id: true,
              title: true,
              marketplaceTitle: true,
              examType: true,
            },
          },
        },
      },
    },
  } as never) as {
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
    examModules: Array<{ examModule: { id: string; title: string; marketplaceTitle: string | null; examType: string } }>;
  } | null;

  if (!plan) {
    notFound();
  }

  const features = [
    plan.includesVocab && t("featureVocab"),
    plan.includesReading && t("featureReading"),
    plan.includesGrammar && t("featureGrammar"),
    plan.includesAIPlanner && t("featureAIPlanner"),
    plan.includesExam && t("featureExam"),
    plan.examModules.length > 0 && t("featureExams", { count: plan.examModules.length }),
    plan.includesLiveClass && t("featureLive"),
  ].filter((item): item is string => Boolean(item));

  const bundledExams = plan.examModules.map(({ examModule }) => examModule);

  const formatPrice = (price: number | null) =>
    price ? formatter.number(price, { style: "currency", currency: "TRY", maximumFractionDigits: 0 }) : t("requestQuote");
  const monthlyLabel = formatPrice(plan.monthlyPrice);
  const yearlyLabel = formatPrice(plan.yearlyPrice);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/pricing"
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          {t("backToPlans")}
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(135deg,rgba(18,20,28,0.98),rgba(10,11,15,0.95)_45%,rgba(31,24,12,0.92))] p-8 text-white shadow-[0_30px_120px_rgba(0,0,0,0.42)] md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)] opacity-40" />
          <div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-amber-300/10" />
          <div className="pointer-events-none absolute right-16 top-16 h-24 w-24 rounded-full border border-white/10" />

          <div className="relative">
            <div className="inline-flex max-w-full flex-wrap items-center gap-2.5 rounded-full border border-amber-400/35 bg-amber-400/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300 shadow-[0_0_24px_rgba(212,168,67,0.12)] sm:text-xs sm:tracking-[0.28em]">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              {t("badge")}
            </div>
          <h1 className="mt-6 break-words text-3xl font-black sm:text-4xl md:text-6xl">{plan.name}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            {plan.description ?? t("defaultDescription", { name: plan.name })}
          </p>

          <div className="mt-6 inline-flex max-w-full flex-wrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300 sm:text-xs sm:tracking-[0.18em]">
            {t("planTagline", { name: plan.name })}
          </div>

          {plan.includesLiveClass ? (
            <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
              {t("liveIncludedNote")}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
              {t("liveOptionalNote")}
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{t("monthly")}</p>
              <p className="mt-3 text-3xl font-black text-white">{monthlyLabel}</p>
              <p className="mt-1 text-sm text-slate-400">{t("monthlySub")}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{t("yearly")}</p>
              <p className="mt-3 text-3xl font-black text-white">{yearlyLabel}</p>
              <p className="mt-1 text-sm text-slate-400">{t("yearlySub")}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{t("liveClass")}</p>
              <p className="mt-3 text-3xl font-black text-white">{plan.includesLiveClass ? t("liveHours") : t("optional")}</p>
              <p className="mt-1 text-sm text-slate-400">{plan.includesLiveClass ? t("liveIncludedSub") : t("liveOptionalSub")}</p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">{t("benefitsTitle")}</h2>
            <div className="mt-5 grid gap-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
              {features.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                  {t("noFeatures")}
                </div>
              ) : null}
            </div>
          </div>

          {bundledExams.length > 0 ? (
            <div className="mt-10 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
              <h2 className="text-xl font-bold text-white">{t("bundledExams")}</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {bundledExams.map((exam) => (
                  <div key={exam.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
                    <p className="font-semibold text-white">{exam.marketplaceTitle ?? exam.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-300">{exam.examType}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-white">{t("step1")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t("step1Text")}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-white">{t("step2")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t("step2Text")}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-white">{t("step3")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t("step3Text")}</p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t("securityTitle")}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{t("securityText")}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-200">{t("liveNoteTitle")}</p>
                  <p className="mt-2 text-sm leading-7 text-amber-100/85">{plan.includesLiveClass ? t("liveNoteIncluded") : t("liveNoteOptional")}</p>
                </div>
                <div className="w-fit rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
                  <CalendarDays size={18} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">{t("refundTitle")}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">{t("salesRecordTitle")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {t("salesRecordText")}
                </p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">{t("paymentSecurityTitle")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {t("paymentSecurityText")}
                </p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">{t("refundChangeTitle")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {t("refundChangeText")}
                </p>
              </div>
            </div>
          </div>
          </div>
        </section>

        <PlanDetailPurchase
          plan={{
            id: plan.id,
            slug: plan.slug,
            name: plan.name,
            monthlyPrice: plan.monthlyPrice,
            yearlyPrice: plan.yearlyPrice,
          }}
          initialCycle={initialCycle}
        />
      </div>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{t("reviewsBadge")}</p>
              <h2 className="mt-3 break-words text-3xl font-black text-white">{t("reviewsTitle")}</h2>
            </div>
            <div className="w-fit rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
              <Sparkles size={18} />
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {testimonials.map((item) => (
              <div key={item.name} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-base leading-7 text-slate-300">“{item.quote}”</p>
                <div className="mt-4">
                  <p className="text-sm font-bold text-white">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{t("faqBadge")}</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="break-words text-3xl font-black text-white">{t("faqTitle")}</h2>
            <Link href="/pricing" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white transition hover:bg-white/14">
              <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="mt-8 space-y-4">
            {faqs.map((item) => (
              <div key={item.question} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <h3 className="text-base font-bold text-white">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
