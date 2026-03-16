"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  CalendarDays,
  CreditCard,
  GraduationCap,
  Languages,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Settings,
  Shield,
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
  "/vocabulary": Languages,
  "/reading": BookOpen,
  "/grammar": GraduationCap,
  "/live-classes": Video,
  "/dashboard/live-recordings": Video,
  "/pricing": CreditCard,
  "/teacher": UserCog,
  "/admin": Shield,
  "/admin/users": Users,
  "/admin/readings": Library,
  "/admin/grammar": GraduationCap,
  "/admin/vocabulary": Languages,
  "/admin/live-classes": CalendarDays,
  "/admin/live-recordings": Video,
  "/admin/plans": CreditCard,
  "/admin/crm": Users,
  "/admin/accounting": CreditCard,
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
  const theme =
    roleTheme[(userRole as keyof typeof roleTheme) ?? "STUDENT"] ??
    roleTheme.STUDENT;

  const sidebarContent = (
    <aside className="flex h-full flex-col">
      {/* Role badge */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
        <span
          className={cn(
            "rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
            theme.badge,
          )}
        >
          {roleLabel}
        </span>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-zinc-500 hover:text-white lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-0.5 px-3 py-4">
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "shrink-0",
                  isActive ? "text-zinc-900" : theme.icon,
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="space-y-2 border-t border-white/8 p-4">
        {userName && (
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
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
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-red-500/8 hover:text-red-400"
        >
          <LogOut size={16} className="shrink-0" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#07101f] transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6 lg:items-start">
          {/* Desktop sidebar */}
          <div className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              {sidebarContent}
            </div>
          </div>

          {/* Main content */}
          <main className="min-w-0 flex-1 space-y-5">
            {/* Mobile top bar */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setOpen(true)}
                className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-white transition hover:bg-white/10"
              >
                <Menu size={20} />
              </button>
              <span
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
                  theme.badge,
                )}
              >
                {roleLabel}
              </span>
            </div>

            {/* Page header */}
            <div
              className={cn("rounded-2xl border p-5 sm:p-6", theme.highlight)}
            >
              <h1 className="text-xl font-black text-white sm:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1.5 text-sm text-zinc-300">{subtitle}</p>
              )}
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}