import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { prisma } from "@/src/lib/prisma";

const adminNavItems = [
  { label: "Admin Dashboard", href: "/admin" },
  { label: "Kullanıcılar", href: "/admin/users" },
  { label: "Reading Yönetimi", href: "/admin/readings" },
  { label: "Grammar Yönetimi", href: "/admin/grammar" },
  { label: "Vocabulary Yönetimi", href: "/admin/vocabulary" },
  { label: "Canlı Ders Yönetimi", href: "/admin/live-classes" },
  { label: "Plan Yönetimi", href: "/admin/plans" },
  { label: "CRM & Lead", href: "/admin/crm" },
  { label: "Muhasebe", href: "/admin/accounting" },
  { label: "Öğrenci Modülleri", href: "/dashboard" },
  { label: "Öğretmen Paneli", href: "/teacher" },
];

const roleBadge: Record<string, string> = {
  STUDENT: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  TEACHER: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  ADMIN: "bg-violet-500/15 text-violet-300 border border-violet-500/20",
};

const roleLabel: Record<string, string> = {
  STUDENT: "Öğrenci",
  TEACHER: "Öğretmen",
  ADMIN: "Admin",
};

async function assertAdmin() {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

async function createUserAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const role = String(formData.get("role") ?? "STUDENT") as "STUDENT" | "TEACHER" | "ADMIN";

  if (!name || !email || password.length < 8) {
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      ...(role === "STUDENT" ? { studentProfile: { create: {} } } : {}),
      ...(role === "TEACHER" ? { teacherProfile: { create: {} } } : {}),
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

async function updateUserRoleAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as "STUDENT" | "TEACHER" | "ADMIN";

  if (!userId || !role) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  if (role === "STUDENT") {
    await prisma.studentProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  if (role === "TEACHER") {
    await prisma.teacherProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

async function deleteUserAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) {
    return;
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [users, totalStudents, totalTeachers, totalAdmins] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        image: true,
      },
    }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="Kullanıcı Yönetimi"
      subtitle={`Toplam ${users.length} kullanıcı kayıtlı`}
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      {/* Back + stats */}
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          Geri
        </Link>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Öğrenci", value: totalStudents, color: "bg-blue-500/15 text-blue-300" },
            { label: "Öğretmen", value: totalTeachers, color: "bg-emerald-500/15 text-emerald-300" },
            { label: "Admin", value: totalAdmins, color: "bg-violet-500/15 text-violet-300" },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${s.color}`}
            >
              {s.value} {s.label}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-bold text-white">Yeni Kullanıcı Ekle</h2>
        <form action={createUserAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            name="name"
            required
            placeholder="Ad Soyad"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
          />
          <input
            type="email"
            name="email"
            required
            placeholder="E-posta"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
          />
          <input
            type="password"
            name="password"
            minLength={8}
            required
            placeholder="Şifre (min 8)"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
          />
          <select
            name="role"
            defaultValue="STUDENT"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="STUDENT">Öğrenci</option>
            <option value="TEACHER">Öğretmen</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
          >
            Ekle
          </button>
        </form>
      </div>

      {/* User list */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/8 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:grid-cols-[1fr_200px_140px_170px]">
          <span>Kullanıcı</span>
          <span className="hidden sm:block">E-posta</span>
          <span className="hidden sm:block">Kayıt Tarihi</span>
          <span>Rol / İşlem</span>
        </div>

        <div className="divide-y divide-white/5">
          {users.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 transition hover:bg-white/[0.02] sm:grid-cols-[1fr_200px_140px_170px]"
            >
              {/* Name + avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                  {u.name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {u.name ?? "—"}
                  </p>
                  <p className="truncate text-xs text-zinc-500 sm:hidden">{u.email}</p>
                </div>
              </div>

              {/* Email */}
              <div className="hidden items-center sm:flex">
                <p className="truncate text-sm text-zinc-400">{u.email}</p>
              </div>

              {/* Date */}
              <div className="hidden items-center sm:flex">
                <p className="text-sm text-zinc-500">
                  {format(u.createdAt, "d MMM yyyy", { locale: tr })}
                </p>
              </div>

              {/* Role */}
              <div className="flex items-center gap-2">
                <form action={updateUserRoleAction} className="flex items-center gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <select
                    name="role"
                    defaultValue={u.role}
                    className={`rounded-lg border border-white/10 px-2 py-1 text-xs font-medium ${roleBadge[u.role] ?? "bg-white/10 text-zinc-300"}`}
                  >
                    <option value="STUDENT">Öğrenci</option>
                    <option value="TEACHER">Öğretmen</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10"
                  >
                    Kaydet
                  </button>
                </form>
                <form action={deleteUserAction}>
                  <input type="hidden" name="userId" value={u.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Sil
                  </button>
                </form>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-zinc-500">
              <Users size={32} className="opacity-50" />
              <p className="text-sm">Henüz kayıtlı kullanıcı yok.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
