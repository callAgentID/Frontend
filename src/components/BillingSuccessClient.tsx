"use client";

import Link from "next/link";
import { OrganizationSwitcher, useAuth, useOrganization, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  ExternalLink,
  Loader2,
  MailCheck,
  RefreshCw,
  SearchX,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import { useApi } from "@/lib/useApi";
import {
  BILLING_CHECKOUT_SCOPE_KEY,
  BILLING_CHECKOUT_SESSION_KEY,
  type CheckoutScope,
  apiErrorDetail,
  apiErrorMessage,
  clearIdempotencyKey,
  getIdempotencyKey,
  isRetryableBillingStatus,
} from "@/lib/billing";
import { BillingReturnShell, type BillingReturnTone } from "./BillingReturnShell";

const BACKOFF_MS = [2_000, 4_000, 8_000, 15_000];

type ClaimPhase = "waiting" | "claiming" | "finalizing" | "success" | "error";
type ClaimIssue =
  | "missing_session"
  | "not_found"
  | "email_mismatch"
  | "permission"
  | "conflict"
  | "payment_inactive"
  | "invalid"
  | "service"
  | "network"
  | "unknown";

type ClaimError = Error & { status?: number; code?: string; issue?: ClaimIssue; retryable?: boolean };

function classifyIssue(status: number, code: string | undefined, message: string): ClaimIssue {
  const normalized = `${code || ""} ${message}`.toLowerCase();
  if (status === 404) return "not_found";
  if (/email/.test(normalized) && /match|same|different|verified/.test(normalized)) return "email_mismatch";
  if (status === 401 || status === 403) return "permission";
  if (/inactive|ended|expired|refund|dispute|payment.*complete/.test(normalized)) return "payment_inactive";
  if (status === 409) return "conflict";
  if (status === 400 || status === 422) return "invalid";
  if (status >= 500) return "service";
  return "unknown";
}

function stepsFor(phase: ClaimPhase, accountReady: boolean) {
  return [
    { label: "Payment received", state: "complete" as const },
    { label: "Verify account & organization", state: accountReady ? "complete" as const : "current" as const },
    { label: "Activate subscription", state: phase === "success" ? "complete" as const : accountReady ? "current" as const : "upcoming" as const },
  ];
}

const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4A7FA7] to-[#245A8C] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-950/30 hover:brightness-110";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-300/18 bg-white/[0.035] px-5 py-2.5 text-sm font-bold text-[#CDE4F8] hover:bg-white/[0.07]";

export function BillingSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { apiFetch } = useApi();
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const { membership, organization } = useOrganization();
  const { user } = useUser();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checkoutScope, setCheckoutScope] = useState<CheckoutScope | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [phase, setPhase] = useState<ClaimPhase>("waiting");
  const [issue, setIssue] = useState<ClaimIssue | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const autoStarted = useRef(false);

  const isSuperAdmin = (user?.publicMetadata?.role as string | undefined)?.toLowerCase() === "super_admin";
  const isAdmin = membership?.role === "org:admin" || membership?.role === "admin" || isSuperAdmin;
  const accountReady = !!isSignedIn && !!orgId && !!isAdmin;

  useEffect(() => {
    const fromUrl = searchParams.get("session_id");
    const scopeFromUrl = searchParams.get("checkout_scope");
    const validScopeFromUrl = scopeFromUrl === "organization" || scopeFromUrl === "public_signup"
      ? scopeFromUrl
      : null;
    const stored = window.sessionStorage.getItem(BILLING_CHECKOUT_SESSION_KEY);
    const storedScope = window.sessionStorage.getItem(BILLING_CHECKOUT_SCOPE_KEY);
    const resolved = fromUrl || stored;
    if (fromUrl) {
      window.sessionStorage.setItem(BILLING_CHECKOUT_SESSION_KEY, fromUrl);
    }
    if (validScopeFromUrl) {
      window.sessionStorage.setItem(BILLING_CHECKOUT_SCOPE_KEY, validScopeFromUrl);
    }
    if (fromUrl || validScopeFromUrl) {
      // Keep the Stripe session only in this browser session so analytics and
      // copied URLs never receive the sensitive identifier.
      window.history.replaceState(window.history.state, "", "/billing/success");
    }
    const timer = window.setTimeout(() => {
      setSessionId(resolved);
      setCheckoutScope(validScopeFromUrl || (stored === resolved && (storedScope === "organization" || storedScope === "public_signup") ? storedScope : null));
      setSessionResolved(true);
      if (!resolved) {
        setPhase("error");
        setIssue("missing_session");
        setRetryable(false);
        setMessage("The return link did not include a Checkout session. No activation attempt was made.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const claim = useCallback(async (automatic: boolean) => {
    if (!sessionId || !orgId || !isAdmin) return;
    const action = `claim:${sessionId}:${orgId}`;
    const key = getIdempotencyKey(action);
    setPhase("claiming");
    setIssue(null);
    setRetryable(false);
    setMessage("Confirming the Stripe payment and matching it to your organization…");
    const attempts = automatic ? BACKOFF_MS.length + 1 : 1;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await apiFetch("/api/v1/billing/claim", {
          method: "POST",
          headers: { "Idempotency-Key": key },
          body: JSON.stringify({ checkout_session_id: sessionId }),
        });
        const body = await response.json().catch(() => null);
        if (response.ok) {
          clearIdempotencyKey(action);
          window.sessionStorage.removeItem(BILLING_CHECKOUT_SESSION_KEY);
          window.sessionStorage.removeItem(BILLING_CHECKOUT_SCOPE_KEY);
          window.dispatchEvent(new Event("billing:refresh"));
          setPhase("success");
          setMessage("Your subscription is active and this organization can now use its included minutes.");
          return;
        }

        const detail = apiErrorDetail(body);
        const rawErrorMessage = detail.message || "";
        const errorMessage = apiErrorMessage(body, "We could not verify this Checkout purchase.", response.status);
        const finalizing = response.status === 409 && /finaliz|process|pending|webhook/i.test(`${detail.code || ""} ${rawErrorMessage}`);
        if (finalizing && automatic && attempt < BACKOFF_MS.length) {
          setPhase("finalizing");
          setMessage(`Stripe confirmed the return, but activation is still syncing. Checking again in ${BACKOFF_MS[attempt] / 1_000} seconds…`);
          await new Promise((resolve) => window.setTimeout(resolve, BACKOFF_MS[attempt]));
          continue;
        }

        if (!finalizing && !isRetryableBillingStatus(response.status)) clearIdempotencyKey(action);
        const error = new Error(errorMessage) as ClaimError;
        error.status = response.status;
        error.code = detail.code;
        error.issue = classifyIssue(response.status, detail.code, rawErrorMessage || errorMessage);
        error.retryable = finalizing || isRetryableBillingStatus(response.status);
        throw error;
      } catch (cause) {
        const error = cause as ClaimError;
        const isFetchFailure = error.status === undefined;
        setPhase("error");
        setIssue(isFetchFailure ? "network" : error.issue || "unknown");
        setRetryable(isFetchFailure || !!error.retryable);
        setMessage(isFetchFailure ? "We could not reach the billing service. Your payment status has not been changed." : error.message);
        return;
      }
    }

    setPhase("error");
    setIssue("service");
    setRetryable(true);
    setMessage("Your payment was received, but activation is taking longer than expected. You can retry safely in a moment.");
  }, [apiFetch, isAdmin, orgId, sessionId]);

  useEffect(() => {
    if (!sessionResolved || checkoutScope !== "organization" || !isLoaded || !isSignedIn || !orgId || !isAdmin) return;
    window.sessionStorage.removeItem(BILLING_CHECKOUT_SESSION_KEY);
    window.sessionStorage.removeItem(BILLING_CHECKOUT_SCOPE_KEY);
    window.dispatchEvent(new Event("billing:refresh"));
    router.replace("/settings/billing?checkout=success");
  }, [checkoutScope, isAdmin, isLoaded, isSignedIn, orgId, router, sessionResolved]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !orgId || !isAdmin || !sessionId || checkoutScope === "organization" || autoStarted.current) return;
    autoStarted.current = true;
    void claim(true);
  }, [checkoutScope, claim, isAdmin, isLoaded, isSignedIn, orgId, sessionId]);

  if (!isLoaded || !sessionResolved || (phase === "waiting" && !!sessionId && accountReady)) {
    return <BillingReturnShell icon={Loader2} tone="info" eyebrow="Secure verification" title="Checking your payment" description="We’re preparing the Checkout confirmation and securely matching it to your account." steps={stepsFor("claiming", accountReady)}><div className="flex items-center gap-3 rounded-xl border border-blue-300/12 bg-blue-400/5 p-4 text-sm text-[#B8DAFF]"><Loader2 className="h-5 w-5 animate-spin" /> Please keep this page open.</div></BillingReturnShell>;
  }

  if (!sessionId) {
    return <BillingReturnShell icon={SearchX} tone="warning" eyebrow="Confirmation link incomplete" title="We can’t locate this Checkout session" description={message || "The payment return link is missing the information required to confirm a purchase."} footer="If money was deducted, use the original Stripe return link or contact support with the payment email."><div className="flex flex-wrap gap-3"><Link href="/settings/billing" className={primaryButton}>Check billing status</Link><Link href="/pricing" className={secondaryButton}>Return to pricing</Link></div></BillingReturnShell>;
  }

  if (!isSignedIn) {
    return <BillingReturnShell icon={MailCheck} tone="success" eyebrow="Payment received" title={checkoutScope === "organization" ? "Sign in to check your subscription" : "Check your email to finish setup"} description={checkoutScope === "organization" ? "Sign in again and select the organization used at Checkout. We’ll confirm the subscription from your billing overview." : "Stripe returned successfully. Sign in with the same verified email used at Checkout so we can securely attach this purchase to your organization."} steps={stepsFor("waiting", false)} footer="Your Checkout session is stored only in this browser session and is removed after activation."><div className="flex flex-wrap gap-3"><Link href="/sign-in?redirect_url=%2Fbilling%2Fsuccess" className={primaryButton}>Sign in to continue</Link><Link href="/pricing" className={secondaryButton}>View plans</Link></div></BillingReturnShell>;
  }

  if (!orgId) {
    return <BillingReturnShell icon={Building2} tone="info" eyebrow="Organization required" title="Choose where to activate this plan" description="Subscriptions belong to organizations. Select an existing organization or create a new one to continue activation." steps={stepsFor("waiting", false)}><div className="rounded-2xl border border-blue-300/12 bg-white/[0.025] p-4"><OrganizationSwitcher hidePersonal afterCreateOrganizationUrl="/billing/success" afterSelectOrganizationUrl="/billing/success" /></div></BillingReturnShell>;
  }

  if (!isAdmin) {
    return <BillingReturnShell icon={ShieldAlert} tone="warning" eyebrow="Admin approval required" title="An organization admin must finish activation" description={`You’re signed in${organization?.name ? ` to ${organization.name}` : ""}, but your current role cannot claim a subscription. Ask an organization admin to complete this step in this same browser session.`} steps={stepsFor("waiting", false)}><div className="flex flex-wrap gap-3"><Link href="/" className={primaryButton}>Go to dashboard</Link><Link href="/pricing" className={secondaryButton}>Back to pricing</Link></div></BillingReturnShell>;
  }

  if (phase === "success") {
    return <BillingReturnShell icon={CheckCircle2} tone="success" eyebrow="Activation complete" title="Your subscription is ready" description={message || "Payment was confirmed and access is active."} steps={stepsFor("success", true)} footer="Billing status is projected from Stripe webhooks and the verified claim—not from the browser redirect alone."><div className="flex flex-wrap gap-3"><button onClick={() => router.replace(window.sessionStorage.getItem("billing:returnTo") || "/")} className={primaryButton}>Continue to CallBlick</button><Link href="/settings/billing" className={secondaryButton}>View billing</Link></div></BillingReturnShell>;
  }

  if (phase === "claiming" || phase === "finalizing") {
    return <BillingReturnShell icon={phase === "finalizing" ? Clock3 : RefreshCw} tone="info" eyebrow={phase === "finalizing" ? "Payment syncing" : "Secure verification"} title={phase === "finalizing" ? "Stripe is finalizing your purchase" : "Activating your subscription"} description={message || "We’re verifying this purchase with the billing service."} steps={stepsFor(phase, true)} footer="This can take a few moments after Stripe redirects back. Refreshing or closing this page cannot create another charge."><div className="flex items-center gap-3 rounded-xl border border-blue-300/12 bg-blue-400/5 p-4 text-sm text-[#B8DAFF]"><Loader2 className="h-5 w-5 animate-spin" /> Verification is in progress…</div></BillingReturnShell>;
  }

  const errorPresentation: Record<ClaimIssue, { icon: typeof AlertTriangle; tone: BillingReturnTone; eyebrow: string; title: string; guidance: string }> = {
    missing_session: { icon: SearchX, tone: "warning", eyebrow: "Confirmation incomplete", title: "Checkout session missing", guidance: "Open the original Stripe return link or check your current billing status." },
    not_found: { icon: SearchX, tone: "warning", eyebrow: "Purchase not found", title: "We couldn’t find this purchase", guidance: "The link may be incomplete, expired, or connected to another environment. Check billing status before trying Checkout again." },
    email_mismatch: { icon: CircleUserRound, tone: "warning", eyebrow: "Account mismatch", title: "Sign in with the Checkout email", guidance: "The verified Clerk email must exactly match the email used for this Stripe purchase." },
    permission: { icon: ShieldAlert, tone: "warning", eyebrow: "Permission required", title: "This purchase can’t be claimed by your current account", guidance: "Confirm the selected organization and ask an organization admin if your role needs to be updated." },
    conflict: { icon: AlertTriangle, tone: "warning", eyebrow: "Purchase needs review", title: "We couldn’t attach this purchase", guidance: "It may already belong to another organization or another activation may be in progress." },
    payment_inactive: { icon: AlertTriangle, tone: "danger", eyebrow: "Payment not active", title: "This purchase is no longer claimable", guidance: "The subscription may be inactive, ended, refunded, disputed, or not fully paid." },
    invalid: { icon: SearchX, tone: "danger", eyebrow: "Invalid confirmation", title: "This Checkout confirmation isn’t valid", guidance: "Return to pricing and start a new Checkout session if you still want to subscribe." },
    service: { icon: Clock3, tone: "warning", eyebrow: "Temporary billing delay", title: "Activation is taking longer than expected", guidance: "Stripe or the billing service is temporarily unavailable. Your payment has not been duplicated." },
    network: { icon: WifiOff, tone: "warning", eyebrow: "Connection interrupted", title: "We couldn’t reach the billing service", guidance: "Check your connection and retry. The same safe request key will be reused." },
    unknown: { icon: AlertTriangle, tone: "danger", eyebrow: "Activation needs attention", title: "We couldn’t finish activation", guidance: "Review your billing status or contact support if the payment appears in Stripe." },
  };
  const presentation = errorPresentation[issue || "unknown"];
  const ErrorIcon = presentation.icon;
  const displayMessage = message && !/^(not found|forbidden|unauthorized|internal server error)$/i.test(message.trim())
    ? message
    : presentation.guidance;

  return <BillingReturnShell icon={ErrorIcon} tone={presentation.tone} eyebrow={presentation.eyebrow} title={presentation.title} description={displayMessage} steps={stepsFor("error", true)} footer={presentation.guidance}><div className="flex flex-wrap gap-3">{retryable && <button onClick={() => void claim(false)} className={primaryButton}><RefreshCw className="h-4 w-4" /> Retry safely</button>}<Link href="/settings/billing" className={retryable ? secondaryButton : primaryButton}>Check billing status</Link><Link href="/pricing" className={secondaryButton}>Back to pricing</Link>{issue === "email_mismatch" && <Link href="/sign-in?redirect_url=%2Fbilling%2Fsuccess" className={secondaryButton}><ExternalLink className="h-4 w-4" /> Switch account</Link>}</div></BillingReturnShell>;
}
