"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  BarChart3,
  Command,
  Layers,
  FileSearch,
  FileCode,
  ShieldAlert,
  Settings,
  ChevronLeft,
  Menu,
  X
} from "lucide-react";
import { cn } from "../lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";

const NAV_ITEMS = [
  { name: "admin", href: "/admin", icon: Settings },
  { name: "analysis", href: "/", icon: LayoutDashboard },
  { name: "callAnalytics", href: "/analytics", icon: BarChart3 },
  { name: "redFlags", href: "/red-flags", icon: ShieldAlert },
  { name: "campaigns", href: "/campaigns", icon: Layers },
  { name: "scripts", href: "/scripts", icon: FileCode },
  { name: "questionnaires", href: "/questionnaires", icon: FileSearch },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button - Only show when sidebar is closed */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-5 left-4 z-[60] lg:hidden p-2 rounded-xl bg-[#1A3D63]/95 backdrop-blur-md border border-[#4A7FA7]/30 shadow-xl hover:bg-[#4A7FA7]/90 transition-all"
          title="Open Menu"
        >
          <Menu className="w-5 h-5 text-[#F6FAFD]" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[45] lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "h-screen flex-shrink-0 flex flex-col border-r border-[#4A7FA7]/20 glass-blur apple-blur top-0 left-0 bg-[#0A1931]/95",
        "[transition:width_300ms_ease,transform_300ms_ease]",
        "fixed lg:relative z-[50]",
        isCollapsed ? "w-[80px]" : "w-[280px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className={cn("flex flex-col h-full", isCollapsed ? "px-3 py-6" : "p-6")}>
          {/* Header with Close/Collapse */}
          <div className="flex items-center justify-between mb-10 mt-2">
            <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center w-full" : "px-2")}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center shadow-lg glow">
                <Command className="text-[#F6FAFD] w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-lg font-extrabold tracking-tight text-[#F6FAFD]">
                    Conversation <span className="opacity-60 font-bold block -mt-1 text-[10px] uppercase tracking-widest leading-none text-[#B3CFE5]">Intel</span>
                  </h1>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 hover:bg-[#1A3D63]/40 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-[#B3CFE5]" />
            </button>
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "hidden lg:flex items-center justify-center w-8 h-8 rounded-xl bg-[#1A3D63]/40 hover:bg-[#4A7FA7] hover:text-[#F6FAFD] text-[#B3CFE5] transition-all mb-6 shrink-0 border border-[#4A7FA7]/20",
              isCollapsed ? "mx-auto" : "ml-auto"
            )}
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", isCollapsed && "rotate-180")} />
          </button>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="px-2 py-1">
              {!isCollapsed && (
                <h2 className="px-3 text-[11px] font-bold uppercase tracking-widest text-[#B3CFE5]/60 mb-4">{t('navigation')}</h2>
              )}
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center rounded-full text-[14px] font-medium transition-all group",
                        isCollapsed ? "justify-center p-2.5" : "gap-3.5 px-4 py-2.5",
                        isActive
                          ? "bg-gradient-to-r from-[#4A7FA7] to-[#4A7FA7] text-[#F6FAFD] border border-[#4A7FA7]/40 rounded-full"
                          : "text-[#B3CFE5] hover:bg-[#1A3D63]/40 border border-transparent hover:border-[#4A7FA7]/20"
                      )}
                      title={t(item.name as any)}
                    >
                      <Icon
                        className={cn(
                          "w-[18px] h-[18px] opacity-70 shrink-0",
                          isActive ? "text-[#F6FAFD]" : "text-[#B3CFE5]/70"
                        )}
                      />
                      {!isCollapsed && t(item.name as any)}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Language Switcher & User Section */}
          <div className={cn("mt-auto space-y-3", isCollapsed ? "" : "px-2")}>
            {!isCollapsed && <LanguageSwitcher />}

            <div className={cn(
              "rounded-3xl bg-[#1A3D63]/40 border border-[#4A7FA7]/30 flex items-center transition-all glow",
              isCollapsed ? "flex-col gap-2 p-2" : "gap-3 p-4"
            )}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-[#F6FAFD] font-bold text-xs shrink-0 shadow-lg">
                JD
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#F6FAFD] truncate">John Doe</p>
                  <p className="description text-[10px] text-[#B3CFE5]/70 font-semibold mt-0.5 uppercase tracking-wider truncate">Enterprise Manager</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
