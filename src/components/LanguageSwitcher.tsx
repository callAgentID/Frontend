"use client";

import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const locale = useLocale();

  const changeLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1A3D63]/40 border border-[#4A7FA7]/30">
      <Languages className="w-4 h-4 text-[#B3CFE5]/70" />
      <button
        onClick={() => changeLocale('en')}
        className={cn(
          "px-2 py-1 rounded-lg text-xs font-bold transition-all",
          locale === 'en'
            ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] glow"
            : "text-[#B3CFE5]/70 hover:text-[#F6FAFD] hover:bg-[#1A3D63]/40"
        )}
      >
        EN
      </button>
      <button
        onClick={() => changeLocale('de')}
        className={cn(
          "px-2 py-1 rounded-lg text-xs font-bold transition-all",
          locale === 'de'
            ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] glow"
            : "text-[#B3CFE5]/70 hover:text-[#F6FAFD] hover:bg-[#1A3D63]/40"
        )}
      >
        DE
      </button>
    </div>
  );
}
