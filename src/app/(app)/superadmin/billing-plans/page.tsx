"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, Loader2, Pencil, Plus, RefreshCw, Send, X } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { useApi } from "@/lib/useApi";
import { toast } from "@/components/Toast";
import {
  CatalogItem,
  CatalogItemType,
  ComplianceTier,
  apiErrorMessage,
  clearIdempotencyKey,
  formatUsd,
  getIdempotencyKey,
  isRetryableBillingStatus,
  tierLabel,
} from "@/lib/billing";

type Draft = {
  name: string;
  description: string;
  item_type: CatalogItemType;
  compliance_tier: ComplianceTier;
  minutes: string;
  unit_amount: string;
};

const emptyDraft: Draft = { name: "", description: "", item_type: "subscription", compliance_tier: "non_gdpr", minutes: "", unit_amount: "" };
const fieldClass = "h-11 w-full rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]";

function validateDraft(draft: Draft) {
  const minutes = Number(draft.minutes);
  const unitAmount = Number(draft.unit_amount);
  if (!draft.name.trim()) return "Plan name is required.";
  if (!Number.isInteger(minutes) || minutes <= 0) return "Minutes must be a positive whole number.";
  if (!Number.isInteger(unitAmount) || unitAmount <= 0) return "Price must be a positive integer number of cents.";
  return null;
}

function SuperadminBillingContent() {
  const { apiFetch } = useApi();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [invite, setInvite] = useState({ email: "", first_name: "", last_name: "" });
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/v1/billing/admin/catalog?include_inactive=true");
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(body, "Could not load the billing catalog.", response.status));
      setItems(Array.isArray(body?.items) ? body.items : []);
    } catch (cause) { toast(cause instanceof Error ? cause.message : "Could not load the Stripe catalog.", "error"); }
    finally { setLoading(false); }
  }, [apiFetch]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const request = async (path: string, method: string, action: string, body?: unknown) => {
    const response = await apiFetch(path, { method, headers: { "Idempotency-Key": getIdempotencyKey(action) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      if (!isRetryableBillingStatus(response.status)) clearIdempotencyKey(action);
      const error = new Error(apiErrorMessage(data, "The catalog could not be updated.", response.status)) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    clearIdempotencyKey(action);
    return data;
  };

  const save = async () => {
    const validation = validateDraft(draft);
    if (validation) { toast(validation, "error"); return; }
    setBusy(editing?.product_id || "create");
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        compliance_tier: draft.compliance_tier,
        minutes: Number(draft.minutes),
        unit_amount: Number(draft.unit_amount),
        ...(!editing ? { item_type: draft.item_type, currency: "usd" } : { expected_price_id: editing.price_id }),
      };
      const payloadIdentity = `${draft.name.trim()}:${draft.description.trim()}:${draft.compliance_tier}:${draft.minutes}:${draft.unit_amount}`;
      await request(editing ? `/api/v1/billing/admin/catalog/${editing.product_id}` : "/api/v1/billing/admin/catalog", editing ? "PATCH" : "POST", editing ? `catalog-edit:${editing.product_id}:${editing.price_id}:${payloadIdentity}` : `catalog-create:${draft.item_type}:${payloadIdentity}`, payload);
      toast(editing ? "Plan updated. Existing subscribers remain on their historical Stripe Price." : "Plan created.", "success");
      setDraft(emptyDraft); setEditing(null); await load();
    } catch (cause) {
      if ((cause as Error & { status?: number }).status === 409) {
        await load(); setEditing(null); setDraft(emptyDraft);
        toast("This plan changed in Stripe. The latest catalog was loaded; review it before editing again.", "error");
      } else toast(cause instanceof Error ? cause.message : "The plan could not be saved.", "error");
    } finally { setBusy(null); }
  };

  const beginEdit = (item: CatalogItem) => {
    setEditing(item);
    setDraft({ name: item.name, description: item.description || "", item_type: item.item_type, compliance_tier: item.compliance_tier, minutes: String(item.minutes), unit_amount: String(item.unit_amount) });
  };

  const archive = async (item: CatalogItem) => {
    if (!window.confirm(`Archive ${item.name}? Existing subscriptions and invoice history will not be changed.`)) return;
    setBusy(item.product_id);
    try { await request(`/api/v1/billing/admin/catalog/${item.product_id}`, "DELETE", `catalog-archive:${item.product_id}`); toast("Plan archived.", "success"); await load(); }
    catch (cause) { toast(cause instanceof Error ? cause.message : "The plan could not be archived.", "error"); }
    finally { setBusy(null); }
  };

  const sendInvite = async () => {
    if (!/^\S+@\S+\.\S+$/.test(invite.email.trim())) { toast("Enter a valid email address.", "error"); return; }
    setBusy("invite");
    try {
      const response = await apiFetch("/api/v1/users/invitations/demo", { method: "POST", body: JSON.stringify({ email: invite.email.trim(), first_name: invite.first_name.trim() || undefined, last_name: invite.last_name.trim() || undefined }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(body, "The demo invitation could not be sent.", response.status));
      toast(body.created === false ? "The existing valid demo invitation was returned successfully." : "Demo invitation sent.", "success");
      setInvite({ email: "", first_name: "", last_name: "" });
    } catch (cause) { toast(cause instanceof Error ? cause.message : "The demo invitation could not be sent.", "error"); }
    finally { setBusy(null); }
  };

  const reconcile = async () => {
    if (!window.confirm("Run the replay-safe billing-access reconciliation now? This is an operational migration action, not a routine page refresh.")) return;
    setBusy("reconcile"); setReconcileResult(null);
    try {
      const response = await apiFetch("/api/v1/organizations/reconcile-billing-access", { method: "POST" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(body, "Billing access could not be reconciled.", response.status));
      setReconcileResult(`${body.organizations_seen} organizations checked · ${body.demo_organizations} demos · ${body.billing_exempt_organizations} exempt · ${body.unowned_organizations_skipped} unowned skipped`);
      toast("Billing access reconciliation completed.", "success");
    } catch (cause) { toast(cause instanceof Error ? cause.message : "Reconciliation failed.", "error"); }
    finally { setBusy(null); }
  };

  return <div className="space-y-8 p-1 sm:p-2">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#6BB6FF]">Platform superadmin</p><h1 className="mt-2 text-3xl font-black text-[#F6FAFD]">Billing plans</h1><p className="mt-2 text-sm text-[#B3CFE5]">Stripe is the catalog source of truth. Price, minutes, and tier edits create a replacement Stripe Price.</p></div><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-blue-400/15 px-4 py-2.5 text-sm font-bold text-[#D8E7F4]"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button></div>

    <section className="rounded-2xl border border-blue-400/12 bg-[#071a33]/75 p-5"><h2 className="text-lg font-black text-[#F6FAFD]">{editing ? `Edit ${editing.name}` : "Create plan"}</h2><div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3"><input className={fieldClass} placeholder="Plan name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /><input className={fieldClass} placeholder="Description (optional)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /><select className={fieldClass} disabled={!!editing} value={draft.item_type} onChange={(e) => setDraft({ ...draft, item_type: e.target.value as CatalogItemType })}><option value="subscription">Subscription</option><option value="topup">Top-up</option></select><select className={fieldClass} value={draft.compliance_tier} onChange={(e) => setDraft({ ...draft, compliance_tier: e.target.value as ComplianceTier })}><option value="non_gdpr">Non-GDPR</option><option value="gdpr">GDPR</option></select><input className={fieldClass} type="number" min="1" step="1" placeholder="Minutes" value={draft.minutes} onChange={(e) => setDraft({ ...draft, minutes: e.target.value })} /><input className={fieldClass} type="number" min="1" step="1" placeholder="Price in cents (999)" value={draft.unit_amount} onChange={(e) => setDraft({ ...draft, unit_amount: e.target.value })} /></div><div className="mt-4 flex gap-2"><button onClick={() => void save()} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-[#4A7FA7] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy === (editing?.product_id || "create") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editing ? "Save replacement price" : "Create plan"}</button>{editing && <button onClick={() => { setEditing(null); setDraft(emptyDraft); }} className="inline-flex items-center gap-2 rounded-xl border border-blue-400/15 px-4 py-2.5 text-sm font-bold text-[#D8E7F4]"><X className="h-4 w-4" /> Cancel</button>}</div></section>

    <section className="overflow-hidden rounded-2xl border border-blue-400/12 bg-[#071a33]/75"><div className="border-b border-blue-400/10 p-5"><h2 className="text-lg font-black text-[#F6FAFD]">Stripe catalog</h2></div>{loading && items.length === 0 ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-[#6BB6FF]" /></div> : <div className="divide-y divide-blue-400/10">{items.map((item) => <div key={`${item.product_id}:${item.price_id}`} className="grid gap-4 p-5 lg:grid-cols-[1fr_180px_180px_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-[#F6FAFD]">{item.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${item.active ? "bg-green-500/15 text-green-200" : "bg-slate-500/15 text-slate-300"}`}>{item.active ? "Active" : "Archived"}</span>{!item.checkout_enabled && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-amber-200">Checkout disabled</span>}</div><p className="mt-1 text-xs text-[#B3CFE5]">{item.product_id} · {item.price_id}</p></div><p className="text-sm font-bold text-[#D8E7F4]">{tierLabel(item.compliance_tier)} · {item.item_type}</p><p className="text-sm font-bold text-[#D8E7F4]">{item.minutes.toLocaleString()} min · {formatUsd(item.unit_amount)}</p><div className="flex gap-2"><button disabled={!item.active || !!busy} onClick={() => beginEdit(item)} className="rounded-lg border border-blue-400/15 p-2 text-[#B3CFE5] disabled:opacity-40" title="Edit plan"><Pencil className="h-4 w-4" /></button><button disabled={!item.active || !!busy} onClick={() => void archive(item)} className="rounded-lg border border-red-400/20 p-2 text-red-200 disabled:opacity-40" title="Archive plan">{busy === item.product_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}</button></div></div>)}</div>}</section>

    <section className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-blue-400/12 bg-[#071a33]/75 p-5"><h2 className="text-lg font-black text-[#F6FAFD]">Invite demo user</h2><p className="mt-1 text-sm text-[#B3CFE5]">Creates a 15-day, 60-minute non-GDPR demo invitation. Replays return the still-valid invitation.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><input className={`${fieldClass} sm:col-span-2`} type="email" placeholder="Email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} /><input className={fieldClass} placeholder="First name (optional)" value={invite.first_name} onChange={(e) => setInvite({ ...invite, first_name: e.target.value })} /><input className={fieldClass} placeholder="Last name (optional)" value={invite.last_name} onChange={(e) => setInvite({ ...invite, last_name: e.target.value })} /></div><button disabled={busy === "invite"} onClick={() => void sendInvite()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#4A7FA7] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy === "invite" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send invitation</button></div>
      <div className="rounded-2xl border border-blue-400/12 bg-[#071a33]/75 p-5"><h2 className="text-lg font-black text-[#F6FAFD]">Legacy access reconciliation</h2><p className="mt-1 text-sm leading-6 text-[#B3CFE5]">Run only as an intentional operational migration. It is replay-safe and leaves organizations whose creator no longer exists unchanged.</p><button disabled={busy === "reconcile"} onClick={() => void reconcile()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-400/25 px-4 py-2.5 text-sm font-black text-amber-100 disabled:opacity-50">{busy === "reconcile" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Run reconciliation</button>{reconcileResult && <p className="mt-4 rounded-xl bg-green-500/10 p-3 text-sm text-green-100">{reconcileResult}</p>}</div></section>
  </div>;
}

export default function SuperadminBillingPlansPage() {
  return <RoleGuard allow={["super_admin"]}><SuperadminBillingContent /></RoleGuard>;
}
