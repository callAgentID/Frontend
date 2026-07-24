"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Zap, RefreshCw, AlertCircle } from "lucide-react";
import { usePoints } from "@/lib/usePoints";
import { cn } from "@/lib/utils";

interface PointsBalanceProps {
  collapsed?: boolean;
  className?: string;
}

export function PointsBalance({ collapsed = false, className }: PointsBalanceProps) {
  const { getOrgBalance } = usePoints();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOrgBalance();
      const raw = data.available_points ?? data.balance ?? 0;
      const numBalance = typeof raw === "number" ? raw : parseFloat(String(raw) || "0");
      setBalance(isNaN(numBalance) ? 0 : numBalance);
    } catch (err: any) {
      console.error("Failed to load points balance:", err);
      setError(err?.message || "Failed to load balance");
    } finally {
      setIsLoading(false);
    }
  }, [getOrgBalance]);

  useEffect(() => {
    fetchBalance();
    // Refresh balance every 60 seconds
    const interval = setInterval(fetchBalance, 60000);
    const handlePointsUpdated = () => fetchBalance();
    window.addEventListener("points-updated", handlePointsUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener("points-updated", handlePointsUpdated);
    };
  }, [fetchBalance]);

  const formattedBalance = balance !== null ? balance.toFixed(2) : "—";
  const formattedMinutes = balance !== null ? `${Math.floor(balance)}m` : "";

  if (collapsed) {
    return (
      <Link
        href="/points"
        title={balance !== null ? `Organization Points: ${formattedBalance} (${formattedMinutes} min)` : "Points Balance"}
        className={cn(
          "w-full flex items-center justify-center p-2.5 rounded-2xl border transition-colors",
          "bg-[#4A7FA7]/10 hover:bg-[#4A7FA7]/20 border-blue-400/20 text-[#F6FAFD]",
          className
        )}
      >
        <Zap className="w-4 h-4 text-[#4A7FA7] shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      href="/points"
      className={cn(
        "group block p-3 rounded-2xl border transition-all duration-200",
        "bg-gradient-to-r from-[#1A3D63]/40 to-[#0A1931]/60 hover:from-[#1A3D63]/60 hover:to-[#0A1931]/80",
        "border-blue-400/20 hover:border-blue-400/40 shadow-sm",
        className
      )}
      title="View detailed organization points & usage"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4A7FA7]/20 border border-blue-400/30 flex items-center justify-center text-[#4A7FA7] group-hover:scale-105 transition-transform shrink-0">
            <Zap className="w-4 h-4 text-[#4A7FA7]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]/80 leading-none mb-1">
              Points Balance
            </p>
            <div className="flex items-baseline gap-1.5">
              {isLoading && balance === null ? (
                <div className="h-4 w-12 bg-blue-400/20 rounded animate-pulse" />
              ) : error ? (
                <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Error
                </span>
              ) : (
                <>
                  <span className="text-base font-extrabold text-[#F6FAFD] tracking-tight">
                    {formattedBalance}
                  </span>
                  <span className="text-[10px] font-semibold text-[#B3CFE5]">
                    pts ({formattedMinutes})
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
            fetchBalance();
          }}
          disabled={isLoading}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[#B3CFE5] hover:text-[#F6FAFD] transition-colors"
          title="Refresh points balance"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-[#4A7FA7]")} />
        </button>
      </div>
    </Link>
  );
}