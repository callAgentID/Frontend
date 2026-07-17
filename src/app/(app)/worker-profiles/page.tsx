"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  Check,
  ChevronDown,
  Database,
  DollarSign,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  X,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { toast } from "@/components/Toast";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { formatLLMCost, formatTokens } from "@/lib/formatters";
import {
  WorkerProfile,
  OpenRouterModel,
  OpenRouterModelPage,
  LlmCostAnalytics,
  formatWorkerProfileModels,
} from "@/lib/workerProfiles";

type Tab = "profiles" | "create" | "catalog" | "costs";

type ProfileDraft = {
  name: string;
  llm_script_model: string;
  llm_qa_model: string;
  is_global: boolean;
};

type ModelFilters = {
  search: string;
  eligible: "true" | "false" | "all";
  input_modality: string;
  output_modality: string;
  supported_parameter: string;
  sort_by: "name" | "id" | "context_length" | "prompt_price" | "completion_price";
  sort_order: "asc" | "desc";
  offset: string;
  limit: string;
};

const emptyDraft: ProfileDraft = {
  name: "",
  llm_script_model: "",
  llm_qa_model: "",
  is_global: true,
};

const defaultModelFilters: ModelFilters = {
  search: "",
  eligible: "true",
  input_modality: "",
  output_modality: "",
  supported_parameter: "",
  sort_by: "name",
  sort_order: "asc",
  offset: "0",
  limit: "300",
};

function messageFromErrorBody(body: unknown, fallback: string) {
  const value = body as { detail?: string | { message?: string; reasons?: string[] }; message?: string } | null;
  if (typeof value?.detail === "string") return value.detail;
  if (typeof value?.detail === "object" && value.detail?.message) {
    return `${value.detail.message}${value.detail.reasons?.length ? `: ${value.detail.reasons.join(", ")}` : ""}`;
  }
  if (value?.message) return value.message;
  return fallback;
}

function normalizeInteger(value: string, fallback: number, min: number, max?: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return String(fallback);
  const limited = max === undefined ? Math.max(min, parsed) : Math.min(max, Math.max(min, parsed));
  return String(limited);
}

function buildModelParams(filters: ModelFilters, force: boolean) {
  const params = new URLSearchParams();
  const trimmedSearch = filters.search.trim();
  if (trimmedSearch) params.set("search", trimmedSearch);
  if (filters.eligible !== "all") params.set("eligible", filters.eligible);
  if (filters.input_modality.trim()) params.set("input_modality", filters.input_modality.trim());
  if (filters.output_modality.trim()) params.set("output_modality", filters.output_modality.trim());
  if (filters.supported_parameter.trim()) params.set("supported_parameter", filters.supported_parameter.trim());
  params.set("sort_by", filters.sort_by);
  params.set("sort_order", filters.sort_order);
  params.set("offset", normalizeInteger(filters.offset, 0, 0));
  params.set("limit", normalizeInteger(filters.limit, 100, 1, 500));
  if (force) params.set("force_refresh", "true");
  return params;
}

function ModelSelect({
  label,
  value,
  onChange,
  models,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  models: OpenRouterModel[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => models.find((model) => model.id === value), [models, value]);
  const filteredModels = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return models;
    return models.filter((model) => `${model.name} ${model.id}`.toLowerCase().includes(needle));
  }, [models, query]);

  const selectedLabel = selected ? `${selected.name || selected.id} - ${selected.id}` : value || "Select eligible model...";

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setOpen(false);
        setQuery("");
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative space-y-2">
      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-blue-400/12 bg-blue-950/30 px-4 text-left text-sm font-bold text-[#F6FAFD] outline-none transition-colors hover:bg-blue-950/45 focus:border-[#4A7FA7] disabled:opacity-60"
      >
        <span className={cn("truncate", !value && "text-[#B3CFE5]")}>{selectedLabel}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#B3CFE5] transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[90] rounded-2xl border border-blue-400/18 bg-[#06162d]/98 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B3CFE5]" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter models..."
              className="h-10 w-full rounded-xl border border-blue-400/12 bg-blue-950/35 pl-9 pr-3 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]"
            />
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {filteredModels.map((model) => (
              <button
                key={model.id}
                type="button"
                disabled={!model.eligible}
                onClick={() => {
                  onChange(model.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                  model.id === value ? "bg-[#4A7FA7]/22 text-white" : "text-[#D8E7F4] hover:bg-blue-950/45",
                  !model.eligible && "cursor-not-allowed opacity-45"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold">{model.name || model.id}</span>
                  <span className="block truncate font-mono text-[11px] text-[#B3CFE5]">{model.id}</span>
                </span>
                {model.id === value && <Check className="mt-1 h-4 w-4 shrink-0 text-[#6BB6FF]" />}
              </button>
            ))}
            {filteredModels.length === 0 && (
              <div className="px-3 py-6 text-center text-sm font-bold text-[#B3CFE5]">No models match this search.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkerProfilesPageContent() {
  const { apiFetch } = useApi();
  const [tab, setTab] = useState<Tab>("profiles");
  const [profiles, setProfiles] = useState<WorkerProfile[]>([]);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [catalog, setCatalog] = useState<OpenRouterModelPage | null>(null);
  const [modelFilters, setModelFilters] = useState<ModelFilters>(defaultModelFilters);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [profileEdits, setProfileEdits] = useState<ProfileDraft>(emptyDraft);
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft);
  const [costs, setCosts] = useState<LlmCostAnalytics | null>(null);
  const [costFilters, setCostFilters] = useState({ profileId: "", model: "", stage: "", createdAfter: "" });
  const [loadingCosts, setLoadingCosts] = useState(false);

  const selectableModels = useMemo(() => models.filter((model) => model.eligible), [models]);

  const parseResponse = async <T,>(response: Response, fallback: string): Promise<T> => {
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(messageFromErrorBody(body, fallback));
    return body as T;
  };

  const loadProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const response = await apiFetch("/api/v1/worker/profiles?include_inactive=true&skip=0&limit=500");
      const data = await parseResponse<WorkerProfile[]>(response, "Failed to load worker profiles");
      setProfiles(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "Failed to load worker profiles", "error");
    } finally {
      setLoadingProfiles(false);
    }
  }, [apiFetch]);

  const loadModels = useCallback(async (force = false) => {
    setLoadingModels(true);
    try {
      const params = buildModelParams(modelFilters, force);
      const response = await apiFetch(`/api/v1/worker/llm-models?${params.toString()}`);
      const data = await parseResponse<OpenRouterModelPage>(response, "OpenRouter model catalog is unavailable");
      setCatalog(data);
      setModels(Array.isArray(data?.items) ? data.items : []);
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "Failed to load model catalog", "error");
      setCatalog(null);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, [apiFetch, modelFilters]);

  const loadCosts = useCallback(async () => {
    setLoadingCosts(true);
    try {
      const params = new URLSearchParams();
      if (costFilters.profileId) params.append("processing_profile_id", costFilters.profileId);
      if (costFilters.model) params.append("model", costFilters.model);
      if (costFilters.stage) params.append("stage", costFilters.stage);
      if (costFilters.createdAfter) params.append("created_after", new Date(costFilters.createdAfter).toISOString());
      const response = await apiFetch(`/api/v1/analytics/llm-costs${params.toString() ? `?${params.toString()}` : ""}`);
      const data = await parseResponse<LlmCostAnalytics>(response, "Failed to load LLM cost analytics");
      setCosts(data);
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "Failed to load LLM cost analytics", "error");
      setCosts(null);
    } finally {
      setLoadingCosts(false);
    }
  }, [apiFetch, costFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProfiles();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProfiles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadModels(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [loadModels]);

  useEffect(() => {
    if (tab !== "costs") return;
    const timer = setTimeout(() => {
      void loadCosts();
    }, 0);
    return () => clearTimeout(timer);
  }, [tab, loadCosts]);

  const saveProfile = async (profile: WorkerProfile, updates: Partial<WorkerProfile>) => {
    const payload = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== null && value !== undefined && value !== ""));
    if (Object.keys(payload).length === 0) return true;
    setSavingId(profile.id);
    try {
      const response = await apiFetch(`/api/v1/worker/profiles/${profile.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const data = await parseResponse<WorkerProfile>(response, "Failed to update profile");
      setProfiles((prev) => prev.map((item) => (item.id === profile.id ? data : item)));
      toast("Worker profile updated", "success");
      return true;
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "Failed to update profile", "error");
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const startEditingProfile = (profile: WorkerProfile) => {
    setEditingProfileId(profile.id);
    setProfileEdits({
      name: profile.name,
      llm_script_model: profile.llm_script_model,
      llm_qa_model: profile.llm_qa_model,
      is_global: profile.is_global,
    });
  };

  const cancelEditingProfile = () => {
    setEditingProfileId(null);
    setProfileEdits(emptyDraft);
  };

  const saveProfileEdits = async (profile: WorkerProfile) => {
    const saved = await saveProfile(profile, {
      name: profileEdits.name.trim(),
      llm_script_model: profileEdits.llm_script_model,
      llm_qa_model: profileEdits.llm_qa_model,
    });
    if (saved) cancelEditingProfile();
  };

  const createProfile = async () => {
    if (!draft.name.trim() || !draft.llm_script_model || !draft.llm_qa_model) {
      toast("Name, script model, and QA model are required", "error");
      return;
    }
    setSavingId("new");
    try {
      const response = await apiFetch("/api/v1/worker/profiles", {
        method: "POST",
        body: JSON.stringify({
          name: draft.name.trim(),
          llm_script_model: draft.llm_script_model,
          llm_qa_model: draft.llm_qa_model,
          is_global: draft.is_global,
        }),
      });
      const data = await parseResponse<WorkerProfile>(response, "Failed to create profile");
      setProfiles((prev) => [data, ...prev]);
      setDraft(emptyDraft);
      setTab("profiles");
      toast("Worker profile created", "success");
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "Failed to create profile", "error");
    } finally {
      setSavingId(null);
    }
  };

  const deleteProfile = async (profile: WorkerProfile) => {
    if (!confirm(`Delete ${profile.name}? Historical calls remain, but this cannot be undone through the API.`)) return;
    setSavingId(profile.id);
    try {
      const response = await apiFetch(`/api/v1/worker/profiles/${profile.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(messageFromErrorBody(body, "Failed to delete profile"));
      }
      setProfiles((prev) => prev.filter((item) => item.id !== profile.id));
      toast("Worker profile deleted", "success");
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "Failed to delete profile", "error");
    } finally {
      setSavingId(null);
    }
  };

  const updateModelFilter = <K extends keyof ModelFilters>(key: K, value: ModelFilters[K]) => {
    setModelFilters((prev) => ({ ...prev, [key]: value }));
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "profiles", label: "Profiles" },
    { id: "create", label: "Create Profile" },
    { id: "catalog", label: "Model Catalog" },
    { id: "costs", label: "LLM Cost Analytics" },
  ];

  return (
    <div className="space-y-8 p-4 animate-in fade-in duration-150 sm:p-6 md:p-10">
      <div className="flex flex-col gap-6 border-b border-blue-400/18 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-xl bg-[#4A7FA7]/20 p-2 text-[#4A7FA7]"><BrainCircuit className="h-5 w-5" /></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A7FA7]">Super Admin</span>
          </div>
          <h1 className="text-[34px] font-[850] leading-none tracking-tight text-[#F6FAFD] sm:text-[48px]">Worker Profiles</h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold text-[#B3CFE5]">Manage reusable processing profiles, select eligible OpenRouter models, and inspect LLM spend by profile.</p>
        </div>
        <button onClick={() => { void loadProfiles(); void loadModels(true); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4A7FA7] px-4 text-xs font-black uppercase tracking-widest text-white hover:bg-[#4A7FA7]/90">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={cn("rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors", tab === item.id ? "border-blue-400/20 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white" : "border-blue-400/10 bg-blue-950/18 text-[#B3CFE5] hover:text-[#F6FAFD]")}>{item.label}</button>
        ))}
      </div>

      {tab === "profiles" && (
        <div className="glass-card rounded-[2rem] border border-blue-400/18">
          {loadingProfiles ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-[#4A7FA7]" /></div>
          ) : profiles.length === 0 ? (
            <div className="p-12 text-center font-bold text-[#B3CFE5]">No worker profiles yet.</div>
          ) : (
            <div className="divide-y divide-blue-400/12">
              {profiles.map((profile) => (
                <div key={profile.id} className="space-y-4 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-[850] text-[#F6FAFD]">{profile.name}</h3>
                        <span className={cn("rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", profile.active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}>{profile.active ? "Active" : "Inactive"}</span>
                        <span className={cn("rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", profile.is_global ? "bg-[#4A7FA7]/20 text-[#9DCEFF]" : "bg-amber-500/20 text-amber-200")}>{profile.is_global ? "Global" : "Private"}</span>
                      </div>
                      <p className="mt-1 truncate text-xs font-bold text-[#B3CFE5]">{formatWorkerProfileModels(profile)}</p>
                      <p className="mt-2 font-mono text-[10px] text-[#B3CFE5]/70">{profile.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button disabled={savingId === profile.id} onClick={() => startEditingProfile(profile)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-400/12 bg-blue-950/30 text-[#B3CFE5] hover:bg-blue-950/45 hover:text-[#F6FAFD] disabled:opacity-60" title="Edit profile"><Pencil className="h-4 w-4" /></button>
                      <button disabled={savingId === profile.id} onClick={() => void saveProfile(profile, { active: !profile.active })} className="h-9 rounded-lg border border-blue-400/12 bg-blue-950/30 px-3 text-xs font-bold text-[#F6FAFD] hover:bg-blue-950/45 disabled:opacity-60">{profile.active ? "Deactivate" : "Reactivate"}</button>
                      <button disabled={savingId === profile.id} onClick={() => void saveProfile(profile, { is_global: !profile.is_global })} className="h-9 rounded-lg border border-blue-400/12 bg-blue-950/30 px-3 text-xs font-bold text-[#F6FAFD] hover:bg-blue-950/45 disabled:opacity-60">{profile.is_global ? "Make private" : "Publish global"}</button>
                      <button disabled={savingId === profile.id} onClick={() => deleteProfile(profile)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/15 text-red-300 hover:bg-red-500/25 disabled:opacity-60" title="Delete profile"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  {editingProfileId === profile.id ? (
                    <div className="grid items-end gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)_minmax(260px,1fr)_auto]">
                      <label className="block space-y-2">
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Name</span>
                        <input value={profileEdits.name} onChange={(event) => setProfileEdits((prev) => ({ ...prev, name: event.target.value }))} className="h-12 w-full rounded-xl border border-blue-400/12 bg-blue-950/30 px-4 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" />
                      </label>
                      <ModelSelect label="Script model" value={profileEdits.llm_script_model} onChange={(value) => setProfileEdits((prev) => ({ ...prev, llm_script_model: value }))} models={selectableModels} disabled={loadingModels || savingId === profile.id} />
                      <ModelSelect label="QA model" value={profileEdits.llm_qa_model} onChange={(value) => setProfileEdits((prev) => ({ ...prev, llm_qa_model: value }))} models={selectableModels} disabled={loadingModels || savingId === profile.id} />
                      <div className="flex h-12 items-center gap-2">
                        <button disabled={savingId === profile.id} onClick={() => void saveProfileEdits(profile)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-green-500/25 bg-green-500/15 text-green-300 hover:bg-green-500/25 disabled:opacity-60" title="Save changes">{savingId === profile.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</button>
                        <button disabled={savingId === profile.id} onClick={cancelEditingProfile} className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-400/12 bg-blue-950/30 text-[#B3CFE5] hover:bg-blue-950/45 disabled:opacity-60" title="Cancel editing"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-3">
                      <div className="space-y-2 rounded-xl border border-blue-400/10 bg-blue-950/18 px-4 py-3">
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Name</span>
                        <p className="truncate text-sm font-bold text-[#F6FAFD]">{profile.name}</p>
                      </div>
                      <div className="space-y-2 rounded-xl border border-blue-400/10 bg-blue-950/18 px-4 py-3">
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Script model</span>
                        <p className="truncate font-mono text-sm font-bold text-[#F6FAFD]">{profile.llm_script_model}</p>
                      </div>
                      <div className="space-y-2 rounded-xl border border-blue-400/10 bg-blue-950/18 px-4 py-3">
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">QA model</span>
                        <p className="truncate font-mono text-sm font-bold text-[#F6FAFD]">{profile.llm_qa_model}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "create" && (
        <div className="glass-card w-full space-y-6 rounded-[2rem] border border-blue-400/18 p-6">
          <div>
            <h2 className="text-2xl font-[850] text-[#F6FAFD]">Create Profile</h2>
            <p className="mt-1 text-sm font-semibold text-[#B3CFE5]">Only submit the editable fields the API accepts.</p>
          </div>
          <label className="block space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Name</span>
            <input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="DeepSeek Global Profile" className="h-12 w-full rounded-xl border border-blue-400/12 bg-blue-950/30 px-4 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <ModelSelect label="Script model" value={draft.llm_script_model} onChange={(value) => setDraft((prev) => ({ ...prev, llm_script_model: value }))} models={selectableModels} disabled={loadingModels} />
            <ModelSelect label="QA model" value={draft.llm_qa_model} onChange={(value) => setDraft((prev) => ({ ...prev, llm_qa_model: value }))} models={selectableModels} disabled={loadingModels} />
          </div>
          <label className="flex items-center gap-3 text-sm font-bold text-[#F6FAFD]"><input type="checkbox" checked={draft.is_global} onChange={(event) => setDraft((prev) => ({ ...prev, is_global: event.target.checked }))} />Publish globally for organization users</label>
          <button onClick={createProfile} disabled={savingId === "new"} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#4A7FA7] px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-[#4A7FA7]/90 disabled:opacity-60">
            {savingId === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Create Profile
          </button>
        </div>
      )}

      {tab === "catalog" && (
        <div className="space-y-4">
          <div className="glass-card rounded-[2rem] border border-blue-400/18 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-[850] text-[#F6FAFD]"><SlidersHorizontal className="h-4 w-4 text-[#4A7FA7]" /> Model filters</div>
            <div className="grid gap-3 lg:grid-cols-4">
              <label className="space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B3CFE5]">search</span><input value={modelFilters.search} onChange={(event) => updateModelFilter("search", event.target.value)} placeholder="deepseek, claude, gemini" className="h-11 w-full rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" /></label>
              <label className="space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B3CFE5]">eligible</span><select value={modelFilters.eligible} onChange={(event) => updateModelFilter("eligible", event.target.value as ModelFilters["eligible"])} className="h-11 w-full rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]"><option value="true">true</option><option value="false">false</option><option value="all">all</option></select></label>
              <label className="space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B3CFE5]">input_modality</span><input value={modelFilters.input_modality} onChange={(event) => updateModelFilter("input_modality", event.target.value)} placeholder="text, image, audio" className="h-11 w-full rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" /></label>
              <label className="space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B3CFE5]">output_modality</span><input value={modelFilters.output_modality} onChange={(event) => updateModelFilter("output_modality", event.target.value)} placeholder="text" className="h-11 w-full rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" /></label>
              <label className="space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B3CFE5]">supported_parameter</span><input value={modelFilters.supported_parameter} onChange={(event) => updateModelFilter("supported_parameter", event.target.value)} placeholder="temperature, tools" className="h-11 w-full rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" /></label>
              <label className="space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B3CFE5]">sort_by</span><select value={modelFilters.sort_by} onChange={(event) => updateModelFilter("sort_by", event.target.value as ModelFilters["sort_by"])} className="h-11 w-full rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]"><option value="name">name</option><option value="id">id</option><option value="context_length">context_length</option><option value="prompt_price">prompt_price</option><option value="completion_price">completion_price</option></select></label>
              <label className="space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B3CFE5]">sort_order</span><select value={modelFilters.sort_order} onChange={(event) => updateModelFilter("sort_order", event.target.value as ModelFilters["sort_order"])} className="h-11 w-full rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]"><option value="asc">asc</option><option value="desc">desc</option></select></label>
              <div className="grid grid-cols-2 gap-3"><label className="space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B3CFE5]">offset</span><input type="number" min="0" value={modelFilters.offset} onChange={(event) => updateModelFilter("offset", event.target.value)} className="h-11 w-full rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" /></label><label className="space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B3CFE5]">limit</span><input type="number" min="1" max="500" value={modelFilters.limit} onChange={(event) => updateModelFilter("limit", event.target.value)} className="h-11 w-full rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" /></label></div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-blue-400/10 pt-4">
              <div className="text-xs font-bold text-[#B3CFE5]">
                {catalog ? <>Showing <span className="text-[#F6FAFD]">{models.length}</span> of <span className="text-[#F6FAFD]">{catalog.total}</span> total models. Offset {catalog.offset}, limit {catalog.limit}.</> : "Model count will appear after the catalog loads."}
              </div>
              <button onClick={() => void loadModels(true)} className="h-11 rounded-xl border border-blue-400/12 bg-blue-950/30 px-4 text-xs font-black uppercase tracking-widest text-[#F6FAFD] hover:bg-blue-950/45">Force refresh</button>
            </div>
          </div>

          {catalog?.stale && <div className="flex items-center gap-2 text-sm font-bold text-amber-200"><AlertTriangle className="h-4 w-4" /> Catalog cache is stale.</div>}

          <div className="glass-card rounded-[2rem] border border-blue-400/18 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-400/12 px-5 py-4">
              <h2 className="text-lg font-[850] text-[#F6FAFD]">OpenRouter models</h2>
              <span className="rounded-full border border-blue-400/12 bg-blue-950/30 px-3 py-1 text-xs font-black uppercase tracking-widest text-[#B3CFE5]">Total: {catalog?.total ?? "-"}</span>
            </div>
            {loadingModels ? (
              <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-[#4A7FA7]" /></div>
            ) : (
              <div className="max-h-[560px] divide-y divide-blue-400/12 overflow-y-auto">
                {models.map((model) => (
                  <div key={model.id} className="grid gap-3 p-5 lg:grid-cols-[1fr_160px_180px] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-[850] text-[#F6FAFD]">{model.name || model.id}</h3>
                        <span className={cn("rounded-md px-2 py-0.5 text-[9px] font-black uppercase", model.eligible ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}>{model.eligible ? "Eligible" : "Ineligible"}</span>
                      </div>
                      <p className="mt-1 truncate font-mono text-xs text-[#B3CFE5]">{model.id}</p>
                      {!model.eligible && model.ineligibility_reasons?.length > 0 && <p className="mt-1 text-xs font-bold text-red-300">{model.ineligibility_reasons.join(", ")}</p>}
                    </div>
                    <div className="text-xs font-bold text-[#B3CFE5]">Context: {formatTokens(model.context_length || 0)}</div>
                    <div className="text-xs font-bold text-[#B3CFE5]">${model.prompt_price_per_million_usd ?? "?"} / ${model.completion_price_per_million_usd ?? "?"}</div>
                  </div>
                ))}
                {models.length === 0 && <div className="p-12 text-center font-bold text-[#B3CFE5]">No models found.</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "costs" && (
        <div className="space-y-5">
          <div className="glass-card grid gap-3 rounded-[2rem] border border-blue-400/18 p-5 md:grid-cols-5">
            <select value={costFilters.profileId} onChange={(event) => setCostFilters((prev) => ({ ...prev, profileId: event.target.value }))} className="h-11 rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD]"><option value="">All profiles</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select>
            <input value={costFilters.model} onChange={(event) => setCostFilters((prev) => ({ ...prev, model: event.target.value }))} placeholder="model id" className="h-11 rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD]" />
            <input value={costFilters.stage} onChange={(event) => setCostFilters((prev) => ({ ...prev, stage: event.target.value }))} placeholder="stage" className="h-11 rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD]" />
            <input type="date" value={costFilters.createdAfter} onChange={(event) => setCostFilters((prev) => ({ ...prev, createdAfter: event.target.value }))} className="h-11 rounded-xl border border-blue-400/12 bg-blue-950/30 px-3 text-sm font-bold text-[#F6FAFD]" />
            <button onClick={() => void loadCosts()} className="h-11 rounded-xl bg-[#4A7FA7] text-xs font-black uppercase tracking-widest text-white">Apply</button>
          </div>
          {loadingCosts ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-[#4A7FA7]" /></div>
          ) : costs && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="glass-card rounded-2xl border border-blue-400/18 p-5"><DollarSign className="mb-3 h-4 w-4 text-[#4A7FA7]" /><p className="text-xs font-bold uppercase text-[#B3CFE5]">Total spent</p><h3 className="text-2xl font-[850] text-[#F6FAFD]">{formatLLMCost(costs.aggregate?.total_spent_usd)}</h3></div>
                <div className="glass-card rounded-2xl border border-blue-400/18 p-5"><Database className="mb-3 h-4 w-4 text-[#4A7FA7]" /><p className="text-xs font-bold uppercase text-[#B3CFE5]">Tokens</p><h3 className="text-2xl font-[850] text-[#F6FAFD]">{formatTokens(costs.aggregate?.total_tokens_used || 0)}</h3></div>
                <div className="glass-card rounded-2xl border border-blue-400/18 p-5"><p className="text-xs font-bold uppercase text-[#B3CFE5]">Calls</p><h3 className="text-2xl font-[850] text-[#F6FAFD]">{costs.aggregate?.total_calls_processed ?? 0}</h3></div>
                <div className="glass-card rounded-2xl border border-blue-400/18 p-5"><p className="text-xs font-bold uppercase text-[#B3CFE5]">Requests</p><h3 className="text-2xl font-[850] text-[#F6FAFD]">{costs.aggregate?.llm_requests ?? 0}</h3></div>
              </div>
              <div className="glass-card overflow-hidden rounded-[2rem] border border-blue-400/18">
                <div className="border-b border-blue-400/12 p-5"><h3 className="text-lg font-[850] text-[#F6FAFD]">Breakdown by profile</h3></div>
                <div className="divide-y divide-blue-400/12">
                  {(costs.breakdown_by_profile || []).map((profile, index) => (
                    <div key={profile.processing_profile_id || index} className="grid gap-2 p-5 md:grid-cols-[1fr_140px_140px_140px] md:items-center">
                      <div className="min-w-0"><p className="truncate text-sm font-bold text-[#F6FAFD]">{profile.profile_name || "Unknown profile"}</p><p className="truncate text-xs text-[#B3CFE5]">{profile.llm_script_model === profile.llm_qa_model ? profile.llm_script_model : `${profile.llm_script_model} / ${profile.llm_qa_model}`}</p></div>
                      <p className="text-sm font-bold text-[#B3CFE5]">{profile.calls_count} calls</p>
                      <p className="text-sm font-bold text-[#B3CFE5]">{formatTokens(profile.total_tokens)}</p>
                      <p className="text-sm font-black text-[#F6FAFD]">{formatLLMCost(profile.profile_controlled_cost_usd ?? profile.total_cost_usd)}</p>
                    </div>
                  ))}
                  {(costs.breakdown_by_profile || []).length === 0 && <div className="p-12 text-center font-bold text-[#B3CFE5]">No profile cost data.</div>}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkerProfilesPage() {
  return (
    <RoleGuard allow={["super_admin"]}>
      <WorkerProfilesPageContent />
    </RoleGuard>
  );
}
