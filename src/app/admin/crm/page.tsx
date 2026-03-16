import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, UserRound, Users } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/src/auth";
import { DashboardShell } from "@/src/components/dashboard/shell";
import { prisma } from "@/src/lib/prisma";

type LeadRecord = {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  plan: string;
  createdAt: Date;
};

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

async function assertAdmin() {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

async function createLeadAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const plan = String(formData.get("plan") ?? "").trim();

  if (!name || !surname || !phone || !email || !plan) {
    return;
  }

  const prismaAny = prisma as any;

  try {
    await prismaAny.lead.create({
      data: { name, surname, phone, email, plan },
    });
  } catch (error) {
    console.error("Failed to create lead:", error);
  }

  revalidatePath("/admin/crm");
  revalidatePath("/admin");
}

async function updateLeadAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const plan = String(formData.get("plan") ?? "").trim();

  if (!id || !name || !surname || !phone || !email || !plan) {
    return;
  }

  const prismaAny = prisma as any;

  try {
    await prismaAny.lead.update({
      where: { id },
      data: { name, surname, phone, email, plan },
    });
  } catch (error) {
    console.error("Failed to update lead:", error);
  }

  revalidatePath("/admin/crm");
  revalidatePath("/admin");
}

async function deleteLeadAction(formData: FormData) {
  "use server";
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const prismaAny = prisma as any;

  try {
    await prismaAny.lead.delete({ where: { id } });
  } catch (error) {
    console.error("Failed to delete lead:", error);
  }

  revalidatePath("/admin/crm");
  revalidatePath("/admin");
}

export default async function AdminCrmPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const prismaAny = prisma as any;

  const [leads, totalPlans] = await Promise.all([
    prismaAny.lead
      .findMany({
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []) as Promise<LeadRecord[]>,
    prisma.plan.count({ where: { isActive: true } }).catch(() => 0),
  ]);

  const distinctLeadEmails = new Set(leads.map((lead) => lead.email.toLowerCase()));

  return (
    <DashboardShell
      navItems={adminNavItems}
      roleLabel="Admin Paneli"
      title="CRM ve Lead Yönetimi"
      subtitle={`${leads.length} lead kayıtlı · ${distinctLeadEmails.size} benzersiz kişi`}
      userName={session.user.name ?? undefined}
      userRole={session.user.role}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          Geri
        </Link>
        <div className="ml-auto flex flex-wrap gap-2">
          <div className="rounded-xl bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-300">
            {leads.length} Lead
          </div>
          <div className="rounded-xl bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-300">
            {totalPlans} Aktif Plan
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-bold text-white">Yeni Lead Ekle</h2>
        <form action={createLeadAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            name="name"
            required
            placeholder="Ad"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
          <input
            name="surname"
            required
            placeholder="Soyad"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
          <input
            name="phone"
            required
            placeholder="Telefon"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
          <input
            type="email"
            name="email"
            required
            placeholder="E-posta"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
          <div className="flex gap-2">
            <input
              name="plan"
              required
              placeholder="İlgi planı"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
            <button
              type="submit"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
            >
              Ekle
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/8 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[1fr_170px_150px_170px]">
          <span>Lead</span>
          <span className="hidden md:block">Plan</span>
          <span className="hidden md:block">Tarih</span>
          <span>İşlemler</span>
        </div>

        <div className="divide-y divide-white/5">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4 transition hover:bg-white/[0.03] md:grid-cols-[1fr_170px_150px_170px]"
            >
              <div className="min-w-0">
                <form action={updateLeadAction} className="space-y-2">
                  <input type="hidden" name="id" value={lead.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      name="name"
                      defaultValue={lead.name}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-zinc-200"
                    />
                    <input
                      name="surname"
                      defaultValue={lead.surname}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-zinc-200"
                    />
                    <input
                      name="phone"
                      defaultValue={lead.phone}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
                    />
                    <input
                      name="email"
                      defaultValue={lead.email}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><UserRound size={12} />Lead Kaydı</span>
                    <span className="flex items-center gap-1"><Phone size={12} />{lead.phone}</span>
                    <span className="flex items-center gap-1"><Mail size={12} />{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2 md:hidden">
                    <input
                      name="plan"
                      defaultValue={lead.plan}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
                    />
                    <button type="submit" className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10">Kaydet</button>
                  </div>
                </form>
              </div>

              <div className="hidden md:flex md:items-center">
                <form action={updateLeadAction} className="flex w-full items-center gap-2">
                  <input type="hidden" name="id" value={lead.id} />
                  <input type="hidden" name="name" value={lead.name} />
                  <input type="hidden" name="surname" value={lead.surname} />
                  <input type="hidden" name="phone" value={lead.phone} />
                  <input type="hidden" name="email" value={lead.email} />
                  <input
                    name="plan"
                    defaultValue={lead.plan}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
                  />
                  <button type="submit" className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10">Kaydet</button>
                </form>
              </div>

              <div className="hidden md:flex md:items-center">
                <p className="text-xs text-zinc-500">
                  {format(lead.createdAt, "d MMM yyyy", { locale: tr })}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <form action={deleteLeadAction}>
                  <input type="hidden" name="id" value={lead.id} />
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

          {leads.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-zinc-500">
              <Users size={32} className="opacity-50" />
              <p className="text-sm">Henüz lead kaydı bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
