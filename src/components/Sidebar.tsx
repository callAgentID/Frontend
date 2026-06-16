"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, BarChart3, Layers, FileSearch, FileCode,
  ShieldAlert, Settings, Users, LogOut, ChevronLeft, Menu, X, Package
} from "lucide-react";
import { cn } from "../lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useClerk, useUser } from "@clerk/nextjs";
import { useCurrentUser } from "@/lib/useCurrentUser";

// Static styles defined outside component — never recreated on render
const SIDEBAR_STYLE = {
  background: 'rgba(4, 12, 30, 0.88)', // more opaque = cheaper blur needed
  backdropFilter: 'blur(8px)',          // was 20px — 8px is ~4x cheaper
  WebkitBackdropFilter: 'blur(8px)',
  borderColor: 'rgba(255, 255, 255, 0.06)',
  borderRightWidth: '1px',
  contain: 'layout style',             // isolate layout from rest of page
} as const;

const NAV_ACTIVE_STYLE = {
  background: 'rgba(44, 143, 255, 0.16)',
  border: '1px solid rgba(44, 143, 255, 0.28)',
  color: '#E8F3FF',
} as const;

const NAV_INACTIVE_STYLE = {
  border: '1px solid transparent',
  color: 'var(--text-secondary)',
} as const;

type NavRole = "all" | "admin" | "admin_manager";

const NAV_ITEMS: { name: string; href: string; icon: any; roles: NavRole }[] = [
  { name: "admin", href: "/admin", icon: Settings, roles: "admin" },
  { name: "users", href: "/users", icon: Users, roles: "admin_manager" },
  { name: "analysis", href: "/", icon: LayoutDashboard, roles: "all" },
  { name: "callAnalytics", href: "/analytics", icon: BarChart3, roles: "all" },
  { name: "batches", href: "/batches", icon: Package, roles: "all" },
  { name: "redFlags", href: "/red-flags", icon: ShieldAlert, roles: "all" },
  { name: "campaigns", href: "/campaigns", icon: Layers, roles: "all" },
  { name: "scripts", href: "/scripts", icon: FileCode, roles: "all" },
  { name: "questionnaires", href: "/questionnaires", icon: FileSearch, roles: "all" },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(v => {
      const next = !v;
      document.body.classList.toggle('sidebar-collapsed', next);
      return next;
    });
  };
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const { role: backendRole } = useCurrentUser();

  const initials = user
    ? (((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase()
      || user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || "U")
    : "U";
  const displayName = user
    ? (user.fullName || user.emailAddresses[0]?.emailAddress || "User")
    : "User";
  const role = backendRole?.toLowerCase() ?? "user"; // "admin" | "manager" | "user"

  const canSee = (itemRoles: NavRole) => {
    if (role === "super_admin") return true;
    if (itemRoles === "all") return true;
    if (itemRoles === "admin") return role === "admin";
    if (itemRoles === "admin_manager") return role === "admin" || role === "manager";
    return false;
  };

  return (
    <>
      {/* Mobile hamburger */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-[60] lg:hidden w-10 h-10 rounded-2xl glass
            flex items-center justify-center text-[var(--text-primary)]"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[45] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Sidebar — floating pill ───────── */}
      <aside
        className={cn(
          "flex flex-col overflow-hidden",
          /* Float with margin on all sides */
          "fixed z-[50]",
          "top-3 bottom-3 left-3",
          "[transition:width_200ms_ease,transform_200ms_ease]",
          isCollapsed ? "w-[68px]" : "w-[240px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+12px)] lg:translate-x-0"
        )}
        style={{
          ...SIDEBAR_STYLE,
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Top glint */}
        <div className="absolute top-0 inset-x-0 h-px rounded-t-[20px] bg-white/[0.09] pointer-events-none" />

        <div className={cn("flex flex-col h-full", isCollapsed ? "px-3 py-5" : "px-4 py-5")}>

          {/* Logo */}
          <div className={cn("flex items-center justify-between ", isCollapsed && "mb-5")}>
            <div className={cn("flex items-center", isCollapsed && "justify-center w-full")}>
              {isCollapsed ? (
                <div style={{ borderRadius: 12, padding: '4px', boxShadow: '0 0 18px rgba(255,255,255,0.28), 0 2px 8px rgba(0,0,0,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Image src="/CallBlick-Logo.png" alt="CallBlick" width={30} height={30} loading="eager" className="object-contain" style={{ width: 30, height: 'auto', display: 'block' }} />
                </div>
              ) : (
                <div style={{ borderRadius: 12, padding: '6px 2.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 'full' }}>
                  <Image src="/CallBlick-Logo-Final.png" alt="CallBlick" width={150} height={32} loading="eager" className="object-contain" style={{ width: 120, height: 'auto', display: 'block' }} />
                </div>
              )}
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-tertiary)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Collapse btn */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "hidden lg:flex w-7 h-7 rounded-xl items-center justify-center mb-4 shrink-0",
              "bg-white/[0.05] border border-white/[0.08] text-[var(--text-tertiary)]",
              "hover:bg-white/[0.09] hover:text-[var(--text-secondary)]",
              isCollapsed ? "mx-auto" : "ml-auto"
            )}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform duration-200", isCollapsed && "rotate-180")} />
          </button>

          {/* Nav label */}
          {!isCollapsed && (
            <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              {t('navigation')}
            </p>
          )}

          {/* Nav items — CSS handles hover, no inline handlers */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-0.5 sidebar-nav">
            {NAV_ITEMS.filter(item => canSee(item.roles)).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed ? t(item.name as any) : undefined}
                  className={cn(
                    "sidebar-nav-item flex items-center rounded-2xl text-[13px] font-medium relative overflow-hidden",
                    isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                    isActive ? "sidebar-nav-active" : "sidebar-nav-inactive"
                  )}
                  style={isActive ? NAV_ACTIVE_STYLE : NAV_INACTIVE_STYLE}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--accent)]" />
                  )}
                  <Icon
                    className="w-[16px] h-[16px] shrink-0"
                    style={{ opacity: isActive ? 1 : 0.5, color: isActive ? 'var(--accent)' : 'inherit' }}
                  />
                  {!isCollapsed && <span className="truncate">{t(item.name as any)}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="mt-4 space-y-2">
            {!isCollapsed && <LanguageSwitcher />}

            <Link
              href="/users"
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center rounded-2xl overflow-hidden border border-white/[0.07]",
                "bg-white/[0.04] hover:bg-white/[0.07]",
                isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-3",
                pathname === "/users" && "bg-blue-500/15 border-blue-400/25"
              )}
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl} alt={displayName}
                  width={32} height={32}
                  className="rounded-full shrink-0 object-cover ring-1 ring-white/10"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--accent), #1060B8)' }}
                >
                  {initials}
                </div>
              )}

              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate leading-tight text-[var(--text-primary)]">{displayName}</p>
                    <p className="text-[10px] uppercase tracking-wider truncate mt-0.5 text-[var(--text-tertiary)]">
                      {backendRole ?? "Member"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); signOut({ redirectUrl: "/sign-in" }); }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[var(--text-tertiary)] hover:text-red-400"
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {isCollapsed && (
                <button
                  onClick={(e) => { e.preventDefault(); signOut({ redirectUrl: "/sign-in" }); }}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-400"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </Link>
          </div>
        </div>
      </aside>

      {/* CSS hover styles for nav items — avoids inline JS handlers */}
      <style>{`
        .sidebar-nav-inactive:hover {
          background: rgba(44,143,255,0.08) !important;
          border-color: rgba(44,143,255,0.14) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
    </>
  );
}
