"use client";

import { useState, useRef } from "react";
import { useTranslations } from 'next-intl';
import {
  FileAudio,
  FileText,
  Upload,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Download,
  FileUp,
  Layout,
  ChevronRight,
  Layers,
  FileSearch,
  ShieldAlert,
  Target,
  Zap,
  Activity as Waveform,
  Tag,
  HelpCircle
} from "lucide-react";
import { cn } from "../lib/utils";
import { useEffect } from "react";

type InputMode = "audio" | "transcript";

type CallAnalytics = {
  silence: { total_duration_ms: number; ratio: number; longest_gap_ms: number; gap_count: number };
  speakers: { speaker_id: string; talk_time_ms: number; turn_count: number; talk_ratio: number }[];
  total_talk_time_ms: number;
  turn_count: number;
  duration_seconds?: number;
};

export function InputSection({
  onTranscriptReady,
  onAnalysisComplete,
  onPartialResult
}: {
  onTranscriptReady?: (transcript: string) => void;
  onAnalysisComplete?: (data: any) => void;
  onPartialResult?: (data: any) => void;
}) {
  const t = useTranslations('input');
  const [mode, setMode] = useState<InputMode>("audio");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [manualTranscript, setManualTranscript] = useState("");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<"uploading" | "transcribing" | "idle">("idle");
  const [generatedTranscript, setGeneratedTranscript] = useState("");
  const [callAnalytics, setCallAnalytics] = useState<CallAnalytics | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedRedFlagIds, setSelectedRedFlagIds] = useState<string[]>([]);
  const [selectedOtherIds, setSelectedOtherIds] = useState<string[]>([]);
  const [isRedFlagOpen, setIsRedFlagOpen] = useState(false);
  const [isOtherOpen, setIsOtherOpen] = useState(false);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [metaTags, setMetaTags] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Array<{ text: string; weight: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI Governance: Handle click-outside for dual selectors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".group\\/select")) {
        setIsRedFlagOpen(false);
        setIsOtherOpen(false);
      }
    };

    if (isRedFlagOpen || isOtherOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isRedFlagOpen, isOtherOpen]);

  // Fetch all strategic contexts for selectors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
        const headers = { "ngrok-skip-browser-warning": "true" };

        const [campRes, profRes, questRes] = await Promise.all([
          fetch(`${baseUrl}/api/v1/campaigns/`, { headers }),
          fetch(`${baseUrl}/api/v1/worker/profiles`, { headers }),
          fetch(`${baseUrl}/api/v1/questionnaires/?skip=0&limit=100`, { headers })
        ]);

        const [campData, profData, questData] = await Promise.all([
          campRes.json(),
          profRes.json(),
          questRes.json()
        ]);

        if (Array.isArray(campData)) {
          setCampaigns(campData);
          if (campData.length > 0) setSelectedCampaignId(campData[0].id || campData[0]._id);
        }

        if (Array.isArray(profData)) {
          setProfiles(profData);
          if (profData.length > 0) setSelectedProfileId(profData[0].id || profData[0]._id);
        }

        if (Array.isArray(questData)) {
          setQuestionnaires(questData);
          setSelectedRedFlagIds([]);
          setSelectedOtherIds([]);
        }
      } catch (err) {
        console.error("Failed to load strategic contexts:", err);
      }
    };
    fetchData();
  }, []);

  const handleModeChange = (newMode: InputMode) => {
    // Clear data from other mode upon switching
    if (newMode === "audio") setManualTranscript("");
    else {
      setAudioFile(null);
      setGeneratedTranscript("");
      setCallAnalytics(null);
      setProcessingError(null);
    }
    setMode(newMode);
    setIsProcessing(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith("audio/") || file.type.startsWith("video/mpeg") || ["audio/mpeg", "audio/wav", "audio/x-m4a"].includes(file.type) || file.name.endsWith('.mpeg'))) {
      setAudioFile(file);
      setGeneratedTranscript("");
    }
  };

  const pollForTranscript = async (callId: string) => {
    setProcessingStatus("transcribing");

    const poll = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
        const response = await fetch(`${baseUrl}/api/v1/calls/${callId}`, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });
        if (!response.ok) return;

        const data = await response.json();

        // **Parallel Hydration**: Always update partial results if data exists
        if (data.transcript?.utterances) {
          const formattedTranscript = data.transcript.utterances
            .map((u: any) => `Speaker ${u.speaker_id}: ${u.text}`)
            .join("\n");

          setGeneratedTranscript(formattedTranscript);
          if (data.analytics) {
            setCallAnalytics({
              ...data.analytics,
              duration_seconds: data.transcript.duration_seconds,
            });
          }
          if (onPartialResult) onPartialResult(data);
        }

        // Handle failed status — stop polling and show error
        if (data.status === "failed") {
          setIsProcessing(false);
          setProcessingStatus("idle");
          setProcessingError(data.error_message || "Transcription failed. Please try again.");
          return true; // Stop polling
        }

        if ((data.status === "ready" || data.status === "transcribed") && data.transcript?.utterances) {
          const formattedTranscript = data.transcript.utterances
            .map((u: any) => `Speaker ${u.speaker_id}: ${u.text}`)
            .join("\n");

          setGeneratedTranscript(formattedTranscript);
          setIsProcessing(false);
          setProcessingStatus("idle");
          if (onTranscriptReady) onTranscriptReady(formattedTranscript);
          if (onAnalysisComplete) onAnalysisComplete(data);
          return true; // Stop polling
        }
        return false;
      } catch (err) {
        console.error("Polling error:", err);
        return false;
      }
    };

    const interval = setInterval(async () => {
      const isDone = await poll();
      if (isDone) clearInterval(interval);
    }, 30000); // Decelerated 30s polling for steady hydration
  };

  const handleUploadSubmit = async () => {
    if (!audioFile || !selectedCampaignId) return;

    setIsProcessing(true);
    setProcessingStatus("uploading");
    setProcessingError(null); try {
      const formData = new FormData();
      formData.append("file", audioFile!);

      // Integration: Using live IDs from selection
      formData.append("campaign_id", selectedCampaignId);
      formData.append("processing_profile_id", selectedProfileId);

      // Mandatory Questionnaire Mapping (Dual-Dropdown Strategy)
      const selectedCampaign = campaigns.find(c => (c.id === selectedCampaignId || c._id === selectedCampaignId));
      const campaignTemplateId = selectedCampaign?.questionnaire_template_id;

      // Global IDs = Campaign Logic + All Others (which includes Red Flags per auto-sync rule)
      const globalIds = Array.from(new Set([
        ...(campaignTemplateId ? [campaignTemplateId] : []),
        ...selectedOtherIds
      ]));

      // High Priority IDs = All Red Flags (per user requirement)
      // We package the red flag selected IDs here.
      const highPriorityValue = selectedRedFlagIds.length > 0
        ? (selectedRedFlagIds.length > 1 ? JSON.stringify(selectedRedFlagIds) : selectedRedFlagIds[0])
        : (campaignTemplateId || globalIds[0]);

      if (!highPriorityValue) throw new Error("Misconfiguration: No audit frameworks selected.");

      formData.append("high_priority_questionnaire_template_id", highPriorityValue);
      formData.append("questionnaire_template_ids", JSON.stringify(globalIds));

      formData.append("language", "en");

      // New optional fields
      if (metaTags.length > 0) {
        formData.append("meta_tags", JSON.stringify(metaTags));
      }
      if (customQuestions.length > 0) {
        formData.append("custom_questions", JSON.stringify(customQuestions));
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const response = await fetch(`${baseUrl}/api/v1/calls/`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      console.log("Analysis Queued:", data);

      if (data.call_id) {
        await pollForTranscript(data.call_id);
      } else {
        throw new Error("No call_id returned");
      }
    } catch (error: any) {
      console.error("API Error:", error);
      alert(error.message || "Failed to connect to the analysis engine. Please check your connection.");
      setIsProcessing(false);
      setProcessingStatus("idle");
    }
  };

  const [showManualSuccess, setShowManualSuccess] = useState(false);

  const handleTranscriptSubmit = async () => {
    if ((!manualTranscript.trim() && !manualFile) || !selectedCampaignId) return;

    setIsProcessing(true);
    setProcessingStatus("uploading");
    setProcessingError(null);

    try {
      const formData = new FormData();

      // If we have a file, use it. Otherwise, create a text blob from the manual entry.
      if (manualFile) {
        formData.append("file", manualFile);
      } else {
        const blob = new Blob([manualTranscript], { type: "text/plain" });
        formData.append("file", blob, "manual_transcript.txt");
      }

      // Integration: Using live IDs from selection (Matching Audio Upload Logic)
      formData.append("campaign_id", selectedCampaignId);
      formData.append("processing_profile_id", selectedProfileId);

      const selectedCampaign = campaigns.find(c => (c.id === selectedCampaignId || c._id === selectedCampaignId));
      const campaignTemplateId = selectedCampaign?.questionnaire_template_id;

      const globalIds = Array.from(new Set([
        ...(campaignTemplateId ? [campaignTemplateId] : []),
        ...selectedOtherIds
      ]));

      const highPriorityValue = selectedRedFlagIds.length > 0
        ? (selectedRedFlagIds.length > 1 ? JSON.stringify(selectedRedFlagIds) : selectedRedFlagIds[0])
        : (campaignTemplateId || globalIds[0]);

      if (!highPriorityValue) throw new Error("Misconfiguration: No audit frameworks selected.");

      formData.append("high_priority_questionnaire_template_id", highPriorityValue);
      formData.append("questionnaire_template_ids", JSON.stringify(globalIds));
      formData.append("language", "en");

      // New optional fields
      if (metaTags.length > 0) {
        formData.append("meta_tags", JSON.stringify(metaTags));
      }
      if (customQuestions.length > 0) {
        formData.append("custom_questions", JSON.stringify(customQuestions));
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const response = await fetch(`${baseUrl}/api/v1/ingest/manual`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Manual ingestion failed");

      const data = await response.json();
      console.log("Manual Analysis Queued:", data);

      if (data.call_id) {
        // Shared Polling Logic
        await pollForTranscript(data.call_id);
      } else {
        throw new Error("No call_id returned from manual ingestion");
      }
    } catch (error: any) {
      console.error("Manual API Error:", error);
      alert(error.message || "Failed to connect to the analysis engine. Please check your connection.");
      setIsProcessing(false);
      setProcessingStatus("idle");
    }
  };

  const handleGeneratedTranscriptChange = (newVal: string) => {
    setGeneratedTranscript(newVal);
    if (onTranscriptReady) onTranscriptReady(newVal);
  };

  const downloadTranscript = () => {
    if (!generatedTranscript) return;
    const blob = new Blob([generatedTranscript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${audioFile?.name?.split('.')[0] || 'signal'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleManualFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setManualFile(file);
      setShowManualSuccess(false);

      // If it's a text file, populate the textarea for preview/editing
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (event) => {
          setManualTranscript(event.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        // For PDF/DOCX, just show a placeholder/filename in manual mode
        setManualTranscript(`[File Attachment: ${file.name}]`);
      }
    }
  };

  const removeFile = () => {
    setAudioFile(null);
    setManualFile(null);
    setManualTranscript("");
    setGeneratedTranscript("");
    setCallAnalytics(null);
    setProcessingError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section className="max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header & Subtext */}
      <div className="flex flex-col gap-2 items-center text-center px-4">
        <h3 className="text-3xl font-[850] text-[#1F3A34] tracking-tight">{t('signalInput')}</h3>
        <p className="text-[#1F3A3450] text-sm font-semibold max-w-sm">{t('provideData')}</p>
      </div>

      {/* Mode Toggle Tabs */}
      <div className="flex justify-center">
        <div className="flex p-1.5 bg-[#1F3A3408] rounded-2xl border border-[#1f3a3405] w-full max-w-[400px]">
          <button
            onClick={() => handleModeChange("audio")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-extrabold transition-all",
              mode === "audio"
                ? "bg-[#1F3A34] text-white apple-shadow"
                : "text-[#1F3A3450] hover:text-[#1F3A34]"
            )}
          >
            <FileAudio className="w-4 h-4 opacity-70" />
            {t('uploadAudio')}
          </button>
          <button
            onClick={() => handleModeChange("transcript")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-extrabold transition-all",
              mode === "transcript"
                ? "bg-[#1F3A34] text-white apple-shadow"
                : "text-[#1F3A3450] hover:text-[#1F3A34]"
            )}
          >
            <FileText className="w-4 h-4 opacity-70" />
            {t('manualEntry')}
          </button>
        </div>
      </div>

      {/* Input Content Area */}
      <div className="glass-blur apple-blur bg-white p-8 md:p-12 rounded-[40px] apple-shadow border border-[#1f3a3405]">
        <div className="space-y-10">
          {mode === "audio" ? (
            <div className="space-y-8">
              {!audioFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group w-full aspect-video md:aspect-[3/1] border-2 border-dashed border-[#1f3a3410] hover:border-[#1f3a34] rounded-[2.5rem] flex flex-col items-center justify-center gap-6 cursor-pointer transition-all hover:bg-[#1f3a3403]"
                >
                  <div className="w-16 h-16 rounded-[2rem] bg-[#1F3A3408] group-hover:bg-[#1F3A34] group-hover:scale-110 transition-all flex items-center justify-center">
                    <Upload className="w-7 h-7 text-[#1F3A3460] group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-[#1F3A34] group-hover:translate-y-[-2px] transition-transform">{t('uploadSignalFile')}</p>
                    <p className="text-xs font-bold text-[#1F3A3440] uppercase tracking-widest mt-1.5">{t('mp3WavInfo')}</p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept="audio/*,video/mpeg,.mpeg,.mp3,.wav,.m4a,.ogg,.opus"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-6 rounded-[2rem] bg-[#1F3A3405] border border-[#1f3a3408] animate-in zoom-in-95 duration-500">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#1F3A34] flex items-center justify-center shadow-lg shadow-[#1f3a3420]">
                      <FileAudio className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-[#1F3A34] truncate max-w-[200px] md:max-w-md">{audioFile.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3440] mt-1">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB • READY TO PROCESS</p>
                    </div>
                  </div>
                  {!isProcessing && (
                    <button onClick={removeFile} className="p-3 hover:bg-red-50 text-[#1F3A3420] hover:text-red-500 rounded-xl transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#1F3A34] flex items-center gap-2">
                    <FileText className="w-4 h-4" /> {t('bypassedInput')}
                  </h4>
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-[#1F3A3408] hover:bg-[#1F3A3415] text-[#1F3A3480] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer">
                    <FileUp className="w-3.5 h-3.5" /> {manualFile ? manualFile.name : t('uploadDocument')}
                    <input
                      type="file"
                      accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={handleManualFileUpload}
                    />
                  </label>
                </div>
                <textarea
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                  placeholder={t('transcriptPlaceholderImmediate')}
                  className="w-full h-48 p-8 rounded-[2.5rem] bg-[#1F3A3405] border border-transparent focus:border-[#1f3a3410] focus:bg-white focus:apple-shadow transition-all text-base font-medium leading-relaxed resize-none text-[#1F3A34] outline-none placeholder:text-[#1F3A3430]"
                />
              </div>
            </div>
          )}

          {/* SHARED STRATEGIC CONTEXT GRID */}
          {(audioFile || manualTranscript.trim() || manualFile) && !isProcessing && (
            <div className="space-y-8 pt-10 border-t border-[#1f3a3408] animate-in slide-in-from-top-8 duration-700">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#1F3A34] flex items-center gap-2">
                  <Target className="w-4 h-4" /> Strategic Context
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100 uppercase tracking-widest animate-pulse">Neural Ready</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[#1f3a3408]">
                {/* Red Flag Multi-Select */}
                <div className="relative group/select">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 mb-2 block px-1">Risk / High Priority</label>
                  <div
                    onClick={() => setIsRedFlagOpen(!isRedFlagOpen)}
                    className={cn(
                      "w-full h-16 bg-red-500/5 border border-transparent rounded-2xl px-14 flex items-center cursor-pointer transition-all hover:bg-red-500/8",
                      isRedFlagOpen && "border-red-500/20 bg-white shadow-lg text-[#1F3A34]"
                    )}
                  >
                    <span className={cn("font-bold tracking-tight text-base truncate", selectedRedFlagIds.length > 0 ? "text-red-600" : "text-[#1F3A3440]")}>
                      {selectedRedFlagIds.length === 0 ? "Identify Red Flags..." : `${selectedRedFlagIds.length} Red Flags Marked`}
                    </span>
                  </div>
                  <ShieldAlert className={cn("absolute left-5 top-[65%] -translate-y-1/2 w-5 h-5 transition-colors", selectedRedFlagIds.length > 0 ? "text-red-500" : "text-[#1F3A3420]")} />
                  <ChevronRight className={cn("absolute right-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#1F3A3420] transition-transform", isRedFlagOpen ? "-rotate-90 text-red-500" : "rotate-90")} />

                  {isRedFlagOpen && (
                    <div className="absolute top-[105%] left-0 right-0 bg-white border border-red-100 rounded-2xl shadow-2xl p-4 z-[60] space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200 lg:max-h-[300px] overflow-y-auto">
                      {questionnaires.map(q => {
                        const qId = q.id || q._id;
                        const isChecked = selectedRedFlagIds.includes(qId);
                        return (
                          <label key={`rf-${qId}`} className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer hover:bg-red-50">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRedFlagIds([...selectedRedFlagIds, qId]);
                                  if (!selectedOtherIds.includes(qId)) setSelectedOtherIds([...selectedOtherIds, qId]);
                                } else {
                                  setSelectedRedFlagIds(selectedRedFlagIds.filter(id => id !== qId));
                                }
                              }}
                              className="w-4 h-4 rounded-md border-red-200 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm font-bold text-[#1F3A34]">{q.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Standard Audit Multi-Select */}
                <div className="relative group/select">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440] mb-2 block px-1">Questionaire</label>
                  <div
                    onClick={() => setIsOtherOpen(!isOtherOpen)}
                    className={cn(
                      "w-full h-16 bg-[#1F3A3405] border border-transparent rounded-2xl px-14 flex items-center cursor-pointer transition-all hover:bg-[#1F3A3408]",
                      isOtherOpen && "border-[#1F3A3415] bg-white shadow-lg text-[#1F3A34]"
                    )}
                  >
                    <span className={cn("font-bold tracking-tight text-base truncate", selectedOtherIds.length > 0 ? "text-[#1F3A34]" : "text-[#1F3A3440]")}>
                      {selectedOtherIds.length === 0 ? "Select Questionaire..." : `${selectedOtherIds.length} Frameworks Selected`}
                    </span>
                  </div>
                  <FileSearch className={cn("absolute left-5 top-[65%] -translate-y-1/2 w-5 h-5 transition-colors", selectedOtherIds.length > 0 ? "text-[#1F3A34]" : "text-[#1F3A3420]")} />
                  <ChevronRight className={cn("absolute right-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#1F3A3420] transition-transform", isOtherOpen ? "-rotate-90 text-[#1F3A34]" : "rotate-90")} />

                  {isOtherOpen && (
                    <div className="absolute top-[105%] left-0 right-0 bg-white border border-[#1f3a3410] rounded-2xl shadow-2xl p-4 z-50 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200 lg:max-h-[300px] overflow-y-auto">
                      {questionnaires.map(q => {
                        const qId = q.id || q._id;
                        const isChecked = selectedOtherIds.includes(qId);
                        const isAlsoRedFlag = selectedRedFlagIds.includes(qId);
                        return (
                          <label key={`oa-${qId}`} className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer hover:bg-[#1F3A3405]">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOtherIds([...selectedOtherIds, qId]);
                                } else {
                                  setSelectedOtherIds(selectedOtherIds.filter(id => id !== qId));
                                  if (isAlsoRedFlag) setSelectedRedFlagIds(selectedRedFlagIds.filter(id => id !== qId));
                                }
                              }}
                              className="w-4 h-4 rounded-md border-[#1F3A3415] text-[#1F3A34] focus:ring-[#1F3A34]"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#1F3A34]">{q.name}</span>
                              {isAlsoRedFlag && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest leading-none mt-1">(Red Flag Priority)</span>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group/select">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440] mb-2 block px-1">Campaign Name</label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full h-16 bg-[#1F3A3405] border border-transparent focus:border-[#1F3A3415] rounded-2xl px-14 appearance-none text-[#1F3A34] font-bold tracking-tight text-base cursor-pointer outline-none transition-all"
                  >
                    <option value="">{t('selectPlaceholder')}</option>
                    {campaigns.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                  </select>
                  <Layers className="absolute left-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#1F3A3420]" />
                  <ChevronRight className="absolute right-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#1F3A3420] rotate-90" />
                </div>
                <div className="relative group/select">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440] mb-2 block px-1">Intelligence Profile</label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="w-full h-16 bg-[#1F3A3405] border border-transparent focus:border-[#1F3A3415] rounded-2xl px-14 appearance-none text-[#1F3A34] font-bold tracking-tight text-base cursor-pointer outline-none transition-all"
                  >
                    <option value="">Select Profile...</option>
                    {profiles.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
                  </select>
                  <Zap className="absolute left-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#1F3A3420]" />
                  <ChevronRight className="absolute right-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#1F3A3420] rotate-90" />
                </div>
              </div>

              {/* Meta Tags Input (Optional) */}
              <div className="space-y-4 pt-6 border-t border-[#1f3a3408]">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440] flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" /> {t('metaTags')}
                    {metaTags.length > 0 && (
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {metaTags.length} tag{metaTags.length !== 1 ? 's' : ''} added
                      </span>
                    )}
                  </label>
                  <span className="text-[9px] font-bold text-[#1F3A3430] uppercase tracking-wider">Comma-separated or Enter</span>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={t('metaTagsPlaceholder')}
                    className="w-full h-12 px-4 rounded-xl bg-[#1F3A3405] border border-transparent focus:border-[#1F3A3415] focus:bg-white text-[#1F3A34] font-medium transition-all outline-none placeholder:text-[#1F3A3430]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim();

                        if (value) {
                          // Split by comma and process each tag
                          const newTags = value
                            .split(',')
                            .map(tag => tag.trim().toLowerCase())
                            .filter(tag => tag && !metaTags.includes(tag));

                          if (newTags.length > 0) {
                            setMetaTags([...metaTags, ...newTags]);
                          }
                          input.value = '';
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // Also process on blur (when user clicks away)
                      const input = e.currentTarget;
                      const value = input.value.trim();

                      if (value) {
                        const newTags = value
                          .split(',')
                          .map(tag => tag.trim().toLowerCase())
                          .filter(tag => tag && !metaTags.includes(tag));

                        if (newTags.length > 0) {
                          setMetaTags([...metaTags, ...newTags]);
                        }
                        input.value = '';
                      }
                    }}
                  />

                  {/* Display Added Tags */}
                  {metaTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#1F3A3405] border border-[#1f3a3408]">
                      {metaTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold group hover:bg-blue-100 transition-all"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => setMetaTags(metaTags.filter((_, i) => i !== idx))}
                            className="w-4 h-4 rounded-full hover:bg-blue-200 flex items-center justify-center transition-all"
                            title="Remove tag"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Questions Input (Optional) */}
              <div className="space-y-4 pt-6 border-t border-[#1f3a3408]">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440] flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5" /> Custom Questions (Optional)
                  </label>
                  {customQuestions.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[9px] font-black">
                      {customQuestions.length} ADDED
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter your question and press Enter..."
                    className="w-full h-12 px-4 rounded-xl bg-[#1F3A3405] border border-transparent focus:border-[#1F3A3415] focus:bg-white text-[#1F3A34] font-medium transition-all outline-none placeholder:text-[#1F3A3430]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim();

                        if (value) {
                          setCustomQuestions([...customQuestions, { text: value, weight: 5 }]);
                          input.value = '';
                        }
                      }
                    }}
                  />

                  {/* Display Added Questions */}
                  {customQuestions.length > 0 && (
                    <div className="space-y-2 p-3 rounded-xl bg-[#1F3A3405] border border-[#1f3a3408]">
                      {customQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-[#1f3a3408] rounded-lg group hover:border-[#1F3A3420] transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1F3A34] truncate">{q.text}</p>
                            <p className="text-[10px] font-bold text-[#1F3A3440] uppercase tracking-wider mt-1">
                              Weight: {q.weight}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={q.weight}
                              onChange={(e) => {
                                const updated = [...customQuestions];
                                updated[idx].weight = parseInt(e.target.value) || 5;
                                setCustomQuestions(updated);
                              }}
                              className="w-14 h-8 px-2 rounded-lg bg-[#1F3A3405] border border-[#1f3a3408] text-[#1F3A34] font-bold text-xs text-center outline-none focus:border-[#1F3A3415] transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setCustomQuestions(customQuestions.filter((_, i) => i !== idx))}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 text-[#1F3A3420] hover:text-red-500 flex items-center justify-center transition-all"
                              title="Remove question"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={mode === "audio" ? handleUploadSubmit : handleTranscriptSubmit}
                disabled={isProcessing || !selectedCampaignId || !selectedProfileId}
                className="w-full h-16 bg-[#1F3A34] hover:bg-[#1F3A34E0] disabled:bg-[#1F3A3450] text-white rounded-[1.25rem] font-bold text-sm uppercase tracking-widest transition-all apple-shadow active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
              >
                <ArrowRight className="w-5 h-5 opacity-50" />
                {t('analyze')}
              </button>
            </div>
          )}

          {/* PROCESSING VIEW */}
          {isProcessing && (
            <div className="p-12 rounded-[2.5rem] bg-[#1F3A3405] border border-[#1f3a3408] animate-in zoom-in-95 duration-500">
              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-[2.5rem] border-4 border-[#1f3a3408] border-t-[#1F3A34] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[#1F3A34] fill-current animate-pulse delay-700" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-xl font-[850] text-[#1F3A34] tracking-tight uppercase">AI Signal Analysis</h4>
                  <p className="text-[#1F3A3440] text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                    {processingStatus === "uploading" ? "Broadcasting Signal..." : "Cognitive Engine Active..."}
                  </p>
                </div>
                <div className="w-full max-w-sm space-y-3">
                  {(["uploading", "transcribing", "done"] as const).map((key, i) => {
                    const isActive = processingStatus === key;
                    const isDone = (processingStatus === "transcribing" && key === "uploading") || (processingStatus === "idle");
                    const statusConfig = {
                      uploading: { t: "Signal Transport", s: "Secure tunnel transfer" },
                      transcribing: { t: "Neural Transcription", s: "Speech pattern resolution" },
                      done: { t: "Audit Generation", s: "Strategic intelligence map" }
                    };
                    const labels = statusConfig[key];

                    return (
                      <div key={key} className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500",
                        isActive ? "bg-white border-[#1f3a3410] apple-shadow scale-[1.02]" : "bg-transparent border-transparent opacity-30"
                      )}>
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                          isActive ? "bg-[#1F3A34] text-white shadow-lg shadow-[#1f3a3420]" : isDone ? "bg-green-500 text-white" : "bg-[#1f3a3410] text-[#1f3a3440]"
                        )}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-[10px] font-black uppercase tracking-wider text-[#1F3A34] leading-none mb-1">{labels.t}</p>
                          <p className="text-[9px] font-bold text-[#1F3A3440] tracking-tight">{labels.s}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SHARED RESULTS AREA */}
          {generatedTranscript && !isProcessing && (
            <div className="space-y-6 pt-10 border-t border-[#1f3a3410] animate-in slide-in-from-top-4 duration-700">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#1F3A3450]">Intelligence Extraction</h4>
                <div className="flex items-center gap-2">
                  <button onClick={downloadTranscript} className="flex items-center gap-1.5 px-3 py-1 bg-[#1F3A3408] hover:bg-[#1F3A3415] text-[#1F3A3480] text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"><Download className="w-3 h-3" /> Download</button>
                  <span className="text-[10px] uppercase font-black text-green-600 bg-green-500/10 px-2 py-1 rounded-full">Signal Locked</span>
                </div>
              </div>
              <textarea
                value={generatedTranscript}
                readOnly
                className="w-full min-h-[160px] p-8 rounded-[2rem] bg-[#F4F8F9] border border-[#1f3a3410] text-[#1F3A3480] text-base leading-relaxed italic font-medium apple-shadow outline-none"
              />
              {callAnalytics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { l: "Duration", v: `${callAnalytics.duration_seconds || 0}s` },
                    { l: "Silence", v: `${((callAnalytics.silence?.ratio || 0) * 100).toFixed(1)}%` },
                    { l: "Turns", v: String(callAnalytics.turn_count || 0) },
                    { l: "Diarization", v: `${callAnalytics.speakers?.length || 0} IDs` }
                  ].map((m) => (
                    <div key={m.l} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#1F3A3406] border border-[#1f3a3408]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3440]">{m.l}</span>
                      <span className="text-xl font-[850] text-[#1F3A34] tracking-tight">{m.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer / Status footer */}
      <div className="text-center">
        <p className="text-[10px] font-[850] text-[#1f3a3420] uppercase tracking-widest flex items-center justify-center gap-2">
          Encrypted Signal Tunnel <span className="w-1 h-1 rounded-full bg-[#1F3A3420]" /> Latency: 12ms
        </p>
      </div>
    </section>
  );
}

// Minimal placeholder ArrowRight for the button (not imported from lucide list above to keep it concise)
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
