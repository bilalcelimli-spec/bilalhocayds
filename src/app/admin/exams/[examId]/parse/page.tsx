import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { FileUp, Sparkles } from "lucide-react";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { getAdminExamWorkspace } from "@/src/lib/exam-workspace";
import { ingestExamPdf } from "@/src/lib/exam-pdf-ingest";

type PageProps = { params: Promise<{ examId: string }> };

type ParseSnapshot = {
  excerpt?: string;
  wordCount?: number;
  estimatedQuestionCandidates?: number;
  parsedQuestionCount?: number;
  sectionHints?: string[];
  sectionCount?: number;
  extractionMethod?: string;
  usedOcr?: boolean;
  usedAi?: boolean;
  warnings?: string[];
  structuredPreview?: Array<{ title?: string; questionCount?: number; hasPassage?: boolean }>;
  extractionDiagnostics?: string[];
};

export default async function AdminExamParsePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const adminUserId = session.user.id;
  const { examId } = await params;
  const workspace = await getAdminExamWorkspace(examId);
  if (!workspace) notFound();

  async function ingestPdfAction(formData: FormData) {
    "use server";

    const pdfFile = formData.get("pdfFile");
    if (!(pdfFile instanceof File)) {
      throw new Error("PDF dosyası bulunamadı.");
    }

    await ingestExamPdf({
      examId,
      file: pdfFile,
      uploadedById: adminUserId,
    });

    revalidatePath(`/admin/exams/${examId}`);
    revalidatePath(`/admin/exams/${examId}/parse`);
    revalidatePath(`/admin/exams/${examId}/mapping`);
    revalidatePath(`/admin/exams/${examId}/questions`);
    redirect(`/admin/exams/${examId}/parse`);
  }

  const latestParseSnapshot = (workspace.activeVersion?.parsedSnapshotJson ?? workspace.activeVersion?.parseJobs[0]?.rawOutputJson) as ParseSnapshot | null;

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="PDF Parse Workspace" subtitle="Upload, OCR fallback ve parse queue ekranı" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="parse" />
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">AI PDF Ingest</h2>
                <p className="mt-2 text-sm leading-7 text-zinc-300">
                  PDF yukle, sistem metni otomatik cikarsin, gerekirse macOS OCR fallback kullansin ve yeni version altinda section ile question taslagi olustursun.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
                v2 pipeline
              </div>
            </div>

            <form action={ingestPdfAction} className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-8 text-center transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.06]">
                <FileUp size={24} className="text-emerald-300" />
                <span className="text-sm font-semibold text-white">PDF dosyasi yukle</span>
                <span className="text-xs leading-6 text-zinc-400">
                  Sınav kitapçığı veya soru PDF’i yükleyebilirsin. Sistem metni çıkarır, OCR fallback dener, sonra structured section ve question taslağı üretir.
                </span>
                <input type="file" name="pdfFile" accept="application/pdf,.pdf" required className="block text-xs text-zinc-400 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-black hover:file:bg-zinc-200" />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
                <p>Tarama PDF’lerde native text extraction zayıfsa macOS Vision OCR fallback devreye girer. Sonuçlar yine de admin review ile doğrulanmalıdır.</p>
                <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200">
                  <Sparkles size={14} />
                  PDF ingest başlat
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">Son ingest özeti</h2>
            {latestParseSnapshot ? (
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Word count</p>
                    <p className="mt-2 text-lg font-bold text-white">{latestParseSnapshot.wordCount ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Question hints</p>
                    <p className="mt-2 text-lg font-bold text-white">{latestParseSnapshot.estimatedQuestionCandidates ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Parsed questions</p>
                    <p className="mt-2 text-lg font-bold text-white">{latestParseSnapshot.parsedQuestionCount ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Section hints</p>
                    <p className="mt-2 text-sm font-semibold text-white">{latestParseSnapshot.sectionHints?.join(", ") || "-"}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Extraction</p>
                    <p className="mt-2 text-sm font-semibold text-white">{latestParseSnapshot.extractionMethod ?? "-"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">OCR</p>
                    <p className="mt-2 text-sm font-semibold text-white">{latestParseSnapshot.usedOcr ? "Used" : "Not needed"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">AI parse</p>
                    <p className="mt-2 text-sm font-semibold text-white">{latestParseSnapshot.usedAi ? "Structured AI" : "Heuristic fallback"}</p>
                  </div>
                </div>
                {latestParseSnapshot.structuredPreview?.length ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Structured preview</p>
                    <div className="mt-3 space-y-2 text-sm text-zinc-300">
                      {latestParseSnapshot.structuredPreview.map((section, index) => (
                        <div key={`${section.title ?? "section"}-${index}`} className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white">{section.title ?? "Section"}</span>
                          <span>· {section.questionCount ?? 0} soru</span>
                          <span>· passage: {section.hasPassage ? "var" : "yok"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {latestParseSnapshot.extractionDiagnostics?.length ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-amber-100">Extraction notes</p>
                    <div className="mt-3 space-y-2 text-sm text-amber-50/90">
                      {latestParseSnapshot.extractionDiagnostics.map((item, index) => (
                        <p key={`${item}-${index}`}>{item}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {latestParseSnapshot.warnings?.length ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-amber-100">Review warnings</p>
                    <div className="mt-3 space-y-2 text-sm text-amber-50/90">
                      {latestParseSnapshot.warnings.map((warning, index) => (
                        <p key={`${warning}-${index}`}>{warning}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Extract preview</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                    {latestParseSnapshot.excerpt || "Henüz preview oluşmadı."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/exams/${examId}/mapping`} className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/15">
                    Mapping ekranına geç
                  </Link>
                  <Link href={`/admin/exams/${examId}/questions`} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white">
                    Question editor aç
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-zinc-500">
                Henüz ingest snapshot oluşmadı. PDF yüklediğinde burada çıkarılan metnin özeti görünecek.
              </div>
            )}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ["Upload", `${workspace.activeVersion?.assets.length ?? 0} asset kaydı`],
            ["Parse", `${workspace.activeVersion?.parseJobs.length ?? 0} parse job`],
            ["Review", `${workspace.activeVersion?.questions.filter((question) => !question.isVerified).length ?? 0} doğrulanmamış soru`],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold text-white">Son parse job kayıtları</h2>
          <div className="mt-4 space-y-3">
            {workspace.activeVersion?.parseJobs.length ? workspace.activeVersion.parseJobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{job.status}</span>
                  <span>· low confidence: {job.lowConfidenceCount}</span>
                  <span>· provider: {job.provider ?? "-"}</span>
                </div>
                {typeof job.rawOutputJson === "object" && job.rawOutputJson && "parsedQuestionCount" in job.rawOutputJson ? (
                  <p className="mt-2 text-xs leading-6 text-zinc-500">
                    parsed questions: {String((job.rawOutputJson as { parsedQuestionCount?: number }).parsedQuestionCount ?? 0)}
                  </p>
                ) : null}
                {typeof job.rawOutputJson === "object" && job.rawOutputJson && "excerpt" in job.rawOutputJson ? (
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-6 text-zinc-500">
                    {String((job.rawOutputJson as { excerpt?: string }).excerpt ?? "")}
                  </p>
                ) : null}
              </div>
            )) : <div className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-zinc-500">Henüz parse job oluşmadı.</div>}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold text-white">Son asset kayıtları</h2>
          <div className="mt-4 space-y-3">
            {workspace.activeVersion?.assets.length ? workspace.activeVersion.assets.map((asset) => (
              <div key={asset.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{asset.assetType}</span>
                  <span>· {asset.originalFileName ?? asset.storageKey}</span>
                  <span>· {asset.fileSizeBytes ? `${Math.round(asset.fileSizeBytes / 1024)} KB` : "-"}</span>
                </div>
                <a href={`/${asset.storageKey}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs text-cyan-300 hover:text-cyan-200">
                  Kaynağı aç
                </a>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-zinc-500">Henüz asset kaydı oluşmadı.</div>}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}