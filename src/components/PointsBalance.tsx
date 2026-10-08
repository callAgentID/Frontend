"use client";

import Link from "next/link";
import { Clock3, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBillingStatus } from "./BillingStatusProvider";
import { formatMinutes, tierLabel } from "@/lib/billing";

interface PointsBalanceProps {
  collapsed?: boolean;
  className?: string;
}

export function PointsBalance({ collapsed = false, className }: PointsBalanceProps) {
  const { status, loading, error, refresh } = useBillingStatus();
  const balance = status?.balances.find((item) => item.compliance_tier === status.access.compliance_tier);
  const formattedBalance = formatMinutes(balance?.usable_minutes);
  const isUnmetered = status?.access.metered === false;
  const accessLabel = isUnmetered ? "Internal" : status?.access.source === "demo" ? "Demo" : tierLabel(status?.access.compliance_tier);

  if (collapsed) {
    return (
      <Link
        href="/settings/billing"
        title={status ? isUnmetered ? "Internal · unmetered" : `${accessLabel}: ${formattedBalance} usable minutes` : "Billing & minutes"}
        className={cn(
          "w-full flex items-center justify-center p-2.5 rounded-2xl border transition-colors",
          "bg-[#4A7FA7]/10 hover:bg-[#4A7FA7]/20 border-blue-400/20 text-[#F6FAFD]",
          className
        )}
      >
        <Clock3 className="w-4 h-4 text-[#4A7FA7] shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      href="/settings/billing"
      className={cn(
        "group block p-3 rounded-2xl border transition-all duration-200",
        "bg-gradient-to-r from-[#1A3D63]/40 to-[#0A1931]/60 hover:from-[#1A3D63]/60 hover:to-[#0A1931]/80",
        "border-blue-400/20 hover:border-blue-400/40 shadow-sm",
        className
      )}
      title="View organization billing and minute balances"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4A7FA7]/20 border border-blue-400/30 flex items-center justify-center text-[#4A7FA7] group-hover:scale-105 transition-transform shrink-0">
            <Clock3 className="w-4 h-4 text-[#4A7FA7]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]/80 leading-none mb-1">
              {accessLabel} Minutes
            </p>
            <div className="flex items-baseline gap-1.5">
              {loading && !status ? (
                <div className="h-4 w-12 bg-blue-400/20 rounded animate-pulse" />
              ) : error && !status ? (
                <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Error
                </span>
              ) : isUnmetered ? (
                <span className="text-sm font-extrabold text-[#F6FAFD] tracking-tight">Unmetered</span>
              ) : (
                <>
                  <span className="text-base font-extrabold text-[#F6FAFD] tracking-tight">
                    {formattedBalance}
                  </span>
                  <span className="text-[10px] font-semibold text-[#B3CFE5]">
                    usable
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void refresh();
          }}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[#B3CFE5] hover:text-[#F6FAFD] transition-colors"
          title="Refresh minute balance"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-[#4A7FA7]")} />
        </button>
      </div>
    </Link>
  );
}
