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
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1F3A3408] border border-[#1f3a3408]">
      <Languages className="w-4 h-4 text-[#1F3A3460]" />
      <button
        onClick={() => changeLocale('en')}
        className={cn(
          "px-2 py-1 rounded-lg text-xs font-bold transition-all",
          locale === 'en'
            ? "bg-[#1F3A34] text-white"
            : "text-[#1F3A3460] hover:text-[#1F3A34]"
        )}
      >
        EN
      </button>
      <button
        onClick={() => changeLocale('de')}
        className={cn(
          "px-2 py-1 rounded-lg text-xs font-bold transition-all",
          locale === 'de'
            ? "bg-[#1F3A34] text-white"
            : "text-[#1F3A3460] hover:text-[#1F3A34]"
        )}
      >
        DE
      </button>
    </div>
  );
}
