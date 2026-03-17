import Link from "next/link";
import { notFound } from "next/navigation";

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
    plan.includesLiveClass && "Haftada 4 saat canlı ders erişimi ve soru çözüm desteği",
  ].filter((item): item is string => Boolean(item));

  const planLabel = plan.name.toLowerCase();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/pricing"
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Planlara geri dön
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section className="rounded-[32px] bg-slate-950 p-8 text-white shadow-[0_25px_80px_rgba(15,23,42,0.22)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Plan Detayı</p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">{plan.name}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            {plan.description ?? `${plan.name} paketi ile sınav hazırlığını daha düzenli ve ölçülebilir hale getir.`}
          </p>

          <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
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

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Aylık fiyat</p>
              <p className="mt-2 text-3xl font-black">
                {plan.monthlyPrice
                  ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(plan.monthlyPrice)
                  : "Teklif al"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Yıllık fiyat</p>
              <p className="mt-2 text-3xl font-black">
                {plan.yearlyPrice
                  ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(plan.yearlyPrice)
                  : "Teklif al"}
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">Bu planla neler kazanırsın?</h2>
            <div className="mt-5 grid gap-3">
              {features.map((feature) => (
                <div key={feature} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
                  {feature}
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
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">1. Adım</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Planı incele ve sana uygun ödeme tipini seç.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">2. Adım</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Bilgilerini gönder ve satış sürecini başlat.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">3. Adım</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Ödeme ve abonelik kaydın aynı akış içinde işleme alınsın.</p>
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
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Öğrenci Yorumları</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">Bu planı neden tercih ediyorlar?</h2>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {testimonials.map((item) => (
              <div key={item.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-base leading-7 text-slate-700">“{item.quote}”</p>
                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-950">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Sık Sorulan Sorular</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">Karar vermeden önce en çok sorulanlar</h2>

          <div className="mt-8 space-y-4">
            {faqs.map((item) => (
              <div key={item.question} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-bold text-slate-950">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
