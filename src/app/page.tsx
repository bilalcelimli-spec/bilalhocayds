import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/src/components/common/button";
import { prisma } from "@/src/lib/prisma";
import { LiveClassSinglePurchase } from "@/src/components/payment/live-class-single-purchase";
import { LeadCaptureSection } from "@/src/components/home/lead-capture-section";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const featureCards = [
  {
    title: "AI Vocabulary Engine",
    text: "Her gün seviyene göre seçilen kelime kartları ve tekrar sistemi.",
  },
  {
    title: "AI Reading Practice",
    text: "Günlük metin, kelime analizi ve anlama odaklı çalışma.",
  },
  {
    title: "AI Grammar Trainer",
    text: "Zayıf olduğun konulara göre akıllı grammar çalışma akışı.",
  },
  {
    title: "Canlı Dersler",
    text: "Bilal Hoca ile haftalık canlı ders, strateji ve soru çözümü.",
  },
];

const systemCards = [
  "Seviyeni ve hedef puanını belirle",
  "AI günlük çalışma planını oluştursun",
  "Vocabulary, reading ve grammar görevlerini tamamla",
  "Canlı derslerle öğrenme sürecini güçlendir",
];

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

function reorderPopularToMiddle<T extends { slug: string }>(items: T[]): T[] {
  if (items.length !== 3) return items;
  const idx = items.findIndex((p) => p.slug === "premium");
  if (idx === 1 || idx === -1) return items;
  const reordered = [...items];
  const [popular] = reordered.splice(idx, 1);
  reordered.splice(1, 0, popular);
  return reordered;
}

export default async function HomePage() {
  const rawPlans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { monthlyPrice: "asc" },
    take: 3,
    select: {
      id: true,
      name: true,
      slug: true,
      monthlyPrice: true,
      includesLiveClass: true,
      includesAIPlanner: true,
      includesReading: true,
      includesGrammar: true,
      includesVocab: true,
    },
  });

  const plans = reorderPopularToMiddle(rawPlans);
  const premiumPlan = plans.find((plan) => plan.slug === "premium") ?? plans[0] ?? null;
  const liveClassEnabledPlanCount = plans.filter((plan) => plan.includesLiveClass).length;

  const nextLiveClass = await prisma.liveClass.findFirst({
    where: {
      scheduledAt: { gt: new Date() },
      singlePrice: { gt: 0 },
    },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      topicOutline: true,
      scheduledAt: true,
      durationMinutes: true,
      singlePrice: true,
    },
  });

  return (
    <div>
      <section className="relative overflow-hidden px-6 pt-16 md:pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-24 h-56 w-56 rounded-full bg-amber-400/12 blur-3xl" />
          <div className="absolute right-[10%] top-16 h-72 w-72 rounded-full bg-white/6 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(135deg,rgba(18,20,28,0.98),rgba(10,11,15,0.95)_45%,rgba(31,24,12,0.92))] px-6 py-10 shadow-[0_30px_120px_rgba(0,0,0,0.45)] md:px-10 md:py-14 xl:px-14 xl:py-16">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)] opacity-40" />
            <div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-amber-300/10" />
            <div className="pointer-events-none absolute right-16 top-16 h-24 w-24 rounded-full border border-white/10" />

            <div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_380px] xl:items-center">
              <div>
                <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/35 bg-amber-400/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300 shadow-[0_0_24px_rgba(212,168,67,0.12)]">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Premium YDS Hazırlık Deneyimi
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">AI Planlama</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Haftada 4 Saat Canlı Ders</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Bilal Hoca Rehberliği</span>
                </div>

                <h1 className="mt-8 max-w-5xl text-5xl font-black leading-[0.95] text-white md:text-7xl xl:text-[7.1rem]">
                  <span className="block text-white/96">Bilal Hoca ile</span>
                  <span className="mt-2 block bg-gradient-to-r from-[#fff2b8] via-[#f7d96b] to-[#d4a843] bg-clip-text text-transparent">
                    Güçlü Bir
                  </span>
                  <span className="mt-2 block text-white">YDS/YDT Hazırlığı</span>
                </h1>

                <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300 md:text-xl md:leading-9">
                  Yapay zeka destekli kişisel çalışma planı, güçlü içerik akışı ve Zoom canlı derslerle hazırlığını daha kontrollü ve daha yüksek standartta yönet.
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <Button href="/register" size="lg" className="min-w-[180px] rounded-2xl bg-gradient-to-r from-[#fff4c2] via-[#f1d56d] to-[#d4a843] text-zinc-950 shadow-[0_20px_50px_rgba(212,168,67,0.28)] hover:brightness-105">
                    Hemen Başla
                  </Button>
                  <Button href="/pricing" variant="secondary" size="lg" className="min-w-[200px] rounded-2xl border-white/20 bg-white/6 backdrop-blur-sm hover:bg-white/10">
                    Üyelik Planlarını Aç
                  </Button>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Başlangıç</p>
                    <p className="mt-3 text-2xl font-black text-white">
                      {premiumPlan ? formatPrice(premiumPlan.monthlyPrice) : "Teklif al"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">Yüksek standartta tasarlanan planlar</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Canlı Ders</p>
                    <p className="mt-3 text-2xl font-black text-white">4 Saat / Hafta</p>
                    <p className="mt-1 text-sm text-slate-400">Ritmi koruyan düzenli Zoom programı</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Esneklik</p>
                    <p className="mt-3 text-2xl font-black text-white">Tek Ders</p>
                    <p className="mt-1 text-sm text-slate-400">Üyelik dışında da satın alma açık</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-full bg-amber-400/10 blur-2xl xl:block" />
                <div className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <div className="rounded-[26px] border border-white/10 bg-[#0d1017]/90 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">Private Academic System</p>
                        <h2 className="mt-3 text-2xl font-black text-white">Sınava hazırlanırken kalite standardını yükselt</h2>
                      </div>
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-300">
                        <Sparkles size={18} />
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
                            <ShieldCheck size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">Kişisel çalışma omurgası</p>
                            <p className="mt-1 text-xs leading-6 text-slate-400">AI destekli günlük akış, görev önceliği ve ilerleme düzeni.</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-sky-500/10 p-2 text-sky-300">
                            <Clock3 size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">Haftalık yüksek temas</p>
                            <p className="mt-1 text-xs leading-6 text-slate-400">{liveClassEnabledPlanCount} plan içinde haftada 4 saat canlı ders erişimi sunuluyor.</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-400/18 bg-[linear-gradient(135deg,rgba(212,168,67,0.14),rgba(255,255,255,0.03))] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">Sıradaki Oturum</p>
                            <p className="mt-2 text-base font-bold text-white">
                              {nextLiveClass ? nextLiveClass.title : "Yeni premium oturum planlanıyor"}
                            </p>
                            <p className="mt-1 text-xs leading-6 text-amber-100/80">
                              {nextLiveClass
                                ? `${format(nextLiveClass.scheduledAt, "d MMMM yyyy · HH:mm", { locale: tr })} · ${nextLiveClass.durationMinutes} dk`
                                : "Takvim çok yakında güncellenecek."}
                            </p>
                          </div>
                          <Link href="/live-classes" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white transition hover:bg-white/14">
                            <ArrowUpRight size={18} />
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Canlı Takvim</p>
                        <p className="mt-1 text-sm font-semibold text-white">Tek ders satışına da açık premium program</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <CalendarDays size={14} className="text-amber-300" />
                        Esnek katılım
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 pb-12 pt-2 md:pt-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 h-px w-24 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <h2 className="text-4xl font-black text-white md:text-5xl">Sana uygun planı seç</h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Her seviyeye uygun esnek üyelik yapısı ve hızlı ödeme akışı.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const features = [
              plan.includesVocab && "Günlük vocabulary",
              plan.includesReading && "Reading modülü",
              plan.includesGrammar && "Grammar modülü",
              plan.includesAIPlanner && "AI çalışma planı",
              plan.includesLiveClass && "Haftada 4 saat canlı ders erişimi",
            ].filter((item): item is string => Boolean(item));

            const isHighlighted = plan.slug === "premium";

            return (
              <div
                key={plan.id}
                className={`rounded-[28px] p-8 backdrop-blur-xl ${
                  isHighlighted
                    ? "border-2 border-amber-400/70 bg-gradient-to-b from-amber-400/8 to-zinc-900/60 shadow-[0_20px_60px_rgba(212,168,67,0.18)]"
                    : "border border-white/8 bg-zinc-900/50 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
                }`}
              >
                {isHighlighted && (
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
                    ★ Popüler
                  </div>
                )}
                <h2 className={`text-2xl font-bold ${ isHighlighted ? "text-amber-100" : "text-white" }`}>{plan.name}</h2>
                <p className={`mt-4 text-4xl font-black ${ isHighlighted ? "text-amber-300" : "text-white" }`}>
                  {formatPrice(plan.monthlyPrice)}
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className={isHighlighted ? "text-amber-400" : "text-zinc-500"}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-5 text-zinc-500">
                  Tek tek canlı ders satın alma seçeneği de ayrıca açıktır.
                </p>
                <div className="mt-8">
                  <Button href="/pricing" className="w-full">
                    Bu Planla Başla
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/pricing" className="text-sm font-semibold text-zinc-300 hover:text-white">
            Tüm plan detaylarını gör
          </Link>
        </div>
      </section>

      {/* Yaklaşan Canlı Ders — Tek Ders Satın Alım */}
      {nextLiveClass ? (
        <section className="mx-auto max-w-7xl px-6 pb-4 pt-10">
          <div className="rounded-[32px] border-2 border-amber-400/40 bg-gradient-to-br from-amber-400/8 via-zinc-900/70 to-zinc-900/50 p-8 shadow-[0_24px_80px_rgba(212,168,67,0.14)] backdrop-blur-xl md:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                  Yaklaşan Canlı Ders
                </div>
                <h2 className="mt-4 text-3xl font-black text-white md:text-4xl">
                  {nextLiveClass.title}
                </h2>
                <p className="mt-2 text-lg font-medium text-amber-300">
                  {format(nextLiveClass.scheduledAt, "d MMMM EEEE · HH:mm", { locale: tr })} · {nextLiveClass.durationMinutes} dk
                </p>
                {nextLiveClass.description ? (
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">{nextLiveClass.description}</p>
                ) : null}
                {nextLiveClass.topicOutline ? (
                  <p className="mt-2 text-sm text-zinc-400">
                    <span className="font-medium text-zinc-300">Konular:</span> {nextLiveClass.topicOutline}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                    <span className="text-amber-400">✓</span> Canlı soru-cevap
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                    <span className="text-amber-400">✓</span> Ders kaydı erişimi
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                    <span className="text-amber-400">✓</span> E-posta ile ders linki
                  </div>
                </div>
              </div>
              <div className="w-full shrink-0 lg:w-96">
                <LiveClassSinglePurchase
                  liveClassId={nextLiveClass.id}
                  title={nextLiveClass.title}
                  description={nextLiveClass.description}
                  topicOutline={nextLiveClass.topicOutline}
                  scheduledAt={nextLiveClass.scheduledAt}
                  durationMinutes={nextLiveClass.durationMinutes}
                  singlePrice={nextLiveClass.singlePrice}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 h-px w-24 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <h2 className="text-3xl font-black text-white md:text-5xl">Platformun ana yapı taşları</h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Öğrenciyi her gün sistemde aktif tutan AI destekli öğrenme deneyimi.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((item) => (
            <div key={item.title} className="group rounded-[28px] border border-white/20 bg-white/8 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="mb-4 h-0.5 w-10 rounded-full bg-amber-400/50 transition-all group-hover:w-16 group-hover:bg-amber-400/80" />
              <h3 className="text-xl font-bold text-white">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="system" className="mx-auto max-w-7xl px-6 pb-20 pt-4">
        <div className="grid gap-10 md:grid-cols-2 md:items-stretch">
          <div className="flex flex-col rounded-[32px] border border-amber-400/25 bg-gradient-to-br from-amber-400/8 via-zinc-900/60 to-zinc-900/40 p-8 shadow-[0_20px_60px_rgba(212,168,67,0.10)] backdrop-blur-xl">
            <div className="mb-5 h-px w-16 rounded-full bg-gradient-to-r from-amber-400/80 to-transparent" />
            <h2 className="text-3xl font-black text-white md:text-4xl">Öğrenciyi her gün sistemde tutan akış</h2>
            <div className="mt-8 flex flex-col gap-4">
              {systemCards.map((item, index) => (
                <div key={item} className="flex items-start gap-4 rounded-2xl border border-white/8 bg-zinc-900/50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-sm font-black text-zinc-900">
                    {index + 1}
                  </div>
                  <p className="pt-2 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col rounded-[32px] border border-amber-400/25 bg-gradient-to-br from-amber-400/8 via-zinc-900/60 to-zinc-900/40 p-8 shadow-[0_20px_60px_rgba(212,168,67,0.10)] backdrop-blur-xl">
            <div className="mb-5 h-px w-16 rounded-full bg-gradient-to-r from-amber-400/80 to-transparent" />
            <h3 className="text-2xl font-black text-white">Bilal Hoca + AI modeli</h3>
            <p className="mt-4 leading-8 text-slate-400">
              Otomatik içerik, canlı ders stratejisi ve ölçülebilir takip tek merkezde.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 p-4">
                <span className="mt-0.5 text-amber-400">◆</span>
                <div>
                  <p className="font-semibold text-white">Kişiselleştirilmiş plan</p>
                  <p className="mt-1 text-sm text-slate-400">AI her gün seviyene ve eksiklerine göre çalışma içeriği oluşturur.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 p-4">
                <span className="mt-0.5 text-amber-400">◆</span>
                <div>
                  <p className="font-semibold text-white">Anlık ilerleme takibi</p>
                  <p className="mt-1 text-sm text-slate-400">Tamamlanan görevler, zayıf konular ve gelişim grafiği panelden izlenir.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 p-4">
                <span className="mt-0.5 text-amber-400">◆</span>
                <div>
                  <p className="font-semibold text-white">Canlı ders entegrasyonu</p>
                  <p className="mt-1 text-sm text-slate-400">Bilal Hoca&apos;nın haftalık canlı dersleri AI planıyla koordineli ilerler.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LeadCaptureSection />

    </div>
  );
}
