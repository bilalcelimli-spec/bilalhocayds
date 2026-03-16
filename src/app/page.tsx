import Link from "next/link";
import { Button } from "@/src/components/common/button";
import { prisma } from "@/src/lib/prisma";

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

export default async function HomePage() {
  const plans = await prisma.plan.findMany({
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

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-28 md:pt-32">
          <div className="flex flex-col items-center text-center">
            <div className="mt-12 inline-flex items-center gap-2.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-amber-300 shadow-[0_0_24px_rgba(212,168,67,0.12)]">
              <span className="h-2 w-2 rounded-full bg-amber-400 opacity-80" />
              AI DESTEKLİ ÖĞRENME PLATFORMU
            </div>

            <h1 className="mt-10 max-w-5xl text-6xl font-extrabold leading-tight text-white md:text-8xl">
              Bilal Hoca ile <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent">Yeni Nesil YDS / YDT Hazırlığı</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Yapay zeka destekli kişisel çalışma planı, günlük görevler ve canlı
              derslerle sınava daha akıllı hazırlan.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button href="/register">Hemen Başla</Button>
              <Button href="/pricing" variant="secondary" className="border-white/35">
                Üyelik Planlarını Aç
              </Button>
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
              plan.includesLiveClass && "Canlı ders erişimi",
            ].filter((item): item is string => Boolean(item));

            const isHighlighted = plan.slug === "pro";

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
                  {features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className={isHighlighted ? "text-amber-400" : "text-zinc-500"}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
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

    </div>
  );
}
