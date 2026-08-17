"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Clock3, Loader2, RotateCcw, Save, Settings2 } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { toast } from "@/components/Toast";
import { Tooltip } from "@/components/Tooltip";
import { useApi } from "@/lib/useApi";

type ScoringMethod = "v4" | "v5";
type PolicySource = "system_default" | "organization_policy";

interface ScoringPolicySettings {
  schema_version: 1;
  scoring_method: ScoringMethod;
  allow_call_scoring_method_override: boolean;
  success: { threshold: number; operator: "gt" | "gte"; missing_score_result: "failure" | "success" };
  question_scoring: { full_evidence_score: number; partial_evidence_score: number; no_evidence_score: number; negative_no_issue_score: number; negative_issue_score: number; open_ended_points_per_item: number; maximum_question_score: number; v5_pass_threshold: number; v5_pass_score: number; v5_fail_score: number; v5_not_applicable: "exclude" | "score_zero" };
  aggregation: { no_eligible_questions_score: number; rounding_decimals: number };
  red_flags: { overall_weight: number; flag_item_threshold: number; critical_score_threshold: number; immediate_attention_threshold: number; critical_forces_failure: boolean; immediate_attention_forces_failure: boolean };
  questionnaire_weight_defaults: { critical_compliance: number; important_quality: number; standard: number; nice_to_have: number };
  outcome_explanation: { success_criteria: string[]; failure_criteria: string[]; custom_instructions: string };
}

interface PolicyResponse { organization_id: string; source: PolicySource; policy_id: string | null; version: number; is_current: boolean; settings: ScoringPolicySettings; change_reason: string | null; created_by: string | null; created_at: string | null; }
interface HistoryResponse { items: PolicyResponse[]; total: number; }
type SettingsSection = "success" | "question_scoring" | "aggregation" | "red_flags" | "questionnaire_weight_defaults" | "outcome_explanation";

const endpoint = "/api/v1/organization/scoring-policy";
const inputClass = "mt-1.5 w-full rounded-xl border border-blue-400/15 bg-[#081b35]/70 px-3 py-2 text-sm text-[#F6FAFD] outline-none focus:border-[#4A7FA7]";
const labelClass = "text-[11px] font-black uppercase tracking-[0.12em] text-[#B3CFE5]";

const descriptions: Record<string, string> = {
  "Scoring model": "Choose the default scoring method used for future calls in this organization.",
  "Call success": "Define when a call is classified as successful from its final score.",
  "Question scoring": "Set the score awarded for each evidence type and V5 answer outcome.",
  "Aggregation": "Control how question scores are combined into a final call score.",
  "Red flags": "Configure the impact of risk flags on the final score and outcome.",
  "Questionnaire weight defaults": "Set the default relative importance assigned to new questionnaire questions.",
  "Custom outcome instructions": "Add organization-specific guidance that helps explain success and failure outcomes.",
  "Success criteria": "Define the evidence and conditions that should count as a successful call.",
  "Failure criteria": "Define the evidence and conditions that should count as an unsuccessful call.",
  "Save changes": "Review and save your policy updates as a new auditable version.",
  "Default method": "The scoring method selected automatically for new calls unless an override is allowed.",
  "Threshold": "The score boundary used to determine whether a call succeeds.",
  "Comparison": "Choose whether scores must be strictly above, or may equal, the success threshold.",
  "Missing score": "Choose the outcome used if the system cannot calculate a final score.",
  "Full evidence": "Score awarded when direct, clear evidence supports the answer.",
  "Partial evidence": "Score awarded when available evidence is relevant but incomplete or inconclusive.",
  "No evidence": "Score awarded when no supporting evidence is found.",
  "Negative: no issue": "Score awarded when a negative question confirms that no issue occurred.",
  "Negative: issue": "Score awarded when a negative question identifies that an issue occurred.",
  "Open-ended / item": "Points awarded for each qualifying item found in an open-ended response.",
  "Maximum question score": "The highest score any individual question can contribute.",
  "V5 pass threshold": "The minimum V5 result needed for an answer to be considered a pass.",
  "V5 pass score": "Score awarded to a V5 answer that passes the threshold.",
  "V5 fail score": "Score awarded to a V5 answer that does not pass the threshold.",
  "V5 not applicable": "Choose whether non-applicable V5 questions are excluded or scored as zero.",
  "No eligible questions score": "Final score used when a call has no questions eligible for scoring.",
  "Rounding decimals": "Number of decimal places kept in final calculated scores.",
  "Overall score weight": "How much red flags affect the overall score. A value of 0 excludes them.",
  "Flag item threshold": "Score at or above which an individual red-flag item is treated as flagged.",
  "Critical threshold": "Score at or above which a red flag is classified as critical.",
  "Immediate-attention threshold": "Score at or above which a red flag requires immediate attention.",
  "Critical compliance": "Default weight for compliance questions that are critical to the organization.",
  "Important quality": "Default weight for high-impact quality questions.",
  "Standard": "Default weight for normal questionnaire questions.",
  "Nice to have": "Default weight for lower-priority questionnaire questions.",
  "Change reason": "Optional audit note explaining why this scoring policy is being changed.",
};

function readError(body: unknown, fallback: string) {
  const value = body as { detail?: string | { message?: string }; message?: string } | null;
  return typeof value?.detail === "string" ? value.detail : value?.detail?.message || value?.message || fallback;
}

function Field({ label, value, onChange, min = 0, max = 100, step = 1, help }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; help?: string }) {
  return <Tooltip fullWidth content={help || descriptions[label] || `Set the ${label.toLowerCase()} value for this policy.`}><label className="block w-full"><span className={labelClass}>{label}</span>{help && <span className="ml-2 text-xs text-[#B3CFE5]/60 normal-case tracking-normal">{help}</span>}<input className={inputClass} type="number" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label></Tooltip>;
}
function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (checked: boolean) => void; help?: string }) {
  return <Tooltip fullWidth content={help || descriptions[label] || `Enable or disable ${label.toLowerCase()} for this organization.`}><label className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-blue-400/10 bg-blue-950/20 px-3 py-3"><span><span className="block text-sm font-bold text-[#F6FAFD]">{label}</span>{help && <span className="mt-0.5 block text-xs text-[#B3CFE5]/65">{help}</span>}</span><input className="h-4 w-4 accent-[#4A7FA7]" type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /></label></Tooltip>;
}
function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <Tooltip fullWidth content={descriptions[label] || `Choose the ${label.toLowerCase()} setting for this policy.`}><label className="block w-full"><span className={labelClass}>{label}</span><select className={inputClass} value={value} onChange={e => onChange(e.target.value)}>{children}</select></label></Tooltip>;
}
function Card({ title, children }: { title: string; children: React.ReactNode }) { return <Tooltip fullWidth content={descriptions[title] || `${title} scoring-policy settings.`}><section className="w-full rounded-2xl border border-blue-400/12 bg-[#071a33]/75 p-5 shadow-xl shadow-black/10"><h2 className="mb-4 text-base font-black text-[#F6FAFD]">{title}</h2>{children}</section></Tooltip>; }

function SettingsContent() {
  const { apiFetch } = useApi();
  const [current, setCurrent] = useState<PolicyResponse | null>(null);
  const [settings, setSettings] = useState<ScoringPolicySettings | null>(null);
  const [history, setHistory] = useState<PolicyResponse[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadPolicy = useCallback(async (loadHistory = false) => {
    setLoading(true); setError(null);
    try {
      const response = await apiFetch(endpoint);
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(readError(data, "Could not load scoring settings."));
      setCurrent(data); setSettings(data.settings);
      if (loadHistory) {
        const h = await apiFetch(`${endpoint}/history?limit=50&offset=0`);
        const hData = await h.json().catch(() => null);
        if (h.ok) setHistory((hData as HistoryResponse).items || []);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load scoring settings."); }
    finally { setLoading(false); }
  }, [apiFetch]);
  useEffect(() => { void Promise.resolve().then(() => loadPolicy()); }, [loadPolicy]);

  const dirty = useMemo(() => !!current && !!settings && JSON.stringify(current.settings) !== JSON.stringify(settings), [current, settings]);
  const update = <K extends SettingsSection>(section: K, patch: Partial<ScoringPolicySettings[K]>) => setSettings(prev => prev ? { ...prev, [section]: { ...prev[section], ...patch } } : prev);
  const validate = () => {
    if (!settings) return "Settings are unavailable.";
    const s = settings;
    const percentages = [...Object.values(s.success).filter(v => typeof v === "number"), ...Object.values(s.question_scoring).filter(v => typeof v === "number"), s.aggregation.no_eligible_questions_score, ...Object.values(s.questionnaire_weight_defaults)];
    if (percentages.some(v => typeof v === "number" && (v < 0 || v > 100))) return "Scores must be between 0 and 100.";
    if (s.red_flags.overall_weight < 0 || s.red_flags.overall_weight > 1) return "Red-flag overall weight must be between 0 and 1.";
    if (s.aggregation.rounding_decimals < 0 || s.aggregation.rounding_decimals > 4) return "Rounding decimals must be between 0 and 4.";
    if (s.question_scoring.maximum_question_score < Math.max(s.question_scoring.full_evidence_score, s.question_scoring.partial_evidence_score, s.question_scoring.no_evidence_score, s.question_scoring.negative_no_issue_score, s.question_scoring.negative_issue_score)) return "A question score cannot exceed its maximum.";
    if (!s.outcome_explanation.success_criteria.length || !s.outcome_explanation.failure_criteria.length) return "Add at least one success and one failure criterion.";
    if ([...s.outcome_explanation.success_criteria, ...s.outcome_explanation.failure_criteria].some(item => !item.trim() || item.length > 500)) return "Each criterion must be 1–500 characters.";
    if (s.outcome_explanation.success_criteria.length > 20 || s.outcome_explanation.failure_criteria.length > 20) return "Each criterion is limited to 20 items.";
    if (s.outcome_explanation.custom_instructions.length > 2000) return "Custom instructions are limited to 2,000 characters.";
    return null;
  };
  const save = async () => {
    const validation = validate(); if (validation || !current || !settings) { setError(validation); return; }
    setSaving(true); setError(null);
    try {
      const response = await apiFetch(endpoint, { method: "PUT", body: JSON.stringify({ expected_version: current.version, change_reason: reason.trim() || null, settings }) });
      const data = await response.json().catch(() => null);
      if (response.status === 409) { await loadPolicy(); throw new Error("Another admin changed this policy. The latest settings have been loaded; please review and save again."); }
      if (!response.ok) throw new Error(readError(data, "Could not save scoring settings."));
      setCurrent(data); setSettings(data.settings); setReason(""); toast(`Policy version ${data.version} saved.`, "success"); if (showHistory) loadPolicy(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save scoring settings."); }
    finally { setSaving(false); }
  };
  const reset = async () => {
    if (!current || !window.confirm("Reset this organization’s scoring policy to platform defaults?")) return;
    setSaving(true); setError(null);
    try {
      const response = await apiFetch(`${endpoint}/reset`, { method: "POST", body: JSON.stringify({ expected_version: current.version, change_reason: reason.trim() || "Return to platform defaults" }) });
      const data = await response.json().catch(() => null);
      if (response.status === 409) { await loadPolicy(); throw new Error("Another admin changed this policy. The latest settings have been loaded."); }
      if (!response.ok) throw new Error(readError(data, "Could not reset scoring settings."));
      setCurrent(data); setSettings(data.settings); setReason(""); toast("Policy reset to platform defaults.", "success"); if (showHistory) loadPolicy(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not reset scoring settings."); }
    finally { setSaving(false); }
  };
  const criteria = (kind: "success_criteria" | "failure_criteria", title: string) => <Card title={title}><div className="space-y-2">{settings?.outcome_explanation[kind].map((item, index) => <div className="flex gap-2" key={`${kind}-${index}`}><Tooltip fullWidth content={`Write the ${kind === "success_criteria" ? "success" : "failure"} condition evaluated by CallBlick.`}><textarea className={inputClass} maxLength={500} rows={2} value={item} onChange={e => update("outcome_explanation", { [kind]: settings.outcome_explanation[kind].map((value, i) => i === index ? e.target.value : value) } as Partial<ScoringPolicySettings["outcome_explanation"]>)} /></Tooltip><Tooltip content="Remove this criterion from the policy."><button className="text-xs font-bold text-red-300" onClick={() => update("outcome_explanation", { [kind]: settings.outcome_explanation[kind].filter((_, i) => i !== index) } as Partial<ScoringPolicySettings["outcome_explanation"]>)}>Remove</button></Tooltip></div>)}</div><Tooltip content="Add another criterion to this policy."><button className="mt-3 text-sm font-bold text-[#B3CFE5] hover:text-white" onClick={() => update("outcome_explanation", { [kind]: [...settings!.outcome_explanation[kind], ""] } as Partial<ScoringPolicySettings["outcome_explanation"]>)}>+ Add criterion</button></Tooltip></Card>;

  if (loading && !settings) return <div className="min-h-[70vh] p-8 flex items-center justify-center"><div className="h-10 w-10 rounded-2xl border-4 border-[#1A3D63]/40 border-t-[#4A7FA7] animate-spin" /></div>;
  if (!settings || !current) return <div className="min-h-[70vh] p-8"><p className="text-red-300">{error || "Scoring settings are unavailable."}</p><button onClick={() => loadPolicy()} className="mt-4 text-[#B3CFE5]">Try again</button></div>;
  return <div className="w-full p-1 sm:p-2"><div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-[#B3CFE5]"><Settings2 className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[0.18em]">Organization controls</span></div><h1 className="mt-2 text-3xl font-black text-[#F6FAFD]">Scoring settings</h1><p className="mt-2 text-sm text-[#B3CFE5]">Changes apply to future calls in this organization. Saved policies are versioned for auditability.</p></div><div className="rounded-xl border border-blue-400/15 bg-blue-950/35 px-4 py-3 text-right"><p className="text-xs text-[#B3CFE5]">Effective policy</p><p className="mt-1 font-black text-[#F6FAFD]">{current.source === "system_default" ? "Platform default" : "Organization policy"} · v{current.version}</p></div></div>
    {error && <div className="mb-5 flex gap-2 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}
    <div className="grid items-start gap-5 lg:grid-cols-2"><Card title="Scoring model"><div className="grid gap-4 sm:grid-cols-2"><SelectField label="Default method" value={settings.scoring_method} onChange={value => setSettings({ ...settings, scoring_method: value as ScoringMethod })}><option value="v4">V4</option><option value="v5">V5</option></SelectField><Toggle label="Allow per-call override" checked={settings.allow_call_scoring_method_override} onChange={value => setSettings({ ...settings, allow_call_scoring_method_override: value })} help="Allows uploaders to select V4 or V5." /></div></Card>
      <Card title="Call success"><div className="grid gap-4 sm:grid-cols-3"><Field label="Threshold" value={settings.success.threshold} onChange={value => update("success", { threshold: value })} /><SelectField label="Comparison" value={settings.success.operator} onChange={value => update("success", { operator: value as "gt" | "gte" })}><option value="gt">Greater than</option><option value="gte">Greater than or equal</option></SelectField><SelectField label="Missing score" value={settings.success.missing_score_result} onChange={value => update("success", { missing_score_result: value as "failure" | "success" })}><option value="failure">Failure</option><option value="success">Success</option></SelectField></div></Card>
      <Card title="Question scoring"><div className="grid gap-4 sm:grid-cols-2">{([['full_evidence_score','Full evidence'],['partial_evidence_score','Partial evidence'],['no_evidence_score','No evidence'],['negative_no_issue_score','Negative: no issue'],['negative_issue_score','Negative: issue'],['open_ended_points_per_item','Open-ended / item'],['maximum_question_score','Maximum question score'],['v5_pass_threshold','V5 pass threshold'],['v5_pass_score','V5 pass score'],['v5_fail_score','V5 fail score']] as const).map(([key,label]) => <Field key={key} label={label} value={settings.question_scoring[key]} step={key === 'open_ended_points_per_item' ? 0.01 : 1} onChange={value => update("question_scoring", { [key]: value })} />)}<SelectField label="V5 not applicable" value={settings.question_scoring.v5_not_applicable} onChange={value => update("question_scoring", { v5_not_applicable: value as "exclude" | "score_zero" })}><option value="exclude">Exclude</option><option value="score_zero">Score zero</option></SelectField></div></Card>
      <Card title="Aggregation"><div className="grid gap-4 sm:grid-cols-2"><Field label="No eligible questions score" value={settings.aggregation.no_eligible_questions_score} onChange={value => update("aggregation", { no_eligible_questions_score: value })} /><Field label="Rounding decimals" value={settings.aggregation.rounding_decimals} min={0} max={4} onChange={value => update("aggregation", { rounding_decimals: value })} /></div></Card>
      <Card title="Red flags"><div className="grid gap-4 sm:grid-cols-2"><Field label="Overall score weight" value={settings.red_flags.overall_weight} min={0} max={1} step={0.01} help="0 excludes red flags" onChange={value => update("red_flags", { overall_weight: value })} />{([['flag_item_threshold','Flag item threshold'],['critical_score_threshold','Critical threshold'],['immediate_attention_threshold','Immediate-attention threshold']] as const).map(([key,label]) => <Field key={key} label={label} value={settings.red_flags[key]} onChange={value => update("red_flags", { [key]: value })} />)}<Toggle label="Critical forces failure" checked={settings.red_flags.critical_forces_failure} onChange={value => update("red_flags", { critical_forces_failure: value })} /><Toggle label="Immediate attention forces failure" checked={settings.red_flags.immediate_attention_forces_failure} onChange={value => update("red_flags", { immediate_attention_forces_failure: value })} /></div></Card>
      <Card title="Questionnaire weight defaults"><div className="grid gap-4 sm:grid-cols-2">{([['critical_compliance','Critical compliance'],['important_quality','Important quality'],['standard','Standard'],['nice_to_have','Nice to have']] as const).map(([key,label]) => <Field key={key} label={label} value={settings.questionnaire_weight_defaults[key]} min={0.01} onChange={value => update("questionnaire_weight_defaults", { [key]: value })} />)}</div></Card>
      <Card title="Custom outcome instructions"><Tooltip fullWidth content="Optional organization-specific guidance for the AI when explaining why a call succeeded or failed."><textarea className={inputClass} rows={5} maxLength={2000} value={settings.outcome_explanation.custom_instructions} placeholder="Optional instructions for explaining outcomes" onChange={e => update("outcome_explanation", { custom_instructions: e.target.value })} /></Tooltip><p className="mt-1 text-right text-xs text-[#B3CFE5]/60">{settings.outcome_explanation.custom_instructions.length}/2000</p></Card></div>
    <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">{criteria("success_criteria", "Success criteria")}{criteria("failure_criteria", "Failure criteria")}</div>
    <div className="mt-5"><Card title="Save changes"><Tooltip fullWidth content={descriptions["Change reason"]}><label className="block w-full"><span className={labelClass}>Change reason <span className="normal-case font-normal text-[#B3CFE5]/60">(recommended for audit history)</span></span><input className={inputClass} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} placeholder="Why are you changing this policy?" /></label></Tooltip><div className="mt-4 flex flex-wrap gap-3"><Tooltip content="Save these changes as the next version of this organization’s scoring policy."><button disabled={!dirty || saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save policy</button></Tooltip><Tooltip content="Discard all unsaved policy changes and restore the currently active version."><button disabled={saving} onClick={() => { setSettings(current.settings); setReason(""); setError(null); }} className="rounded-xl border border-blue-400/20 px-4 py-2.5 text-sm font-bold text-[#B3CFE5]">Discard edits</button></Tooltip><Tooltip content="Replace this organization’s custom policy with the platform default settings."><button disabled={saving} onClick={reset} className="ml-auto inline-flex items-center gap-2 rounded-xl border border-red-400/25 px-4 py-2.5 text-sm font-bold text-red-200"><RotateCcw className="h-4 w-4" /> Reset defaults</button></Tooltip></div></Card></div>
    <section className="mt-5 rounded-2xl border border-blue-400/12 bg-[#071a33]/75"><Tooltip fullWidth content="Open the version history to review previous saved scoring policies and their change reasons."><button className="flex w-full items-center justify-between p-5 text-left" onClick={() => { const next = !showHistory; setShowHistory(next); if (next) loadPolicy(true); }}><span className="flex items-center gap-2 font-black text-[#F6FAFD]"><Clock3 className="h-5 w-5 text-[#B3CFE5]" />Policy history</span><ChevronDown className={`h-5 w-5 text-[#B3CFE5] transition-transform ${showHistory ? "rotate-180" : ""}`} /></button></Tooltip>{showHistory && <div className="border-t border-blue-400/10 p-5">{loading ? <Loader2 className="h-5 w-5 animate-spin text-[#4A7FA7]" /> : history.length ? <div className="space-y-3">{history.map(item => <Tooltip key={item.policy_id || item.version} fullWidth content={`Policy version ${item.version}. ${item.change_reason || "No change reason was provided."}`}><div className="w-full flex flex-wrap items-center justify-between gap-2 rounded-xl bg-blue-950/25 px-4 py-3 text-sm"><span className="font-bold text-[#F6FAFD]">v{item.version} · {item.source === "system_default" ? "Platform default" : "Organization policy"}{item.is_current && <span className="ml-2 text-xs text-green-300">Current</span>}</span><span className="text-[#B3CFE5]">{item.change_reason || "No reason provided"}{item.created_at && ` · ${new Date(item.created_at).toLocaleString()}`}</span></div></Tooltip>)}</div> : <p className="text-sm text-[#B3CFE5]">No saved policy versions yet.</p>}</div>}</section>
  </div>;
}

export default function SettingsPage() { return <RoleGuard allow={["admin"]}><SettingsContent /></RoleGuard>; }
