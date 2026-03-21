import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  Flame,
  GraduationCap,
  Languages,
  Video,
  Zap,
} from "lucide-react";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";

const studentNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Siparişlerim", href: "/dashboard/orders" },
  { label: "Canlı Ders Kayıtları", href: "/dashboard/live-recordings" },
  { label: "Paylaşılan İçerikler", href: "/dashboard/content-library" },
  { label: "Vocabulary", href: "/vocabulary" },
  { label: "Reading", href: "/reading" },
  { label: "Grammar", href: "/grammar" },
  { label: "Sınav", href: "/exam" },
  { label: "Canlı Dersler", href: "/live-classes" },
  { label: "Fiyatlandırma", href: "/pricing" },
];

const todayTasks = [
  { id: 1, label: "20 kelime kartını tamamla", module: "Vocabulary", done: false },
  { id: 2, label: "1 reading metnini oku ve soruları çöz", module: "Reading", done: false },
  { id: 3, label: "Relative Clauses konusunu tekrar et", module: "Grammar", done: false },
  { id: 4, label: "1 süreli mini deneme çöz", module: "Exam", done: false },
];

const moduleCards = [
  {
    title: "Vocabulary",
    desc: "Bugün 20 akademik kelime seni bekliyor",
    href: "/vocabulary",
    Icon: Languages,
    gradient: "from-blue-600 to-blue-700",
    stat: "20 kart",
  },
  {
    title: "Reading",
    desc: "Günlük AI makale ve comprehension seti",
    href: "/reading",
    Icon: BookOpen,
    gradient: "from-indigo-600 to-indigo-700",
    stat: "1 metin",
  },
  {
    title: "Grammar",
    desc: "Zayıf noktalara odaklı AI alıştırması",
    href: "/grammar",
    Icon: GraduationCap,
    gradient: "from-violet-600 to-violet-700",
    stat: "1 konu",
  },
  {
    title: "Sınav",
    desc: "API ile eklenen deneme sınavlarını süreli çöz",
    href: "/exam",
    Icon: FileText,
    gradient: "from-emerald-600 to-emerald-700",
    stat: "Deneme seti",
  },
  {
    title: "Canlı Ders",
    desc: "Haftalık Bilal Hoca canlı oturumu",
    href: "/live-classes",
    Icon: Video,
    gradient: "from-teal-600 to-teal-700",
    stat: "Cmt 20:00",
  },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role === "TEACHER") redirect("/teacher");

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Günaydın" : hour < 17 ? "İyi günler" : "İyi akşamlar";
  const hasBundledExamAccess = (session.user.accessibleExamIds?.length ?? 0) > 0;
  const hasAnyExamAccess = session.user.hasExamAccess || hasBundledExamAccess;

  return (
    <DashboardShell
      navItems={studentNavItems}
      roleLabel="Öğrenci Paneli"
      title={`${greeting}, ${session.user.name ?? "Öğrenci"} 👋`}
      subtitle="Bugünkü çalışma planın hazır. Hedefini yakala!"
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Bugünkü Kelimeler", value: "20", Icon: Languages, color: "text-blue-300", tone: "border-blue-500/20 bg-blue-500/8" },
          { label: "Reading Görevi", value: "1", Icon: BookOpen, color: "text-indigo-300", tone: "border-indigo-500/20 bg-indigo-500/8" },
          { label: "Grammar Alıştırması", value: "1", Icon: GraduationCap, color: "text-violet-300", tone: "border-violet-500/20 bg-violet-500/8" },
          { label: "Sınav Hedefi", value: hasAnyExamAccess ? hasBundledExamAccess && !session.user.hasExamAccess ? `${session.user.accessibleExamIds?.length ?? 0} set açık` : "Açık" : "Kilitli", Icon: FileText, color: "text-emerald-300", tone: "border-emerald-500/20 bg-emerald-500/8" },
        ].map((s) => (
          <div
            key={s.label}
            className={"rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl " + s.tone}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                {s.label}
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                <s.Icon size={16} className={s.color} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Bugünkü Görevler</h2>
              <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-zinc-500">4 görev · Tahmini 90 dk</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-3 py-2">
              <Flame size={13} className="text-orange-400" />
              <span className="text-xs font-semibold text-orange-300">7 günlük seri</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4"
              >
                {task.done ? (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                ) : (
                  <Circle size={18} className="shrink-0 text-zinc-600" />
                )}
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">
                  {task.label}
                </p>
                <span className="shrink-0 rounded-xl border border-white/8 bg-black/20 px-2.5 py-1.5 text-xs text-zinc-400">
                  {task.module}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <h2 className="mb-5 text-lg font-bold text-white">Performans</h2>
            <div className="space-y-4">
              {[
                { label: "Kelime Doğruluğu", val: 78, color: "bg-blue-500" },
                { label: "Grammar Doğruluğu", val: 69, color: "bg-violet-500" },
                { label: "Reading Tamamlama", val: 74, color: "bg-indigo-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-zinc-400">{item.label}</span>
                    <span className="font-semibold text-white">%{item.val}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all`}
                      style={{ width: `${item.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-teal-500/20 bg-teal-500/8 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <div className="mb-2 flex items-center gap-2">
              <Video size={14} className="text-teal-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">
                Sonraki Canlı Ders
              </p>
            </div>
            <p className="text-xl font-black text-white">Cumartesi 20:00</p>
            <p className="mt-1 text-xs text-zinc-400">YDS Reading Stratejisi</p>
            <Link
              href="/live-classes"
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition"
            >
              Detayları gör <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Module quick access */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-white">Modüllere Git</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {moduleCards
            .filter((m) => m.href !== "/exam" || hasAnyExamAccess)
            .map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition-all hover:-translate-y-0.5 hover:border-white/20"
            >
              <div className="pointer-events-none absolute -right-8 top-4 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${m.gradient}`}
              >
                <m.Icon size={18} className="text-white" />
              </div>
              <h3 className="font-bold text-white">{m.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{m.desc}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">{m.stat}</span>
                <ArrowRight
                  size={14}
                  className="text-zinc-500 transition-transform group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {!hasAnyExamAccess ? (
        <div className="rounded-[30px] border border-emerald-500/20 bg-gradient-to-r from-emerald-900/25 via-teal-900/15 to-cyan-900/15 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15">
                <FileText size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  Yeni Modül
                </p>
                <h3 className="mt-1 text-base font-black text-white">
                  Sınav modülü ayrı olarak da açılabiliyor
                </h3>
                <p className="mt-1 text-sm text-zinc-300">
                  Süreli deneme akışı ve admin tarafından eklenen sınav setleri için erişimi paketine ekleyebilir veya ayrı ürün olarak satın alabilirsin.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Sınav erişimini aç
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : null}

      <div className="rounded-[30px] border border-fuchsia-500/20 bg-gradient-to-r from-fuchsia-900/25 via-indigo-900/15 to-cyan-900/15 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/15">
              <Zap size={18} className="text-fuchsia-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-300">
                AI Feature
              </p>
              <h3 className="mt-1 text-base font-black text-white">
                Interactive Article Reader aktif
              </h3>
              <p className="mt-1 text-sm text-zinc-300">
                Metin üzerinde tıklanabilir kelime analizi, boşluk doldurma ve not paneli.
              </p>
            </div>
          </div>
          <Link
            href="/reading"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Reader&apos;ı Aç
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}

