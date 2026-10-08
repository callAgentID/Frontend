"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useBillingStatus } from "./BillingStatusProvider";
import { formatBillingDate, formatMinutes, tierLabel } from "@/lib/billing";

function countdown(value: string | null) {
  if (!value) return null;
  const remaining = new Date(value).getTime() - Date.now();
  if (remaining <= 0) return "Expired";
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  return `${days}d ${hours}h left`;
}

export function BillingBadge() {
  const { status } = useBillingStatus();
  const [, tick] = useState(0);
  useEffect(() => {
    if (status?.access.source !== "demo") return;
    const timer = window.setInterval(() => tick((value) => value + 1), 60_000);
    return () => window.clearInterval(timer);
  }, [status?.access.source]);

  if (!status) return null;
  const access = status.access;
  const balance = status.balances.find((item) => item.compliance_tier === access.compliance_tier);
  const label = access.source === "demo" ? "Demo" : access.source === "exempt" ? "Internal" : tierLabel(access.compliance_tier);
  const detail = access.source === "demo"
    ? `${formatMinutes(balance?.demo_minutes)} min · ${countdown(access.expires_at) || ""}`
    : access.source === "exempt"
      ? "Billing exempt"
      : `${formatMinutes(balance?.usable_minutes)} min${access.cancel_at_period_end ? ` · Ends ${formatBillingDate(access.expires_at)}` : ""}`;
  const compactDetail = access.source === "exempt"
    ? "Unmetered"
    : `${formatMinutes(access.source === "demo" ? balance?.demo_minutes : balance?.usable_minutes)} min`;
  const statusColor = access.cancel_at_period_end
    ? "bg-amber-300"
    : access.allowed
      ? "bg-emerald-300"
      : "bg-red-300";

  return <Link
    href="/settings/billing"
    aria-label={`${label}: ${detail}. Open billing settings.`}
    title={`${label} · ${detail}`}
    className="group inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border border-blue-400/15 bg-white/[0.035] px-2.5 text-left transition-colors hover:border-blue-400/30 hover:bg-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6BB6FF]/70"
  >
    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-400/10">
      <ShieldCheck className="h-3.5 w-3.5 text-[#6BB6FF]" />
      <span className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ring-2 ring-[#071426] ${statusColor}`} />
    </span>
    <span className="hidden whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.09em] text-[#D8E7F4] md:inline">{label}</span>
    <span className="hidden h-3 w-px bg-blue-300/15 md:block" aria-hidden="true" />
    <span className="whitespace-nowrap text-[11px] font-semibold tabular-nums text-[#9FBDD6]">{compactDetail}</span>
  </Link>;
}
