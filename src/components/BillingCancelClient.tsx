"use client";

import Link from "next/link";
import { useAuth, useOrganization, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { ArrowLeft, Ban, CreditCard, ShieldCheck } from "lucide-react";
import { BillingReturnShell } from "./BillingReturnShell";
import { BILLING_CHECKOUT_SCOPE_KEY, BILLING_CHECKOUT_SESSION_KEY } from "@/lib/billing";

const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4A7FA7] to-[#245A8C] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-950/30 hover:brightness-110";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-300/18 bg-white/[0.035] px-5 py-2.5 text-sm font-bold text-[#CDE4F8] hover:bg-white/[0.07]";

export function BillingCancelClient() {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const { membership } = useOrganization();
  const { user } = useUser();
  const isSuperAdmin = (user?.publicMetadata?.role as string | undefined)?.toLowerCase() === "super_admin";
  const canManageBilling = !!orgId && (membership?.role === "org:admin" || membership?.role === "admin" || isSuperAdmin);

  useEffect(() => {
    // A cancelled Checkout must never be picked up later as a successful claim.
    window.sessionStorage.removeItem(BILLING_CHECKOUT_SESSION_KEY);
    window.sessionStorage.removeItem(BILLING_CHECKOUT_SCOPE_KEY);
  }, []);

  return <BillingReturnShell
    icon={Ban}
    tone="warning"
    eyebrow="Checkout cancelled"
    title="No changes were made"
    description="You left Stripe Checkout before completing the purchase. Your current plan and minute balances remain unchanged."
    footer="If your bank shows a temporary authorization, it is controlled by the payment provider and normally disappears automatically."
  >
    <div className="rounded-2xl border border-blue-300/12 bg-white/[0.025] p-4">
      <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#6BB6FF]" /><div><p className="text-sm font-black text-[#EAF4FF]">Safe to try again</p><p className="mt-1 text-xs leading-5 text-[#8EACC7]">Starting a new Checkout from CallBlick will not duplicate a completed subscription.</p></div></div>
    </div>
    <div className="mt-5 flex flex-wrap gap-3">
      {!isLoaded ? <span className={secondaryButton}>Loading account…</span> : canManageBilling ? <Link href="/settings/billing" className={primaryButton}><CreditCard className="h-4 w-4" /> Return to billing</Link> : <Link href="/pricing" className={primaryButton}><CreditCard className="h-4 w-4" /> Choose a plan</Link>}
      {isSignedIn && <Link href="/" className={secondaryButton}><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>}
    </div>
  </BillingReturnShell>;
}
