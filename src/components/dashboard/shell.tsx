"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CreditCard,
  FileText,
  GraduationCap,
  Languages,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Receipt,
  Search,
  Settings,
  Shield,
  Sparkles,
  UserCog,
  Users,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardNavItem = {
  label: string;
  href: string;
};

type DashboardShellProps = {
  title: string;
  subtitle?: string;
  roleLabel: string;
  navItems: DashboardNavItem[];
  userName?: string;
  userRole?: string;
  children: React.ReactNode;
  /* legacy compat */
  currentPath?: string;
};

const hrefIconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/orders": Receipt,
  "/vocabulary": Languages,
  "/reading": BookOpen,
  "/grammar": GraduationCap,
  "/exam": FileText,
  "/live-classes": Video,
  "/dashboard/live-recordings": Video,
  "/dashboard/content-library": Sparkles,
  "/pricing": CreditCard,
  "/teacher": UserCog,
  "/admin": Shield,
  "/admin/users": Users,
  "/admin/readings": Library,
  "/admin/grammar": GraduationCap,
  "/admin/vocabulary": Languages,
  "/admin/exams": FileText,
  "/admin/exam-sales": CreditCard,
  "/admin/live-classes": CalendarDays,
  "/admin/live-recordings": Video,
  "/admin/plans": CreditCard,
  "/admin/crm": Users,
  "/admin/accounting": CreditCard,
  "/admin/seo": Search,
  "/admin/content-engine": Sparkles,
};

const roleTheme = {
  STUDENT: {
    highlight: "border-blue-500/30 bg-blue-500/8",
    badge: "bg-blue-500/15 text-blue-300 border border-blue-500/25",
    avatar: "bg-blue-500/20 text-blue-300",
    icon: "text-blue-400",
  },
  TEACHER: {
    highlight: "border-emerald-500/30 bg-emerald-500/8",
    badge: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
    avatar: "bg-emerald-500/20 text-emerald-300",
    icon: "text-emerald-400",
  },
  ADMIN: {
    highlight: "border-violet-500/30 bg-violet-500/8",
    badge: "bg-violet-500/15 text-violet-300 border border-violet-500/25",
    avatar: "bg-violet-500/20 text-violet-300",
    icon: "text-violet-400",
  },
};

export function DashboardShell({
  title,
  subtitle,
  roleLabel,
  navItems,
  userName,
  userRole,
  children,
}: DashboardShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const todayLabel = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const theme =
    roleTheme[(userRole as keyof typeof roleTheme) ?? "STUDENT"] ??
    roleTheme.STUDENT;

  const sidebarContent = (
    <aside className="flex h-full flex-col bg-[linear-gradient(180deg,rgba(20,22,30,0.98),rgba(11,13,18,0.96))]">
      <div className="border-b border-white/8 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Workspace
            </div>
            <p className="mt-3 text-base font-black text-white">BilalHocayds</p>
            <p className="mt-1 text-xs text-zinc-500">Premium kontrol yüzeyi</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-zinc-500 transition hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <span
            className={cn(
              "rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]",
              theme.badge,
            )}
          >
            {roleLabel}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            Dashboard
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1 rounded-[26px] border border-white/8 bg-white/[0.025] p-2">
        {navItems.map((item) => {
          const Icon = hrefIconMap[item.href] ?? Settings;
          const isActive =
            pathname === item.href ||
            (item.href.length > 1 &&
              item.href !== "/dashboard" &&
              item.href !== "/teacher" &&
              item.href !== "/admin" &&
              pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-150",
                isActive
                  ? "border border-white/10 bg-[linear-gradient(180deg,rgba(255,244,194,0.94),rgba(212,168,67,0.94))] text-zinc-950 shadow-[0_18px_40px_rgba(212,168,67,0.18)]"
                  : "border border-transparent text-zinc-400 hover:border-white/8 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "shrink-0",
                  isActive ? "text-zinc-950" : theme.icon,
                )}
              />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <ArrowUpRight
                size={14}
                className={cn(
                  "shrink-0 transition",
                  isActive ? "text-zinc-950/70" : "text-zinc-600 group-hover:text-zinc-300",
                )}
              />
            </Link>
          );
        })}
        </div>
      </nav>

      <div className="space-y-3 border-t border-white/8 p-4">
        {userName && (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-bold",
                theme.avatar,
              )}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {userName}
              </p>
              <p className={cn("truncate text-xs", theme.icon)}>{roleLabel}</p>
            </div>
            </div>
            <div className="mt-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              {todayLabel}
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-red-500/20 hover:bg-red-500/8 hover:text-red-400"
        >
          <LogOut size={16} className="shrink-0" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#06080d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(212,168,67,0.12),transparent_28%),radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_24%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-[#0a0d14] transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6 lg:items-start">
          <div className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,22,30,0.96),rgba(12,14,20,0.92))] shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              {sidebarContent}
            </div>
          </div>

          <main className="min-w-0 flex-1 space-y-6">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="rounded-2xl border border-white/12 bg-white/[0.04] p-2.5 text-white transition hover:bg-white/[0.08]"
              >
                <Menu size={20} />
              </button>
              <span
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em]",
                  theme.badge,
                )}
              >
                {roleLabel}
              </span>
            </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                {todayLabel}
              </div>
            </div>

            <div
              className={cn(
                "relative overflow-hidden rounded-[34px] border p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:p-7",
                theme.highlight,
              )}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)] opacity-40" />
              <div className="pointer-events-none absolute -right-10 top-6 h-28 w-28 rounded-full bg-amber-400/10 blur-3xl" />
              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
                    {roleLabel}
                  </div>
                  <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-300">{subtitle}</p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Bugün</p>
                    <p className="mt-1 text-sm font-semibold text-white">{todayLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Çalışma Alanı</p>
                    <p className="mt-1 text-sm font-semibold text-white">Odaklı premium panel</p>
                  </div>
                </div>
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}