"use client";

import { Search, Bell, Plus } from "lucide-react";
import { useTranslations } from 'next-intl';
import { OrganizationSwitcher } from "@clerk/nextjs";

export function Navbar() {
  const t = useTranslations('common');

  return (
    <>
      <style>{`
        .navbar-root {
          background: rgba(4, 12, 30, 0.90);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          margin: 10px 10px 0 10px;
          color: #EEF4FF;
        }
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

        /* Light mode overrides */
        html.light .navbar-root {
          background: rgba(230,238,250,0.94);
          border-color: rgba(26,111,212,0.12);
          color: #0D1B2E;
        }
        html.light .navbar-btn {
          background: rgba(26,111,212,0.06);
          border-color: rgba(26,111,212,0.14);
        }
        html.light .navbar-btn:hover {
          background: rgba(26,111,212,0.14);
          border-color: rgba(26,111,212,0.28);
        }
        html.light .navbar-search {
          background: rgba(255,255,255,0.80);
          border-color: rgba(26,111,212,0.14);
        }
        html.light .navbar-search:focus {
          background: rgba(255,255,255,0.95);
          border-color: rgba(26,111,212,0.35);
        }

        /* Clerk OrganizationSwitcher overrides */
        .cl-organizationSwitcherTrigger {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 10px !important;
          color: var(--text-primary) !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          height: 32px !important;
          padding: 0 10px !important;
          gap: 6px !important;
        }
        .cl-organizationSwitcherTrigger:hover {
          background: rgba(44,143,255,0.12) !important;
          border-color: rgba(44,143,255,0.22) !important;
        }
        html.light .cl-organizationSwitcherTrigger {
          background: rgba(26,111,212,0.06) !important;
          border-color: rgba(26,111,212,0.14) !important;
          color: #0D1B2E !important;
        }
        .cl-organizationPreviewTextContainer { color: inherit !important; }
        .cl-organizationPreviewMainIdentifier { font-size: 12px !important; font-weight: 600 !important; }
        .cl-organizationSwitcherPopoverCard {
          background: #0A1931 !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 16px !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
        }
        html.light .cl-organizationSwitcherPopoverCard {
          background: #ffffff !important;
          border-color: rgba(26,111,212,0.15) !important;
        }
        .cl-organizationSwitcherPopoverActionButton {
          border-radius: 10px !important;
          font-size: 12px !important;
        }
      `}</style>

      <header
        className="navbar-root h-12 flex items-center justify-between px-4 relative overflow-hidden flex-shrink-0"
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
          {/* Organization switcher */}
          <div className="hidden sm:block">
            <OrganizationSwitcher
              hidePersonal={true}
              afterCreateOrganizationUrl="/"
              afterSelectOrganizationUrl="/"
              afterLeaveOrganizationUrl="/"
            />
          </div>

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
