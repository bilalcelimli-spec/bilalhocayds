import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { AdminExamWorkspaceNav } from "@/src/components/exam/admin-exam-workspace-nav";
import { cancelReviewBooking, completeReviewBooking, parseReviewBookingNotes, updateReviewBookingSchedule } from "@/src/lib/exam-review-bookings";
import { formatCurrency, getAdminExamWorkspace } from "@/src/lib/exam-workspace";
import { prisma } from "@/src/lib/prisma";

type PageProps = { params: Promise<{ examId: string }> };

function toDateTimeLocalValue(value: Date | null) {
  if (!value) {
    return "";
  }

  const localValue = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return localValue.toISOString().slice(0, 16);
}

export default async function AdminExamBookingsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const { examId } = await params;
  const [workspace, teachers] = await Promise.all([
    getAdminExamWorkspace(examId),
    prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        teacherProfile: {
          select: {
            expertise: true,
            isActive: true,
          },
        },
      },
    }),
  ]);
  if (!workspace) notFound();
  const examSlug = workspace.exam.slug;

  async function updateBookingAction(formData: FormData) {
    "use server";

    const actionSession = await getServerSession(authOptions);
    if (!actionSession || actionSession.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const bookingId = String(formData.get("bookingId") ?? "").trim();
    const teacherIdRaw = String(formData.get("teacherId") ?? "").trim();
    const scheduledStartAt = String(formData.get("scheduledStartAt") ?? "").trim();
    const teacherPrepNote = String(formData.get("teacherPrepNote") ?? "").trim();

    if (!bookingId) {
      return;
    }

    await updateReviewBookingSchedule({
      bookingId,
      teacherId: teacherIdRaw || null,
      scheduledStartAt: scheduledStartAt || null,
      teacherPrepNote: teacherPrepNote || null,
    });

    revalidatePath(`/admin/exams/${examId}/bookings`);
    revalidatePath(`/exam/${examSlug}`);
    revalidatePath("/teacher");
  }

  async function completeBookingAction(formData: FormData) {
    "use server";

    const actionSession = await getServerSession(authOptions);
    if (!actionSession || actionSession.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const bookingId = String(formData.get("bookingId") ?? "").trim();
    if (!bookingId) {
      return;
    }

    await completeReviewBooking(bookingId);
    revalidatePath(`/admin/exams/${examId}/bookings`);
    revalidatePath("/teacher");
  }

  async function cancelBookingAction(formData: FormData) {
    "use server";

    const actionSession = await getServerSession(authOptions);
    if (!actionSession || actionSession.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const bookingId = String(formData.get("bookingId") ?? "").trim();
    if (!bookingId) {
      return;
    }

    await cancelReviewBooking(bookingId);
    revalidatePath(`/admin/exams/${examId}/bookings`);
    revalidatePath("/teacher");
  }

  return (
    <DashboardShell navItems={[{ label: "Admin Dashboard", href: "/admin" }, { label: "Sınav Yönetimi", href: "/admin/exams" }]} roleLabel="Admin Paneli" title="Lesson Review Bookings" subtitle="Attempt-linked live review scheduling workspace" userName={session.user.name ?? undefined} userRole={session.user.role}>
      <div className="space-y-6">
        <AdminExamWorkspaceNav examId={examId} activeKey="bookings" />
        <div className="space-y-3">
          {workspace.recentBookings.length ? workspace.recentBookings.map((booking) => {
            const parsedNotes = parseReviewBookingNotes(booking.lessonNotes);

            return (
              <form key={booking.id} action={updateBookingAction} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm leading-7 text-zinc-300">
                <input type="hidden" name="bookingId" value={booking.id} />
                <p className="font-semibold text-white">{booking.student.name ?? booking.student.email}</p>
                <p className="mt-2">Status: {booking.status} · Teacher: {booking.teacher?.name ?? "Atanmadı"}</p>
                <p>Price: {formatCurrency(booking.priceAmount, booking.currency)} · Payment: {booking.payments[0]?.status ?? "Henüz ödeme yok"}</p>
                {parsedNotes.studentNote ? <p className="mt-1 text-xs text-zinc-500">Öğrenci notu: {parsedNotes.studentNote}</p> : null}
                {parsedNotes.lessonSummary ? <p className="mt-1 text-xs text-zinc-500">Ders özeti hazır</p> : null}
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <select name="teacherId" defaultValue={booking.teacherId ?? ""} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
                    <option value="">Öğretmen seç...</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {(teacher.name ?? teacher.email) + (teacher.teacherProfile?.expertise ? ` · ${teacher.teacherProfile.expertise}` : "")}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    name="scheduledStartAt"
                    defaultValue={toDateTimeLocalValue(booking.scheduledStartAt)}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200"
                  />
                </div>
                <textarea
                  name="teacherPrepNote"
                  rows={3}
                  defaultValue={parsedNotes.teacherPrepNote ?? ""}
                  placeholder="Operasyon / öğretmen hazırlık notu"
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200"
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="submit" className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20">
                    Atama ve slotu kaydet
                  </button>
                  <button type="submit" formAction={completeBookingAction} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20">
                    Tamamlandı işaretle
                  </button>
                  <button type="submit" formAction={cancelBookingAction} className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/20">
                    İptal et
                  </button>
                </div>
              </form>
            );
          }) : <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm leading-7 text-zinc-500">Henüz booking oluşmadı.</div>}
        </div>
      </div>
    </DashboardShell>
  );
}