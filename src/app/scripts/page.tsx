"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
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
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const [scriptsRes, campaignsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/scripts/?skip=0&limit=100`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        }),
        fetch(`${baseUrl}/api/v1/campaigns/`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        })
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
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";

      formData.append("title", createForm.title);
      if (createForm.campaign_id) formData.append("campaign_id", createForm.campaign_id);
      formData.append("call_direction", createForm.call_direction);
      formData.append("status", createForm.status);
      formData.append("set_as_campaign_default", String(createForm.set_as_campaign_default));

      let endpoint = "";
      if (createForm.inputMode === "file" && createForm.file) {
        formData.append("file", createForm.file);
        endpoint = `${baseUrl}/api/v1/scripts/upload`;
      } else {
        formData.append("text", createForm.text);
        endpoint = `${baseUrl}/api/v1/scripts/parse`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" },
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
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const res = await fetch(`${baseUrl}/api/v1/scripts/${scriptId}`, {
        method: "DELETE",
        headers: { "ngrok-skip-browser-warning": "true" }
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

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          {t('createScript')}
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B3CFE5] group-focus-within:text-[#4A7FA7] transition-colors" />
        <input
          type="text"
          placeholder={t('filterPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-16 bg-[#1A3D63]/60 glow border border-[#4A7FA7]/30 rounded-[1.25rem] pl-16 pr-6 text-[#F6FAFD] font-bold tracking-tight placeholder:text-[#B3CFE5] outline-none focus:border-[#4A7FA7] transition-all"
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
              Retry Connection
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <FileCode className="w-16 h-16 text-[#4A7FA7] mx-auto" />
            <p className="text-[#B3CFE5] font-bold">
              {searchQuery ? "No scripts found matching your search." : "No scripts found. Create your first script to get started."}
            </p>
          </div>
        ) : (
          filtered.map((script) => (
            <div
              key={script.id}
              className={cn(
                "group bg-[#1A3D63]/60 glow border rounded-[2rem] transition-all duration-500 overflow-hidden",
                expandedId === script.id ? "border-[#4A7FA7]/50" : "border-[#4A7FA7]/30 hover:border-[#4A7FA7]/40"
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
                      script.status === 'active' ? "bg-[#4A7FA7]/20 text-[#4A7FA7] border border-[#4A7FA7]/30" : "bg-[#1A3D63]/40 text-[#B3CFE5]"
                    )}>
                      v{script.version} • {script.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-[#4A7FA7]/20 text-[#4A7FA7] border border-[#4A7FA7]/30">
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScript(script.id);
                    }}
                    className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    title="Delete script"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-12 h-12 rounded-2xl bg-[#1A3D63]/40 flex items-center justify-center text-[#4A7FA7] group-hover:bg-gradient-to-r group-hover:from-[#4A7FA7] group-hover:to-[#1A3D63] group-hover:text-white transition-all duration-500">
                    {expandedId === script.id ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                  </div>
                </div>
              </div>

              {expandedId === script.id && (
                <div className="px-8 pb-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="h-px bg-[#4A7FA7]/30" />

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5] mb-3">Source Text</h4>
                      <div className="bg-[#1A3D63]/40 p-6 rounded-2xl border border-[#4A7FA7]/30 max-h-[400px] overflow-y-auto">
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

      {/* Create Script Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1A3D63]/95 glow w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-[#4A7FA7]/30 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-[#4A7FA7]/30 bg-[#1A3D63]/40 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-[850] text-[#F6FAFD] tracking-tight">Create Neural Script</h3>
                <p className="text-sm font-semibold text-[#B3CFE5] mt-1">Define a new conversation script.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-10 h-10 rounded-xl hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-all text-[#B3CFE5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">Script Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Sales Discovery Script v1"
                  className="w-full h-14 bg-[#1F3A3403] border border-[#1f3a3410] rounded-xl px-4 outline-none focus:border-[#1F3A34] transition-all text-[#1F3A34] font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">Campaign (Optional)</label>
                <select
                  value={createForm.campaign_id}
                  onChange={(e) => setCreateForm({ ...createForm, campaign_id: e.target.value })}
                  className="w-full h-14 bg-[#1F3A3403] border border-[#1f3a3410] rounded-xl px-4 outline-none focus:border-[#1F3A34] transition-all text-[#1F3A34] font-semibold appearance-none cursor-pointer"
                >
                  <option value="">No Campaign</option>
                  {campaigns.map(c => (
                    <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">Input Method</label>
                <div className="flex p-1.5 bg-[#1F3A3408] rounded-xl border border-[#1f3a3405]">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, inputMode: "text" })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-extrabold transition-all",
                      createForm.inputMode === "text"
                        ? "bg-[#1F3A34] text-white shadow-sm"
                        : "text-[#1F3A3450] hover:text-[#1F3A34]"
                    )}
                  >
                    <FileText className="w-3.5 h-3.5 inline-block mr-1.5" />
                    Paste Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, inputMode: "file" })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-extrabold transition-all",
                      createForm.inputMode === "file"
                        ? "bg-[#1F3A34] text-white shadow-sm"
                        : "text-[#1F3A3450] hover:text-[#1F3A34]"
                    )}
                  >
                    <Upload className="w-3.5 h-3.5 inline-block mr-1.5" />
                    Upload File
                  </button>
                </div>
              </div>

              {createForm.inputMode === "text" ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">Script Content</label>
                  <textarea
                    value={createForm.text}
                    onChange={(e) => setCreateForm({ ...createForm, text: e.target.value })}
                    placeholder="Paste your script content here..."
                    rows={8}
                    className="w-full bg-[#1F3A3403] border border-[#1f3a3410] rounded-xl p-4 outline-none focus:border-[#1F3A34] transition-all text-[#1F3A34] font-medium text-sm resize-none"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">Upload Document (.docx)</label>
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
                    className="w-full h-20 border-2 border-dashed border-[#1f3a3410] rounded-xl flex items-center px-4 gap-3 cursor-pointer hover:bg-[#1F3A3402] transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#1F3A3408] group-hover:bg-[#1F3A34] group-hover:text-white flex items-center justify-center text-[#1F3A3440] transition-all">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-[#1F3A3440]">
                      {createForm.file ? createForm.file.name : "Click to select .docx file"}
                    </span>
                  </div>
                </div>
              )}

              {createForm.campaign_id && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1F3A3405]">
                  <input
                    type="checkbox"
                    id="set_default"
                    checked={createForm.set_as_campaign_default}
                    onChange={(e) => setCreateForm({ ...createForm, set_as_campaign_default: e.target.checked })}
                    className="w-4 h-4 rounded border-[#1F3A3415] text-[#1F3A34]"
                  />
                  <label htmlFor="set_default" className="text-xs font-bold text-[#1F3A34] cursor-pointer">
                    Set as campaign default script
                  </label>
                </div>
              )}

              <button
                onClick={handleCreateScript}
                disabled={isSubmitting || !createForm.title || (!createForm.text.trim() && !createForm.file)}
                className="w-full h-14 bg-[#1F3A34] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" /> Create Script
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
