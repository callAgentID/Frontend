"use client";

import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, LockKeyhole, RefreshCw, X } from "lucide-react";
import { useApi } from "@/lib/useApi";
import {
  ApiErrorDetail,
  BillingStatus,
  apiErrorMessage,
  decimalIsPositive,
  formatMinutes,
} from "@/lib/billing";

type BillingContextValue = {
  status: BillingStatus | null;
  loading: boolean;
  error: string | null;
  paymentRequired: ApiErrorDetail | null;
  refresh: () => Promise<void>;
  clearPaymentRequired: () => void;
};

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingStatusProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, orgId, userId } = useAuth();
  const { user } = useUser();
  const { apiFetch } = useApi();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [statusUserId, setStatusUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentRequired, setPaymentRequired] = useState<ApiErrorDetail | null>(null);
  const [paymentScope, setPaymentScope] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  const isSuperAdmin = (user?.publicMetadata?.role as string | undefined)?.toLowerCase() === "super_admin";

  const refresh = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !orgId) {
      activeRequest.current?.abort();
      setStatus(null);
      setLoading(false);
      setError(null);
      return;
    }
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    try {
      const response = await apiFetch("/api/v1/billing/status", { signal: controller.signal });
      const body = await response.json().catch(() => null);
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(apiErrorMessage(body, "Could not load billing status.", response.status));
      setStatus(body as BillingStatus);
      setStatusUserId(userId || null);
      window.dispatchEvent(new CustomEvent("billing:status-updated", { detail: body }));
      setError(null);
      if ((body as BillingStatus).access.allowed) setPaymentRequired(null);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Could not load billing status.");
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }, [apiFetch, isLoaded, isSignedIn, orgId, userId]);

  useEffect(() => {
    activeRequest.current?.abort();
    return () => activeRequest.current?.abort();
  }, [orgId, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const paymentHandler = (event: Event) => {
      const custom = event as CustomEvent<{ error?: ApiErrorDetail }>;
      setPaymentRequired(custom.detail?.error || { message: "A subscription is required." });
      setPaymentScope(`${userId || "signed-out"}:${orgId || "no-org"}`);
      void refresh();
    };
    const refreshHandler = () => void refresh();
    window.addEventListener("billing:payment-required", paymentHandler);
    window.addEventListener("billing:refresh", refreshHandler);
    return () => {
      window.removeEventListener("billing:payment-required", paymentHandler);
      window.removeEventListener("billing:refresh", refreshHandler);
    };
  }, [orgId, refresh, userId]);

  const statusMatchesOrganization = !status || (status.access.organization_id === orgId && statusUserId === userId);
  const visibleStatus = statusMatchesOrganization ? status : null;
  const visibleLoading = loading || (!!orgId && !statusMatchesOrganization && !error);
  const currentScope = `${userId || "signed-out"}:${orgId || "no-org"}`;
  const visiblePaymentRequired = paymentScope === currentScope ? paymentRequired : null;
  const value = useMemo<BillingContextValue>(() => ({
    status: visibleStatus,
    loading: visibleLoading,
    error,
    paymentRequired: visiblePaymentRequired,
    refresh,
    clearPaymentRequired: () => {
      setPaymentRequired(null);
      setPaymentScope(null);
    },
  }), [visibleStatus, visibleLoading, error, visiblePaymentRequired, refresh]);

  return <BillingContext.Provider value={value}>
    {children}
    {visiblePaymentRequired && visibleStatus?.access.allowed && !isSuperAdmin && <div className="fixed inset-x-4 bottom-4 z-[9999] mx-auto max-w-2xl rounded-2xl border border-amber-400/25 bg-[#151207]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" /><div className="min-w-0 flex-1"><p className="text-sm font-black text-amber-50">Action needs more billing capacity</p><p className="mt-1 text-sm leading-5 text-amber-100/85">{visiblePaymentRequired.message || "This action requires an active subscription or additional minutes."}</p><Link href="/settings/billing" className="mt-3 inline-block text-sm font-black text-[#9DCEFF]">Review billing & minutes</Link></div><button onClick={() => { setPaymentRequired(null); setPaymentScope(null); }} className="rounded-lg p-1 text-amber-100/70 hover:bg-white/5" aria-label="Dismiss billing message"><X className="h-4 w-4" /></button></div>
    </div>}
  </BillingContext.Provider>;
}

export function useBillingStatus() {
  const context = useContext(BillingContext);
  if (!context) throw new Error("useBillingStatus must be used inside BillingStatusProvider");
  return context;
}

const RECOVERY_PATHS = ["/settings/billing", "/billing/success", "/pricing", "/sign-in", "/sign-up"];

export function EntitlementGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { orgId } = useAuth();
  const { user } = useUser();
  const { status, loading, error, paymentRequired, refresh, clearPaymentRequired } = useBillingStatus();
  const isSuperAdmin = (user?.publicMetadata?.role as string | undefined)?.toLowerCase() === "super_admin";
  const isRecoveryPath = RECOVERY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isRecoveryPath || isSuperAdmin || !orgId) return <>{children}</>;

  if (loading && !status) {
    return <div className="flex min-h-[70vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-2xl border-4 border-[#1A3D63]/40 border-t-[#4A7FA7]" /></div>;
  }

  // Do not turn a temporary status-read outage into a false billing lock.
  if (!status) {
    return <div className="mx-auto mt-16 max-w-xl rounded-3xl border border-amber-400/20 bg-amber-500/10 p-8 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-amber-200" />
      <h1 className="mt-4 text-xl font-black text-[#F6FAFD]">Billing status is unavailable</h1>
      <p className="mt-2 text-sm text-[#B3CFE5]">{error || "We could not verify this organization’s access."}</p>
      <button onClick={() => void refresh()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#4A7FA7] px-4 py-2.5 text-sm font-black text-white"><RefreshCw className="h-4 w-4" /> Retry</button>
    </div>;
  }

  if (status.access.allowed) return <>{children}</>;

  const locked = status.balances.find((balance) => decimalIsPositive(balance.locked_minutes));
  const message = paymentRequired?.message || (locked
    ? `You have ${formatMinutes(locked.locked_minutes)} unused ${locked.compliance_tier === "gdpr" ? "GDPR" : "non-GDPR"} minutes. To use them, you must have a valid matching subscription.`
    : "This organization needs an active subscription before it can use processing features.");

  return <div className="mx-auto mt-12 max-w-2xl rounded-[2rem] border border-blue-400/15 bg-[#071a33]/85 p-8 text-center shadow-2xl shadow-black/20">
    <LockKeyhole className="mx-auto h-10 w-10 text-[#6BB6FF]" />
    <h1 className="mt-5 text-2xl font-black text-[#F6FAFD]">Subscription required</h1>
    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#B3CFE5]">{message}</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Link href="/pricing" className="rounded-xl bg-[#4A7FA7] px-5 py-2.5 text-sm font-black text-white">View plans</Link>
      <Link href="/settings/billing" onClick={clearPaymentRequired} className="rounded-xl border border-blue-400/20 px-5 py-2.5 text-sm font-bold text-[#D8E7F4]">Billing settings</Link>
      <button onClick={() => void refresh()} className="rounded-xl border border-blue-400/20 px-5 py-2.5 text-sm font-bold text-[#D8E7F4]">Refresh status</button>
    </div>
  </div>;
}
