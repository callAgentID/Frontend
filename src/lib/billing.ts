export type ComplianceTier = "gdpr" | "non_gdpr";
export type CatalogItemType = "subscription" | "topup";
export type AccessSource = "demo" | "subscription" | "exempt";
export type CheckoutScope = "organization" | "public_signup";

export const BILLING_CHECKOUT_SESSION_KEY = "billing:pending-checkout-session";
export const BILLING_CHECKOUT_SCOPE_KEY = "billing:pending-checkout-scope";
export type SubscriptionStatus =
  | "none"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export interface CatalogItem {
  product_id: string;
  price_id: string;
  name: string;
  description: string | null;
  item_type: CatalogItemType;
  compliance_tier: ComplianceTier;
  minutes: number;
  unit_amount: number;
  currency: "usd";
  recurring_interval: "month" | null;
  tax_behavior: "exclusive";
  active: boolean;
  checkout_enabled: boolean;
  unavailable_reason: string | null;
}

export interface BillingAccess {
  organization_id: string;
  allowed: boolean;
  source: AccessSource | null;
  compliance_tier: ComplianceTier | null;
  expires_at: string | null;
  subscription_status: SubscriptionStatus;
  cancel_at_period_end: boolean;
  metered: boolean;
  purchases_allowed: boolean;
  purchase_block_reason: string | null;
  reason:
    | "billing_account_missing"
    | "billing_exempt"
    | "active_subscription"
    | "active_demo"
    | "subscription_inactive_or_expired"
    | "demo_expired"
    | "subscription_required";
}

export interface MinuteBalance {
  compliance_tier: ComplianceTier;
  subscription_minutes: string;
  top_up_minutes: string;
  demo_minutes: string;
  adjustment_minutes: string;
  reserved_minutes: string;
  usable_minutes: string;
  locked_minutes: string;
  total_remaining_minutes: string;
}

export interface BillingStatus {
  access: BillingAccess;
  balances: MinuteBalance[];
}

export interface BillingAccount {
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  compliance_tier: ComplianceTier | null;
  subscription_status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  billing_exempt: boolean;
  demo_started_at: string | null;
  demo_expires_at: string | null;
  first_paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingOverview extends BillingStatus {
  account: BillingAccount | null;
}

export type ApiErrorDetail = {
  code?: string;
  message?: string;
  reason?: string;
  compliance_tier?: ComplianceTier;
  locked_minutes?: string;
  required_minutes?: string;
  available_minutes?: string;
  [key: string]: unknown;
};

type ValidationIssue = {
  loc?: Array<string | number>;
  msg?: string;
};

export function apiErrorDetail(body: unknown): ApiErrorDetail {
  const value = body as { detail?: string | ApiErrorDetail; message?: string } | null;
  if (typeof value?.detail === "string") return { message: value.detail };
  if (value?.detail && typeof value.detail === "object") return value.detail;
  return { message: value?.message };
}

function validationMessage(body: unknown) {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (!Array.isArray(detail)) return null;
  const fields = Array.from(new Set(detail
    .map((issue) => (issue as ValidationIssue)?.loc?.at(-1))
    .filter((field): field is string | number => field !== undefined)
    .map((field) => String(field).replaceAll("_", " "))));
  return fields.length > 0
    ? `Please check ${fields.slice(0, 3).join(", ")} and try again.`
    : "Please check the information you entered and try again.";
}

function simplifyBackendMessage(message: string) {
  return message
    .replace(/\bnon_gdpr\b/gi, "Non-GDPR")
    .replace(/\bgdpr\b/gi, "GDPR")
    .replace(/\b(-?\d+\.\d{3,})\b/g, (value) => formatMinutes(value))
    .replace(/checkout_session_id/gi, "checkout session")
    .replace(/organization_id/gi, "organization")
    .replace(/processing_profile_id/gi, "processing profile")
    .replace(/\s+/g, " ")
    .trim();
}

/** Convert structured API failures into safe, user-facing copy. */
export function apiErrorMessage(body: unknown, fallback: string, status?: number) {
  const validation = validationMessage(body);
  if (validation) return validation;

  const detail = apiErrorDetail(body);
  const code = detail.code?.toLowerCase();
  const knownMessages: Record<string, string> = {
    compliance_tier_not_allowed: "That processing profile does not match your organization’s current plan. Choose one of the available profiles.",
    gdpr_routing_unavailable: "GDPR processing is temporarily unavailable. Please choose Non-GDPR processing or try again later.",
    email_mismatch: "Sign in with the same verified email address used during Checkout.",
    purchase_already_claimed: "This purchase is already connected to another organization.",
    billing_purchases_disabled: "Purchases are not available for this organization.",
    purchases_not_allowed: "Purchases are not available for this organization.",
  };
  if (code && knownMessages[code]) return knownMessages[code];

  const rawMessage = typeof detail.message === "string" ? detail.message.trim() : "";
  const technical = /^(not found|forbidden|unauthorized|internal server error)$/i.test(rawMessage)
    || /traceback|stack trace|sqlalchemy|pydantic|validation error|request[_ -]?id|aws|lambda|\b(?:cs|sub|cus|price|prod)_[a-z0-9_]+/i.test(rawMessage)
    || rawMessage.includes("{\"")
    || rawMessage.includes("[{");

  if (rawMessage && !technical) return simplifyBackendMessage(rawMessage);
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do that. Ask an organization admin for help.";
  if (status === 404) return "We could not find what you requested. Refresh the page and try again.";
  if (status === 409) return "This information changed while you were working. Refresh the page and try again.";
  if (status === 422) return "Please check the information you entered and try again.";
  if (status && status >= 500) return "The service is temporarily unavailable. Please try again in a moment.";
  return fallback;
}

export function formatUsd(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** Format a backend decimal string without converting billing state to IEEE-754. */
export function formatMinutes(value: string | null | undefined, maximumFractionDigits = 2) {
  if (!value) return "0";
  const match = value.trim().match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match) return value;
  const [, sign, rawWhole, rawFraction = ""] = match;
  const whole = rawWhole.replace(/^0+(?=\d)/, "");
  const fraction = rawFraction.slice(0, maximumFractionDigits).replace(/0+$/, "");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${grouped}${fraction ? `.${fraction}` : ""}`;
}

export function decimalIsPositive(value: string | null | undefined) {
  return !!value && /[1-9]/.test(value.replace(/^[+-]/, ""));
}

export function tierLabel(tier: ComplianceTier | null | undefined) {
  return tier === "gdpr" ? "GDPR" : tier === "non_gdpr" ? "Non-GDPR" : "—";
}

export function formatBillingDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

const IDEMPOTENCY_PREFIX = "billing:idempotency:";

export function getIdempotencyKey(action: string) {
  if (typeof window === "undefined") return crypto.randomUUID();
  const storageKey = `${IDEMPOTENCY_PREFIX}${action}`;
  const existing = window.sessionStorage.getItem(storageKey);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.sessionStorage.setItem(storageKey, value);
  return value;
}

export function clearIdempotencyKey(action: string) {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(`${IDEMPOTENCY_PREFIX}${action}`);
  }
}

export function isRetryableBillingStatus(status: number) {
  return status === 0 || status === 502 || status === 503 || status === 504;
}
