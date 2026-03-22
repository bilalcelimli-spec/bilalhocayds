import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { getMockExamAttempt } from "@/src/lib/mock-exam-workspace";

type PageProps = { params: Promise<{ slug: string; attemptId: string }> };

export default async function MockExamBookReviewPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { attemptId } = await params;
  const attempt = getMockExamAttempt(attemptId);

  return (
    <DashboardShell navItems={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sınav", href: "/exam" }]} roleLabel="Öğrenci Paneli" title="30 Dakikalık Review Lesson" subtitle="Attempt-linked ödeme ve slot seçimi" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Lesson Value</p>
          <h2 className="mt-2 text-2xl font-black text-white">Yanlışlarını Bilal Hoca ile birebir incele</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
            <li>Bu denemedeki yanlışların ders öncesi otomatik olarak öğretmen paneline aktarılır.</li>
            <li>Reading inference, grammar trap ve vocabulary choice hataları odaklı analiz edilir.</li>
            <li>Ders sonrası kısa öğretmen notu bırakılabilir.</li>
          </ul>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["Duration", "30 dakika"],
              ["Wrong questions", String(attempt.workspace.reviewMetrics.incorrect)],
              ["Price", attempt.workspace.lessonPrice],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                <p className="mt-2 text-lg font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Booking Flow</p>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <p>1. Ödeme intent oluştur</p>
            <p>2. Slot seç</p>
            <p>3. Teacher dashboard'a wrong-answer packet gönder</p>
            <p>4. E-posta ve panel teyidi üret</p>
          </div>
          <Link href={`/exam/${attempt.workspace.slug}/attempt/${attemptId}/result`} className="mt-6 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
            Checkout placeholder
          </Link>
        </aside>
      </div>
    </DashboardShell>
  );
}