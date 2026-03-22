import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, User } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { getExamAttemptResult } from "@/src/lib/exam-attempts";
import { completeReviewBooking, getReviewFollowUpActionLabel, mergeReviewBookingNotes, parseReviewBookingNotes, REVIEW_FOLLOW_UP_ACTIONS } from "@/src/lib/exam-review-bookings";
import { formatCurrency } from "@/src/lib/exam-workspace";
import { prisma } from "@/src/lib/prisma";

const teacherNavItems = [
  { label: "Dashboard", href: "/teacher" },
  { label: "Paylaşılan İçerikler", href: "/dashboard/content-library" },
  { label: "Reading Modülü", href: "/reading" },
  { label: "Grammar Modülü", href: "/grammar" },
  { label: "Vocabulary Modülü", href: "/vocabulary" },
  { label: "Sınav Modülü", href: "/exam" },
  { label: "Canlı Dersler", href: "/live-classes" },
  { label: "Admin Paneli", href: "/admin" },
];

type PageProps = { params: Promise<{ bookingId: string }> };

export default async function TeacherReviewBookingWorkspacePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role !== "TEACHER") redirect("/dashboard");

  const { bookingId } = await params;
  const booking = await prisma.examReviewBooking.findFirst({
    where: {
      id: bookingId,
      teacherId: session.user.id,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      examModule: {
        select: {
          id: true,
          title: true,
          slug: true,
          lessonReviewPrice: true,
          lessonCurrency: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!booking) notFound();

  const result = await getExamAttemptResult(booking.student.id, booking.attemptId).catch(() => null);
  if (!result) notFound();
  const bookingExamId = booking.examModule.id;
  const initialLessonNotes = booking.lessonNotes;
  const parsedNotes = parseReviewBookingNotes(booking.lessonNotes);

  const focusedAnswers = result.answers.filter((answer) => {
    if (booking.selectedQuestionIds.length > 0) {
      return booking.selectedQuestionIds.includes(answer.id);
    }

    return answer.selectedAnswer !== answer.correctAnswer;
  });

  async function saveLessonNotesAction(formData: FormData) {
    "use server";

    const actionSession = await getServerSession(authOptions);
    if (!actionSession || actionSession.user.role !== "TEACHER") {
      throw new Error("Unauthorized");
    }

    const teacherPrepNote = String(formData.get("teacherPrepNote") ?? "").trim();
    const lessonSummary = String(formData.get("lessonSummary") ?? "").trim();
    const followUpActionValue = String(formData.get("followUpAction") ?? "").trim();

    await prisma.examReviewBooking.updateMany({
      where: {
        id: bookingId,
        teacherId: actionSession.user.id,
      },
      data: {
        lessonNotes: mergeReviewBookingNotes(initialLessonNotes, {
          teacherPrepNote: teacherPrepNote || null,
          lessonSummary: lessonSummary || null,
          followUpAction: REVIEW_FOLLOW_UP_ACTIONS.includes(followUpActionValue as (typeof REVIEW_FOLLOW_UP_ACTIONS)[number])
            ? (followUpActionValue as (typeof REVIEW_FOLLOW_UP_ACTIONS)[number])
            : null,
        }),
      },
    });

    revalidatePath(`/teacher/review-bookings/${bookingId}`);
    revalidatePath("/teacher");
    revalidatePath(`/admin/exams/${bookingExamId}/bookings`);
  }

  async function markCompletedAction() {
    "use server";

    const actionSession = await getServerSession(authOptions);
    if (!actionSession || actionSession.user.role !== "TEACHER") {
      throw new Error("Unauthorized");
    }

    const ownedBooking = await prisma.examReviewBooking.findFirst({
      where: {
        id: bookingId,
        teacherId: actionSession.user.id,
      },
      select: { id: true },
    });

    if (!ownedBooking) {
      throw new Error("BOOKING_NOT_FOUND");
    }

    await completeReviewBooking(bookingId);
    revalidatePath(`/teacher/review-bookings/${bookingId}`);
    revalidatePath("/teacher");
    revalidatePath(`/admin/exams/${bookingExamId}/bookings`);
  }

  return (
    <DashboardShell
      navItems={teacherNavItems}
      roleLabel="Öğretmen Paneli"
      title="Exam Review Workspace"
      subtitle={`${booking.student.name ?? booking.student.email} · ${booking.examModule.title}`}
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/teacher" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10">
            <ArrowLeft size={14} />
            Panele dön
          </Link>
          <Link href={`/exam/${booking.examModule.slug}/attempt/${booking.attemptId}/result`} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20">
            Öğrenci result ekranı
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Öğrenci</p>
            <p className="mt-2 text-lg font-bold text-white">{booking.student.name ?? booking.student.email}</p>
            <p className="mt-1 text-sm text-zinc-400">{booking.student.email}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Randevu</p>
            <p className="mt-2 text-lg font-bold text-white">{booking.status}</p>
            <p className="mt-1 text-sm text-zinc-400">{booking.scheduledStartAt ? format(booking.scheduledStartAt, "d MMMM yyyy · HH:mm", { locale: tr }) : "Henüz slot yok"}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Ödeme</p>
            <p className="mt-2 text-lg font-bold text-white">{formatCurrency(booking.priceAmount, booking.currency)}</p>
            <p className="mt-1 text-sm text-zinc-400">{booking.payments[0]?.status ?? "Ödeme kaydı yok"}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Sonuç</p>
            <p className="mt-2 text-lg font-bold text-white">Net {result.netScore ?? 0}</p>
            <p className="mt-1 text-sm text-zinc-400">{result.incorrectCount + result.blankCount} yanlış veya boş</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            {focusedAnswers.length ? focusedAnswers.map((answer) => (
              <article key={answer.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Soru {answer.number} · {answer.section}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${answer.selectedAnswer === answer.correctAnswer ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                    {answer.selectedAnswer ?? "Boş"} → {answer.correctAnswer}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{answer.prompt}</p>
                <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Açıklama</p>
                  <p className="mt-3 text-sm font-semibold text-white">{answer.explanationDetail?.shortReason ?? `Doğru cevap: ${answer.correctAnswer}`}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-200">{answer.explanationDetail?.detailed ?? answer.explanation ?? "Bu soru için kayıtlı açıklama bulunmuyor."}</p>
                  <p className="mt-3 text-sm text-cyan-100">Exam tip: {answer.explanationDetail?.examTip ?? "Öğrenciyi önce soru kökü ve eleme mantığına geri döndür."}</p>
                </div>
              </article>
            )) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
                Bu booking için odaklanacak yanlış soru bulunamadı.
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Session Brief</p>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <p className="flex items-center gap-2"><User size={14} className="text-emerald-300" /> {booking.student.name ?? booking.student.email}</p>
                <p className="flex items-center gap-2"><Clock3 size={14} className="text-amber-300" /> {booking.durationMinutes} dakika</p>
                <p className="flex items-center gap-2"><CalendarDays size={14} className="text-cyan-300" /> {booking.scheduledStartAt ? format(booking.scheduledStartAt, "d MMMM yyyy · HH:mm", { locale: tr }) : "Öğrenci slotu bekleniyor"}</p>
                {parsedNotes.studentNote ? <p className="text-xs text-zinc-400">Öğrenci notu: {parsedNotes.studentNote}</p> : null}
                {parsedNotes.followUpAction ? <p className="text-xs text-zinc-400">Takip aksiyonu: {getReviewFollowUpActionLabel(parsedNotes.followUpAction)}</p> : null}
              </div>
            </div>

            <form action={saveLessonNotesAction} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Öğretmen Çalışma Notu</p>
              <textarea
                name="teacherPrepNote"
                rows={5}
                defaultValue={parsedNotes.teacherPrepNote ?? ""}
                placeholder="Ders oncesi plan veya seans icin hazirlik notu"
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200"
              />
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-zinc-500">Ders Özeti</p>
              <textarea
                name="lessonSummary"
                rows={5}
                defaultValue={parsedNotes.lessonSummary ?? ""}
                placeholder="Derste ne calisildi, hangi hata kaliplari tekrar etti"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200"
              />
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-zinc-500">Takip Aksiyonu</p>
              <select
                name="followUpAction"
                defaultValue={parsedNotes.followUpAction ?? ""}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200"
              >
                <option value="">Aksiyon sec...</option>
                {REVIEW_FOLLOW_UP_ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {getReviewFollowUpActionLabel(action)}
                  </option>
                ))}
              </select>
              <button type="submit" className="mt-4 inline-flex rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20">
                Çalışma notlarını kaydet
              </button>
            </form>

            {booking.status !== "COMPLETED" ? (
              <form action={markCompletedAction} className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                <p className="text-sm leading-7 text-emerald-100">Ders tamamlandıysa booking kaydını kapatabilirsin. Bu işlem admin görünümünü de günceller.</p>
                <button type="submit" className="mt-4 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-200">
                  Tamamlandı işaretle
                </button>
              </form>
            ) : null}
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}