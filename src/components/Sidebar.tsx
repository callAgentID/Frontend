"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ShieldAlert
} from "lucide-react";
import { cn } from "../lib/utils";

const NAV_ITEMS = [
  { name: "Summary", href: "/", icon: LayoutDashboard },
  { name: "Call Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Red Flags", href: "/red-flags", icon: ShieldAlert },
  { name: "Campaigns", href: "/campaigns", icon: Layers },
  { name: "Scripts", href: "/scripts", icon: FileCode },
  { name: "Questionnaires", href: "/questionnaires", icon: FileSearch },
  { name: "Feed", href: "/conversations", icon: MessageSquare },
  { name: "Team", href: "/users", icon: Users },
  { name: "Security", href: "/security", icon: ShieldCheck },
  { name: "Preferences", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] h-screen flex-shrink-0 flex flex-col p-6 border-r border-[#1f3a3410] bg-white/40 glass-blur apple-blur">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-10 mt-2 px-2">
        <div className="w-8 h-8 rounded-lg bg-[#1F3A34] flex items-center justify-center shadow-lg shadow-[#1F3A3420]">
          <Command className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1F3A34]">
            Conversation <span className="opacity-40 font-bold block -mt-1 text-[10px] uppercase tracking-widest leading-none">Intel</span>
          </h1>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="space-y-8 flex-1">
        <div>
          <h2 className="px-4 text-[11px] font-bold uppercase tracking-widest text-[#1F3A3470] mb-4">Navigation</h2>
          <nav className="space-y-1">
            {NAV_ITEMS.slice(0, 6).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[14px] font-medium transition-all group",
                    isActive
                      ? "bg-[#1F3A34] text-white apple-shadow"
                      : "text-[#1F3A34] hover:bg-[#1F3A3408]"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[18px] h-[18px] opacity-70",
                      isActive ? "text-white" : "text-[#1F3A3470]"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <h2 className="px-4 text-[11px] font-bold uppercase tracking-widest text-[#1F3A3470] mb-4">Management</h2>
          <nav className="space-y-1">
            {NAV_ITEMS.slice(6).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[14px] font-medium transition-all group",
                    isActive
                      ? "bg-[#1F3A34] text-white apple-shadow"
                      : "text-[#1F3A34] hover:bg-[#1F3A3408]"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[18px] h-[18px] opacity-70",
                      isActive ? "text-white" : "text-[#1F3A3470]"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Section */}
      <div className="mt-auto px-2">
        <div className="p-4 rounded-3xl bg-[#1F3A3408] border border-[#1f3a3408] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1F3A3420] flex items-center justify-center text-[#1F3A34] font-bold text-xs">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1F3A34] truncate">John Doe</p>
            <p className="description text-[10px] text-[#1F3A3480] font-semibold mt-0.5 uppercase tracking-wider truncate">Enterprise Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
