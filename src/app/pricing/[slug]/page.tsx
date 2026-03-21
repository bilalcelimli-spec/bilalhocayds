import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";

import { prisma } from "@/src/lib/prisma";
import PlanDetailPurchase from "@/src/components/payment/plan-detail-purchase";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ cycle?: string }>;
};

const testimonials = [
  {
    name: "Zeynep A.",
    role: "YÖKDİL öğrencisi",
    quote:
      "Plan yapısının net olması sayesinde ne çalışacağımı her gün düşünmek zorunda kalmadım. Düzenim oturdu.",
  },
  {
    name: "Mert K.",
    role: "YDS hazırlık süreci",
    quote:
      "Reading ve vocabulary tarafı birlikte ilerlediği için skor artışını daha ölçülebilir gördüm.",
  },
  {
    name: "Elif T.",
    role: "Akademik sınav hazırlığı",
    quote:
      "Canlı ders ve AI çalışma planı birleşince takibim güçlendi. Özellikle plan detay sayfası karar vermemi kolaylaştırdı.",
  },
];

const faqs = [
  {
    question: "Planı satın aldıktan sonra erişim ne zaman başlar?",
    answer:
      "Ödeme ve satış kaydı sisteme düştükten sonra erişim hesabına tanımlanır. Aktifleşme süreci satış ekibi kontrolüyle kısa sürede tamamlanır.",
  },
  {
    question: "Aylık ve yıllık paket arasında geçiş yapabilir miyim?",
    answer:
      "Evet. İhtiyacına göre daha sonra üst pakete veya farklı ödeme döngüsüne geçiş planlanabilir. Bu değişiklik muhasebe ve abonelik modülü üzerinden takip edilir.",
  },
  {
    question: "Plan içeriği değişirse mevcut aboneliğim etkilenir mi?",
    answer:
      "Admin panelde yapılan plan güncellemeleri yeni satış akışına yansır. Mevcut abonelikler için geçiş kararı ayrıca yönetilebilir.",
  },
  {
    question: "Ödeme sonrası destek alabilecek miyim?",
    answer:
      "Evet. Planın kapsamına göre canlı ders, AI planlama ve içerik takibi için destek akışı devam eder.",
  },
  {
    question: "Canlı dersler haftada ne kadar sürüyor ve tek ders satın alabiliyor muyum?",
    answer:
      "Canlı ders içeren paketlerde program haftada toplam 4 saat olacak şekilde planlanır. Ayrıca paket dışında tek tek canlı ders satın alma seçeneği de açıktır.",
  },
];

export default async function PricingDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialCycle = resolvedSearchParams?.cycle === "yearly" ? "YEARLY" : "MONTHLY";

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
    },
  });

  if (!plan) {
    notFound();
  }

  const features = [
    plan.includesVocab && "Kelime modülü ile günlük tekrar akışı",
    plan.includesReading && "Reading modülü ile metin ve analiz çalışması",
    plan.includesGrammar && "Grammar modülü ile konu ve soru takibi",
    plan.includesAIPlanner && "AI çalışma planı ile günlük yönlendirme",
    plan.includesExam && "Sınav modülü ile süreli deneme ve cevap anahtarı erişimi",
    plan.includesLiveClass && "Haftada 4 saat canlı ders erişimi ve soru çözüm desteği",
  ].filter((item): item is string => Boolean(item));

  const planLabel = plan.name.toLowerCase();
  const monthlyLabel = plan.monthlyPrice
    ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(plan.monthlyPrice)
    : "Teklif al";
  const yearlyLabel = plan.yearlyPrice
    ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(plan.yearlyPrice)
    : "Teklif al";

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/pricing"
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Planlara geri dön
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
              Plan Detayı
            </div>
          <h1 className="mt-6 break-words text-3xl font-black sm:text-4xl md:text-6xl">{plan.name}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            {plan.description ?? `${plan.name} paketi ile sınav hazırlığını daha düzenli ve ölçülebilir hale getir.`}
          </p>

          <div className="mt-6 inline-flex max-w-full flex-wrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300 sm:text-xs sm:tracking-[0.18em]">
            {planLabel} paketi için detaylı satış ve bilgilendirme ekranı
          </div>

          {plan.includesLiveClass ? (
            <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
              Bu pakette haftada 4 saat canlı ders erişimi bulunur. Paket dışında da tek tek canlı ders satın alma seçeneği açıktır.
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
              Canlı dersleri bu paket dışında tek tek satın alma modeliyle de alabilirsin.
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Aylık</p>
              <p className="mt-3 text-3xl font-black text-white">{monthlyLabel}</p>
              <p className="mt-1 text-sm text-slate-400">Esnek başlangıç ritmi</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Yıllık</p>
              <p className="mt-3 text-3xl font-black text-white">{yearlyLabel}</p>
              <p className="mt-1 text-sm text-slate-400">Daha kararlı çalışma akışı</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Canlı Ders</p>
              <p className="mt-3 text-3xl font-black text-white">{plan.includesLiveClass ? "4 Saat" : "Opsiyonel"}</p>
              <p className="mt-1 text-sm text-slate-400">{plan.includesLiveClass ? "Haftalık Zoom programı dahil" : "Tek ders satın alma açık"}</p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">Bu planla neler kazanırsın?</h2>
            <div className="mt-5 grid gap-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
              {features.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                  Bu plan için içerik detayları henüz güncellenmemiş.
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-white">1. Adım</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Planı incele ve çalışma yoğunluğuna göre ödeme tipini seç.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-white">2. Adım</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Bilgilerini gönder, satış akışını aynı panelden başlat.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-white">3. Adım</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Ödeme ve erişim tanımı tek akış içinde tamamlanır.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Satış güvenliği</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">Tutar bilgisi istemciden değil doğrudan plan kaydından alınır. Satış, lead ve abonelik kaydı aynı zincirde ilerler.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-200">Canlı ders notu</p>
                  <p className="mt-2 text-sm leading-7 text-amber-100/85">{plan.includesLiveClass ? "Bu planda haftada 4 saat canlı ders programı ve soru çözüm desteği yer alır." : "Canlı dersleri istersen bu plan dışında tek tek satın alarak ekleyebilirsin."}</p>
                </div>
                <div className="w-fit rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
                  <CalendarDays size={18} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Ödeme ve İade Bilgilendirmesi</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Satış kaydı</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Bu sayfadan başlatılan her işlem satış, lead ve abonelik tarafına birlikte düşer.
                </p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Ödeme güvenliği</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Tutar bilgisi istemciden değil, doğrudan sunucudaki plan kaydından alınır.
                </p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">İade ve değişiklik</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Paket değişikliği ve özel durumlar satış ve muhasebe akışı üzerinden değerlendirilir.
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
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Öğrenci Yorumları</p>
              <h2 className="mt-3 break-words text-3xl font-black text-white">Bu planı neden tercih ediyorlar?</h2>
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
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Sık Sorulan Sorular</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="break-words text-3xl font-black text-white">Karar vermeden önce en çok sorulanlar</h2>
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
