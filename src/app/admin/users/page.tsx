import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound, Users } from "lucide-react";
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
  { label: "Canlı Ders Kayıtları", href: "/admin/live-recordings" },
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

const studentFeatureLabels = {
  hasReadingAccess: "Reading",
  hasGrammarAccess: "Grammar",
  hasVocabAccess: "Vocabulary",
  hasExamAccess: "Tam sınav modülü",
  hasLiveClassesAccess: "Canlı ders",
  hasLiveRecordingsAccess: "Canlı ders kayıtları",
  hasContentLibraryAccess: "İçerik kütüphanesi",
  hasAIPlannerAccess: "AI çalışma planı",
} as const;

type StudentFeatureKey = keyof typeof studentFeatureLabels;
type StudentFeatureConfig = Record<StudentFeatureKey, boolean>;
type AdminUserRecord = {
  id: string;
  name: string | null;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  createdAt: Date;
  image: string | null;
  studentFeatureAccess: StudentFeatureConfig | null;
  studentFeatureExamAccesses: Array<{
    examModule: {
      id: string;
      title: string;
      isPublished: boolean;
      isActive: boolean;
    };
  }>;
  subscriptions: Array<{
    id: string;
    plan: {
      name: string;
      includesReading: boolean;
      includesGrammar: boolean;
      includesVocab: boolean;
      includesExam: boolean;
      includesLiveClass: boolean;
      includesAIPlanner: boolean;
      examModules: Array<{
        examModule: {
          id: string;
          title: string;
          isPublished: boolean;
          isActive: boolean;
        };
      }>;
    };
  }>;
};

const studentFeatureKeys = Object.keys(studentFeatureLabels) as StudentFeatureKey[];

const emptyStudentFeatureConfig: StudentFeatureConfig = {
  hasReadingAccess: false,
  hasGrammarAccess: false,
  hasVocabAccess: false,
  hasExamAccess: false,
  hasLiveClassesAccess: false,
  hasLiveRecordingsAccess: false,
  hasContentLibraryAccess: false,
  hasAIPlannerAccess: false,
};

function readStudentFeatureConfig(formData: FormData): StudentFeatureConfig {
  return studentFeatureKeys.reduce<StudentFeatureConfig>((config, key) => {
    config[key] = formData.get(key) === "on";
    return config;
  }, { ...emptyStudentFeatureConfig });
}

function readExamAccessIds(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("examAccessIds")
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function hasAnyStudentFeatureAccess(config: StudentFeatureConfig, examAccessIds: string[]) {
  return Object.values(config).some(Boolean) || examAccessIds.length > 0;
}

function revalidateStudentAccessPaths() {
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/content-library");
  revalidatePath("/dashboard/live-recordings");
  revalidatePath("/reading");
  revalidatePath("/grammar");
  revalidatePath("/vocabulary");
  revalidatePath("/exam");
  revalidatePath("/live-classes");
}

async function syncStudentFeatureAccess(
  userId: string,
  config: StudentFeatureConfig,
  examAccessIds: string[],
) {
  await prisma.studentFeatureAccess.upsert({
    where: { userId },
    update: config,
    create: {
      userId,
      ...config,
    },
  });

  await prisma.studentFeatureExamAccess.deleteMany({ where: { userId } });

  if (examAccessIds.length > 0) {
    await prisma.studentFeatureExamAccess.createMany({
      data: examAccessIds.map((examModuleId) => ({ userId, examModuleId })),
      skipDuplicates: true,
    });
  }
}

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

  if (!name || !email || password.length < 8 || !["STUDENT", "TEACHER", "ADMIN"].includes(role)) {
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      ...(role === "STUDENT" ? { studentProfile: { create: {} } } : {}),
      ...(role === "TEACHER" ? { teacherProfile: { create: {} } } : {}),
    },
    select: { id: true },
  });

  if (role === "STUDENT") {
    await syncStudentFeatureAccess(
      createdUser.id,
      readStudentFeatureConfig(formData),
      readExamAccessIds(formData),
    );
  }

  revalidateStudentAccessPaths();
}

async function updateUserRoleAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as "STUDENT" | "TEACHER" | "ADMIN";

  if (!userId || !role || !["STUDENT", "TEACHER", "ADMIN"].includes(role)) {
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

  revalidateStudentAccessPaths();
}

async function updateStudentFeatureAccessAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "STUDENT") {
    return;
  }

  await syncStudentFeatureAccess(
    userId,
    readStudentFeatureConfig(formData),
    readExamAccessIds(formData),
  );

  revalidateStudentAccessPaths();
}

async function clearStudentFeatureAccessAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    return;
  }

  await prisma.studentFeatureExamAccess.deleteMany({ where: { userId } });
  await prisma.studentFeatureAccess.deleteMany({ where: { userId } });

  revalidateStudentAccessPaths();
}

async function updateUserPasswordAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const userId = String(formData.get("userId") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!userId || password.length < 8) {
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  revalidatePath("/admin/users");
}

async function deleteUserAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) {
    return;
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidateStudentAccessPaths();
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();
  const [users, totalStudents, totalTeachers, totalAdmins, examOptions] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        image: true,
        studentFeatureAccess: {
          select: {
            hasReadingAccess: true,
            hasGrammarAccess: true,
            hasVocabAccess: true,
            hasExamAccess: true,
            hasLiveClassesAccess: true,
            hasLiveRecordingsAccess: true,
            hasContentLibraryAccess: true,
            hasAIPlannerAccess: true,
          },
        },
        studentFeatureExamAccesses: {
          orderBy: { createdAt: "asc" },
          select: {
            examModule: {
              select: {
                id: true,
                title: true,
                isPublished: true,
                isActive: true,
              },
            },
          },
        },
        subscriptions: {
          where: {
            status: { in: ["ACTIVE", "TRIALING"] },
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            plan: {
              select: {
                name: true,
                includesReading: true,
                includesGrammar: true,
                includesVocab: true,
                includesExam: true,
                includesLiveClass: true,
                includesAIPlanner: true,
                examModules: {
                  select: {
                    examModule: {
                      select: {
                        id: true,
                        title: true,
                        isPublished: true,
                        isActive: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    } as never) as unknown as Promise<AdminUserRecord[]>,
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.examModule.findMany({
      orderBy: [{ isPublished: "desc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        isPublished: true,
        isActive: true,
      },
    }),
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
          ].map((item) => (
            <div key={item.label} className={`rounded-xl px-3 py-2 text-sm font-semibold ${item.color}`}>
              {item.value} {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Yeni Öğrenci / Kullanıcı Ekle</h2>
            <p className="mt-1 text-xs text-zinc-400">
              Admin burada şifre belirleyebilir ve öğrenci için manuel erişim profili tanımlayabilir.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300">
            Kaydettiğin öğrenciye abonelikten bağımsız yetki verebilirsin.
          </div>
        </div>

        <form action={createUserAction} className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
              Kullanıcıyı Ekle
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Öğrenci Manuel Yetkileri</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Bu alan sadece rolü öğrenci olan kullanıcı için uygulanır.
                </p>
              </div>
              <span className="text-xs text-zinc-500">İstersen boş bırak; öğrenciye başlangıçta hiç yetki verme.</span>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {studentFeatureKeys.map((key) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
                  <input type="checkbox" name={key} />
                  {studentFeatureLabels[key]}
                </label>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Özel sınav erişimi</p>
              <p className="mt-1 text-xs text-zinc-400">
                Tam sınav modülünü açmadan yalnızca seçtiğin sınavları erişime açabilirsin.
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {examOptions.map((exam) => (
                  <label key={exam.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
                    <input type="checkbox" name="examAccessIds" value={exam.id} />
                    <span>
                      {exam.title}
                      {!exam.isPublished ? " (taslak)" : ""}
                      {!exam.isActive ? " - pasif" : ""}
                    </span>
                  </label>
                ))}
                {examOptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 px-3 py-2 text-xs text-zinc-500">
                    Henüz tanımlı sınav bulunmuyor.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {users.map((user) => {
          const activeSubscription = user.subscriptions[0] ?? null;
          const hasManualAccessConfig = Boolean(user.studentFeatureAccess);
          const effectiveFeatureConfig: StudentFeatureConfig = hasManualAccessConfig
            ? {
                hasReadingAccess: Boolean(user.studentFeatureAccess?.hasReadingAccess),
                hasGrammarAccess: Boolean(user.studentFeatureAccess?.hasGrammarAccess),
                hasVocabAccess: Boolean(user.studentFeatureAccess?.hasVocabAccess),
                hasExamAccess: Boolean(user.studentFeatureAccess?.hasExamAccess),
                hasLiveClassesAccess: Boolean(user.studentFeatureAccess?.hasLiveClassesAccess),
                hasLiveRecordingsAccess: Boolean(user.studentFeatureAccess?.hasLiveRecordingsAccess),
                hasContentLibraryAccess: Boolean(user.studentFeatureAccess?.hasContentLibraryAccess),
                hasAIPlannerAccess: Boolean(user.studentFeatureAccess?.hasAIPlannerAccess),
              }
            : {
                hasReadingAccess: Boolean(activeSubscription?.plan.includesReading),
                hasGrammarAccess: Boolean(activeSubscription?.plan.includesGrammar),
                hasVocabAccess: Boolean(activeSubscription?.plan.includesVocab),
                hasExamAccess: Boolean(activeSubscription?.plan.includesExam),
                hasLiveClassesAccess: Boolean(activeSubscription?.plan.includesLiveClass),
                hasLiveRecordingsAccess: Boolean(activeSubscription?.plan.includesLiveClass),
                hasContentLibraryAccess: Boolean(activeSubscription),
                hasAIPlannerAccess: Boolean(activeSubscription?.plan.includesAIPlanner),
              };
          const effectiveExamAccess = hasManualAccessConfig
            ? user.studentFeatureExamAccesses.map((item) => item.examModule)
            : activeSubscription?.plan.examModules.map((item) => item.examModule) ?? [];
          const enabledFeatureLabels = studentFeatureKeys
            .filter((key) => effectiveFeatureConfig[key])
            .map((key) => studentFeatureLabels[key]);
          const manualEnabledCount = hasManualAccessConfig
            ? studentFeatureKeys.filter((key) => Boolean(user.studentFeatureAccess?.[key])).length +
              (user.studentFeatureExamAccesses.length > 0 ? 1 : 0)
            : 0;
          const studentHasAnyAccess = hasAnyStudentFeatureAccess(effectiveFeatureConfig, effectiveExamAccess.map((exam) => exam.id));

          return (
            <div key={user.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                      {user.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-zinc-100">{user.name ?? "İsimsiz Kullanıcı"}</p>
                        <span className={`rounded-lg px-2 py-1 text-xs font-medium ${roleBadge[user.role] ?? "bg-white/10 text-zinc-300"}`}>
                          {user.role === "STUDENT" ? "Öğrenci" : user.role === "TEACHER" ? "Öğretmen" : "Admin"}
                        </span>
                        {user.role === "STUDENT" ? (
                          <span className={`rounded-lg px-2 py-1 text-xs font-medium ${studentHasAnyAccess ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                            {studentHasAnyAccess ? "Erişim var" : "Erişim yok"}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Kayıt: {format(user.createdAt, "d MMM yyyy", { locale: tr })}
                      </p>
                    </div>
                  </div>

                  {user.role === "STUDENT" ? (
                    <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Aktif Öğrenci Yetkisi</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {hasManualAccessConfig
                              ? `Manuel profil aktif · ${manualEnabledCount} yetki tanımlı`
                              : activeSubscription
                                ? `${activeSubscription.plan.name} planından devralınıyor`
                                : "Henüz abonelik veya manuel yetki tanımlı değil"}
                          </p>
                        </div>
                        {hasManualAccessConfig ? (
                          <form action={clearStudentFeatureAccessAction}>
                            <input type="hidden" name="userId" value={user.id} />
                            <button type="submit" className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20">
                              Manuel ayarı kaldır
                            </button>
                          </form>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {enabledFeatureLabels.map((label) => (
                          <span key={`${user.id}-${label}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                            {label}
                          </span>
                        ))}
                        {effectiveExamAccess.map((exam) => (
                          <span key={`${user.id}-${exam.id}`} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                            Sınav: {exam.title}
                          </span>
                        ))}
                        {enabledFeatureLabels.length === 0 && effectiveExamAccess.length === 0 ? (
                          <span className="rounded-full border border-dashed border-white/10 px-3 py-1 text-xs text-zinc-500">
                            Bu öğrenci için şu an açık bir özellik yok.
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <form action={updateUserRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className={`rounded-lg border border-white/10 px-2 py-2 text-xs font-medium ${roleBadge[user.role] ?? "bg-white/10 text-zinc-300"}`}
                    >
                      <option value="STUDENT">Öğrenci</option>
                      <option value="TEACHER">Öğretmen</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button type="submit" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10">
                      Rolü Kaydet
                    </button>
                  </form>

                  <form action={deleteUserAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <button type="submit" className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10">
                      Sil
                    </button>
                  </form>
                </div>
              </div>

              <div className={`mt-5 grid gap-4 ${user.role === "STUDENT" ? "xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]" : "xl:grid-cols-1"}`}>
                {user.role === "STUDENT" ? (
                  <form action={updateStudentFeatureAccessAction} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <input type="hidden" name="userId" value={user.id} />
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Öğrenci yetkilerini düzenle</p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Kaydettiğinde bu öğrenci için manuel yetki profili oluşturulur ve abonelikten gelen erişim yerine bu profil kullanılır.
                        </p>
                      </div>
                      <span className="text-xs text-zinc-500">İstediğini aç, istediğini kapat, istersen sadece belirli sınavlar ver.</span>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                      {studentFeatureKeys.map((key) => (
                        <label key={`${user.id}-${key}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
                          <input
                            type="checkbox"
                            name={key}
                            defaultChecked={effectiveFeatureConfig[key]}
                          />
                          {studentFeatureLabels[key]}
                        </label>
                      ))}
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Özel sınav erişimi</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {examOptions.map((exam) => {
                          const isChecked = effectiveExamAccess.some((item) => item.id === exam.id);
                          return (
                            <label key={`${user.id}-${exam.id}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
                              <input
                                type="checkbox"
                                name="examAccessIds"
                                value={exam.id}
                                defaultChecked={isChecked}
                              />
                              <span>
                                {exam.title}
                                {!exam.isPublished ? " (taslak)" : ""}
                                {!exam.isActive ? " - pasif" : ""}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button type="submit" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">
                        Yetkileri Kaydet
                      </button>
                      <p className="text-xs text-zinc-500">
                        Manuel profil oluşturursan öğrenci erişimi artık doğrudan bu ayarlardan okunur.
                      </p>
                    </div>
                  </form>
                ) : null}

                <form action={updateUserPasswordAction} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <input type="hidden" name="userId" value={user.id} />
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-zinc-300">
                      <KeyRound size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">Şifre belirle / değiştir</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Admin bu kullanıcı için doğrudan yeni şifre atayabilir.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="password"
                      name="password"
                      minLength={8}
                      required
                      placeholder="Yeni şifre (min 8 karakter)"
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                    />
                    <button type="submit" className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10">
                      Şifreyi Güncelle
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })}

        {users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-12 text-zinc-500">
            <Users size={32} className="opacity-50" />
            <p className="text-sm">Henüz kayıtlı kullanıcı yok.</p>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
