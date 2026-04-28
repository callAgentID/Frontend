"use client";

import { useState, useEffect } from "react";
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
import { cn } from "../../lib/utils";

export default function CampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"campaign" | "script" | "questionnaire" | "view_script">("campaign");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingScript, setViewingScript] = useState<{ loading: boolean; data: any; error?: string }>({ loading: false, data: null });

  // Form States
  const [campForm, setCampForm] = useState({ name: "", code: "" });
  const [scriptForm, setScriptForm] = useState({ title: "", campaign_id: "", file: null as File | null });
  const [questForm, setQuestForm] = useState({ name: "", description: "", campaign_id: "", file: null as File | null });

  const [data, setData] = useState<{ campaigns: any[]; scripts: any[]; questionnaires: any[] }>({
    campaigns: [],
    scripts: [],
    questionnaires: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const headers = { "ngrok-skip-browser-warning": "true" };

      const [campRes, scriptRes, questRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/campaigns/`, { headers }),
        fetch(`${baseUrl}/api/v1/scripts/`, { headers }).catch(() => null),
        fetch(`${baseUrl}/api/v1/questionnaires/`, { headers }).catch(() => null)
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
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const res = await fetch(`${baseUrl}/api/v1/campaigns/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
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
    if (!scriptForm.file || !scriptForm.campaign_id) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", scriptForm.file);
      formData.append("campaign_id", scriptForm.campaign_id);
      formData.append("title", scriptForm.title || "New Script");
      formData.append("call_direction", "outbound");

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const res = await fetch(`${baseUrl}/api/v1/scripts/upload`, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" },
        body: formData
      });
      if (res.ok) {
        setIsModalOpen(false);
        setScriptForm({ title: "", campaign_id: "", file: null });
        fetchData();
      }
    } catch (err) {
      console.error("Script mapping failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadQuest = async () => {
    if (!questForm.file || !questForm.campaign_id) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", questForm.file);
      formData.append("campaign_id", questForm.campaign_id);
      formData.append("name", questForm.name || "New Questionnaire");
      formData.append("description", questForm.description);

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const res = await fetch(`${baseUrl}/api/v1/questionnaires/upload`, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" },
        body: formData
      });
      if (res.ok) {
        setIsModalOpen(false);
        setQuestForm({ name: "", description: "", campaign_id: "", file: null });
        fetchData();
      }
    } catch (err) {
      console.error("Audit mapping failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScriptClick = async (scriptId: string) => {
    setModalType("view_script");
    setIsModalOpen(true);
    setViewingScript({ loading: true, data: null });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const headers = { "ngrok-skip-browser-warning": "true" };
      const res = await fetch(`${baseUrl}/api/v1/scripts/${scriptId}`, { headers });
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
    <div className="max-w-7xl mx-auto py-10 px-8 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-[850] text-[#1F3A34] tracking-tight">Intelligence Hierarchy</h1>
          <p className="text-[#1F3A3460] font-medium">Classifying neural scripts and audit blueprints by campaign relationship.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchData} className="h-12 px-6 bg-[#1F3A3408] text-[#1F3A34] rounded-2xl font-bold flex items-center gap-2 hover:bg-[#1F3A3415] transition-all text-sm">
            Refresh Data
          </button>
          <button
            onClick={() => {
              setModalType("campaign");
              setIsModalOpen(true);
            }}
            className="h-12 px-6 bg-[#1F3A34] text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-[#1F3A3420] hover:scale-105 active:scale-95 transition-all text-sm"
          >
            <Plus className="w-5 h-5" /> New Asset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-[500px] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-[#1F3A34] animate-spin" />
          <p className="text-[#1F3A3440] font-bold uppercase tracking-widest text-xs">Mapping Relationships...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          {data.campaigns.map((campaign) => {
            const campaignScripts = data.scripts.filter(s => s.campaign_id === campaign.id);
            const campaignQuestionnaires = data.questionnaires.filter(q => q.campaign_id === campaign.id);

            return (
              <div key={campaign.id} className="group relative">
                {/* Campaign Header Card */}
                <div className="bg-white rounded-[2.5rem] border border-[#1f3a3410] overflow-hidden shadow-2xl shadow-[#1f3a3405] transition-all hover:border-[#1f3a3420]">
                  <div className="p-10 border-b border-[#1f3a3408] bg-[#1F3A3402] flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 rounded-3xl bg-[#1F3A34] text-white flex items-center justify-center shadow-2xl shadow-[#1F3A3430]">
                        <Layers className="w-10 h-10" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-3xl font-[850] text-[#1F3A34] tracking-tight">{campaign.name}</h2>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            campaign.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          )}>
                            {campaign.active ? "Live Cluster" : "Archived"}
                          </span>
                        </div>
                        <p className="text-[#1F3A3440] font-bold uppercase tracking-[0.2em] text-[11px]">Identity Code: {campaign.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 pr-4">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3430]">Mapped Assets</p>
                        <p className="font-[850] text-[#1F3A34]">{campaignScripts.length + campaignQuestionnaires.length} Units</p>
                      </div>
                      <button className="w-12 h-12 rounded-2xl bg-[#1F3A3405] flex items-center justify-center text-[#1F3A3440] hover:bg-[#1F3A34] hover:text-white transition-all">
                        <MoreHorizontal className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Asset Classification Grid */}
                  {/* Scripts Section */}
                  <div className="bg-white p-10 space-y-6">
                    <div className="flex items-center justify-between border-b border-[#1f3a3405] pb-4">
                      <div className="flex items-center gap-3">
                        <FileCode className="w-5 h-5 text-[#1F3A3440]" />
                        <h3 className="font-extrabold text-[#1F3A34] uppercase tracking-wider text-xs">Neural Scripts</h3>
                      </div>
                      <button
                        onClick={() => {
                          setScriptForm(prev => ({ ...prev, campaign_id: campaign.id }));
                          setModalType("script");
                          setIsModalOpen(true);
                        }}
                        className="bg-[#1F3A3410] text-[#1F3A34] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-[#1F3A34] hover:text-white transition-all"
                      >
                        Add Logic
                      </button>
                    </div>
                    <div className="space-y-3">
                      {campaignScripts.map((s) => (
                        <div key={s.id} onClick={() => handleScriptClick(s.id)} className="p-4 rounded-2xl bg-[#1F3A3403] border border-transparent hover:border-[#1F3A3410] transition-all flex items-center justify-between group/row cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1F3A3420] group-hover/row:text-[#1F3A34]">
                              <FileText className="w-4 h-4" />
                            </div>
                            <p className="text-sm font-bold text-[#1F3A34]">{s.title || "Standard Sales Script"}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#1F3A3410] group-hover/row:translate-x-1 transition-all" />
                        </div>
                      ))}
                      {campaignScripts.length === 0 && <p className="text-[11px] font-bold text-[#1F3A3420] italic py-2">No scripts mapped to this framework...</p>}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#11231f20] backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-[#1f3a3410] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-[#1f3a3405] bg-[#1F3A3402] flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-[850] text-[#1F3A34] tracking-tight">
                  {modalType === 'view_script' ? 'Neural Script Details' : `Deploy New ${modalType === 'campaign' ? 'Campaign Cluster' : modalType === 'script' ? 'Neural Script' : 'QA Blueprint'}`}
                </h3>
                <p className="text-sm font-semibold text-[#1F3A3440] mt-1">
                  {modalType === 'view_script' ? 'Reviewing deployed logic framework.' : 'Configure your intelligence assets below.'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-xl hover:bg-[#1F3A3410] flex items-center justify-center transition-all text-[#1F3A3420]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-10 space-y-8">
              {modalType === "campaign" && (
                <div className="space-y-6">
                  <InputField label="Name" placeholder="e.g. Q4 Growth Sales" value={campForm.name} onChange={(v) => setCampForm({ ...campForm, name: v })} />
                  <InputField label="Identity Code" placeholder="e.g. SALES_Q4" value={campForm.code} onChange={(v) => setCampForm({ ...campForm, code: v })} />
                  <button onClick={handleCreateCampaign} disabled={isSubmitting} className="w-full h-14 bg-[#1F3A34] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all">
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
                  <FileUpload label="Script Document (.docx)" onChange={(f) => setScriptForm({ ...scriptForm, file: f })} />
                  <button onClick={handleUploadScript} disabled={isSubmitting} className="w-full h-14 bg-[#1F3A34] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /> Deploy Logic</>}
                  </button>
                </div>
              )}

              {modalType === "questionnaire" && (
                <div className="space-y-6">
                  <InputField label="Name" placeholder="e.g. Compliance Audit v1" value={questForm.name} onChange={(v) => setQuestForm({ ...questForm, name: v })} />
                  <InputField label="Description" placeholder="What does this audit measure?" value={questForm.description} onChange={(v) => setQuestForm({ ...questForm, description: v })} />
                  <SelectField
                    label="Home Campaign"
                    options={data.campaigns}
                    value={questForm.campaign_id}
                    onChange={(v) => setQuestForm({ ...questForm, campaign_id: v })}
                  />
                  <FileUpload label="Question Sheet (.xlsx / .csv)" onChange={(f) => setQuestForm({ ...questForm, file: f })} />
                  <button onClick={handleUploadQuest} disabled={isSubmitting} className="w-full h-14 bg-[#1F3A34] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Define Audit</>}
                  </button>
                </div>
              )}

              {modalType === "view_script" && (
                <div className="space-y-6">
                  {viewingScript.loading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                      <Loader2 className="w-8 h-8 animate-spin text-[#1F3A3450]" />
                      <p className="text-sm font-bold text-[#1F3A3450]">Decoding Neural Script...</p>
                    </div>
                  ) : viewingScript.error ? (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100">{viewingScript.error}</div>
                  ) : viewingScript.data ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">Script Title</h4>
                        <p className="text-lg font-bold text-[#1F3A34]">{viewingScript.data.title}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">Source Text</h4>
                        <div className="bg-[#F4F8F9] p-6 rounded-2xl border border-[#1f3a3410] max-h-[400px] overflow-y-auto subtle-grid">
                          <p className="text-sm text-[#1F3A3480] whitespace-pre-wrap leading-relaxed">{viewingScript.data.source_text}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-[#1F3A3450] uppercase tracking-wider">
                        <span className="bg-[#1F3A3405] px-2 py-1 rounded-md">Version {viewingScript.data.version}</span>
                        <span className="bg-[#1F3A3405] px-2 py-1 rounded-md">{viewingScript.data.call_direction}</span>
                        <span className="bg-[#1F3A3405] px-2 py-1 rounded-md">{viewingScript.data.status}</span>
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

function InputField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-14 bg-[#1F3A3403] border border-[#1f3a3410] rounded-xl px-4 outline-none focus:border-[#1F3A34] transition-all text-[#1F3A34] font-semibold"
      />
    </div>
  );
}

function SelectField({ label, options, value, onChange }: { label: string; options: any[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-14 bg-[#1F3A3403] border border-[#1f3a3410] rounded-xl px-4 outline-none focus:border-[#1F3A34] transition-all text-[#1F3A34] font-semibold appearance-none"
        >
          <option value="">Select Target...</option>
          {options.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3A3420] rotate-90" />
      </div>
    </div>
  );
}

function FileUpload({ label, onChange }: { label: string; onChange: (file: File) => void }) {
  const [fileName, setFileName] = useState("");
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">{label}</label>
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
        className="w-full h-14 border-2 border-dashed border-[#1f3a3410] rounded-xl flex items-center px-4 gap-3 cursor-pointer hover:bg-[#1F3A3402] transition-all group"
      >
        <div className="w-8 h-8 rounded-lg bg-[#1F3A3408] group-hover:bg-[#1F3A34] group-hover:text-white flex items-center justify-center text-[#1F3A3440] transition-all">
          <Upload className="w-4 h-4" />
        </div>
        <span className="text-sm font-bold text-[#1F3A3440]">{fileName || "Click to select file"}</span>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-20 text-center space-y-3">
      <div className="w-16 h-16 bg-[#1F3A3405] rounded-3xl flex items-center justify-center mx-auto mb-4">
        <Layers className="w-8 h-8 text-[#1F3A3410]" />
      </div>
      <p className="text-[#1F3A3420] font-extrabold uppercase tracking-widest text-xs italic">{label}</p>
    </div>
  );
}
