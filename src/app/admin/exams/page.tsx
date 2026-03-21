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
import { examModule, prisma } from "@/src/lib/prisma";

const adminNavItems = [
  { label: "Admin Dashboard", href: "/admin" },
  { label: "Kullanıcılar", href: "/admin/users" },
  { label: "Reading Yönetimi", href: "/admin/readings" },
  { label: "Grammar Yönetimi", href: "/admin/grammar" },
  { label: "Vocabulary Yönetimi", href: "/admin/vocabulary" },
  { label: "Sınav Yönetimi", href: "/admin/exams" },
  { label: "Sınav Satışları", href: "/admin/exam-sales" },
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

  await examModule.create({
    data: {
      title,
      slug: toSlug(slugInput || title),
      examType: String(formData.get("examType") ?? "General Practice").trim() || "General Practice",
      cefrLevel: String(formData.get("cefrLevel") ?? "").trim() || null,
      durationMinutes: parseNumber(formData.get("durationMinutes"), 45),
      questionCount: parseNumber(formData.get("questionCount"), 20),
      description: String(formData.get("description") ?? "").trim() || null,
      instructions: String(formData.get("instructions") ?? "").trim() || null,
      marketplaceTitle: String(formData.get("marketplaceTitle") ?? "").trim() || null,
      marketplaceDescription: String(formData.get("marketplaceDescription") ?? "").trim() || null,
      coverImageUrl: String(formData.get("coverImageUrl") ?? "").trim() || null,
      price: parseNumber(formData.get("price"), 0),
      isForSale: formData.get("isForSale") === "on",
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

  await examModule.update({
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
      marketplaceTitle: String(formData.get("marketplaceTitle") ?? "").trim() || null,
      marketplaceDescription: String(formData.get("marketplaceDescription") ?? "").trim() || null,
      coverImageUrl: String(formData.get("coverImageUrl") ?? "").trim() || null,
      price: parseNumber(formData.get("price"), 0),
      isForSale: formData.get("isForSale") === "on",
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

  await examModule.delete({ where: { id } });
  revalidatePath("/admin/exams");
  revalidatePath("/admin");
  revalidatePath("/exam");
}

async function revalidatePlanRelations(planId: string) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { slug: true },
  });

  revalidatePath("/admin/exams");
  revalidatePath("/admin/plans");
  revalidatePath("/admin");
  revalidatePath("/pricing");
  if (plan?.slug) {
    revalidatePath(`/pricing/${plan.slug}`);
  }
}

async function attachExamToPlanAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const examModuleId = String(formData.get("examModuleId") ?? formData.get("id") ?? "").trim();
  const planId = String(formData.get("attachPlanId") ?? "").trim();

  if (!examModuleId || !planId) {
    return;
  }

  await prisma.planExamModule.upsert({
    where: {
      planId_examModuleId: {
        planId,
        examModuleId,
      },
    },
    update: {},
    create: {
      planId,
      examModuleId,
    },
  });

  await revalidatePlanRelations(planId);
}

async function detachExamFromPlanAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const examModuleId = String(formData.get("examModuleId") ?? formData.get("id") ?? "").trim();
  const planId = String(formData.get("detachPlanId") ?? "").trim();

  if (!examModuleId || !planId) {
    return;
  }

  await prisma.planExamModule.deleteMany({
    where: {
      planId,
      examModuleId,
    },
  });

  await revalidatePlanRelations(planId);
}

export default async function AdminExamsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [exams, publishedCount, plans] = await Promise.all([
    prisma.examModule.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        plans: {
          select: {
            plan: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
              },
            },
          },
        },
      },
    }),
    prisma.examModule.count({ where: { isPublished: true, isActive: true } }),
    prisma.plan.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    }),
  ]);

  const typedExams = exams as Array<{
    id: string;
    title: string;
    slug: string;
    examType: string;
    cefrLevel: string | null;
    durationMinutes: number;
    questionCount: number;
    description: string | null;
    instructions: string | null;
    marketplaceTitle: string | null;
    marketplaceDescription: string | null;
    coverImageUrl: string | null;
    price: number | null;
    isForSale: boolean;
    contentJson: Prisma.JsonValue;
    isPublished: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    plans: Array<{ plan: { id: string; name: string; slug: string; isActive: boolean } }>;
  }>;

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
        <p className="mt-2 text-xs text-emerald-300">
          Marketplace&apos;te görünmesi için fiyat gir, satış kutusunu işaretle, ardından sınavı yayınlı ve aktif hale getir.
        </p>
        <form action={createExamAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input name="title" required placeholder="Başlık" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="slug" placeholder="Slug (opsiyonel)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="examType" placeholder="Exam type" defaultValue="YDS Practice" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="cefrLevel" placeholder="Seviye (B1/B2/C1/C2)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="durationMinutes" type="number" min="1" defaultValue="45" placeholder="Süre" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="questionCount" type="number" min="1" defaultValue="20" placeholder="Soru sayısı" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="price" type="number" min="0" step="0.01" defaultValue="0" placeholder="Satış fiyatı" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="coverImageUrl" placeholder="Kapak görseli URL" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" name="isPublished" /> Yayınla</label>
          <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" name="isActive" defaultChecked /> Aktif</label>
          <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" name="isForSale" /> Marketplace&apos;te sat</label>
          <textarea name="description" placeholder="Açıklama" rows={3} className="md:col-span-2 xl:col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <textarea name="marketplaceTitle" placeholder="Marketplace başlığı (opsiyonel)" rows={3} className="md:col-span-2 xl:col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <textarea name="instructions" placeholder="Talimatlar" rows={3} className="md:col-span-2 xl:col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <textarea name="marketplaceDescription" placeholder="Marketplace açıklaması" rows={3} className="md:col-span-2 xl:col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
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
          {typedExams.map((exam) => (
            <div key={exam.id} className="px-5 py-4 transition hover:bg-white/[0.03]">
              <form action={updateExamAction} className="space-y-3">
                <input type="hidden" name="id" value={exam.id} />
                <input type="hidden" name="examModuleId" value={exam.id} />
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
                    <span className={`rounded-lg px-2 py-1 text-xs font-medium ${exam.isForSale ? "bg-cyan-500/15 text-cyan-300" : "bg-zinc-500/15 text-zinc-400"}`}>
                      {exam.isForSale ? "Satışta" : "Kapalı"}
                    </span>
                    <span className={`rounded-lg px-2 py-1 text-xs font-medium ${exam.isActive ? "bg-blue-500/15 text-blue-300" : "bg-zinc-500/15 text-zinc-400"}`}>
                      {exam.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <input name="durationMinutes" type="number" min="1" defaultValue={exam.durationMinutes} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                  <input name="questionCount" type="number" min="1" defaultValue={exam.questionCount} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                  <input name="price" type="number" min="0" step="0.01" defaultValue={exam.price ?? 0} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                  <input name="coverImageUrl" defaultValue={exam.coverImageUrl ?? ""} placeholder="Kapak görseli URL" className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
                  <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"><input type="checkbox" name="isPublished" defaultChecked={exam.isPublished} /> Yayınlı</label>
                  <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"><input type="checkbox" name="isActive" defaultChecked={exam.isActive} /> Aktif</label>
                  <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"><input type="checkbox" name="isForSale" defaultChecked={exam.isForSale} /> Satışta</label>
                </div>

                <textarea name="description" defaultValue={exam.description ?? ""} rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300" />
                <textarea name="marketplaceTitle" defaultValue={exam.marketplaceTitle ?? ""} rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300" />
                <textarea name="instructions" defaultValue={exam.instructions ?? ""} rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300" />
                <textarea name="marketplaceDescription" defaultValue={exam.marketplaceDescription ?? ""} rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300" />
                <textarea
                  name="contentJson"
                  defaultValue={JSON.stringify(exam.contentJson, null, 2)}
                  rows={10}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-zinc-300"
                />

                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Bağlı Planlar</p>
                    <span className="text-xs text-zinc-500">{exam.plans.length} plan</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {exam.plans.map(({ plan }) => (
                        <button
                          key={plan.id}
                          type="submit"
                          name="detachPlanId"
                          value={plan.id}
                          formAction={detachExamFromPlanAction}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            plan.isActive
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
                              : "border-zinc-500/20 bg-zinc-500/10 text-zinc-300 hover:bg-zinc-500/15"
                          }`}
                          title="Plandan çıkar"
                        >
                          {plan.name} · Çıkar
                        </button>
                    ))}
                    {exam.plans.length === 0 ? (
                      <span className="rounded-full border border-dashed border-white/10 px-3 py-1 text-xs text-zinc-500">
                        Henüz hiçbir plana eklenmemiş
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      name="attachPlanId"
                      defaultValue=""
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200"
                    >
                      <option value="" disabled>Plana ekle...</option>
                      {plans.map((plan) => {
                        const alreadyLinked = exam.plans.some(({ plan: linkedPlan }) => linkedPlan.id === plan.id);
                        return (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}{alreadyLinked ? " (zaten ekli)" : ""}{plan.isActive ? "" : " - pasif"}
                          </option>
                        );
                      })}
                    </select>
                    <button type="submit" formAction={attachExamToPlanAction} className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20">
                      Plana ekle
                    </button>
                    <Link href="/admin/plans" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10">
                      Planları aç
                    </Link>
                  </div>
                </div>

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
