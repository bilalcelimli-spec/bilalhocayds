import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { getMockExamWorkspaceBySlug } from "@/src/lib/mock-exam-workspace";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function MockExamLandingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  const { slug } = await params;
  const exam = getMockExamWorkspaceBySlug(slug);

  return (
    <DashboardShell navItems={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sınav", href: "/exam" }]} roleLabel={session.user.role === "TEACHER" ? "Öğretmen Paneli" : "Öğrenci Paneli"} title={exam.title} subtitle={exam.subtitle} userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[["Süre", `${exam.durationMinutes} dk`], ["Soru", String(exam.totalQuestions)], ["Seviye", exam.level], ["Kaynak", exam.sourceLabel]].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                <p className="mt-2 text-xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/exam/${exam.slug}/start`} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">Sınavı Başlat</Link>
            <Link href={`/exam/${exam.slug}/book-review/demo-attempt`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/10">Lesson review akışını gör</Link>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}