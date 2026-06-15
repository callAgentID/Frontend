"use client";

import { useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useApi } from "@/lib/useApi";
import {
  FileCode,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Loader2,
  AlertCircle,
  X,
  Upload,
  FileText,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScriptCardSkeleton } from "@/components/Skeleton";
import { Tooltip } from "@/components/Tooltip";

interface Script {
  id: string;
  title: string;
  campaign_id?: string;
  call_direction: string;
  status: string;
  source_text: string;
  parsed_structure?: any;
  version: number;
  created_at: string;
  updated_at: string;
}

function ScriptsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('scripts');
  const tc = useTranslations('common');
  const tt = useTranslations('tooltips');
  const { apiFetch } = useApi();

  const [scripts, setScripts] = useState<Script[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    campaign_id: "",
    file: null as File | null,
    text: "",
    call_direction: "outbound",
    status: "active",
    set_as_campaign_default: false,
    inputMode: "text" as "file" | "text"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Read script ID from URL on mount
  useEffect(() => {
    const scriptIdFromUrl = searchParams.get('id');
    if (scriptIdFromUrl) {
      setExpandedId(scriptIdFromUrl);
    }
  }, [searchParams]);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const [scriptsRes, campaignsRes] = await Promise.all([
        apiFetch(`/api/v1/scripts/?skip=0&limit=100`),
        apiFetch(`/api/v1/campaigns/`)
      ]);

      if (!scriptsRes.ok) throw new Error("Failed to fetch scripts");

      const scriptsData = await scriptsRes.json();
      const campaignsData = campaignsRes.ok ? await campaignsRes.json() : [];

      setScripts(Array.isArray(scriptsData) ? scriptsData : []);
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleCreateScript = async () => {
    if (!createForm.title || (!createForm.text.trim() && !createForm.file)) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      formData.append("title", createForm.title);
      if (createForm.campaign_id) formData.append("campaign_id", createForm.campaign_id);
      formData.append("call_direction", createForm.call_direction);
      formData.append("status", createForm.status);
      formData.append("set_as_campaign_default", String(createForm.set_as_campaign_default));

      let endpoint = "";
      if (createForm.inputMode === "file" && createForm.file) {
        formData.append("file", createForm.file);
        endpoint = `/api/v1/scripts/upload`;
      } else {
        formData.append("text", createForm.text);
        endpoint = `/api/v1/scripts/parse`;
      }

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setCreateForm({
          title: "",
          campaign_id: "",
          file: null,
          text: "",
          call_direction: "outbound",
          status: "active",
          set_as_campaign_default: false,
          inputMode: "text"
        });
        fetchScripts();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to create script");
      }
    } catch (err: any) {
      console.error("Failed to create script:", err);
      alert("Failed to create script. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (!confirm("Are you sure you want to delete this script? This action cannot be undone.")) return;

    try {
      const res = await apiFetch(`/api/v1/scripts/${scriptId}`, {
        method: "DELETE"
      });

      if (res.ok || res.status === 204) {
        fetchScripts();
      } else {
        alert("Failed to delete script");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete script. Please try again.");
    }
  };

  const getCampaignName = (campaignId?: string) => {
    if (!campaignId) return "No Campaign";
    const campaign = campaigns.find(c => c.id === campaignId || c._id === campaignId);
    return campaign?.name || "Unknown Campaign";
  };

  const filtered = scripts.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.source_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto p-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white glow">
              <FileCode className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-[900] text-[#F6FAFD] tracking-tight">{t('title')}</h1>
          </div>
          <p className="text-[#B3CFE5] text-sm font-medium">
            {t('subtitle')}
          </p>
        </div>

        <Tooltip content={tt("createScript")} placement="bottom">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-colors hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            {t('createScript')}
          </button>
        </Tooltip>
      </div>

      {/* Search Filter */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B3CFE5] group-focus-within:text-[#4A7FA7] transition-colors" />
        <input
          type="text"
          placeholder={t('filterPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-16 glass-card rounded-[1.25rem] pl-16 pr-6 text-[#F6FAFD] font-bold tracking-tight placeholder:text-[#B3CFE5] outline-none focus:border-[#4A7FA7] transition-colors"
        />
      </div>

      {/* Scripts List */}
      <div className="space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <ScriptCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 bg-red-500/20 border border-red-500/30 rounded-3xl text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-red-400 font-bold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
            >
              {tc('retryConnection')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <FileCode className="w-16 h-16 text-[#4A7FA7] mx-auto" />
            <p className="text-[#B3CFE5] font-bold">
              {searchQuery ? t('noMatch') : t('noScripts')}
            </p>
          </div>
        ) : (
          filtered.map((script) => (
            <div
              key={script.id}
              className={cn(
                "group bg-blue-950/25 glow border rounded-[2rem] transition-colors duration-150 overflow-hidden",
                expandedId === script.id ? "border-[#4A7FA7]/50" : "border-blue-400/15 hover:border-blue-400/22"
              )}
            >
              <div
                onClick={() => {
                  const newExpandedId = expandedId === script.id ? null : script.id;
                  setExpandedId(newExpandedId);

                  if (newExpandedId) {
                    router.push(`/scripts?id=${newExpandedId}`, { scroll: false });
                  } else {
                    router.push('/scripts', { scroll: false });
                  }
                }}
                className="p-8 flex flex-col md:flex-row items-start md:items-center gap-8 cursor-pointer"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-[850] text-[#F6FAFD] tracking-tight">{script.title}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                      script.status === 'active' ? "bg-[#4A7FA7]/20 text-[#4A7FA7] border border-blue-400/15" : "bg-blue-950/18 text-[#B3CFE5]"
                    )}>
                      v{script.version} • {script.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-[#4A7FA7]/20 text-[#4A7FA7] border border-blue-400/15">
                      {script.call_direction}
                    </span>
                  </div>
                  <p className="text-[#B3CFE5] text-sm font-medium leading-relaxed">
                    Campaign: <span className="font-bold">{getCampaignName(script.campaign_id)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5] mb-1">Created</div>
                    <div className="text-sm font-[900] text-[#F6FAFD]">
                      {new Date(script.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Tooltip content={tt("deleteScript")} placement="top">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteScript(script.id); }}
                      className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content={expandedId === script.id ? tt("collapseScript") : tt("expandScript")} placement="top">
                    <div className="w-12 h-12 rounded-2xl bg-blue-950/18 flex items-center justify-center text-[#4A7FA7] group-hover:bg-gradient-to-r group-hover:from-[#4A7FA7] group-hover:to-[#1A3D63] group-hover:text-white transition-colors duration-150 cursor-pointer">
                      {expandedId === script.id ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                    </div>
                  </Tooltip>
                </div>
              </div>

              {expandedId === script.id && (
                <div className="px-8 pb-8 space-y-8 animate-in fade-in duration-150 duration-150">
                  <div className="h-px bg-[#4A7FA7]/30" />

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5] mb-3">{t('sourceText')}</h4>
                      <div className="bg-blue-950/18 p-6 rounded-2xl border border-blue-400/15 max-h-[400px] overflow-y-auto">
                        <p className="text-sm text-[#B3CFE5] whitespace-pre-wrap leading-relaxed">{script.source_text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Script Modal — rendered via portal so it sits above everything */}
      {mounted && isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl overflow-hidden animate-in fade-in duration-150"
            style={{ background: 'rgba(6,18,48,0.92)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 24px 64px rgba(0,0,0,0.60)' }}>

            {/* Header */}
            <div className="px-7 py-5 flex items-center justify-between border-b border-white/[0.07]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">{t('createNew')}</h3>
                <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">{t('createSubtitle')}</p>
              </div>
              <Tooltip content={tt("closeWithoutSaving")} placement="left">
                <button onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            {/* Body */}
            <div className="px-7 py-6 space-y-5">

              {/* Title */}
              <div className="space-y-1.5">
                <Tooltip content={tt("scriptTitleField")} placement="top">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-tertiary)] cursor-default">{t('scriptTitleRequired')}</label>
                </Tooltip>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder={t('scriptTitlePlaceholder')}
                  className="w-full h-11 px-4 rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(44,143,255,0.40)'; }}
                  onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}
                />
              </div>

              {/* Campaign */}
              <div className="space-y-1.5">
                <Tooltip content={tt("scriptCampaignField")} placement="top">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-tertiary)] cursor-default">{t('campaign')}</label>
                </Tooltip>
                <select
                  value={createForm.campaign_id}
                  onChange={(e) => setCreateForm({ ...createForm, campaign_id: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none appearance-none cursor-pointer transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                >
                  <option value="" style={{ background: '#0a1020' }}>{t('noCampaign')}</option>
                  {campaigns.map(c => (
                    <option key={c.id || c._id} value={c.id || c._id} style={{ background: '#0a1020' }}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Input mode toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">{t('inputMethod')}</label>
                <div className="flex p-1 rounded-xl gap-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Tooltip content={tt("pasteTextMode")} placement="bottom">
                    <button type="button" onClick={() => setCreateForm({ ...createForm, inputMode: "text" })}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors"
                      style={createForm.inputMode === "text"
                        ? { background: 'rgba(44,143,255,0.20)', color: '#EEF4FF', border: '1px solid rgba(44,143,255,0.30)' }
                        : { color: 'var(--text-tertiary)', border: '1px solid transparent' }
                      }>
                      <FileText className="w-3.5 h-3.5" /> {t('pasteText')}
                    </button>
                  </Tooltip>
                  <Tooltip content={tt("uploadFileMode")} placement="bottom">
                    <button type="button" onClick={() => setCreateForm({ ...createForm, inputMode: "file" })}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors"
                      style={createForm.inputMode === "file"
                        ? { background: 'rgba(44,143,255,0.20)', color: '#EEF4FF', border: '1px solid rgba(44,143,255,0.30)' }
                        : { color: 'var(--text-tertiary)', border: '1px solid transparent' }
                      }>
                      <Upload className="w-3.5 h-3.5" /> {t('uploadFile')}
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* Content */}
              {createForm.inputMode === "text" ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">{t('scriptContentRequired')}</label>
                  <textarea
                    value={createForm.text}
                    onChange={(e) => setCreateForm({ ...createForm, text: e.target.value })}
                    placeholder={t('contentPlaceholder')}
                    rows={7}
                    className="w-full p-4 rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none resize-none transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(44,143,255,0.35)'; }}
                    onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">{t('uploadDocRequired')}</label>
                  <div
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".docx";
                      input.onchange = (e: any) => {
                        const file = e.target.files[0];
                        if (file) setCreateForm({ ...createForm, file });
                      };
                      input.click();
                    }}
                    className="w-full h-20 rounded-xl flex items-center px-5 gap-4 cursor-pointer transition-colors group"
                    style={{ border: '2px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors"
                      style={{ background: 'rgba(44,143,255,0.10)' }}>
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">
                      {createForm.file ? createForm.file.name : t('selectFile')}
                    </span>
                  </div>
                </div>
              )}

              {/* Set as default */}
              {createForm.campaign_id && (
                <Tooltip content={tt("setDefaultScript")} placement="top">
                  <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                    style={{ background: 'rgba(44,143,255,0.06)', border: '1px solid rgba(44,143,255,0.14)' }}>
                    <input
                      type="checkbox"
                      id="set_default"
                      checked={createForm.set_as_campaign_default}
                      onChange={(e) => setCreateForm({ ...createForm, set_as_campaign_default: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      {t('setDefault')}
                    </span>
                  </label>
                </Tooltip>
              )}

              {/* Submit */}
              <div className="w-full">
                <Tooltip content={!createForm.title ? tt("scriptTitleMissing") : !createForm.text.trim() && !createForm.file ? tt("scriptContentMissing") : tt("createScriptBtn")} placement="top">
                  <button
                    onClick={handleCreateScript}
                    disabled={isSubmitting || !createForm.title || (!createForm.text.trim() && !createForm.file)}
                    className="w-full h-12 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(44,143,255,0.85)', border: '1px solid rgba(44,143,255,0.35)' }}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> {t('createScript')}</>}
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}

export default function ScriptsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-[#1A3D63]/40 border-t-[#4A7FA7] animate-spin" />
      </div>
    }>
      <ScriptsPageContent />
    </Suspense>
  );
}
