import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { format } from "date-fns";
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
  { label: "Canlı Ders Kayıtları", href: "/admin/live-recordings" },
  { label: "Plan Yönetimi", href: "/admin/plans" },
  { label: "CRM & Lead", href: "/admin/crm" },
  { label: "Muhasebe", href: "/admin/accounting" },
  { label: "Öğrenci Modülleri", href: "/dashboard" },
  { label: "Öğretmen Paneli", href: "/teacher" },
];

const difficultyColor: Record<string, string> = {
  B1: "bg-green-500/15 text-green-300",
  B2: "bg-yellow-500/15 text-yellow-300",
  C1: "bg-orange-500/15 text-orange-300",
  C2: "bg-red-500/15 text-red-300",
};

async function assertAdmin() {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

async function createReadingAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const sourceName = String(formData.get("sourceName") ?? "").trim() || null;
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const difficultyLevel = String(formData.get("difficultyLevel") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (!title || !content) {
    return;
  }

  await prisma.reading.create({
    data: {
      title,
      content,
      sourceName,
      sourceUrl,
      category,
      difficultyLevel,
      isActive,
      summary: content.slice(0, 200),
    },
  });

  revalidatePath("/admin/readings");
  revalidatePath("/admin");
}

async function updateReadingAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const sourceName = String(formData.get("sourceName") ?? "").trim() || null;
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const difficultyLevel = String(formData.get("difficultyLevel") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (!id || !title) {
    return;
  }

  await prisma.reading.update({
    where: { id },
    data: { title, sourceName, sourceUrl, category, difficultyLevel, isActive },
  });

  revalidatePath("/admin/readings");
  revalidatePath("/admin");
}

async function deleteReadingAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }
  await prisma.reading.delete({ where: { id } });
  revalidatePath("/admin/readings");
  revalidatePath("/admin");
}

export default async function AdminReadingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [readings, activeCount, inactiveCount] = await Promise.all([
    prisma.reading.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.reading.count({ where: { isActive: true } }),
    prisma.reading.count({ where: { isActive: false } }),
  ]);

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="Reading Yönetimi"
      subtitle={`${readings.length} metin kayıtlı · ${activeCount} aktif`}
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
          <div className="rounded-xl bg-blue-500/15 px-3 py-2 text-sm font-semibold text-blue-300">
            {activeCount} Aktif
          </div>
          <div className="rounded-xl bg-zinc-500/15 px-3 py-2 text-sm font-semibold text-zinc-400">
            {inactiveCount} Pasif
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-bold text-white">Yeni Reading Ekle</h2>
        <form action={createReadingAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input name="title" required placeholder="Başlık" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="sourceName" placeholder="Kaynak" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="sourceUrl" placeholder="Kaynak URL" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="category" placeholder="Kategori" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="difficultyLevel" placeholder="Seviye (B1/B2/C1/C2)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" name="isActive" defaultChecked /> Aktif</label>
          <textarea name="content" required placeholder="Metin içeriği" className="md:col-span-2 xl:col-span-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" rows={4} />
          <button type="submit" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">Ekle</button>
        </form>
      </div>

      {/* Reading list */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="border-b border-white/8 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Tüm Reading Metinleri
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {readings.map((r) => (
            <div key={r.id} className="flex items-start gap-4 px-5 py-4 transition hover:bg-white/[0.03]">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
                <BookOpen size={16} className="text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <form action={updateReadingAction} className="space-y-2">
                  <input type="hidden" name="id" value={r.id} />
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <input
                      name="title"
                      defaultValue={r.title}
                      className="min-w-[240px] flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm font-semibold text-zinc-200"
                    />
                  <div className="flex shrink-0 items-center gap-2">
                    {r.difficultyLevel && (
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-medium ${
                          difficultyColor[r.difficultyLevel] ??
                          "bg-white/10 text-zinc-300"
                        }`}
                      >
                        {r.difficultyLevel}
                      </span>
                    )}
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-medium ${
                        r.isActive
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-zinc-500/15 text-zinc-400"
                      }`}
                    >
                      {r.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-4">
                    <input name="sourceName" defaultValue={r.sourceName ?? ""} placeholder="Kaynak" className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                    <input name="sourceUrl" defaultValue={r.sourceUrl ?? ""} placeholder="URL" className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                    <input name="category" defaultValue={r.category ?? ""} placeholder="Kategori" className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                    <input name="difficultyLevel" defaultValue={r.difficultyLevel ?? ""} placeholder="Seviye" className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    <label className="flex items-center gap-1 text-zinc-300"><input type="checkbox" name="isActive" defaultChecked={r.isActive} /> Aktif</label>
                    <span>· {format(r.createdAt, "d MMM yyyy", { locale: tr })}</span>
                    <button type="submit" className="rounded-lg border border-white/10 px-2 py-1 text-zinc-300 hover:bg-white/10">Kaydet</button>
                  </div>
                </form>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span>· {format(r.createdAt, "d MMM yyyy", { locale: tr })}</span>
                  {r.sourceUrl && (
                    <Link
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition"
                    >
                      Kaynak
                      <ExternalLink size={11} />
                    </Link>
                  )}
                  <form action={deleteReadingAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="rounded-lg border border-red-500/30 px-2 py-1 text-red-300 hover:bg-red-500/10">Sil</button>
                  </form>
                </div>
                {r.summary && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    {r.summary}
                  </p>
                )}
              </div>
            </div>
          ))}
          {readings.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-zinc-500">
              <BookOpen size={32} className="opacity-50" />
              <p className="text-sm">Henüz reading içeriği eklenmemiş.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
