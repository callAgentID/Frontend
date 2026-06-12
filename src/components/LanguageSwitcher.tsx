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
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass">
      <Languages className="w-4 h-4 text-[#B3CFE5]/70" />
      <button
        onClick={() => changeLocale('en')}
        className={cn(
          "px-2 py-1 rounded-lg text-xs font-bold transition-colors",
          locale === 'en'
            ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] glow"
            : "text-[#B3CFE5]/70 hover:text-[#F6FAFD] hover:bg-blue-950/18"
        )}
      >
        EN
      </button>
      <button
        onClick={() => changeLocale('de')}
        className={cn(
          "px-2 py-1 rounded-lg text-xs font-bold transition-colors",
          locale === 'de'
            ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] glow"
            : "text-[#B3CFE5]/70 hover:text-[#F6FAFD] hover:bg-blue-950/18"
        )}
      >
        DE
      </button>
    </div>
  );
}
