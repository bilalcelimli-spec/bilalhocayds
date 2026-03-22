import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { startExamAttempt } from "@/src/lib/exam-attempts";
import { getStudentExamWorkspace } from "@/src/lib/exam-workspace";

type PageProps = { params: Promise<{ slug: string }> };

export default async function MockExamStartPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { slug } = await params;
  const workspace = await getStudentExamWorkspace(slug, session.user.id);
  if (!workspace) notFound();

  async function startAction() {
    "use server";

    const actionSession = await getServerSession(authOptions);
    if (!actionSession?.user?.id) {
      redirect("/login");
    }

    const attempt = await startExamAttempt(actionSession.user.id, { slug });
    redirect(`/exam/${slug}/attempt/${attempt.id}`);
  }

  return (
    <DashboardShell navItems={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sınav", href: "/exam" }]} roleLabel="Öğrenci Paneli" title="Sınava başlamadan önce" subtitle="Timer hemen başlar, autosave açıktır" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <h2 className="text-2xl font-black text-white">{workspace.exam.title}</h2>
        <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
          <li>Süre başlatıldığında otomatik olarak attempt kaydı açılır.</li>
          <li>Cevapların otomatik kaydedilir.</li>
          <li>Süre dolduğunda sınav otomatik gönderilir.</li>
          <li>Submission sonrası AI explanation ve live review seçenekleri açılır.</li>
        </ul>
        <form action={startAction} className="mt-6">
          <button type="submit" className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">Gerçek attempt başlat</button>
        </form>
      </div>
    </DashboardShell>
  );
}