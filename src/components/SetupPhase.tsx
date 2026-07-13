"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  Settings,
  CheckCircle2,
  Loader2,
  Layout,
  ArrowRight,
  Upload,
  Globe
} from "lucide-react";
import { cn } from "../lib/utils";
import { useApi } from "../lib/useApi";

interface SetupPhaseProps {
  onComplete: (config: { campaign_id: string; questionnaire_id: string; profile_id: string }) => void;
}

export function SetupPhase({ onComplete }: SetupPhaseProps) {
  const { apiFetch } = useApi();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Entity states
  const [campaignId, setCampaignId] = useState<string>("");
  const [questionnaireId, setQuestionnaireId] = useState<string>("");
  const [profileId, setProfileId] = useState<string>("");

  // Form states for Campaign
  const [campaignName, setCampaignName] = useState("Marketing Outbound Q1");
  const [campaignCode, setCampaignCode] = useState("MKT_Q1");

  // File states
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [questionnaireFile, setQuestionnaireFile] = useState<File | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);

  // 1. Create Campaign
  const handleCreateCampaign = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/v1/campaigns/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          code: campaignCode,
          active: true,
          config: {}
        })
      });
      const data = await response.json();
      if (data.id) {
        setCampaignId(data.id);
        setStep(2);
      }
    } catch (err) {
      console.error("Campaign Creation Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Upload Script
  const handleUploadScript = async () => {
    if (!scriptFile || !campaignId) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", scriptFile);
      formData.append("campaign_id", campaignId);
      formData.append("title", `${campaignName} Script`);
      formData.append("call_direction", "outbound");

      const response = await apiFetch("/api/v1/scripts/upload", {
        method: "POST",
        body: formData
      });
      if (response.ok) setStep(3);
    } catch (err) {
      console.error("Script Upload Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Upload Questionnaire
  const handleUploadQuestionnaire = async () => {
    if (!questionnaireFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", questionnaireFile);
      formData.append("name", `${campaignName} Audit`);
      formData.append("description", "Dynamic QA Audit generated from document.");

      const response = await apiFetch("/api/v1/questionnaires/upload", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data.id) {
        setQuestionnaireId(data.id);
        setStep(4);
      }
    } catch (err) {
      console.error("Questionnaire Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Fetch & Select Profile
  useEffect(() => {
    if (step === 4) {
      const fetchProfiles = async () => {
        try {
          const response = await apiFetch("/api/v1/worker/profiles");
          const data = await response.json();
          setProfiles(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Profiles Failed:", err);
        }
      };
      fetchProfiles();
    }
  }, [step]);

  const handleFinish = () => {
    if (campaignId && questionnaireId && profileId) {
      onComplete({
        campaign_id: campaignId,
        questionnaire_id: questionnaireId,
        profile_id: profileId
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 animate-in fade-in duration-150 duration-150">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <SetupStep num={1} label="Campaign" active={step === 1} done={step > 1} />
        <SetupStep num={2} label="Script" active={step === 2} done={step > 2} />
        <SetupStep num={3} label="Audit" active={step === 3} done={step > 3} />
        <SetupStep num={4} label="Profile" active={step === 4} done={step > 4} />
      </div>

      <div className="bg-[#502D55]/60 rounded-[2.5rem] border border-[#935073]/30 p-12 shadow-sm shadow-[#502D55]/20 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-[#502D55]/60 z-50 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#F8F4E9] animate-spin" />
          </div>
        )}

        {/* STEP 1: CAMPAIGN */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-150 duration-150">
            <div className="space-y-2">
              <h3 className="text-3xl font-[850] text-[#F8F4E9] tracking-tight">Initialize Campaign</h3>
              <p className="text-[#F8F4E9] font-medium leading-relaxed">Create the strategic container for your intelligence signals.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#F8F4E9] ml-1">Campaign Name</label>
                <input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full h-16 px-6 rounded-2xl bg-[#502D55]/40 border border-transparent focus:border-[#935073]/30 focus:bg-[#502D55]/60 text-[#F8F4E9] font-bold transition-colors outline-none pl-12 relative"
                />
                <Layout className="w-5 h-5 absolute mt-12 ml-4 text-[#935073]" />
              </div>
              <div className="space-y-3 relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#F8F4E9] ml-1">Campaign Code</label>
                <input
                  value={campaignCode}
                  onChange={(e) => setCampaignCode(e.target.value)}
                  className="w-full h-16 px-6 rounded-2xl bg-[#502D55]/40 border border-transparent focus:border-[#935073]/30 focus:bg-[#502D55]/60 text-[#F8F4E9] font-bold transition-colors outline-none pl-12"
                />
                <Globe className="w-5 h-5 absolute top-12 left-4 text-[#935073]" />
              </div>
            </div>
            <button
              onClick={handleCreateCampaign}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#935073] to-[#502D55] glow text-white font-[850] shadow-sm shadow-[#935073]/20 hover:scale-[1.02] active:scale-95 transition-colors flex items-center justify-center gap-3"
            >
              Construct Framework <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: SCRIPT */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-150 duration-150">
            <div className="space-y-2">
              <h3 className="text-3xl font-[850] text-[#F8F4E9] tracking-tight">Magic Script Parser</h3>
              <p className="text-[#F8F4E9] font-medium leading-relaxed">Upload your outbound script instructions (.docx) for neural alignment.</p>
            </div>
            <div className="py-10 border-2 border-dashed border-[#935073]/20 rounded-3xl flex flex-col items-center gap-4 bg-[#502D55]/40">
              <div className="p-4 bg-[#935073] rounded-2xl text-white">
                <Upload className="w-6 h-6" />
              </div>
              <input
                type="file"
                accept=".docx"
                onChange={(e) => setScriptFile(e.target.files?.[0] || null)}
                className="hidden" id="script-upload"
              />
              <label htmlFor="script-upload" className="cursor-pointer group">
                <span className="text-lg font-extrabold text-[#F8F4E9] group-hover:underline">{scriptFile ? scriptFile.name : "Select Word Document"}</span>
              </label>
            </div>
            <button
              disabled={!scriptFile}
              onClick={handleUploadScript}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#935073] to-[#502D55] glow disabled:bg-[#935073]/20 disabled:from-[#935073]/20 disabled:to-[#502D55]/20 text-white font-[850] shadow-sm shadow-[#935073]/20 transition-colors flex items-center justify-center gap-3"
            >
              Parse & Map Agent Logic <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 3: AUDIT */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-150 duration-150">
            <div className="space-y-2">
              <h3 className="text-3xl font-[850] text-[#F8F4E9] tracking-tight">Questionnaire Blueprint</h3>
              <p className="text-[#F8F4E9] font-medium leading-relaxed">Upload the audit questions Gemini will use to evaluate your signals.</p>
            </div>
            <div className="py-10 border-2 border-dashed border-[#935073]/20 rounded-3xl flex flex-col items-center gap-4 bg-[#502D55]/40">
              <div className="p-4 bg-[#935073] rounded-2xl text-white">
                <FileText className="w-6 h-6" />
              </div>
              <input
                type="file"
                onChange={(e) => setQuestionnaireFile(e.target.files?.[0] || null)}
                className="hidden" id="audit-upload"
              />
              <label htmlFor="audit-upload" className="cursor-pointer group">
                <span className="text-lg font-extrabold text-[#F8F4E9] group-hover:underline">{questionnaireFile ? questionnaireFile.name : "Select Evaluation Sheet"}</span>
              </label>
            </div>
            <button
              disabled={!questionnaireFile}
              onClick={handleUploadQuestionnaire}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#935073] to-[#502D55] glow disabled:bg-[#935073]/20 disabled:from-[#935073]/20 disabled:to-[#502D55]/20 text-white font-[850] shadow-sm shadow-[#935073]/20 transition-colors flex items-center justify-center gap-3"
            >
              Build Audit Framework <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 4: PROFILE */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in duration-150 duration-150">
            <div className="space-y-2">
              <h3 className="text-3xl font-[850] text-[#F8F4E9] tracking-tight">Intelligence Profile</h3>
              <p className="text-[#F8F4E9] font-medium leading-relaxed">Select the AI processing profile that will power the neural engine.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {profiles.length > 0 ? profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProfileId(p.id)}
                  className={cn(
                    "flex items-center justify-between p-6 rounded-2xl border transition-colors text-left group",
                    profileId === p.id
                      ? "bg-gradient-to-r from-[#935073] to-[#502D55] glow border-[#935073]/30 text-white shadow-lg"
                      : "bg-[#502D55]/40 border-transparent hover:border-[#935073]/20"
                  )}
                >
                  <div>
                    <p className="font-extrabold tracking-tight text-lg">{p.name || "Standard Engine"}</p>
                    <p className={cn("text-xs font-bold uppercase tracking-widest mt-1 opacity-50", profileId === p.id ? "text-white" : "text-[#F8F4E9]")}>
                      STT: {p.stt_provider || "Neural"} · LLM: {p.llm_model || "Gemini"}
                    </p>
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                    profileId === p.id ? "border-white bg-white/20" : "border-[#935073]/20"
                  )}>
                    {profileId === p.id && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </div>
                </button>
              )) : (
                <div className="p-10 text-center text-[#F8F4E9] font-bold">No active profiles found... Using seed default.</div>
              )}
            </div>
            <button
              disabled={!profileId}
              onClick={handleFinish}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#935073] to-[#502D55] glow disabled:bg-[#935073]/20 disabled:from-[#935073]/20 disabled:to-[#502D55]/20 text-white font-[850] shadow-sm shadow-[#935073]/20 transition-colors flex items-center justify-center gap-3"
            >
              Finalize & Launch Ingestion <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SetupStep({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-colors border-2",
        active ? "bg-gradient-to-r from-[#935073] to-[#502D55] glow text-white border-[#935073]/30 scale-110 shadow-lg" :
          done ? "bg-[#935073]/20 text-[#F8F4E9] border-transparent" :
            "bg-transparent text-[#935073]/40 border-[#935073]/20"
      )}>
        {done ? <CheckCircle2 className="w-5 h-5" /> : num}
      </div>
      <span className={cn(
        "text-[10px] uppercase font-black tracking-widest transition-colors",
        active ? "text-[#F8F4E9]" : "text-[#935073]/40"
      )}>{label}</span>
    </div>
  );
}
