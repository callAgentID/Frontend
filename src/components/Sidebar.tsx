"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
  MessageSquare,
  ShieldCheck,
  Command,
  Layers,
  FileSearch,
  FileCode,
  ShieldAlert,
  ChevronLeft,
  Menu,
  X
} from "lucide-react";
import { cn } from "../lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";

const NAV_ITEMS = [
  { name: "summary", href: "/", icon: LayoutDashboard },
  { name: "callAnalytics", href: "/analytics", icon: BarChart3 },
  { name: "redFlags", href: "/red-flags", icon: ShieldAlert },
  { name: "campaigns", href: "/campaigns", icon: Layers },
  { name: "scripts", href: "/scripts", icon: FileCode },
  { name: "questionnaires", href: "/questionnaires", icon: FileSearch },
  { name: "feed", href: "/conversations", icon: MessageSquare },
  { name: "team", href: "/users", icon: Users },
  { name: "security", href: "/security", icon: ShieldCheck },
  { name: "preferences", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 rounded-xl bg-white/90 backdrop-blur-sm border border-[#1f3a3410] shadow-lg"
      >
        <Menu className="w-6 h-6 text-[#1F3A34]" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "h-screen flex-shrink-0 flex flex-col border-r border-[#1f3a3410] bg-white/40 glass-blur apple-blur transition-all duration-300 fixed lg:relative z-50",
        isCollapsed ? "w-[80px]" : "w-[280px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className={cn("flex flex-col h-full", isCollapsed ? "px-3 py-6" : "p-6")}>
          {/* Header with Close/Collapse */}
          <div className="flex items-center justify-between mb-10 mt-2">
            <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center w-full" : "px-2")}>
              <div className="w-8 h-8 rounded-lg bg-[#1F3A34] flex items-center justify-center shadow-lg shadow-[#1F3A3420]">
                <Command className="text-white w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-lg font-extrabold tracking-tight text-[#1F3A34]">
                    Conversation <span className="opacity-40 font-bold block -mt-1 text-[10px] uppercase tracking-widest leading-none">Intel</span>
                  </h1>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 hover:bg-[#1F3A3408] rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-[#1F3A34]" />
            </button>
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "hidden lg:flex items-center justify-center w-8 h-8 rounded-xl bg-[#1F3A3408] hover:bg-[#1F3A34] hover:text-white transition-all mb-6 shrink-0",
              isCollapsed ? "mx-auto" : "ml-auto"
            )}
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", isCollapsed && "rotate-180")} />
          </button>

          {/* Navigation Groups */}
          <div className="space-y-8 flex-1 overflow-y-auto">
            <div>
              {!isCollapsed && (
                <h2 className="px-4 text-[11px] font-bold uppercase tracking-widest text-[#1F3A3470] mb-4">{t('navigation')}</h2>
              )}
              <nav className="space-y-1">
                {NAV_ITEMS.slice(0, 6).map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center rounded-2xl text-[14px] font-medium transition-all group",
                        isCollapsed ? "justify-center p-2.5" : "gap-3.5 px-4 py-2.5",
                        isActive
                          ? "bg-[#1F3A34] text-white apple-shadow"
                          : "text-[#1F3A34] hover:bg-[#1F3A3408]"
                      )}
                      title={isCollapsed ? t(item.name as any) : undefined}
                    >
                      <Icon
                        className={cn(
                          "w-[18px] h-[18px] opacity-70 shrink-0",
                          isActive ? "text-white" : "text-[#1F3A3470]"
                        )}
                      />
                      {!isCollapsed && t(item.name as any)}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              {!isCollapsed && (
                <h2 className="px-4 text-[11px] font-bold uppercase tracking-widest text-[#1F3A3470] mb-4">{t('management')}</h2>
              )}
              <nav className="space-y-1">
                {NAV_ITEMS.slice(6).map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center rounded-2xl text-[14px] font-medium transition-all group",
                        isCollapsed ? "justify-center p-2.5" : "gap-3.5 px-4 py-2.5",
                        isActive
                          ? "bg-[#1F3A34] text-white apple-shadow"
                          : "text-[#1F3A34] hover:bg-[#1F3A3408]"
                      )}
                      title={isCollapsed ? t(item.name as any) : undefined}
                    >
                      <Icon
                        className={cn(
                          "w-[18px] h-[18px] opacity-70 shrink-0",
                          isActive ? "text-white" : "text-[#1F3A3470]"
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
              "rounded-3xl bg-[#1F3A3408] border border-[#1f3a3408] flex items-center transition-all",
              isCollapsed ? "flex-col gap-2 p-2" : "gap-3 p-4"
            )}>
              <div className="w-9 h-9 rounded-full bg-[#1F3A3420] flex items-center justify-center text-[#1F3A34] font-bold text-xs shrink-0">
                JD
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1F3A34] truncate">John Doe</p>
                  <p className="description text-[10px] text-[#1F3A3480] font-semibold mt-0.5 uppercase tracking-wider truncate">Enterprise Manager</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
