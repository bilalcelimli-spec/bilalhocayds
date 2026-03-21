import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, TimerReset } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { prisma } from "@/src/lib/prisma";

const adminNavItems = [
  { label: "Admin Dashboard", href: "/admin" },
  { label: "Kullanıcılar", href: "/admin/users" },
  { label: "Reading Yönetimi", href: "/admin/readings" },
  { label: "Grammar Yönetimi", href: "/admin/grammar" },
  { label: "Vocabulary Yönetimi", href: "/admin/vocabulary" },
  { label: "Sınav Yönetimi", href: "/admin/exams" },
  { label: "Canlı Ders Yönetimi", href: "/admin/live-classes" },
  { label: "Canlı Ders Kayıtları", href: "/admin/live-recordings" },
  { label: "Plan Yönetimi", href: "/admin/plans" },
  { label: "CRM & Lead", href: "/admin/crm" },
  { label: "Muhasebe", href: "/admin/accounting" },
  { label: "Öğrenci Modülleri", href: "/dashboard" },
  { label: "Öğretmen Paneli", href: "/teacher" },
];

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseNumber(value: FormDataEntryValue | null, fallback: number) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseContentJson(rawValue: FormDataEntryValue | null): Prisma.InputJsonValue {
  const raw = typeof rawValue === "string" ? rawValue.trim() : "";
  if (!raw) {
    return { sections: [], questions: [] };
  }

  try {
    return JSON.parse(raw) as Prisma.InputJsonValue;
  } catch {
    return { raw };
  }
}

async function assertAdmin() {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

async function createExamAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  if (!title) {
    return;
  }

  await prisma.examModule.create({
    data: {
      title,
      slug: toSlug(slugInput || title),
      examType: String(formData.get("examType") ?? "General Practice").trim() || "General Practice",
      cefrLevel: String(formData.get("cefrLevel") ?? "").trim() || null,
      durationMinutes: parseNumber(formData.get("durationMinutes"), 45),
      questionCount: parseNumber(formData.get("questionCount"), 20),
      description: String(formData.get("description") ?? "").trim() || null,
      instructions: String(formData.get("instructions") ?? "").trim() || null,
      contentJson: parseContentJson(formData.get("contentJson")),
      isPublished: formData.get("isPublished") === "on",
      isActive: formData.get("isActive") === "on",
    },
  });

  revalidatePath("/admin/exams");
  revalidatePath("/admin");
  revalidatePath("/exam");
}

async function updateExamAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  if (!id || !title) {
    return;
  }

  await prisma.examModule.update({
    where: { id },
    data: {
      title,
      slug: toSlug(slugInput || title),
      examType: String(formData.get("examType") ?? "General Practice").trim() || "General Practice",
      cefrLevel: String(formData.get("cefrLevel") ?? "").trim() || null,
      durationMinutes: parseNumber(formData.get("durationMinutes"), 45),
      questionCount: parseNumber(formData.get("questionCount"), 20),
      description: String(formData.get("description") ?? "").trim() || null,
      instructions: String(formData.get("instructions") ?? "").trim() || null,
      contentJson: parseContentJson(formData.get("contentJson")),
      isPublished: formData.get("isPublished") === "on",
      isActive: formData.get("isActive") === "on",
    },
  });

  revalidatePath("/admin/exams");
  revalidatePath("/admin");
  revalidatePath("/exam");
}

async function deleteExamAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  await prisma.examModule.delete({ where: { id } });
  revalidatePath("/admin/exams");
  revalidatePath("/admin");
  revalidatePath("/exam");
}

export default async function AdminExamsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [exams, publishedCount] = await Promise.all([
    prisma.examModule.findMany({
      orderBy: { updatedAt: "desc" },
    }),
    prisma.examModule.count({ where: { isPublished: true, isActive: true } }),
  ]);

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="Sınav Yönetimi"
      subtitle={`${exams.length} sınav seti kayıtlı · ${publishedCount} yayınlı`}
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          Geri
        </Link>
        <div className="ml-auto rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-300">
          API ile eklenebilir JSON sınav havuzu
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-bold text-white">Yeni Sınav Ekle</h2>
        <p className="mt-1 text-xs text-zinc-400">
          JSON içeriğini doğrudan yapıştırabilir veya aynı alanı admin API&apos;sine gönderebilirsin.
        </p>
        <form action={createExamAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input name="title" required placeholder="Başlık" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="slug" placeholder="Slug (opsiyonel)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="examType" placeholder="Exam type" defaultValue="YDS Practice" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="cefrLevel" placeholder="Seviye (B1/B2/C1/C2)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="durationMinutes" type="number" min="1" defaultValue="45" placeholder="Süre" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="questionCount" type="number" min="1" defaultValue="20" placeholder="Soru sayısı" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" name="isPublished" /> Yayınla</label>
          <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" name="isActive" defaultChecked /> Aktif</label>
          <textarea name="description" placeholder="Açıklama" rows={3} className="md:col-span-2 xl:col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <textarea name="instructions" placeholder="Talimatlar" rows={3} className="md:col-span-2 xl:col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <textarea
            name="contentJson"
            placeholder='{"questions":[{"prompt":"...","choices":["A","B","C","D"],"answer":"A"}]}'
            rows={8}
            className="md:col-span-2 xl:col-span-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white"
          />
          <button type="submit" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">Sınavı ekle</button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="border-b border-white/8 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Kayıtlı Sınavlar
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {exams.map((exam) => (
            <div key={exam.id} className="px-5 py-4 transition hover:bg-white/[0.03]">
              <form action={updateExamAction} className="space-y-3">
                <input type="hidden" name="id" value={exam.id} />
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                      <FileText size={16} className="text-emerald-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                        <input name="title" defaultValue={exam.title} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm font-semibold text-zinc-200" />
                        <input name="slug" defaultValue={exam.slug} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                        <input name="examType" defaultValue={exam.examType} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                        <input name="cefrLevel" defaultValue={exam.cefrLevel ?? ""} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-lg px-2 py-1 text-xs font-medium ${exam.isPublished ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                      {exam.isPublished ? "Yayınlı" : "Taslak"}
                    </span>
                    <span className={`rounded-lg px-2 py-1 text-xs font-medium ${exam.isActive ? "bg-blue-500/15 text-blue-300" : "bg-zinc-500/15 text-zinc-400"}`}>
                      {exam.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <input name="durationMinutes" type="number" min="1" defaultValue={exam.durationMinutes} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                  <input name="questionCount" type="number" min="1" defaultValue={exam.questionCount} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                  <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"><input type="checkbox" name="isPublished" defaultChecked={exam.isPublished} /> Yayınlı</label>
                  <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"><input type="checkbox" name="isActive" defaultChecked={exam.isActive} /> Aktif</label>
                </div>

                <textarea name="description" defaultValue={exam.description ?? ""} rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300" />
                <textarea name="instructions" defaultValue={exam.instructions ?? ""} rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300" />
                <textarea
                  name="contentJson"
                  defaultValue={JSON.stringify(exam.contentJson, null, 2)}
                  rows={10}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-zinc-300"
                />

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1"><TimerReset size={12} /> {exam.durationMinutes} dk</span>
                  <span>{exam.questionCount} soru</span>
                  <span>{format(exam.updatedAt, "d MMM yyyy", { locale: tr })}</span>
                  <button type="submit" className="rounded-lg border border-white/10 px-2 py-1 text-zinc-300 hover:bg-white/10">Kaydet</button>
                </div>
              </form>

              <form action={deleteExamAction} className="mt-3">
                <input type="hidden" name="id" value={exam.id} />
                <button type="submit" className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">Sil</button>
              </form>
            </div>
          ))}
          {exams.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-zinc-500">
              <FileText size={32} className="opacity-50" />
              <p className="text-sm">Henüz sınav seti eklenmemiş.</p>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
