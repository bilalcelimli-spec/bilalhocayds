import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, GraduationCap, Languages, Sparkles } from "lucide-react";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { prisma } from "@/src/lib/prisma";

type PublishedItem = {
  title: string;
  content: string;
  difficulty: string;
  tags: string[];
  sourceInspiration: string;
  answerKey?: string | null;
};

const studentNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Canlı Ders Kayıtları", href: "/dashboard/live-recordings" },
  { label: "Paylaşılan İçerikler", href: "/dashboard/content-library" },
  { label: "Vocabulary", href: "/vocabulary" },
  { label: "Reading", href: "/reading" },
  { label: "Grammar", href: "/grammar" },
  { label: "Canlı Dersler", href: "/live-classes" },
  { label: "Fiyatlandırma", href: "/pricing" },
];

const teacherNavItems = [
  { label: "Dashboard", href: "/teacher" },
  { label: "Paylaşılan İçerikler", href: "/dashboard/content-library" },
  { label: "Reading Modülü", href: "/reading" },
  { label: "Grammar Modülü", href: "/grammar" },
  { label: "Vocabulary Modülü", href: "/vocabulary" },
  { label: "Canlı Dersler", href: "/live-classes" },
  { label: "Admin Paneli", href: "/admin" },
];

function inferIcon(itemType: string) {
  const normalized = itemType.toLowerCase();
  if (normalized.includes("reading")) return BookOpen;
  if (normalized.includes("grammar")) return GraduationCap;
  if (normalized.includes("vocab")) return Languages;
  return Sparkles;
}

function normalizeGeneratedItems(value: unknown): PublishedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): PublishedItem | null => {
      const title = typeof item?.title === "string" ? item.title.trim() : "";
      const content = typeof item?.content === "string" ? item.content.trim() : "";
      const difficulty = typeof item?.difficulty === "string" ? item.difficulty.trim() : "Mixed";
      const tags = Array.isArray(item?.tags)
        ? item.tags
            .map((tag: unknown) => (typeof tag === "string" ? tag.trim() : ""))
            .filter((tag: string) => tag.length > 0)
        : [];
      const sourceInspiration = typeof item?.sourceInspiration === "string" ? item.sourceInspiration.trim() : "Content engine";
      const answerKey = typeof item?.answerKey === "string" ? item.answerKey.trim() : null;

      if (!title || !content) {
        return null;
      }

      return { title, content, difficulty, tags, sourceInspiration, answerKey };
    })
    .filter((item: PublishedItem | null): item is PublishedItem => Boolean(item));
}

export default async function DashboardContentLibraryPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/content-engine");

  const navItems = session.user.role === "TEACHER" ? teacherNavItems : studentNavItems;
  const roleLabel = session.user.role === "TEACHER" ? "Öğretmen Paneli" : "Öğrenci Paneli";
  const hasContentLibraryAccess =
    session.user.role === "TEACHER" || session.user.hasContentLibraryAccess === true;

  const publishedRuns = hasContentLibraryAccess
    ? await prisma.contentGenerationRun.findMany({
        where: {
          status: "COMPLETED",
          isApproved: true,
          isPublished: true,
        },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          itemType: true,
          outputFormat: true,
          itemCount: true,
          styleAnalysis: true,
          generatedItemsJson: true,
          generatedText: true,
          publishedAt: true,
        },
      })
    : [];

  return (
    <DashboardShell
      navItems={navItems}
      roleLabel={roleLabel}
      title="Paylaşılan AI İçerikleri"
      subtitle="Admin onayından geçmiş kaynak tabanlı yeni nesil içerikler burada yayınlanır."
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      {!hasContentLibraryAccess ? (
        <div className="rounded-[30px] border border-amber-400/30 bg-amber-400/10 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Erişim Kapalı</p>
          <h2 className="mt-3 text-2xl font-black text-white">Paylaşılan içerik kütüphanesi bu öğrenci için kapalı</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-200">
            Admin panelinden içerik kütüphanesi yetkisi açıldığında veya uygun bir plan tanımlandığında bu alandaki yayınlanmış içerikler görünür hale gelir.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200">
              Dashboard&apos;a Dön
            </Link>
            <Link href="/pricing" className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/10">
              Planları Gör
            </Link>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={session.user.role === "TEACHER" ? "/teacher" : "/dashboard"}
          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          Geri
        </Link>
        <div className="ml-auto rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
          {publishedRuns.length} yayınlanmış içerik
        </div>
      </div>

      <div className="space-y-5">
        {hasContentLibraryAccess && publishedRuns.length ? (
          publishedRuns.map((run) => {
            const Icon = inferIcon(run.itemType);
            const items = normalizeGeneratedItems(run.generatedItemsJson);

            return (
              <section
                key={run.id}
                className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05] text-emerald-300">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Published Content</p>
                      <h2 className="mt-2 text-xl font-black text-white">{run.title}</h2>
                      <p className="mt-1 text-sm text-zinc-400">{run.itemType} · {run.itemCount} item · {run.outputFormat}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Yayın tarihi</p>
                    <p className="mt-1 text-sm font-semibold text-white">{run.publishedAt ? new Date(run.publishedAt).toLocaleString("tr-TR") : "-"}</p>
                  </div>
                </div>

                {run.styleAnalysis ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-white">Editör Notu</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">{run.styleAnalysis}</p>
                  </div>
                ) : null}

                <div className="mt-5 space-y-4">
                  {items.length ? items.map((item, index) => (
                    <article key={`${run.id}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-white">{index + 1}. {item.title}</h3>
                        <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold text-zinc-300">{item.difficulty}</span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-zinc-200">{item.content}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                        <span>İlham kaynağı: {item.sourceInspiration}</span>
                        {item.tags.length ? <span>· {item.tags.join(" · ")}</span> : null}
                      </div>
                      {item.answerKey ? <p className="mt-3 text-xs text-emerald-300">Answer Key: {item.answerKey}</p> : null}
                    </article>
                  )) : run.generatedText ? (
                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">{run.generatedText}</pre>
                    </article>
                  ) : null}
                </div>
              </section>
            );
          })
        ) : hasContentLibraryAccess ? (
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <p className="text-lg font-bold text-white">Henüz yayınlanmış içerik yok</p>
            <p className="mt-2 text-sm text-zinc-500">Admin bir üretimi onaylayıp yayınladığında burada tüm kullanıcılarla paylaşılacak.</p>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}