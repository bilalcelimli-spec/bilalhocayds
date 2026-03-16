import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, ExternalLink, Video } from "lucide-react";
import { format, isPast } from "date-fns";
import { tr } from "date-fns/locale";
import { revalidatePath } from "next/cache";

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
  { label: "Plan Yönetimi", href: "/admin/plans" },
  { label: "CRM & Lead", href: "/admin/crm" },
  { label: "Muhasebe", href: "/admin/accounting" },
  { label: "Öğrenci Modülleri", href: "/dashboard" },
  { label: "Öğretmen Paneli", href: "/teacher" },
];

async function assertAdmin() {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

async function createClassAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "");
  const durationMinutes = Number(formData.get("durationMinutes") ?? 60);
  const meetingLink = String(formData.get("meetingLink") ?? "").trim() || null;
  const recordingUrl = String(formData.get("recordingUrl") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const topicOutline = String(formData.get("topicOutline") ?? "").trim() || null;
  const singlePriceRaw = Number(formData.get("singlePrice") ?? 0);
  const singlePrice = Number.isFinite(singlePriceRaw) && singlePriceRaw > 0 ? singlePriceRaw : null;

  if (!title || !scheduledAtRaw || Number.isNaN(durationMinutes)) {
    return;
  }

  await prisma.liveClass.create({
    data: {
      title,
      scheduledAt: new Date(scheduledAtRaw),
      durationMinutes,
      meetingLink,
      recordingUrl,
      description,
      topicOutline,
      singlePrice,
    },
  });

  revalidatePath("/admin/live-classes");
  revalidatePath("/admin");
}

async function updateClassAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "");
  const durationMinutes = Number(formData.get("durationMinutes") ?? 60);
  const meetingLink = String(formData.get("meetingLink") ?? "").trim() || null;
  const recordingUrl = String(formData.get("recordingUrl") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const topicOutline = String(formData.get("topicOutline") ?? "").trim() || null;
  const singlePriceRaw = Number(formData.get("singlePrice") ?? 0);
  const singlePrice = Number.isFinite(singlePriceRaw) && singlePriceRaw > 0 ? singlePriceRaw : null;

  if (!id || !title || !scheduledAtRaw || Number.isNaN(durationMinutes)) {
    return;
  }

  await prisma.liveClass.update({
    where: { id },
    data: {
      title,
      scheduledAt: new Date(scheduledAtRaw),
      durationMinutes,
      meetingLink,
      recordingUrl,
      description,
      topicOutline,
      singlePrice,
    },
  });

  revalidatePath("/admin/live-classes");
  revalidatePath("/admin");
}

async function deleteClassAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  await prisma.liveClass.delete({ where: { id } });
  revalidatePath("/admin/live-classes");
  revalidatePath("/admin");
}

export default async function AdminLiveClassesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();

  const [classes, upcomingCount, pastCount] = await Promise.all([
    prisma.liveClass.findMany({
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.liveClass.count({ where: { scheduledAt: { gte: now } } }),
    prisma.liveClass.count({ where: { scheduledAt: { lt: now } } }),
  ]);

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="Canlı Ders Yönetimi"
      subtitle={`${classes.length} ders kayıtlı · ${upcomingCount} yaklaşan`}
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          Geri
        </Link>
        <div className="ml-auto flex gap-3">
          <div className="rounded-xl bg-teal-500/15 px-3 py-2 text-sm font-semibold text-teal-300">
            {upcomingCount} Yaklaşan
          </div>
          <div className="rounded-xl bg-zinc-500/15 px-3 py-2 text-sm font-semibold text-zinc-400">
            {pastCount} Geçmiş
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-bold text-white">Yeni Canlı Ders Ekle</h2>
        <form action={createClassAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input name="title" required placeholder="Ders başlığı" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input type="datetime-local" name="scheduledAt" required className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input type="number" name="durationMinutes" min={15} defaultValue={60} required className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="meetingLink" placeholder="Toplantı linki" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="recordingUrl" placeholder="Kayıt linki" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input type="number" step="0.01" min={0} name="singlePrice" placeholder="Tek ders satış fiyatı (TRY)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <textarea name="description" placeholder="Açıklama" rows={2} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <textarea name="topicOutline" placeholder="Konu başlıkları" rows={2} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <button type="submit" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">Ekle</button>
        </form>
      </div>

      {/* Class list */}
      <div className="space-y-3">
        {classes.map((c) => {
          const isUpcoming = !isPast(c.scheduledAt);
          return (
            <div
              key={c.id}
              className={`rounded-2xl border p-5 transition hover:bg-white/[0.03] ${
                isUpcoming
                  ? "border-teal-500/20 bg-teal-500/5"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isUpcoming ? "bg-teal-500/20" : "bg-white/10"
                    }`}
                  >
                    <Video
                      size={18}
                      className={isUpcoming ? "text-teal-400" : "text-zinc-500"}
                    />
                  </div>
                  <div>
                    <form action={updateClassAction} className="space-y-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input name="title" defaultValue={c.title} className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm font-bold text-white" />
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          type="datetime-local"
                          name="scheduledAt"
                          defaultValue={new Date(c.scheduledAt).toISOString().slice(0, 16)}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
                        />
                        <input
                          type="number"
                          name="durationMinutes"
                          defaultValue={c.durationMinutes}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
                        />
                      </div>
                      <input name="meetingLink" defaultValue={c.meetingLink ?? ""} placeholder="Toplantı" className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                      <input name="recordingUrl" defaultValue={c.recordingUrl ?? ""} placeholder="Kayıt" className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                      <input type="number" step="0.01" min={0} name="singlePrice" defaultValue={c.singlePrice ?? 0} placeholder="Tek ders fiyatı" className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                      <textarea name="description" defaultValue={c.description ?? ""} rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                      <textarea name="topicOutline" defaultValue={c.topicOutline ?? ""} rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                      <div className="flex items-center gap-2">
                        <button type="submit" className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10">Kaydet</button>
                        <button formAction={deleteClassAction} type="submit" className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">Sil</button>
                      </div>
                    </form>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} />
                        {format(c.scheduledAt, "d MMMM yyyy · HH:mm", {
                          locale: tr,
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {c.durationMinutes} dk
                      </span>
                      {c.singlePrice && c.singlePrice > 0 ? (
                        <span className="rounded-md border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-amber-300">
                          Tek ders: {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(c.singlePrice)}
                        </span>
                      ) : null}
                    </div>
                    {c.topicOutline ? <p className="mt-2 text-xs text-zinc-400">Konu: {c.topicOutline}</p> : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      isUpcoming
                        ? "bg-teal-500/15 text-teal-300"
                        : "bg-zinc-500/15 text-zinc-400"
                    }`}
                  >
                    {isUpcoming ? "Yaklaşan" : "Geçmiş"}
                  </span>
                  {c.meetingLink && (
                    <Link
                      href={c.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition hover:bg-white/20 hover:text-white"
                    >
                      Toplantı
                      <ExternalLink size={11} />
                    </Link>
                  )}
                  {c.recordingUrl && (
                    <Link
                      href={c.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-blue-500/15 px-2.5 py-1.5 text-xs text-blue-300 transition hover:bg-blue-500/25"
                    >
                      Kayıt
                      <ExternalLink size={11} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {classes.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-12 text-zinc-500">
            <CalendarDays size={32} className="opacity-50" />
            <p className="text-sm">Henüz canlı ders planlanmamış.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
