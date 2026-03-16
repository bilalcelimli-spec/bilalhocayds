import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Film,
  PlayCircle,
  Video,
} from "lucide-react";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { prisma } from "@/src/lib/prisma";

const adminNavItems = [
  { label: "Admin Dashboard", href: "/admin" },
  { label: "Kullanıcılar", href: "/admin/users" },
  { label: "Reading Yönetimi", href: "/admin/readings" },
  { label: "Grammar Yönetimi", href: "/admin/grammar" },
  { label: "Vocabulary Yönetimi", href: "/admin/vocabulary" },
  { label: "Canlı Ders Yönetimi", href: "/admin/live-classes" },
  { label: "Canlı Ders Kayıtları", href: "/admin/live-recordings" },
  { label: "Plan Yönetimi", href: "/admin/plans" },
  { label: "CRM & Lead", href: "/admin/crm" },
  { label: "Muhasebe", href: "/admin/accounting" },
  { label: "Öğrenci Modülleri", href: "/dashboard" },
  { label: "Öğretmen Paneli", href: "/teacher" },
];

function platformOf(url: string | null) {
  if (!url) return "Belirsiz";
  const lower = url.toLowerCase();

  if (lower.includes("zoom")) return "Zoom";
  if (lower.includes("meet.google") || lower.includes("google")) return "Google Meet";

  return "Diğer";
}

async function assertAdmin() {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

async function updateRecordingAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const recordingUrl = String(formData.get("recordingUrl") ?? "").trim() || null;

  if (!id) {
    return;
  }

  await prisma.liveClass.update({
    where: { id },
    data: { recordingUrl },
  });

  revalidatePath("/admin/live-recordings");
  revalidatePath("/admin/live-classes");
  revalidatePath("/dashboard/live-recordings");
}

export default async function AdminLiveRecordingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();

  const classes = await prisma.liveClass.findMany({
    where: {
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "desc" },
    select: {
      id: true,
      title: true,
      scheduledAt: true,
      meetingLink: true,
      recordingUrl: true,
      durationMinutes: true,
      topicOutline: true,
    },
  });

  const withRecordings = classes.filter((item) => Boolean(item.recordingUrl));
  const pendingRecordings = classes.length - withRecordings.length;
  const zoomCount = withRecordings.filter((item) => platformOf(item.recordingUrl) === "Zoom").length;
  const meetCount = withRecordings.filter((item) => platformOf(item.recordingUrl) === "Google Meet").length;

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="Canlı Ders Kayıtları"
      subtitle="Zoom/Meet canlı ders arşivini tek panelden yönet."
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          Geri
        </Link>
        <Link
          href="/admin/live-classes"
          className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
        >
          Canlı Ders Planlama
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/8 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">Toplam Geçmiş Ders</p>
          <p className="mt-3 text-3xl font-black text-white">{classes.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Kayıt Girilmiş</p>
          <p className="mt-3 text-3xl font-black text-white">{withRecordings.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Kayıt Bekleyen</p>
          <p className="mt-3 text-3xl font-black text-white">{pendingRecordings}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Platform Dağılımı</p>
          <p className="mt-3 text-sm font-semibold text-white">Zoom {zoomCount} · Meet {meetCount}</p>
        </div>
      </div>

      <div className="space-y-3">
        {classes.map((item) => {
          const platform = platformOf(item.recordingUrl ?? item.meetingLink);

          return (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-white">{item.title}</h2>
                    <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-zinc-300">
                      {platform}
                    </span>
                    {item.recordingUrl ? (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
                        Yayında
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                        Link Bekleniyor
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={12} />
                      {format(item.scheduledAt, "d MMMM yyyy · HH:mm", { locale: tr })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Video size={12} />
                      {item.durationMinutes} dk
                    </span>
                    {item.meetingLink ? (
                      <Link
                        href={item.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200"
                      >
                        Orijinal toplantı
                        <ExternalLink size={11} />
                      </Link>
                    ) : null}
                  </div>

                  {item.topicOutline ? (
                    <p className="mt-2 text-xs text-zinc-500">Konu: {item.topicOutline}</p>
                  ) : null}

                  <form action={updateRecordingAction} className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      name="recordingUrl"
                      defaultValue={item.recordingUrl ?? ""}
                      placeholder="Zoom cloud recording veya Google Meet linki"
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
                    >
                      Kaydı Güncelle
                    </button>
                  </form>
                </div>

                {item.recordingUrl ? (
                  <Link
                    href={item.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-fit items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
                  >
                    İzleme Linki
                    <PlayCircle size={14} />
                  </Link>
                ) : (
                  <div className="inline-flex h-fit items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-400">
                    <Film size={14} />
                    Kayıt Linki Girilmedi
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {classes.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-400">
            Geçmiş canlı ders bulunamadı. Ders planları tamamlandıkça kayıt modülü burada dolacaktır.
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
