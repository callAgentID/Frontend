"use client";

import { Search, Bell, Plus } from "lucide-react";
import { useTranslations } from 'next-intl';

const NAVBAR_STYLE = {
  background: 'rgba(4, 12, 30, 0.90)', // high opacity = blur barely needed
  backdropFilter: 'blur(6px)',          // was 16px
  WebkitBackdropFilter: 'blur(6px)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
  margin: '10px 10px 0 10px',
  contain: 'layout style',
} as const;

export function Navbar() {
  const t = useTranslations('common');

  return (
    <>
      <style>{`
        .navbar-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-secondary);
          transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .navbar-btn:hover {
          background: rgba(44,143,255,0.12);
          border-color: rgba(44,143,255,0.22);
          color: var(--text-primary);
        }
        .navbar-search {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-primary);
          transition: background-color 0.12s ease, border-color 0.12s ease;
        }
        .navbar-search:focus {
          background: rgba(44,143,255,0.10);
          border-color: rgba(44,143,255,0.25);
          outline: none;
        }
        .navbar-search::placeholder { color: var(--text-tertiary); }
      `}</style>

      <header
        className="h-12 flex items-center justify-between px-4 relative overflow-hidden flex-shrink-0"
        style={NAVBAR_STYLE}
      >
        {/* Top glint */}
        <div className="absolute top-0 inset-x-0 h-px bg-white/[0.08] pointer-events-none rounded-t-2xl" />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 pl-8 lg:pl-0">
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            {t('summaryOverview')}
          </span>
          <span className="w-1 h-1 rounded-full bg-blue-400/40 hidden sm:block" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] hidden sm:block">
            {t('dashboard')}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)] pointer-events-none" />
            <input
              type="text"
              placeholder={t('searchIntelligence')}
              className="navbar-search h-8 w-40 pl-8 pr-3 rounded-xl text-xs font-medium"
            />
          </div>

          <button className="navbar-btn w-8 h-8 rounded-xl flex items-center justify-center" title="New">
            <Plus className="w-4 h-4" />
          </button>

          <button className="navbar-btn w-8 h-8 rounded-xl flex items-center justify-center relative" title="Notifications">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          </button>
        </div>
      </header>
    </>
  );
}
