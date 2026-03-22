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

  const examTitle = workspace.exam.title;
  const examTitleLower = examTitle.toLowerCase();
  const examCefrLevel = (workspace.exam.cefrLevel ?? "").toUpperCase();
  const initialCefrLevel = (["A2", "B1", "B2", "C1"] as const).includes(examCefrLevel as "A2" | "B1" | "B2" | "C1")
    ? (examCefrLevel as "A2" | "B1" | "B2" | "C1")
    : undefined;
  const adaptiveSkillType = examTitleLower.includes("reading") ? "READING" : "GRAMMAR";
  const adaptiveQuestionFormat = examTitleLower.includes("reading") ? "reading_mcq" : "sentence_completion";
  const adaptiveTopicTheme = workspace.exam.sourceLabel ?? examTitle;

  async function startAction() {
    "use server";

    const actionSession = await getServerSession(authOptions);
    if (!actionSession?.user?.id) {
      redirect("/login");
    }

    const attempt = await startExamAttempt(actionSession.user.id, { slug });
    redirect(`/exam/${slug}/attempt/${attempt.id}`);
  }

  async function startAdaptiveAction() {
    "use server";

    const actionSession = await getServerSession(authOptions);
    if (!actionSession?.user?.id) {
      redirect("/login");
    }

    const attempt = await startExamAttempt(actionSession.user.id, {
      slug,
      deliveryMode: "ADAPTIVE",
      adaptiveConfig: {
        skillType: adaptiveSkillType,
        initialCefrLevel,
        topicTheme: adaptiveTopicTheme,
        questionFormat: adaptiveQuestionFormat,
      },
    });
    redirect(`/exam/${slug}/attempt/${attempt.id}`);
  }

  return (
    <DashboardShell navItems={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sınav", href: "/exam" }]} roleLabel="Öğrenci Paneli" title="Sınava başlamadan önce" subtitle="Timer hemen başlar, autosave açıktır" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="grid gap-6 lg:grid-cols-2">
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

        <div className="rounded-[32px] border border-cyan-500/20 bg-[linear-gradient(180deg,rgba(11,25,33,0.96),rgba(10,16,24,0.96))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Adaptive Mode</p>
          <h2 className="mt-2 text-2xl font-black text-white">Seviyeye göre ilerleyen dinamik akış</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
            <li>İlk soru mevcut CEFR seviyene yakın başlar.</li>
            <li>Her cevaptan sonra bir sonraki soru seviyesi yeniden hesaplanır.</li>
            <li>Confidence yeterince yükseldiğinde test erken bitebilir.</li>
            <li>Sonuç ekranında adaptive seviye yolculuğu ayrıca görünür.</li>
          </ul>
          <form action={startAdaptiveAction} className="mt-6">
            <button type="submit" className="inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15">Adaptive attempt başlat</button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}