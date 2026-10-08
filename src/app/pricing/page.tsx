"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth, useOrganization, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useApi } from "@/lib/useApi";
import {
  BILLING_CHECKOUT_SCOPE_KEY,
  BILLING_CHECKOUT_SESSION_KEY,
  BillingStatus,
  CatalogItem,
  apiErrorMessage,
  clearIdempotencyKey,
  formatUsd,
  getIdempotencyKey,
  isRetryableBillingStatus,
  tierLabel,
} from "@/lib/billing";

function CatalogCard({
  item,
  busy,
  actionLabel,
  onCheckout,
}: {
  item: CatalogItem;
  busy: boolean;
  actionLabel: string;
  onCheckout?: () => void;
}) {
  const disabled = !item.checkout_enabled || !onCheckout || busy;
  return <article className="flex h-full flex-col rounded-[2rem] border border-blue-400/15 bg-[#071a33]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
    <div className="flex items-start justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#6BB6FF]">{tierLabel(item.compliance_tier)}</p><h2 className="mt-2 text-2xl font-black text-[#F6FAFD]">{item.name}</h2></div>
      <ShieldCheck className="h-6 w-6 shrink-0 text-[#6BB6FF]" />
    </div>
    <p className="mt-3 min-h-10 text-sm leading-6 text-[#B3CFE5]">{item.description || `${item.minutes.toLocaleString()} processing minutes ${item.item_type === "subscription" ? "per paid invoice" : "as a one-time top-up"}.`}</p>
    <div className="mt-6"><span className="text-4xl font-black text-white">{formatUsd(item.unit_amount)}</span>{item.recurring_interval && <span className="text-[#B3CFE5]"> / {item.recurring_interval}</span>}<p className="mt-1 text-xs text-[#B3CFE5]">Plus applicable tax at Checkout</p></div>
    <ul className="mt-6 flex-1 space-y-3 text-sm text-[#D8E7F4]">
      <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-green-300" /> {item.minutes.toLocaleString()} minutes</li>
      <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-green-300" /> Unused minutes carry forward</li>
      {item.item_type === "topup" && <li className="flex gap-2"><LockKeyhole className="h-4 w-4 shrink-0 text-amber-200" /> Requires an active matching subscription</li>}
    </ul>
    {!item.checkout_enabled && <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">{item.unavailable_reason || "Checkout is currently unavailable for this plan."}</p>}
    <button disabled={disabled} onClick={onCheckout} className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45">
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}{actionLabel}
    </button>
  </article>;
}

export default function PricingPage() {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const { membership } = useOrganization();
  const { user } = useUser();
  const { apiFetch } = useApi();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyPrice, setBusyPrice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);

  const isSuperAdmin = (user?.publicMetadata?.role as string | undefined)?.toLowerCase() === "super_admin";
  const isOrgAdmin = membership?.role === "org:admin" || membership?.role === "admin";
  const canManageOrgBilling = !!orgId && (isOrgAdmin || isSuperAdmin);
  const visibleBillingStatus = billingStatus?.access.organization_id === orgId ? billingStatus : null;
  const canPurchaseForOrganization = canManageOrgBilling && visibleBillingStatus?.access.purchases_allowed !== false;

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/v1/billing/catalog");
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(body, "Could not load plans.", response.status));
      setItems(Array.isArray(body?.items) ? body.items : []);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load plans.");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCatalog(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCatalog]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !orgId) {
      return;
    }
    const controller = new AbortController();
    void apiFetch("/api/v1/billing/status", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (response.ok && !controller.signal.aborted) setBillingStatus(body as BillingStatus);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [apiFetch, isLoaded, isSignedIn, orgId]);

  const subscriptions = useMemo(() => items.filter((item) => item.active && item.item_type === "subscription"), [items]);
  const topups = useMemo(() => items.filter((item) => item.active && item.item_type === "topup"), [items]);

  const checkout = async (item: CatalogItem) => {
    setError(null);
    if (isSignedIn && visibleBillingStatus?.access.purchases_allowed === false) {
      setError("Purchases are not available for this organization.");
      return;
    }
    if (!isSignedIn && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter the email address you will use for your CallBlick account.");
      return;
    }
    const action = isSignedIn ? `org-checkout:${orgId}:${item.price_id}` : `public-checkout:${email.trim().toLowerCase()}:${item.price_id}`;
    const key = getIdempotencyKey(action);
    setBusyPrice(item.price_id);
    try {
      const response = await apiFetch(isSignedIn ? "/api/v1/billing/checkout-session" : "/api/v1/billing/public/checkout-session", {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: JSON.stringify(isSignedIn ? { price_id: item.price_id } : { email: email.trim(), price_id: item.price_id }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        if (!isRetryableBillingStatus(response.status)) clearIdempotencyKey(action);
        throw new Error(apiErrorMessage(body, "Checkout could not be started.", response.status));
      }
      clearIdempotencyKey(action);
      if (!body?.id || !body?.url) throw new Error("Checkout is temporarily unavailable. Please try again.");
      window.sessionStorage.setItem(BILLING_CHECKOUT_SESSION_KEY, body.id);
      window.sessionStorage.setItem(BILLING_CHECKOUT_SCOPE_KEY, isSignedIn ? "organization" : "public_signup");
      window.location.assign(body.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout could not be started. Please retry.");
      setBusyPrice(null);
    }
  };

  const subscriptionAction = (item: CatalogItem) => {
    if (!item.checkout_enabled) return { label: "Currently unavailable", handler: undefined };
    if (!isLoaded) return { label: "Loading account…", handler: undefined };
    if (!isSignedIn) return { label: "Continue to Checkout", handler: () => void checkout(item) };
    if (visibleBillingStatus?.access.purchases_allowed === false) return { label: "Purchases unavailable", handler: undefined };
    if (canManageOrgBilling) return { label: "Subscribe organization", handler: () => void checkout(item) };
    return { label: "Ask an organization admin", handler: undefined };
  };

  return <div className="h-screen w-full overflow-y-auto bg-[#020912] text-[#F6FAFD]">
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#020912]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><Link href="/"><Image src="/CallBlick-Logo-Final.png" alt="CallBlick" width={132} height={36} /></Link><div className="flex items-center gap-3">{isSignedIn ? <Link href="/settings/billing" className="rounded-xl border border-blue-400/20 px-4 py-2 text-sm font-bold">Billing settings</Link> : <Link href="/sign-in" className="rounded-xl border border-blue-400/20 px-4 py-2 text-sm font-bold">Sign in</Link>}</div></div>
    </header>
    <main className="mx-auto max-w-7xl px-5 py-16">
      <div className="mx-auto max-w-3xl text-center"><div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#9DCEFF]"><Sparkles className="h-4 w-4" /> Simple, server-managed pricing</div><h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">Conversation intelligence that scales with you</h1><p className="mt-5 text-base leading-7 text-[#B3CFE5]">Choose the processing tier that matches your data requirements. Your catalog, pricing, and availability come directly from our billing service.</p></div>
      {!isSignedIn && <div className="mx-auto mt-10 max-w-xl"><label className="text-xs font-black uppercase tracking-widest text-[#B3CFE5]">Checkout email</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="mt-2 h-12 w-full rounded-xl border border-blue-400/15 bg-[#071a33] px-4 text-sm text-white outline-none focus:border-[#4A7FA7]" /><p className="mt-2 text-xs text-[#B3CFE5]">We’ll use this email to send your account invitation after payment.</p></div>}
      {error && <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      {loading ? <div className="flex justify-center py-24"><Loader2 className="h-9 w-9 animate-spin text-[#6BB6FF]" /></div> : <>
        <section className="mt-14 grid gap-6 md:grid-cols-2">{subscriptions.map((item) => { const action = subscriptionAction(item); return <CatalogCard key={item.price_id} item={item} busy={busyPrice === item.price_id} actionLabel={action.label} onCheckout={action.handler} />; })}</section>
        <section className="mt-20"><div className="mb-7"><p className="text-xs font-black uppercase tracking-widest text-[#6BB6FF]">After activation</p><h2 className="mt-2 text-3xl font-black">Need more minutes?</h2><p className="mt-2 text-sm text-[#B3CFE5]">Top-ups remain available indefinitely, but are usable only while a matching paid subscription is active.</p></div><div className="grid gap-6 md:grid-cols-2">{topups.map((item) => <CatalogCard key={item.price_id} item={item} busy={false} actionLabel={visibleBillingStatus?.access.purchases_allowed === false ? "Purchases unavailable" : canManageOrgBilling ? "Buy in billing settings" : "Available after activation"} onCheckout={canPurchaseForOrganization ? () => window.location.assign("/settings/billing") : undefined} />)}</div></section>
      </>}
    </main>
  </div>;
}
