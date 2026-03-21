import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { authOptions } from "@/src/auth";
import ContentEngine from "@/src/components/admin/content-engine";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { inferPublishedModule } from "@/src/lib/content-creator-engine";
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
  { label: "SEO Yönetimi", href: "/admin/seo" },
  { label: "Content Engine", href: "/admin/content-engine" },
  { label: "Öğrenci Modülleri", href: "/dashboard" },
  { label: "Öğretmen Paneli", href: "/teacher" },
];

export default async function AdminContentEnginePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [recentSources, recentRuns] = await Promise.all([
    prisma.contentSource.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        sourceType: true,
        sourceUrl: true,
        mimeType: true,
        tags: true,
        createdAt: true,
        extractedText: true,
      },
    }),
    prisma.contentGenerationRun.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        isApproved: true,
        approvedAt: true,
        isPublished: true,
        publishedAt: true,
        itemType: true,
        outputFormat: true,
        itemCount: true,
        sourceIds: true,
        styleAnalysis: true,
        createdAt: true,
        generatedText: true,
      },
    }),
  ]);

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="Content Creator Engine"
      subtitle="Kaynak tabanlı özgün içerik üretimi ve örnek bankası yönetimi."
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
        <div className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">
          <Sparkles size={15} />
          Benzer ama özgün içerik üret
        </div>
      </div>

      <ContentEngine
        initialSources={recentSources.map((source) => ({
          id: source.id,
          title: source.title,
          sourceType: source.sourceType,
          sourceUrl: source.sourceUrl,
          mimeType: source.mimeType,
          tags: source.tags,
          createdAt: source.createdAt.toISOString(),
          excerpt: source.extractedText.slice(0, 220),
        }))}
        initialRuns={recentRuns.map((run) => ({
          id: run.id,
          title: run.title,
          status: run.status,
          isApproved: run.isApproved,
          approvedAt: run.approvedAt?.toISOString() ?? null,
          isPublished: run.isPublished,
          publishedAt: run.publishedAt?.toISOString() ?? null,
          itemType: run.itemType,
          outputFormat: run.outputFormat,
          itemCount: run.itemCount,
          sourceCount: run.sourceIds.length,
          createdAt: run.createdAt.toISOString(),
          summary: run.styleAnalysis?.slice(0, 220) ?? null,
          generatedPreview: run.generatedText?.slice(0, 320) ?? null,
          distributionTarget: inferPublishedModule(run.itemType),
        }))}
      />
    </DashboardShell>
  );
}