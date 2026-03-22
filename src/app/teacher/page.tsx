import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  Languages,
  PlusCircle,
  Users,
  Video,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { buildZoomDesktopLink, getMeetingPlatformLabel } from "@/src/lib/meeting-platform";
import { prisma } from "@/src/lib/prisma";

const teacherNavItems = [
  { label: "Dashboard", href: "/teacher" },
  { label: "Paylaşılan İçerikler", href: "/dashboard/content-library" },
  { label: "Reading Modülü", href: "/reading" },
  { label: "Grammar Modülü", href: "/grammar" },
  { label: "Vocabulary Modülü", href: "/vocabulary" },
  { label: "Sınav Modülü", href: "/exam" },
  { label: "Canlı Dersler", href: "/live-classes" },
  { label: "Admin Paneli", href: "/admin" },
];

export default async function TeacherPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role !== "TEACHER") redirect("/dashboard");

  const now = new Date();

  const [
    totalStudents,
    activeReadings,
    activeGrammarTopics,
    upcomingClassCount,
    nextClass,
    recentReadings,
    recentGrammar,
    assignedReviewBookings,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.reading.count({ where: { isActive: true } }),
    prisma.grammarTopic.count({ where: { isActive: true } }),
    prisma.liveClass.count({ where: { scheduledAt: { gte: now } } }),
    prisma.liveClass.findFirst({
      where: { scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
      select: {
        title: true,
        scheduledAt: true,
        durationMinutes: true,
        meetingLink: true,
      },
    }),
    prisma.reading.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        sourceName: true,
        difficultyLevel: true,
      },
    }),
    prisma.grammarTopic.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
      },
    }),
    prisma.examReviewBooking.findMany({
      where: {
        teacherId: session.user.id,
        status: { in: ["PAID", "SCHEDULED", "COMPLETED"] },
      },
      orderBy: [{ scheduledStartAt: "asc" }, { createdAt: "desc" }],
      take: 5,
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
        attempt: {
          select: {
            incorrectCount: true,
            blankCount: true,
          },
        },
        examModule: {
          select: {
            title: true,
          },
        },
      },
    }),
  ]);
  const zoomDesktopLink = buildZoomDesktopLink(nextClass?.meetingLink);

  return (
    <DashboardShell
      navItems={teacherNavItems}
      roleLabel="Öğretmen Paneli"
      title={`Hoş geldin, ${session.user.name ?? "Öğretmen"} 👨‍🏫`}
      subtitle="İçerik yönetimi, canlı ders takibi ve öğrenci etkileşimi."
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Toplam Öğrenci", value: totalStudents, Icon: Users, color: "text-emerald-400" },
          { label: "Aktif Reading", value: activeReadings, Icon: BookOpen, color: "text-blue-400" },
          { label: "Aktif Grammar", value: activeGrammarTopics, Icon: GraduationCap, color: "text-violet-400" },
          { label: "Yaklaşan Canlı Ders", value: upcomingClassCount, Icon: Video, color: "text-teal-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
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

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.22)] lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Reading İçerikleri</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                {activeReadings} aktif içerik
              </p>
            </div>
            <Link
              href="/admin/readings"
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              Tümünü Yönet
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentReadings.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3"
              >
                <BookOpen size={15} className="shrink-0 text-blue-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {r.title}
                  </p>
                  {r.sourceName && (
                    <p className="truncate text-xs text-zinc-500">{r.sourceName}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-lg bg-blue-500/15 px-2 py-1 text-xs text-blue-300">
                  {r.difficultyLevel ?? "—"}
                </span>
              </div>
            ))}
            {recentReadings.length === 0 && (
              <p className="py-4 text-center text-sm text-zinc-500">
                Henüz reading içeriği eklenmemiş.
              </p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="rounded-[30px] border border-teal-500/20 bg-teal-500/8 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="mb-3 flex items-center gap-2">
              <Video size={14} className="text-teal-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">
                Sonraki Canlı Ders
              </p>
            </div>
            {nextClass ? (
              <>
                <p className="text-lg font-black text-white">{nextClass.title}</p>
                <p className="mt-1.5 text-sm text-zinc-300">
                  {format(nextClass.scheduledAt, "d MMMM yyyy · HH:mm", {
                    locale: tr,
                  })}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {nextClass.durationMinutes} dakika
                </p>
                {nextClass.meetingLink && (
                  <p className="mt-1 text-xs text-zinc-400">
                    Platform: {getMeetingPlatformLabel(nextClass.meetingLink)}
                  </p>
                )}
                {nextClass.meetingLink && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {zoomDesktopLink ? (
                      <a
                        href={zoomDesktopLink}
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        Zoom&apos;da Aç
                        <ArrowRight size={14} />
                      </a>
                    ) : null}
                    <Link
                      href={nextClass.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500"
                    >
                      Derse Katıl
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-400">Yaklaşan ders planlanmamış.</p>
            )}
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Grammar Konuları</h3>
              <Link
                href="/admin/grammar"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition"
              >
                Yönet
              </Link>
            </div>
            <div className="space-y-2">
              {recentGrammar.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center gap-2.5 rounded-xl border border-white/8 px-3 py-2.5"
                >
                  <GraduationCap size={14} className="shrink-0 text-violet-400" />
                  <p className="truncate text-sm text-zinc-300">{g.title}</p>
                </div>
              ))}
              {recentGrammar.length === 0 && (
                <p className="text-xs text-zinc-500">Henüz grammar konusu yok.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.22)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Exam Review Bookings</h2>
            <p className="mt-0.5 text-xs text-zinc-400">Atanmış birebir review oturumları</p>
          </div>
          <Link href="/admin/exams" className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white">
            Workspace Aç
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="space-y-3">
          {assignedReviewBookings.length ? assignedReviewBookings.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
              <p className="font-semibold text-white">{booking.student.name ?? booking.student.email} · {booking.examModule.title}</p>
              <p className="mt-1 text-xs text-zinc-500">Status: {booking.status}</p>
              <p className="mt-1 text-xs text-zinc-500">Odak soru seti: {(booking.attempt.incorrectCount ?? 0) + (booking.attempt.blankCount ?? 0)}</p>
              <p className="mt-1 text-xs text-zinc-400">{booking.scheduledStartAt ? format(booking.scheduledStartAt, "d MMMM yyyy · HH:mm", { locale: tr }) : "Henüz slot atanmadı"}</p>
              <Link href={`/teacher/review-bookings/${booking.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200">
                Review workspace ac
                <ArrowRight size={12} />
              </Link>
            </div>
          )) : (
            <p className="py-4 text-center text-sm text-zinc-500">Sana atanmış review booking bulunmuyor.</p>
          )}
        </div>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-bold text-white">Hızlı Eylemler</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Reading Metni Yönet",
              href: "/admin/readings",
              Icon: BookOpen,
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
            },
            {
              title: "Grammar Konusu Ekle",
              href: "/admin/grammar",
              Icon: PlusCircle,
              color: "text-violet-400",
              bg: "bg-violet-500/10 border-violet-500/20",
            },
            {
              title: "Canlı Ders Planla",
              href: "/admin/live-classes",
              Icon: CalendarDays,
              color: "text-teal-400",
              bg: "bg-teal-500/10 border-teal-500/20",
            },
            {
              title: "Sınav Modülü",
              href: "/exam",
              Icon: FileText,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
            },
            {
              title: "Kelime Havuzu",
              href: "/admin/vocabulary",
              Icon: Languages,
              color: "text-indigo-400",
              bg: "bg-indigo-500/10 border-indigo-500/20",
            },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`group flex items-center gap-3 rounded-[24px] border px-4 py-3.5 shadow-[0_14px_40px_rgba(0,0,0,0.14)] transition-all hover:-translate-y-0.5 ${a.bg}`}
            >
              <a.Icon size={16} className={`shrink-0 ${a.color}`} />
              <span className="text-sm font-medium text-zinc-300 transition-colors group-hover:text-white">
                {a.title}
              </span>
              <ArrowRight
                size={13}
                className="ml-auto shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-400"
              />
            </Link>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

