import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { SEO_PAGE_PRESETS } from "@/src/lib/seo-presets";
import { resolveSiteUrl } from "@/src/lib/site-url";
import SeoEditor from "@/src/components/admin/seo-editor";

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
  { label: "Öğrenci Modülleri", href: "/dashboard" },
  { label: "Öğretmen Paneli", href: "/teacher" },
];

export default async function AdminSeoPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/login");
  }

  let dbError: string | null = null;
  let configs: Array<{
    id: string;
    pageKey: string;
    pageLabel: string;
    pagePath: string | null;
    title: string | null;
    description: string | null;
    primaryKeyword: string | null;
    secondaryKeywords: string | null;
    searchIntent: string | null;
    keywords: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    ogType: string | null;
    twitterTitle: string | null;
    twitterDescription: string | null;
    twitterImage: string | null;
    twitterCard: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
    noFollow: boolean;
    noArchive: boolean;
    noSnippet: boolean;
    maxSnippet: number | null;
    maxVideoPreview: number | null;
    maxImagePreview: string | null;
    robotsDirectives: string | null;
    breadcrumbTitle: string | null;
    schemaType: string | null;
    schemaMarkup: string | null;
    sitemapPriority: number | null;
    changeFrequency: string | null;
    customHeadTags: string | null;
    contentNotes: string | null;
    updatedAt: Date;
    createdAt: Date;
  }> = [];

  try {
    configs = await prisma.seoConfig.findMany({
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("[admin/seo] Failed to load seo configs", error);
    dbError = "SEO veritabani tablosu okunamadi. Migrasyon eksikse `prisma migrate deploy` veya gelistirme ortaminda `prisma db push` calistirin.";
  }

  const siteUrl = resolveSiteUrl();
  const configuredCount = configs.filter((c) => c.title || c.description || c.schemaMarkup).length;
  const totalPages = SEO_PAGE_PRESETS.length;

  // Serialize for client component
  const serialized = configs.map((c) => ({
    ...c,
    updatedAt: c.updatedAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Admin Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                  item.href === "/admin/seo"
                    ? "bg-amber-400/15 text-amber-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="border-b border-white/10 px-6 py-6">
          <h1 className="text-3xl font-black text-white">SEO Yönetimi</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Her sayfa için ayrı meta etiketleri, Open Graph verileri ve JSON-LD schema tanımlayın.
            AI butonu ile otomatik SEO önerisi alın.
          </p>
        </div>

        {dbError ? (
          <div className="mx-6 mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
            {dbError}
          </div>
        ) : null}

        {/* Coverage stats */}
        <div className="flex flex-wrap gap-4 px-6 py-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 px-5 py-3">
            <p className="text-xs text-zinc-400">Toplam Sayfa</p>
            <p className="text-2xl font-black text-white">{totalPages}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 px-5 py-3">
            <p className="text-xs text-zinc-400">SEO Konfigürasyonu</p>
            <p className="text-2xl font-black text-emerald-400">{configuredCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 px-5 py-3">
            <p className="text-xs text-zinc-400">Eksik Yapılandırma</p>
            <p className="text-2xl font-black text-amber-400">{Math.max(totalPages - configuredCount, 0)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 px-5 py-3">
            <p className="text-xs text-zinc-400">noindex Sayfası</p>
            <p className="text-2xl font-black text-red-400">{configs.filter((c) => c.noIndex).length}</p>
          </div>
        </div>

        {/* SEO Editor */}
        <SeoEditor initialConfigs={serialized} siteUrl={siteUrl} />
      </div>
    </div>
  );
}
