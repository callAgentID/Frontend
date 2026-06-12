"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useApi } from "@/lib/useApi";
import {
  Layers,
  FileText,
  FileCode,
  Search,
  MoreHorizontal,
  Plus,
  Loader2,
  Filter,
  ArrowRight,
  CheckCircle2,
  X,
  Upload,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CampaignCardSkeleton, ScriptDetailSkeleton } from "@/components/Skeleton";

function CampaignsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('campaigns');
  const { apiFetch } = useApi();

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"campaign" | "script" | "questionnaire" | "view_script" | "assign_script">("campaign");
  const [selectedCampaignForAssign, setSelectedCampaignForAssign] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingScript, setViewingScript] = useState<{ loading: boolean; data: any; error?: string }>({ loading: false, data: null });
  const [processedScriptId, setProcessedScriptId] = useState<string | null>(null);

  // Read script ID from URL on mount
  useEffect(() => {
    const scriptIdFromUrl = searchParams.get('scriptId');
    if (scriptIdFromUrl && scriptIdFromUrl !== processedScriptId) {
      setProcessedScriptId(scriptIdFromUrl);
      handleScriptClick(scriptIdFromUrl);
    } else if (!scriptIdFromUrl && processedScriptId) {
      setProcessedScriptId(null);
    }
  }, [searchParams]);

  // Form States
  const [campForm, setCampForm] = useState({ name: "", code: "" });
  const [scriptForm, setScriptForm] = useState({
    title: "",
    campaign_id: "",
    file: null as File | null,
    text: "",
    call_direction: "outbound",
    status: "active",
    set_as_campaign_default: false,
    inputMode: "file" as "file" | "text"
  });
  const [questForm, setQuestForm] = useState({
    name: "",
    description: "",
    campaign_id: "",
    file: null as File | null,
    text: "",
    active: true,
    inputMode: "file" as "file" | "text"
  });

  const [data, setData] = useState<{ campaigns: any[]; scripts: any[]; questionnaires: any[] }>({
    campaigns: [],
    scripts: [],
    questionnaires: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campRes, scriptRes, questRes] = await Promise.all([
        apiFetch(`/api/v1/campaigns/`),
        apiFetch(`/api/v1/scripts/`).catch(() => null),
        apiFetch(`/api/v1/questionnaires/`).catch(() => null)
      ]);

      const campaigns = campRes.ok ? await campRes.json() : [];
      const scripts = (scriptRes && scriptRes.ok) ? await scriptRes.json() : [];
      const questionnaires = (questRes && questRes.ok) ? await questRes.json() : [];

      setData({
        campaigns: Array.isArray(campaigns) ? campaigns : [],
        scripts: Array.isArray(scripts) ? scripts : [],
        questionnaires: Array.isArray(questionnaires) ? questionnaires : []
      });
    } catch (err) {
      console.error("Failed to fetch assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCampaign = async () => {
    if (!campForm.name || !campForm.code) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/v1/campaigns/`, {
        method: "POST",
        body: JSON.stringify({ ...campForm, active: true, config: {} })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setCampForm({ name: "", code: "" });
        fetchData();
      }
    } catch (err) {
      console.error("Campaign creation failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadScript = async () => {
    // Validation based on input mode
    if (scriptForm.inputMode === "file" && (!scriptForm.file || !scriptForm.campaign_id)) return;
    if (scriptForm.inputMode === "text" && (!scriptForm.text.trim() || !scriptForm.campaign_id)) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Common fields for both endpoints
      formData.append("campaign_id", scriptForm.campaign_id);
      formData.append("title", scriptForm.title || "New Script");
      formData.append("call_direction", scriptForm.call_direction);
      formData.append("status", scriptForm.status);
      formData.append("set_as_campaign_default", String(scriptForm.set_as_campaign_default));

      let endpoint = "";
      if (scriptForm.inputMode === "file") {
        // File upload endpoint
        formData.append("file", scriptForm.file!);
        endpoint = `/api/v1/scripts/upload`;
      } else {
        // Raw text parse endpoint
        formData.append("text", scriptForm.text);
        endpoint = `/api/v1/scripts/parse`;
      }

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        setIsModalOpen(false);
        setScriptForm({
          title: "",
          campaign_id: "",
          file: null,
          text: "",
          call_direction: "outbound",
          status: "active",
          set_as_campaign_default: false,
          inputMode: "file"
        });
        fetchData();
      } else if (res.status === 400) {
        const error = await res.json();
        alert(error.detail || "Invalid input. Please check your data.");
      }
    } catch (err) {
      console.error("Script upload failed:", err);
      alert("Failed to upload script. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadQuest = async () => {
    // Validation based on input mode
    if (questForm.inputMode === "file" && !questForm.file) return;
    if (questForm.inputMode === "text" && !questForm.text.trim()) return;
    if (!questForm.name) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Common fields for both endpoints
      formData.append("name", questForm.name);
      formData.append("description", questForm.description);
      formData.append("active", String(questForm.active));

      let endpoint = "";
      if (questForm.inputMode === "file") {
        // File upload endpoint
        formData.append("file", questForm.file!);
        endpoint = `/api/v1/questionnaires/upload`;
      } else {
        // Raw text parse endpoint
        formData.append("text", questForm.text);
        endpoint = `/api/v1/questionnaires/parse`;
      }

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        setIsModalOpen(false);
        setQuestForm({
          name: "",
          description: "",
          campaign_id: "",
          file: null,
          text: "",
          active: true,
          inputMode: "file"
        });
        fetchData();
      } else if (res.status === 400) {
        const error = await res.json();
        alert(error.detail || "Invalid input. Please check your data.");
      }
    } catch (err) {
      console.error("Questionnaire upload failed:", err);
      alert("Failed to upload questionnaire. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScriptClick = async (scriptId: string) => {
    setModalType("view_script");
    setIsModalOpen(true);
    setViewingScript({ loading: true, data: null });

    // Update URL with script ID
    router.push(`/campaigns?scriptId=${scriptId}`, { scroll: false });

    try {
      const res = await apiFetch(`/api/v1/scripts/${scriptId}`);
      if (res.ok) {
        const data = await res.json();
        setViewingScript({ loading: false, data });
      } else {
        setViewingScript({ loading: false, data: null, error: "Failed to fetch script details" });
      }
    } catch (err) {
      setViewingScript({ loading: false, data: null, error: "Failed to fetch script details" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-8 space-y-10 animate-in fade-in duration-150 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-[850] text-[#F6FAFD] tracking-tight">{t('title')}</h1>
          <p className="text-[#B3CFE5] font-medium">{t('subtitle')}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchData} className="h-12 px-6 bg-blue-950/18 text-[#4A7FA7] rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-950/25 transition-colors text-sm border border-blue-400/15">
            {t('refreshData')}
          </button>
          <button
            onClick={() => {
              setModalType("campaign");
              setIsModalOpen(true);
            }}
            className="h-12 px-6 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white rounded-2xl font-bold flex items-center gap-2 shadow-sm shadow-[#4A7FA7]/30 hover:opacity-90 active:scale-95 transition-colors text-sm"
          >
            <Plus className="w-5 h-5" /> {t('newAsset')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-10">
          {[1, 2, 3].map((i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {data.campaigns.map((campaign) => {
            const campaignScripts = data.scripts.filter(s => s.campaign_id === campaign.id);
            const campaignQuestionnaires = data.questionnaires.filter(q => q.campaign_id === campaign.id);

            return (
              <div key={campaign.id} className="group relative">
                {/* Campaign Header Card */}
                <div className="bg-blue-950/25 glow rounded-[2.5rem] border border-blue-400/15 overflow-hidden shadow-sm shadow-[#4A7FA7]/10 transition-colors hover:border-[#4A7FA7]/50">
                  <div className="p-10 border-b border-blue-400/15 bg-blue-950/18 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white flex items-center justify-center shadow-sm shadow-[#4A7FA7]/30">
                        <Layers className="w-10 h-10" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-3xl font-[850] text-[#F6FAFD] tracking-tight">{campaign.name}</h2>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            campaign.active ? "bg-[#4A7FA7]/20 text-[#4A7FA7] border border-blue-400/15" : "bg-blue-950/18 text-[#B3CFE5]"
                          )}>
                            {campaign.active ? "Live Cluster" : "Archived"}
                          </span>
                        </div>
                        <p className="text-[#B3CFE5] font-bold uppercase tracking-[0.2em] text-[11px]">Identity Code: {campaign.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 pr-4">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">Mapped Assets</p>
                        <p className="font-[850] text-[#F6FAFD]">{campaignScripts.length + campaignQuestionnaires.length} Units</p>
                      </div>
                      <button className="w-12 h-12 rounded-2xl bg-blue-950/18 flex items-center justify-center text-[#4A7FA7] hover:bg-gradient-to-r hover:from-[#4A7FA7] hover:to-[#1A3D63] hover:text-white transition-colors">
                        <MoreHorizontal className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Asset Classification Grid */}
                  {/* Scripts Section */}
                  <div className="bg-blue-950/18 p-10 space-y-6">
                    <div className="flex items-center justify-between border-b border-blue-400/15 pb-4">
                      <div className="flex items-center gap-3">
                        <FileCode className="w-5 h-5 text-[#4A7FA7]" />
                        <h3 className="font-extrabold text-[#F6FAFD] uppercase tracking-wider text-xs">Neural Scripts</h3>
                      </div>
                      <button
                        onClick={() => {
                          setScriptForm(prev => ({ ...prev, campaign_id: campaign.id }));
                          setModalType("script");
                          setIsModalOpen(true);
                        }}
                        className="bg-blue-950/18 text-[#4A7FA7] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-gradient-to-r hover:from-[#4A7FA7] hover:to-[#1A3D63] hover:text-white transition-colors border border-blue-400/15"
                      >
                        Add Logic
                      </button>
                    </div>
                    <div className="space-y-3">
                      {campaignScripts.map((s) => (
                        <div key={s.id} onClick={() => handleScriptClick(s.id)} className="p-4 rounded-2xl bg-blue-950/18 border border-transparent hover:border-blue-400/15 transition-colors flex items-center justify-between group/row cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-950/25 flex items-center justify-center text-[#4A7FA7] group-hover/row:text-[#F6FAFD]">
                              <FileText className="w-4 h-4" />
                            </div>
                            <p className="text-sm font-bold text-[#F6FAFD]">{s.title || "Standard Sales Script"}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#4A7FA7] group-hover/row:translate-x-1 transition-colors" />
                        </div>
                      ))}
                      {campaignScripts.length === 0 && <p className="text-[11px] font-bold text-[#B3CFE5] italic py-2">No scripts mapped to this framework...</p>}
                    </div>
                  </div>


                </div>
              </div>
            );
          })}
          {data.campaigns.length === 0 && <EmptyState label="Architectural data missing..." />}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 animate-in fade-in duration-150 duration-150">
          <div className="bg-[#1A3D63]/95 glow w-full max-w-xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-blue-400/15 overflow-y-auto animate-in fade-in duration-150 duration-150">
            <div className="p-8 border-b border-blue-400/15 bg-blue-950/25 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-[850] text-[#F6FAFD] tracking-tight">
                  {modalType === 'view_script' ? 'Neural Script Details' : `Deploy New ${modalType === 'campaign' ? 'Campaign Cluster' : modalType === 'script' ? 'Neural Script' : 'QA Blueprint'}`}
                </h3>
                <p className="text-sm font-semibold text-[#B3CFE5] mt-1">
                  {modalType === 'view_script' ? 'Reviewing deployed logic framework.' : 'Configure your intelligence assets below.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  // Clear URL when closing modal
                  if (modalType === 'view_script') {
                    router.push('/campaigns', { scroll: false });
                  }
                }}
                className="w-10 h-10 rounded-xl hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-colors text-[#B3CFE5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-10 space-y-8 overflow-visible">
              {modalType === "campaign" && (
                <div className="space-y-6">
                  <InputField label="Name" placeholder="e.g. Q4 Growth Sales" value={campForm.name} onChange={(v) => setCampForm({ ...campForm, name: v })} />
                  <InputField label="Identity Code" placeholder="e.g. SALES_Q4" value={campForm.code} onChange={(v) => setCampForm({ ...campForm, code: v })} />
                  <button onClick={handleCreateCampaign} disabled={isSubmitting} className="w-full h-14 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-[#F6FAFD] rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-colors disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Initialize Cluster</>}
                  </button>
                </div>
              )}

              {modalType === "script" && (
                <div className="space-y-6">
                  <InputField label="Title" placeholder="e.g. Standard Script v1" value={scriptForm.title} onChange={(v) => setScriptForm({ ...scriptForm, title: v })} />
                  <SelectField
                    label="Home Campaign"
                    options={data.campaigns}
                    value={scriptForm.campaign_id}
                    onChange={(v) => setScriptForm({ ...scriptForm, campaign_id: v })}
                  />

                  {/* Input Mode Toggle */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Input Method</label>
                    <div className="flex p-1.5 bg-blue-950/18 rounded-xl border border-blue-400/10">
                      <button
                        type="button"
                        onClick={() => setScriptForm({ ...scriptForm, inputMode: "file" })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-extrabold transition-colors",
                          scriptForm.inputMode === "file"
                            ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] glow"
                            : "text-[#B3CFE5]/70 hover:text-[#F6FAFD]"
                        )}
                      >
                        <Upload className="w-3.5 h-3.5 inline-block mr-1.5" />
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setScriptForm({ ...scriptForm, inputMode: "text" })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-extrabold transition-colors",
                          scriptForm.inputMode === "text"
                            ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] glow"
                            : "text-[#B3CFE5]/70 hover:text-[#F6FAFD]"
                        )}
                      >
                        <FileText className="w-3.5 h-3.5 inline-block mr-1.5" />
                        Paste Text
                      </button>
                    </div>
                  </div>

                  {scriptForm.inputMode === "file" ? (
                    <FileUpload label="Script Document (.docx)" onChange={(f) => setScriptForm({ ...scriptForm, file: f })} />
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Script Text</label>
                      <textarea
                        value={scriptForm.text}
                        onChange={(e) => setScriptForm({ ...scriptForm, text: e.target.value })}
                        placeholder="Paste your script content here..."
                        rows={8}
                        className="w-full glass rounded-xl p-4 outline-none focus:border-[#4A7FA7] transition-colors text-[#F6FAFD] font-medium text-sm resize-none placeholder:text-[#B3CFE5]/50"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-xl glass">
                    <input
                      type="checkbox"
                      id="set_default"
                      checked={scriptForm.set_as_campaign_default}
                      onChange={(e) => setScriptForm({ ...scriptForm, set_as_campaign_default: e.target.checked })}
                      className="w-4 h-4 rounded border-blue-400/15 text-[#4A7FA7]"
                    />
                    <label htmlFor="set_default" className="text-xs font-bold text-[#F6FAFD] cursor-pointer">
                      Set as campaign default script
                    </label>
                  </div>

                  <button onClick={handleUploadScript} disabled={isSubmitting} className="w-full h-14 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-[#F6FAFD] disabled:opacity-50 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-colors">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /> Deploy Logic</>}
                  </button>
                </div>
              )}

              {modalType === "questionnaire" && (
                <div className="space-y-6">
                  <InputField label="Name" placeholder="e.g. Compliance Audit v1" value={questForm.name} onChange={(v) => setQuestForm({ ...questForm, name: v })} />
                  <InputField label="Description" placeholder="What does this audit measure?" value={questForm.description} onChange={(v) => setQuestForm({ ...questForm, description: v })} />

                  {/* Input Mode Toggle */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Input Method</label>
                    <div className="flex p-1.5 bg-blue-950/18 rounded-xl border border-blue-400/10">
                      <button
                        type="button"
                        onClick={() => setQuestForm({ ...questForm, inputMode: "file" })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-extrabold transition-colors",
                          questForm.inputMode === "file"
                            ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] glow"
                            : "text-[#B3CFE5]/70 hover:text-[#F6FAFD]"
                        )}
                      >
                        <Upload className="w-3.5 h-3.5 inline-block mr-1.5" />
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestForm({ ...questForm, inputMode: "text" })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-extrabold transition-colors",
                          questForm.inputMode === "text"
                            ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] glow"
                            : "text-[#B3CFE5]/70 hover:text-[#F6FAFD]"
                        )}
                      >
                        <FileText className="w-3.5 h-3.5 inline-block mr-1.5" />
                        Paste Text
                      </button>
                    </div>
                  </div>

                  {questForm.inputMode === "file" ? (
                    <FileUpload label="Questionnaire Document (.docx)" onChange={(f) => setQuestForm({ ...questForm, file: f })} />
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Questionnaire Text</label>
                      <textarea
                        value={questForm.text}
                        onChange={(e) => setQuestForm({ ...questForm, text: e.target.value })}
                        placeholder="Paste your questionnaire content here..."
                        rows={8}
                        className="w-full glass rounded-xl p-4 outline-none focus:border-[#4A7FA7] transition-colors text-[#F6FAFD] font-medium text-sm resize-none placeholder:text-[#B3CFE5]/50"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-xl glass">
                    <input
                      type="checkbox"
                      id="active_quest"
                      checked={questForm.active}
                      onChange={(e) => setQuestForm({ ...questForm, active: e.target.checked })}
                      className="w-4 h-4 rounded border-blue-400/15 text-[#4A7FA7]"
                    />
                    <label htmlFor="active_quest" className="text-xs font-bold text-[#F6FAFD] cursor-pointer">
                      Mark as active questionnaire
                    </label>
                  </div>

                  <button onClick={handleUploadQuest} disabled={isSubmitting} className="w-full h-14 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-[#F6FAFD] disabled:opacity-50 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-colors">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Define Audit</>}
                  </button>
                </div>
              )}

              {modalType === "view_script" && (
                <div className="space-y-6">
                  {viewingScript.loading ? (
                    <ScriptDetailSkeleton />
                  ) : viewingScript.error ? (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100">{viewingScript.error}</div>
                  ) : viewingScript.data ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Script Title</h4>
                        <p className="text-lg font-bold text-[#F6FAFD]">{viewingScript.data.title}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Source Text</h4>
                        <div className="bg-black/25 p-6 rounded-2xl border border-blue-400/15 max-h-[400px] overflow-y-auto">
                          <p className="text-sm text-[#B3CFE5] whitespace-pre-wrap leading-relaxed">{viewingScript.data.source_text}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-[#B3CFE5] uppercase tracking-wider">
                        <span className="bg-blue-950/18 px-2 py-1 rounded-md border border-blue-400/10">Version {viewingScript.data.version}</span>
                        <span className="bg-blue-950/18 px-2 py-1 rounded-md border border-blue-400/10">{viewingScript.data.call_direction}</span>
                        <span className="bg-blue-950/18 px-2 py-1 rounded-md border border-blue-400/10">{viewingScript.data.status}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-[#1A3D63]/40 border-t-[#4A7FA7] animate-spin" />
      </div>
    }>
      <CampaignsPageContent />
    </Suspense>
  );
}

function InputField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-14 glass rounded-xl px-4 outline-none focus:border-[#4A7FA7] transition-colors text-[#F6FAFD] font-semibold placeholder:text-[#B3CFE5]/50"
      />
    </div>
  );
}

function SelectField({ label, options, value, onChange }: { label: string; options: any[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-14 glass rounded-xl px-4 outline-none focus:border-[#4A7FA7] transition-colors text-[#F6FAFD] font-semibold appearance-none"
        >
          <option value="">Select Target...</option>
          {options.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A7FA7] rotate-90" />
      </div>
    </div>
  );
}

function FileUpload({ label, onChange }: { label: string; onChange: (file: File) => void }) {
  const [fileName, setFileName] = useState("");
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{label}</label>
      <div
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
              setFileName(file.name);
              onChange(file);
            }
          };
          input.click();
        }}
        className="w-full h-14 border-2 border-dashed border-blue-400/15 rounded-xl flex items-center px-4 gap-3 cursor-pointer hover:bg-blue-950/18 transition-colors group"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-950/18 group-hover:bg-gradient-to-r group-hover:from-[#4A7FA7] group-hover:to-[#1A3D63] group-hover:text-white flex items-center justify-center text-[#4A7FA7] transition-colors">
          <Upload className="w-4 h-4" />
        </div>
        <span className="text-sm font-bold text-[#B3CFE5]">{fileName || "Click to select file"}</span>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-20 text-center space-y-3">
      <div className="w-16 h-16 bg-blue-950/18 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <Layers className="w-8 h-8 text-[#4A7FA7]" />
      </div>
      <p className="text-[#B3CFE5] font-extrabold uppercase tracking-widest text-xs italic">{label}</p>
    </div>
  );
}
