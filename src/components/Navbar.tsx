import { Search, Bell, Menu, Plus } from "lucide-react";
import { useTranslations } from 'next-intl';

export function Navbar() {
  const t = useTranslations('common');

  return (
    <header className="h-14 flex items-center justify-between px-8 bg-white/40 border-b border-[#1f3a3408] glass-blur apple-blur sticky top-0 z-10">
      {/* Page Context */}
      <div className="flex-1 flex items-center gap-6">
        <button className="lg:hidden p-2 text-[#1F3A3480] hover:text-[#1F3A34] transition-colors rounded-xl hover:bg-[#1f3a3408]">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden lg:flex items-center gap-2">
           <h3 className="text-sm font-bold text-[#1F3A34]">{t('summaryOverview')}</h3>
           <span className="w-1 h-1 rounded-full bg-[#1F3A3420]" />
           <span className="text-xs font-bold text-[#1F3A3470] uppercase tracking-wider">{t('dashboard')}</span>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-4">
        {/* Minimalist Search */}
        <div className="relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3A3460] group-focus-within:text-[#1F3A34] transition-colors" />
          <input
            type="text"
            placeholder={t('searchIntelligence')}
            className="w-48 h-8 pl-9 pr-4 bg-[#1F3A3408] border border-transparent rounded-lg text-xs font-medium focus:outline-none focus:w-64 focus:bg-white focus:apple-shadow focus:border-[#1f3a3410] transition-all placeholder:text-[#1F3A3470] text-[#1F3A34]"
          />
        </div>

        <button className="w-8 h-8 rounded-lg text-[#1F3A3480] hover:text-white hover:bg-[#1F3A34] flex items-center justify-center transition-all bg-[#1F3A3408] border border-transparent">
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[#1f3a3410] mx-1" />

        <button className="w-8 h-8 rounded-lg text-[#1F3A3480] hover:text-[#1F3A34] flex items-center justify-center transition-all bg-[#1F3A3408] border border-transparent">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
