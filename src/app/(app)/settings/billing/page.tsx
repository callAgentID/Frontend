"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarDays, CreditCard, ExternalLink, Loader2, RefreshCw, WalletCards } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { useBillingStatus } from "@/components/BillingStatusProvider";
import { useApi } from "@/lib/useApi";
import {
  BILLING_CHECKOUT_SCOPE_KEY,
  BILLING_CHECKOUT_SESSION_KEY,
  BillingOverview,
  CatalogItem,
  apiErrorMessage,
  clearIdempotencyKey,
  decimalIsPositive,
  formatBillingDate,
  formatMinutes,
  formatUsd,
  getIdempotencyKey,
  isRetryableBillingStatus,
  tierLabel,
} from "@/lib/billing";

function BalanceCard({ title, value, emphasis = false }: { title: string; value: string; emphasis?: boolean }) {
  return <div className={`rounded-xl border p-3 ${emphasis ? "border-[#4A7FA7]/40 bg-[#4A7FA7]/12" : "border-blue-400/10 bg-blue-950/20"}`}><p className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5]">{title}</p><p className="mt-1 text-lg font-black text-[#F6FAFD]">{formatMinutes(value)} <span className="text-xs font-bold text-[#B3CFE5]">min</span></p></div>;
}

function BillingPageContent() {
  const { apiFetch } = useApi();
  const { refresh: refreshBilling } = useBillingStatus();
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    setLoading(true);
    try {
      const [overviewResponse, catalogResponse] = await Promise.all([
        apiFetch("/api/v1/billing/overview", { signal: controller.signal }),
        apiFetch("/api/v1/billing/catalog", { signal: controller.signal }),
      ]);
      const [overviewBody, catalogBody] = await Promise.all([
        overviewResponse.json().catch(() => null),
        catalogResponse.json().catch(() => null),
      ]);
      if (controller.signal.aborted) return;
      if (!overviewResponse.ok) throw new Error(apiErrorMessage(overviewBody, "Could not load billing information.", overviewResponse.status));
      if (!catalogResponse.ok) throw new Error(apiErrorMessage(catalogBody, "Could not load the available plans.", catalogResponse.status));
      setOverview(overviewBody as BillingOverview);
      setCatalog(Array.isArray(catalogBody?.items) ? catalogBody.items : []);
      setError(null);
      // Keep the page refresh independent from the shared status refresh. A slow
      // status request should not leave page actions in a loading state.
      void refreshBilling();
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Could not load billing information.");
    } finally {
      if (loadAbortRef.current === controller) {
        loadAbortRef.current = null;
        setLoading(false);
      }
    }
  }, [apiFetch, refreshBilling]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => {
      window.clearTimeout(timer);
      loadAbortRef.current?.abort();
    };
  }, [load]);
  useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const subscriptions = useMemo(() => catalog.filter((item) => item.active && item.item_type === "subscription"), [catalog]);
  const topups = useMemo(() => catalog.filter((item) => item.active && item.item_type === "topup"), [catalog]);
  const isUnmetered = overview?.access.metered === false;
  const purchasesAllowed = overview?.access.purchases_allowed !== false;
  const hasPaidSubscription = overview?.access.source === "subscription" && ["active", "trialing"].includes(overview.access.subscription_status);

  const startCheckout = async (item: CatalogItem) => {
    if (!purchasesAllowed) {
      setError("Purchases are not available for this organization.");
      return;
    }
    const action = `org-checkout:${overview?.access.organization_id}:${item.price_id}`;
    setBusy(item.price_id); setError(null);
    try {
      const response = await apiFetch("/api/v1/billing/checkout-session", { method: "POST", headers: { "Idempotency-Key": getIdempotencyKey(action) }, body: JSON.stringify({ price_id: item.price_id }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        if (!isRetryableBillingStatus(response.status)) clearIdempotencyKey(action);
        throw new Error(apiErrorMessage(body, "Checkout could not be started.", response.status));
      }
      clearIdempotencyKey(action);
      if (!body?.id || !body?.url) throw new Error("Checkout is temporarily unavailable. Please try again.");
      window.sessionStorage.setItem(BILLING_CHECKOUT_SESSION_KEY, body.id);
      window.sessionStorage.setItem(BILLING_CHECKOUT_SCOPE_KEY, "organization");
      window.location.assign(body.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout could not be started.");
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setBusy("portal"); setError(null);
    try {
      const response = await apiFetch("/api/v1/billing/portal-session", { method: "POST" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(body, "The billing portal is unavailable right now.", response.status));
      window.location.assign(body.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The Stripe billing portal is unavailable.");
      setBusy(null);
    }
  };

  const cancelSubscription = async () => {
    if (!overview?.account?.current_period_end || !window.confirm(`Schedule cancellation for ${formatBillingDate(overview.account.current_period_end)}? Access continues until then and carried minutes will lock after the subscription ends.`)) return;
    const action = `cancel:${overview.access.organization_id}:${overview.account.stripe_subscription_id || "subscription"}`;
    setBusy("cancel"); setError(null);
    try {
      const response = await apiFetch("/api/v1/billing/subscription/cancel", { method: "POST", headers: { "Idempotency-Key": getIdempotencyKey(action) } });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        if (!isRetryableBillingStatus(response.status)) clearIdempotencyKey(action);
        throw new Error(apiErrorMessage(body, "Cancellation could not be scheduled.", response.status));
      }
      clearIdempotencyKey(action);
      // The cancellation endpoint is authoritative. Reflect its successful
      // result immediately instead of keeping the button busy while the
      // follow-up overview/status requests complete.
      setOverview((current) => current?.account ? {
        ...current,
        access: { ...current.access, cancel_at_period_end: true },
        account: { ...current.account, cancel_at_period_end: true },
      } : current);
      setBusy(null);
      void load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cancellation could not be scheduled.");
      setBusy(null);
    }
  };

  if (loading && !overview) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-[#6BB6FF]" /></div>;
  if (!overview) return <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-red-100">{error || "Billing information is unavailable."}<button onClick={() => void load()} className="mt-4 block rounded-xl border border-red-200/20 px-4 py-2 text-sm font-bold">Retry</button></div>;

  return <div className="space-y-7 p-1 sm:p-2">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#6BB6FF]">Organization settings</p><h1 className="mt-2 text-3xl font-black text-[#F6FAFD]">Billing & minutes</h1><p className="mt-2 text-sm text-[#B3CFE5]">Manage your subscription, payment methods, invoices, and carried balances.</p></div><button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-blue-400/15 px-4 py-2.5 text-sm font-bold text-[#D8E7F4]"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button></div>
    {error && <div className="flex gap-2 rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}

    <section className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-blue-400/12 bg-[#071a33]/75 p-5"><WalletCards className="h-5 w-5 text-[#6BB6FF]" /><p className="mt-4 text-xs font-black uppercase tracking-wider text-[#B3CFE5]">Current access</p><p className="mt-1 text-xl font-black text-[#F6FAFD]">{isUnmetered ? "Internal · unmetered" : overview.access.source === "demo" ? "Demo" : overview.access.source === "subscription" ? `${tierLabel(overview.access.compliance_tier)} subscription` : "No active access"}</p><p className="mt-2 text-xs text-[#B3CFE5]">{isUnmetered ? "Usage is not limited by minute balances." : `Status: ${overview.access.subscription_status.replaceAll("_", " ")}`}</p></div>
      <div className="rounded-2xl border border-blue-400/12 bg-[#071a33]/75 p-5"><CalendarDays className="h-5 w-5 text-[#6BB6FF]" /><p className="mt-4 text-xs font-black uppercase tracking-wider text-[#B3CFE5]">{isUnmetered ? "Billing cycle" : "Paid through"}</p><p className="mt-1 text-xl font-black text-[#F6FAFD]">{isUnmetered ? "Not required" : formatBillingDate(overview.account?.current_period_end || overview.access.expires_at)}</p><p className="mt-2 text-xs text-[#B3CFE5]">{isUnmetered ? "This organization has internal billing-exempt access." : overview.account?.cancel_at_period_end ? "Cancellation is scheduled; access continues through this date." : overview.access.source === "demo" ? `Demo expires ${formatBillingDate(overview.account?.demo_expires_at)}` : "Renews according to your Stripe subscription."}</p></div>
      <div className="rounded-2xl border border-blue-400/12 bg-[#071a33]/75 p-5"><CreditCard className="h-5 w-5 text-[#6BB6FF]" /><p className="mt-4 text-xs font-black uppercase tracking-wider text-[#B3CFE5]">Payment & invoices</p>{isUnmetered ? <p className="mt-3 text-sm font-bold text-[#B3CFE5]">No payment method is required.</p> : <button disabled={!overview.account?.stripe_customer_id || busy === "portal"} onClick={() => void openPortal()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#4A7FA7] px-4 py-2.5 text-sm font-black text-white disabled:opacity-45">{busy === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />} Open Stripe portal</button>}</div>
    </section>

    <section><h2 className="mb-4 text-xl font-black text-[#F6FAFD]">Minute balances</h2>{isUnmetered ? <div className="rounded-2xl border border-blue-400/12 bg-[#071a33]/75 p-5"><p className="font-black text-[#F6FAFD]">Internal · unmetered</p><p className="mt-2 text-sm text-[#B3CFE5]">Minute totals do not apply to this billing-exempt organization.</p></div> : <div className="grid gap-4 xl:grid-cols-2">{overview.balances.map((balance) => <article key={balance.compliance_tier} className="rounded-2xl border border-blue-400/12 bg-[#071a33]/75 p-5"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-[#F6FAFD]">{tierLabel(balance.compliance_tier)}</h3>{decimalIsPositive(balance.locked_minutes) && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-200">Minutes locked</span>}</div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><BalanceCard title="Subscription" value={balance.subscription_minutes} /><BalanceCard title="Top-up" value={balance.top_up_minutes} /><BalanceCard title="Demo" value={balance.demo_minutes} /><BalanceCard title="Reserved" value={balance.reserved_minutes} /><BalanceCard title="Usable" value={balance.usable_minutes} emphasis /><BalanceCard title="Locked" value={balance.locked_minutes} /></div></article>)}</div>}</section>

    {!isUnmetered && <section><div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-xl font-black text-[#F6FAFD]">Subscriptions</h2><p className="mt-1 text-sm text-[#B3CFE5]">One processing tier can be active for an organization at a time.</p></div><Link href="/pricing" className="text-sm font-bold text-[#9DCEFF]">Compare plans</Link></div>{!purchasesAllowed && <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">Purchases are not available for this organization.</p>}<div className="grid gap-4 lg:grid-cols-2">{subscriptions.map((item) => { const current = hasPaidSubscription && overview.access.compliance_tier === item.compliance_tier; return <article key={item.price_id} className="rounded-2xl border border-blue-400/12 bg-[#071a33]/75 p-5"><p className="text-xs font-black uppercase tracking-wider text-[#6BB6FF]">{tierLabel(item.compliance_tier)}</p><div className="mt-2 flex items-baseline justify-between gap-4"><h3 className="text-lg font-black text-[#F6FAFD]">{item.name}</h3><p className="font-black text-white">{formatUsd(item.unit_amount)}/mo</p></div><p className="mt-2 text-sm text-[#B3CFE5]">{item.minutes.toLocaleString()} minutes per paid invoice · plus applicable tax</p>{!item.checkout_enabled && <p className="mt-3 text-xs text-amber-200">{item.unavailable_reason}</p>}{(purchasesAllowed || current) && <button disabled={current || hasPaidSubscription || !item.checkout_enabled || busy === item.price_id} onClick={() => void startCheckout(item)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#4A7FA7] px-4 py-2.5 text-sm font-black text-white disabled:opacity-45">{busy === item.price_id && <Loader2 className="h-4 w-4 animate-spin" />}{current ? "Current plan" : hasPaidSubscription ? "A subscription is already active" : "Subscribe"}</button>}</article>; })}</div></section>}

    {!isUnmetered && <section><h2 className="text-xl font-black text-[#F6FAFD]">Top up minutes</h2><p className="mt-1 text-sm text-[#B3CFE5]">Top-ups require an active paid subscription for the same tier.</p><div className="mt-4 grid gap-4 lg:grid-cols-2">{topups.map((item) => { const eligible = hasPaidSubscription && overview.access.compliance_tier === item.compliance_tier; return <article key={item.price_id} className="rounded-2xl border border-blue-400/12 bg-[#071a33]/75 p-5"><div className="flex items-baseline justify-between gap-4"><h3 className="text-lg font-black text-[#F6FAFD]">{item.name}</h3><p className="font-black text-white">{formatUsd(item.unit_amount)}</p></div><p className="mt-2 text-sm text-[#B3CFE5]">{item.minutes.toLocaleString()} carried minutes · plus applicable tax</p>{purchasesAllowed && <button disabled={!eligible || !item.checkout_enabled || busy === item.price_id} onClick={() => void startCheckout(item)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#4A7FA7] px-4 py-2.5 text-sm font-black text-white disabled:opacity-45">{busy === item.price_id && <Loader2 className="h-4 w-4 animate-spin" />}{eligible ? "Buy top-up" : "Matching subscription required"}</button>}</article>; })}</div></section>}

    {hasPaidSubscription && <section className="rounded-2xl border border-red-400/15 bg-red-500/5 p-5"><h2 className="font-black text-[#F6FAFD]">Cancel subscription</h2><p className="mt-2 text-sm leading-6 text-[#B3CFE5]">Cancellation is scheduled at period end. Access remains active through {formatBillingDate(overview.account?.current_period_end)}, then carried minutes become locked until a matching subscription is active again.</p><button disabled={!!overview.account?.cancel_at_period_end || busy === "cancel"} onClick={() => void cancelSubscription()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-400/25 px-4 py-2.5 text-sm font-black text-red-200 disabled:opacity-45">{busy === "cancel" && <Loader2 className="h-4 w-4 animate-spin" />}{overview.account?.cancel_at_period_end ? "Cancellation scheduled" : "Cancel at period end"}</button></section>}
  </div>;
}

export default function BillingSettingsPage() {
  const { userId, orgId } = useAuth();
  return <RoleGuard allow={["admin"]}><BillingPageContent key={`${userId || "signed-out"}:${orgId || "no-org"}`} /></RoleGuard>;
}
