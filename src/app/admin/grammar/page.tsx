import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, HelpCircle } from "lucide-react";
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function createTopicAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const difficultyLevel = String(formData.get("difficultyLevel") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (!title) {
    return;
  }

  const slugBase = slugify(title);
  const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;

  await prisma.grammarTopic.create({
    data: { title, slug, description, difficultyLevel, isActive },
  });

  revalidatePath("/admin/grammar");
  revalidatePath("/admin");
}

async function updateTopicAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const difficultyLevel = String(formData.get("difficultyLevel") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (!id || !title) {
    return;
  }

  await prisma.grammarTopic.update({
    where: { id },
    data: { title, description, difficultyLevel, isActive },
  });

  revalidatePath("/admin/grammar");
  revalidatePath("/admin");
}

async function deleteTopicAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }
  await prisma.grammarTopic.delete({ where: { id } });
  revalidatePath("/admin/grammar");
  revalidatePath("/admin");
}

export default async function AdminGrammarPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [topics, activeCount, inactiveCount] = await Promise.all([
    prisma.grammarTopic.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true } },
      },
    }),
    prisma.grammarTopic.count({ where: { isActive: true } }),
    prisma.grammarTopic.count({ where: { isActive: false } }),
  ]);

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="Grammar Yönetimi"
      subtitle={`${topics.length} konu kayıtlı · ${activeCount} aktif`}
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
          <div className="rounded-xl bg-violet-500/15 px-3 py-2 text-sm font-semibold text-violet-300">
            {activeCount} Aktif
          </div>
          <div className="rounded-xl bg-zinc-500/15 px-3 py-2 text-sm font-semibold text-zinc-400">
            {inactiveCount} Pasif
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-bold text-white">Yeni Grammar Konusu Ekle</h2>
        <form action={createTopicAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input name="title" required placeholder="Konu başlığı" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="difficultyLevel" placeholder="Seviye (B1/B2/C1)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" name="isActive" defaultChecked /> Aktif</label>
          <button type="submit" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">Ekle</button>
          <textarea name="description" placeholder="Açıklama" className="md:col-span-2 xl:col-span-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" rows={3} />
        </form>
      </div>

      {/* Topic list */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {topics.map((t) => (
          <div key={t.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/8">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
                <GraduationCap size={18} className="text-violet-400" />
              </div>
              <span
                className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium ${
                  t.isActive
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-zinc-500/15 text-zinc-400"
                }`}
              >
                {t.isActive ? "Aktif" : "Pasif"}
              </span>
            </div>
            <form action={updateTopicAction} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={t.id} />
              <input name="title" defaultValue={t.title} className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm font-bold text-white" />
              <input name="difficultyLevel" defaultValue={t.difficultyLevel ?? ""} placeholder="Seviye" className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
              <textarea name="description" defaultValue={t.description ?? ""} placeholder="Açıklama" rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <label className="flex items-center gap-1"><input type="checkbox" name="isActive" defaultChecked={t.isActive} /> Aktif</label>
                <button type="submit" className="rounded-lg border border-white/10 px-2 py-1 hover:bg-white/10">Kaydet</button>
              </div>
            </form>

            <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <HelpCircle size={12} className="text-zinc-600" />
                <span>{t._count.questions} soru</span>
              </div>
              <div className="flex items-center gap-2">
                {t.difficultyLevel && (
                  <span className="rounded-lg bg-white/8 px-2 py-0.5 text-zinc-400">
                    {t.difficultyLevel}
                  </span>
                )}
                <span>{format(t.createdAt, "d MMM", { locale: tr })}</span>
                <form action={deleteTopicAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="rounded-lg border border-red-500/30 px-2 py-1 text-red-300 hover:bg-red-500/10">Sil</button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-12 text-zinc-500">
          <GraduationCap size={32} className="opacity-50" />
          <p className="text-sm">Henüz grammar konusu eklenmemiş.</p>
        </div>
      )}
    </DashboardShell>
  );
}
