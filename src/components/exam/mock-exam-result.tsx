import Link from "next/link";

type MockExamResultProps = {
  attemptId: string;
  examSlug: string;
  lessonPriceLabel: string;
  aiExplanationEnabled: boolean;
  result: {
    correctCount: number;
    incorrectCount: number;
    blankCount: number;
    netScore: number | null;
    accuracyPercentage: number | null;
    strongestSection: string | null;
    weakestSection: string | null;
    answers: Array<{
      id: string;
      number: number;
      section: string;
      prompt: string;
      correctAnswer: string;
      selectedAnswer: string | null;
      isCorrect: boolean | null;
    }>;
  };
  previewMode?: boolean;
};

export function MockExamResult({
  attemptId,
  examSlug,
  lessonPriceLabel,
  aiExplanationEnabled,
  result,
  previewMode = false,
}: MockExamResultProps) {
  const incorrectQuestions = result.answers.filter((question) => question.selectedAnswer !== question.correctAnswer);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Result Summary</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[
            ["Net", String(result.netScore ?? 0)],
            ["Doğru", String(result.correctCount)],
            ["Yanlış", String(result.incorrectCount)],
            ["Boş", String(result.blankCount)],
            ["Accuracy", `%${Math.round(result.accuracyPercentage ?? 0)}`],
            ["Attempt", attemptId],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Wrong Answer Review</p>
              <h2 className="mt-2 text-2xl font-black text-white">Yanlış ve geliştirme alanları</h2>
            </div>
            {previewMode ? null : (
              <Link href={`/exam/${examSlug}/attempt/${attemptId}/review`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10">
                Detaylı review aç
              </Link>
            )}
          </div>

          <div className="mt-5 space-y-4">
            {incorrectQuestions.length > 0 ? (
              incorrectQuestions.map((question) => (
                <div key={question.id} className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Soru {question.number} · {question.section}</p>
                    <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
                      {question.selectedAnswer ?? "Boş"} → {question.correctAnswer}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">{question.prompt}</p>
                  {previewMode ? null : (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {aiExplanationEnabled ? (
                        <Link href={`/exam/${examSlug}/attempt/${attemptId}/review`} className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/15">
                          AI Açıklamayı Gör
                        </Link>
                      ) : null}
                      <Link href={`/exam/${examSlug}/book-review/${attemptId}`} className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200">
                        30 Dakika Bilal Hoca ile İncele
                      </Link>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                Bu denemede hatali veya bos soru bulunmuyor.
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-[rgba(18,20,28,0.95)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Performance Insight</p>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              <p><span className="font-semibold text-white">En güçlü alan:</span> {result.strongestSection ?? "Henüz yok"}</p>
              <p><span className="font-semibold text-white">En zayıf alan:</span> {result.weakestSection ?? "Henüz yok"}</p>
              <p>Reading inference ve contrast linker sorularında karar verirken yüzeysel anahtar kelime eşleşmesi yerine bağlam akışını takip etmek gerekiyor.</p>
            </div>
          </div>

          <div className="rounded-[32px] border border-amber-500/20 bg-amber-500/10 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Premium Review</p>
            <h3 className="mt-2 text-2xl font-black text-white">Yanlışlarını Bilal Hoca ile birebir incele</h3>
            <p className="mt-3 text-sm leading-7 text-amber-50/90">Bu denemedeki yanlışlarına göre 30 dakikalık odaklı analiz oturumu planla. Öğretmen ekranında yanlışların ders öncesi hazır açılır.</p>
            <p className="mt-4 text-3xl font-black text-white">{lessonPriceLabel}</p>
            {previewMode ? null : (
              <Link href={`/exam/${examSlug}/book-review/${attemptId}`} className="mt-5 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
                Slot ve ödeme akışını aç
              </Link>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
