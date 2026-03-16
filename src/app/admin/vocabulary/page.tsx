import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Languages } from "lucide-react";
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

const levelColor: Record<string, string> = {
  A1: "bg-green-500/15 text-green-300",
  A2: "bg-green-500/15 text-green-300",
  B1: "bg-blue-500/15 text-blue-300",
  B2: "bg-indigo-500/15 text-indigo-300",
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

async function createWordAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const word = String(formData.get("word") ?? "").trim().toLowerCase();
  const partOfSpeech = String(formData.get("partOfSpeech") ?? "").trim() || null;
  const cefrLevel = String(formData.get("cefrLevel") ?? "").trim() || null;
  const meaningTr = String(formData.get("meaningTr") ?? "").trim() || null;
  const meaningEn = String(formData.get("meaningEn") ?? "").trim() || null;
  const exampleSentence = String(formData.get("exampleSentence") ?? "").trim() || null;

  if (!word) {
    return;
  }

  await prisma.vocabularyWord.create({
    data: { word, partOfSpeech, cefrLevel, meaningTr, meaningEn, exampleSentence },
  });

  revalidatePath("/admin/vocabulary");
  revalidatePath("/admin");
}

async function updateWordAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const partOfSpeech = String(formData.get("partOfSpeech") ?? "").trim() || null;
  const cefrLevel = String(formData.get("cefrLevel") ?? "").trim() || null;
  const meaningTr = String(formData.get("meaningTr") ?? "").trim() || null;
  const meaningEn = String(formData.get("meaningEn") ?? "").trim() || null;
  const exampleSentence = String(formData.get("exampleSentence") ?? "").trim() || null;

  if (!id) {
    return;
  }

  await prisma.vocabularyWord.update({
    where: { id },
    data: { partOfSpeech, cefrLevel, meaningTr, meaningEn, exampleSentence },
  });

  revalidatePath("/admin/vocabulary");
  revalidatePath("/admin");
}

async function deleteWordAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  await prisma.vocabularyWord.delete({ where: { id } });
  revalidatePath("/admin/vocabulary");
  revalidatePath("/admin");
}

export default async function AdminVocabularyPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [words, totalCount] = await Promise.all([
    prisma.vocabularyWord.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.vocabularyWord.count(),
  ]);

  const levelGroups = words.reduce<Record<string, number>>((acc, w) => {
    const level = w.cefrLevel ?? "—";
    acc[level] = (acc[level] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="Vocabulary Yönetimi"
      subtitle={`Toplam ${totalCount} kelime · Son 50 gösteriliyor`}
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
        {/* Level badges */}
        <div className="ml-auto flex flex-wrap gap-2">
          {Object.entries(levelGroups).map(([lvl, count]) => (
            <span
              key={lvl}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                levelColor[lvl] ?? "bg-white/10 text-zinc-300"
              }`}
            >
              {lvl}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-bold text-white">Yeni Kelime Ekle</h2>
        <form action={createWordAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input name="word" required placeholder="Kelime" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="partOfSpeech" placeholder="Part of speech" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="cefrLevel" placeholder="Seviye (A1-C2)" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="meaningTr" placeholder="Türkçe anlam" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="meaningEn" placeholder="İngilizce anlam" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <input name="exampleSentence" placeholder="Örnek cümle" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          <button type="submit" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">Ekle</button>
        </form>
      </div>

      {/* Word grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {words.map((w) => (
          <div key={w.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/8">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{w.word}</h3>
                {w.partOfSpeech && (
                  <span className="rounded-lg bg-white/8 px-1.5 py-0.5 text-[10px] text-zinc-400">
                    {w.partOfSpeech}
                  </span>
                )}
              </div>
              {w.cefrLevel && (
                <span
                  className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold ${
                    levelColor[w.cefrLevel] ?? "bg-white/10 text-zinc-300"
                  }`}
                >
                  {w.cefrLevel}
                </span>
              )}
            </div>

            <form action={updateWordAction} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={w.id} />
              <input name="partOfSpeech" defaultValue={w.partOfSpeech ?? ""} placeholder="Part of speech" className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
              <input name="cefrLevel" defaultValue={w.cefrLevel ?? ""} placeholder="Seviye" className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
              <input name="meaningTr" defaultValue={w.meaningTr ?? ""} placeholder="Türkçe anlam" className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
              <input name="meaningEn" defaultValue={w.meaningEn ?? ""} placeholder="İngilizce anlam" className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
              <input name="exampleSentence" defaultValue={w.exampleSentence ?? ""} placeholder="Örnek cümle" className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300" />
              <div className="flex gap-2">
                <button type="submit" className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10">Kaydet</button>
                <button formAction={deleteWordAction} type="submit" className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">Sil</button>
              </div>
            </form>
          </div>
        ))}
      </div>

      {words.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-12 text-zinc-500">
          <Languages size={32} className="opacity-50" />
          <p className="text-sm">Henüz vocabulary kelimesi eklenmemiş.</p>
        </div>
      )}
    </DashboardShell>
  );
}
