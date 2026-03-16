import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Flame,
  GraduationCap,
  Languages,
  Target,
  Video,
  Zap,
} from "lucide-react";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";

const studentNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Vocabulary", href: "/vocabulary" },
  { label: "Reading", href: "/reading" },
  { label: "Grammar", href: "/grammar" },
  { label: "Canlı Dersler", href: "/live-classes" },
  { label: "Fiyatlandırma", href: "/pricing" },
];

const todayTasks = [
  { id: 1, label: "20 kelime kartını tamamla", module: "Vocabulary", done: false },
  { id: 2, label: "1 reading metnini oku ve soruları çöz", module: "Reading", done: false },
  { id: 3, label: "Relative Clauses konusunu tekrar et", module: "Grammar", done: false },
  { id: 4, label: "10 soruluk mini practice yap", module: "Mixed", done: false },
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

  return (
    <DashboardShell
      navItems={studentNavItems}
      roleLabel="Öğrenci Paneli"
      title={`${greeting}, ${session.user.name ?? "Öğrenci"} 👋`}
      subtitle="Bugünkü çalışma planın hazır. Hedefini yakala!"
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Bugünkü Kelimeler", value: "20", Icon: Languages, color: "text-blue-400" },
          { label: "Reading Görevi", value: "1", Icon: BookOpen, color: "text-indigo-400" },
          { label: "Grammar Alıştırması", value: "1", Icon: GraduationCap, color: "text-violet-400" },
          { label: "Günlük Seri", value: "7 gün", Icon: Flame, color: "text-orange-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                {s.label}
              </p>
              <s.Icon size={16} className={s.color} />
            </div>
            <p className="mt-3 text-3xl font-black text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Middle section */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Today's tasks */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Bugünkü Görevler</h2>
              <p className="mt-0.5 text-xs text-zinc-400">4 görev · Tahmini 90 dk</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-1.5">
              <Flame size={13} className="text-orange-400" />
              <span className="text-xs font-semibold text-orange-300">7 günlük seri</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3.5"
              >
                {task.done ? (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                ) : (
                  <Circle size={18} className="shrink-0 text-zinc-600" />
                )}
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">
                  {task.label}
                </p>
                <span className="shrink-0 rounded-lg bg-white/8 px-2 py-1 text-xs text-zinc-400">
                  {task.module}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance & next class */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
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

          {/* Next live class */}
          <div className="rounded-2xl border border-teal-500/20 bg-teal-500/8 p-5">
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
          {moduleCards.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/8"
            >
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

      {/* AI Feature banner */}
      <div className="rounded-2xl border border-fuchsia-500/20 bg-gradient-to-r from-fuchsia-900/25 via-indigo-900/15 to-cyan-900/15 p-5 sm:p-6">
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

