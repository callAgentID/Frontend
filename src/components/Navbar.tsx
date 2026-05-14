import { Search, Bell, Plus } from "lucide-react";
import { useTranslations } from 'next-intl';

export function Navbar() {
  const t = useTranslations('common');

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-8 glass-blur border-b border-[#4A7FA7]/20 sticky top-0 z-10 backdrop-blur-xl">
      {/* Page Context */}
      <div className="flex-1 flex items-center gap-6">
        <div className="flex items-center gap-2">
           <h3 className="text-sm font-bold text-[#F6FAFD]">{t('summaryOverview')}</h3>
           <span className="w-1 h-1 rounded-full bg-[#4A7FA7] hidden sm:block" />
           <span className="text-xs font-bold text-[#B3CFE5]/70 uppercase tracking-wider hidden sm:block">{t('dashboard')}</span>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-4">
        {/* Minimalist Search */}
        <div className="relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3CFE5]/60 group-focus-within:text-[#4A7FA7] transition-colors" />
          <input
            type="text"
            placeholder={t('searchIntelligence')}
            className="w-48 h-8 pl-9 pr-4 bg-[#1A3D63]/40 border border-[#4A7FA7]/20 rounded-lg text-xs font-medium focus:outline-none focus:w-64 focus:bg-[#1A3D63]/60 focus:glow focus:border-[#4A7FA7]/40 transition-all placeholder:text-[#B3CFE5]/50 text-[#F6FAFD]"
          />
        </div>

        <button className="w-8 h-8 rounded-lg text-[#B3CFE5]/80 hover:text-[#F6FAFD] hover:bg-[#4A7FA7]/30 flex items-center justify-center transition-all bg-[#1A3D63]/40 border border-[#4A7FA7]/20">
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[#4A7FA7]/20 mx-1" />

        <button className="w-8 h-8 rounded-lg text-[#B3CFE5]/80 hover:text-[#F6FAFD] hover:glow flex items-center justify-center transition-all bg-[#1A3D63]/40 border border-[#4A7FA7]/20 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#4A7FA7] rounded-full animate-pulse" />
        </button>
      </div>
    </header>
  );
}
