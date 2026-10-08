"use client";

import Link from "next/link";
import { useAuth, useOrganization, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { AlertTriangle, CreditCard, RefreshCw } from "lucide-react";
import { BillingReturnShell } from "./BillingReturnShell";
import { BILLING_CHECKOUT_SCOPE_KEY, BILLING_CHECKOUT_SESSION_KEY } from "@/lib/billing";

const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4A7FA7] to-[#245A8C] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-950/30 hover:brightness-110";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-300/18 bg-white/[0.035] px-5 py-2.5 text-sm font-bold text-[#CDE4F8] hover:bg-white/[0.07]";

export function BillingFailureClient() {
  const { isSignedIn, orgId } = useAuth();
  const { membership } = useOrganization();
  const { user } = useUser();
  const isSuperAdmin = (user?.publicMetadata?.role as string | undefined)?.toLowerCase() === "super_admin";
  const canManageBilling = !!orgId && (membership?.role === "org:admin" || membership?.role === "admin" || isSuperAdmin);

  useEffect(() => {
    window.sessionStorage.removeItem(BILLING_CHECKOUT_SESSION_KEY);
    window.sessionStorage.removeItem(BILLING_CHECKOUT_SCOPE_KEY);
  }, []);

  return <BillingReturnShell
    icon={AlertTriangle}
    tone="danger"
    eyebrow="Checkout not completed"
    title="Your payment could not be completed"
    description="Stripe did not return a completed purchase, so CallBlick has not activated or changed a subscription."
    footer="For declined cards or authentication failures, Stripe may provide more detail during the next Checkout attempt."
  >
    <div className="flex flex-wrap gap-3">
      <Link href={canManageBilling ? "/settings/billing" : "/pricing"} className={primaryButton}><RefreshCw className="h-4 w-4" /> Try Checkout again</Link>
      {isSignedIn && <Link href="/settings/billing" className={secondaryButton}><CreditCard className="h-4 w-4" /> Check billing status</Link>}
    </div>
  </BillingReturnShell>;
}
