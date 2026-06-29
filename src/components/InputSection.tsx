"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useApi } from "@/lib/useApi";
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
  Tag,
  HelpCircle,
  Plus
} from "lucide-react";
import { cn } from "../lib/utils";
import { BatchProgress } from "./BatchProgress";

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
  const { apiFetch } = useApi();
  const [mode, setMode] = useState<InputMode>("audio");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFiles, setAudioFiles] = useState<File[]>([]); // multi-file batch
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchName, setBatchName] = useState<string>("");
  const [batchIngestErrors, setBatchIngestErrors] = useState<Array<{ file_name: string; error: string }>>([]);
  const [manualTranscript, setManualTranscript] = useState("");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<"uploading" | "transcribing" | "idle" | "Transcription complete, analyzing..." | "Running QA evaluation..." | "Finalizing results...">("idle");
  const [generatedTranscript, setGeneratedTranscript] = useState("");
  const [callAnalytics, setCallAnalytics] = useState<CallAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedRedFlagIds, setSelectedRedFlagIds] = useState<string[]>([]);
  const [selectedRedFlagId, setSelectedRedFlagId] = useState<string>("");
  const [selectedOtherIds, setSelectedOtherIds] = useState<string[]>([]);
  const [isRedFlagOpen, setIsRedFlagOpen] = useState(false);
  const [isOtherOpen, setIsOtherOpen] = useState(false);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [metaTags, setMetaTags] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Array<{ text: string; weight: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Memoized splits — computed once when questionnaires change, not on every render
  const redFlagQuestionnaires = useMemo(() => questionnaires.filter(q => q.is_redflag === true), [questionnaires]);
  const standardQuestionnaires = useMemo(() => questionnaires.filter(q => q.is_redflag === false), [questionnaires]);

  // Stable callbacks — never recreated unless deps change
  const toggleRedFlagOpen = useCallback(() => setIsRedFlagOpen(v => !v), []);
  const toggleOtherOpen = useCallback(() => setIsOtherOpen(v => !v), []);
  const toggleCampaignOpen = useCallback(() => setIsCampaignOpen(v => !v), []);
  const toggleProfileOpen = useCallback(() => setIsProfileOpen(v => !v), []);

  const selectRedFlag = useCallback((qId: string) => {
    // Radio — toggle off if same, replace if different
    // Red flag is SEPARATE from selectedOtherIds — never added to questionnaire list
    setSelectedRedFlagId(prev => {
      const next = prev === qId ? "" : qId;
      setSelectedRedFlagIds(next ? [next] : []);
      return next;
    });
    setIsRedFlagOpen(false);
  }, []);

  const toggleOtherId = useCallback((qId: string, checked: boolean) => {
    setSelectedOtherIds(prev => checked ? [...prev, qId] : prev.filter(id => id !== qId));
  }, []);

  const selectCampaign = useCallback((cId: string) => {
    setSelectedCampaignId(cId);
    setIsCampaignOpen(false);
  }, []);

  const selectProfile = useCallback((pId: string) => {
    setSelectedProfileId(pId);
    setIsProfileOpen(false);
  }, []);

  const removeMetaTag = useCallback((i: number) => setMetaTags(prev => prev.filter((_, idx) => idx !== i)), []);
  const removeCustomQ = useCallback((i: number) => setCustomQuestions(prev => prev.filter((_, idx) => idx !== i)), []);

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Persistent click-outside listener — registered once, avoids add/remove thrashing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!document.getElementById('red-flag-dropdown')?.contains(target)) setIsRedFlagOpen(false);
      if (!document.getElementById('questionnaire-dropdown')?.contains(target)) setIsOtherOpen(false);
      if (!document.getElementById('campaign-dropdown')?.contains(target)) setIsCampaignOpen(false);
      if (!document.getElementById('profile-dropdown')?.contains(target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch all strategic contexts for selectors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campRes, profRes, questRes] = await Promise.all([
          apiFetch("/api/v1/campaigns/"),
          apiFetch("/api/v1/worker/profiles"),
          apiFetch("/api/v1/questionnaires/?skip=0&limit=100")
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
    }
    setMode(newMode);
    setIsProcessing(false);
  };

  const AUDIO_EXTENSIONS = /\.(mp3|m4a|wav|ogg|opus|flac|aac|wma|aiff|aif|webm|mpeg|mpga|mp4a|caf|amr|3gp|3g2)$/i;
  const isAudioFile = (f: File) =>
    f.type.startsWith("audio/") || f.type.startsWith("video/mpeg") || AUDIO_EXTENSIONS.test(f.name);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

  const isDuplicate = (file: File, existing: File[]) =>
    existing.some(f => f.name === file.name && f.size === file.size);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(isAudioFile);
    if (files.length === 0) return;

    const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setFileSizeError(`File${oversized.length > 1 ? 's' : ''} too large: ${oversized.map(f => `"${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)} MB)`).join(', ')}. Maximum allowed size is 100 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Deduplicate within the selection itself
    const seen = new Map<string, File>();
    files.forEach(f => seen.set(`${f.name}__${f.size}`, f));
    const unique = Array.from(seen.values());
    const dupeCount = files.length - unique.length;

    setFileSizeError(null);
    setFileError(dupeCount > 0 ? `${dupeCount} duplicate file${dupeCount > 1 ? 's' : ''} removed.` : null);
    setAudioFiles(unique);
    setAudioFile(unique[0]);
    setGeneratedTranscript("");
    setBatchId(null);
    setBatchIngestErrors([]);
  };

  const onAddMoreFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []).filter(isAudioFile);
    if (newFiles.length === 0) return;

    const oversized = newFiles.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setFileSizeError(`File${oversized.length > 1 ? 's' : ''} too large: ${oversized.map(f => `"${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)} MB)`).join(', ')}. Maximum allowed size is 100 MB.`);
      if (addMoreRef.current) addMoreRef.current.value = "";
      return;
    }

    setFileSizeError(null);
    setAudioFiles(prev => {
      const dupes = newFiles.filter(f => isDuplicate(f, prev));
      const fresh = newFiles.filter(f => !isDuplicate(f, prev));
      if (dupes.length > 0) {
        setFileError(`${dupes.length} duplicate file${dupes.length > 1 ? 's' : ''} skipped: ${dupes.map(f => `"${f.name}"`).join(', ')}.`);
      } else {
        setFileError(null);
      }
      if (fresh.length === 0) return prev;
      const combined = [...prev, ...fresh];
      setAudioFile(combined[0]);
      return combined;
    });
    if (addMoreRef.current) addMoreRef.current.value = "";
  };

  const pollForTranscript = async (callId: string) => {
    setProcessingStatus("transcribing");

    const poll = async () => {
      try {
        const response = await apiFetch(`/api/v1/calls/${callId}`, {
          method: "GET",
          headers: { "Accept": "application/json" },
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
          return true; // Stop polling
        }

        // Only stop polling when status is "ready" - full analysis complete
        if (data.status === "ready") {
          if (data.transcript?.utterances) {
            const formattedTranscript = data.transcript.utterances
              .map((u: any) => `Speaker ${u.speaker_id}: ${u.text}`)
              .join("\n");

            setGeneratedTranscript(formattedTranscript);
            if (onTranscriptReady) onTranscriptReady(formattedTranscript);
          }

          setIsProcessing(false);
          setProcessingStatus("idle");
          if (onAnalysisComplete) onAnalysisComplete(data);
          return true; // Stop polling - analysis complete
        }

        // Update status message for intermediate states
        if (data.status === "transcribed") {
          setProcessingStatus("Transcription complete, analyzing...");
        } else if (data.status === "evaluating") {
          setProcessingStatus("Running QA evaluation...");
        } else if (data.status === "postprocessing") {
          setProcessingStatus("Finalizing results...");
        }
        return false;
      } catch (err) {
        console.error("Polling error:", err);
        return false;
      }
    };

    // Clear any existing interval before starting a new one
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      const isDone = await poll();
      if (isDone && pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }, 30000);
  };

  const handleUploadSubmit = async () => {
    if (!audioFile || !selectedCampaignId) return;

    setIsProcessing(true);
    setProcessingStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("file", audioFile);
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

      // high_priority must also be included in questionnaire_template_ids array
      const allIds = Array.from(new Set([highPriorityValue, ...globalIds]));
      formData.append("high_priority_questionnaire_template_id", highPriorityValue);
      formData.append("questionnaire_template_ids", JSON.stringify(allIds));
      formData.append("language", "en");

      // New optional fields
      if (metaTags.length > 0) {
        formData.append("meta_tags", JSON.stringify(metaTags));
      }
      if (customQuestions.length > 0) {
        formData.append("custom_questions", JSON.stringify(customQuestions));
      }
      formData.append("scoring_method", selectedScoringMethod);

      const response = await apiFetch("/api/v1/calls/", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: formData,
      });

      if (!response.ok) throw new Error("Audio ingestion failed");

      const data = await response.json();
      console.log("Audio Analysis Queued:", data);

      if (data.call_id) {
        await pollForTranscript(data.call_id);
      } else {
        throw new Error("No call_id returned from audio ingestion");
      }
    } catch (error: any) {
      console.error("Audio API Error:", error);
      alert(error.message || "Failed to connect to the analysis engine. Please check your connection.");
      setIsProcessing(false);
      setProcessingStatus("idle");
    }
  };

  // ── Batch Upload Handler ──────────────────────────────────
  const handleBatchUploadSubmit = async () => {
    if (audioFiles.length === 0 || !selectedCampaignId) return;

    setIsProcessing(true);
    setProcessingStatus("uploading");
    setBatchIngestErrors([]);

    try {
      const formData = new FormData();
      audioFiles.forEach(f => formData.append("files", f));
      formData.append("campaign_id", selectedCampaignId);
      formData.append("processing_profile_id", selectedProfileId);

      const selectedCampaign = campaigns.find(c => (c.id === selectedCampaignId || c._id === selectedCampaignId));
      const campaignTemplateId = selectedCampaign?.questionnaire_template_id;
      const globalIds = Array.from(new Set([...(campaignTemplateId ? [campaignTemplateId] : []), ...selectedOtherIds]));
      const highPriorityValue = selectedRedFlagIds.length > 0
        ? (selectedRedFlagIds.length > 1 ? JSON.stringify(selectedRedFlagIds) : selectedRedFlagIds[0])
        : (campaignTemplateId || globalIds[0]);

      if (!highPriorityValue) throw new Error("Misconfiguration: No audit frameworks selected.");

      // high_priority must also be included in questionnaire_template_ids array
      const allIds = Array.from(new Set([highPriorityValue, ...globalIds]));
      formData.append("high_priority_questionnaire_template_id", highPriorityValue);
      formData.append("questionnaire_template_ids", JSON.stringify(allIds));
      formData.append("language", "en");
      if (batchName.trim()) formData.append("name", batchName.trim());
      if (metaTags.length > 0) formData.append("meta_tags", JSON.stringify(metaTags));
      if (customQuestions.length > 0) formData.append("custom_questions", JSON.stringify(customQuestions));
      formData.append("scoring_method", selectedScoringMethod);

      const response = await apiFetch("/api/v1/batches/", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: formData,
      });

      if (!response.ok) throw new Error("Batch ingestion failed");

      const data = await response.json();
      console.log("Batch Queued:", data);

      if (data.errors?.length > 0) setBatchIngestErrors(data.errors);
      if (data.batch_id) setBatchId(data.batch_id);

      setIsProcessing(false);
      setProcessingStatus("idle");
    } catch (error: any) {
      console.error("Batch API Error:", error);
      alert(error.message || "Failed to submit batch. Please check your connection.");
      setIsProcessing(false);
      setProcessingStatus("idle");
    }
  };

  const [selectedScoringMethod, setSelectedScoringMethod] = useState<"v4" | "v5">("v4");
  const [showManualSuccess, setShowManualSuccess] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const handleTranscriptSubmit = async () => {
    if ((!manualTranscript.trim() && !manualFile) || !selectedCampaignId) return;

    setIsProcessing(true);
    setProcessingStatus("uploading");

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

      // high_priority must also be included in questionnaire_template_ids array
      const allIds = Array.from(new Set([highPriorityValue, ...globalIds]));
      formData.append("high_priority_questionnaire_template_id", highPriorityValue);
      formData.append("questionnaire_template_ids", JSON.stringify(allIds));
      formData.append("language", "en");

      // New optional fields
      if (metaTags.length > 0) {
        formData.append("meta_tags", JSON.stringify(metaTags));
      }
      if (customQuestions.length > 0) {
        formData.append("custom_questions", JSON.stringify(customQuestions));
      }
      formData.append("scoring_method", selectedScoringMethod);

      const response = await apiFetch("/api/v1/ingest/manual", {
        method: "POST",
        headers: { "Accept": "application/json" },
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
    setAudioFiles([]);
    setManualFile(null);
    setManualTranscript("");
    setGeneratedTranscript("");
    setCallAnalytics(null);
    setBatchId(null);
    setBatchIngestErrors([]);
    setFileSizeError(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section className="max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-150 duration-150">
      {/* Header & Subtext */}
      <div className="flex flex-col gap-2 items-center text-center px-4">
        <h3 className="text-3xl font-[850] text-[#F6FAFD] tracking-tight">{t('signalInput')}</h3>
        <p className="text-[#B3CFE5] text-sm font-semibold max-w-sm">{t('provideData')}</p>
      </div>

      {/* Mode Toggle Tabs */}
      <div className="flex justify-center">
        <div className="flex p-1.5 bg-[#1A3D63]/30 rounded-2xl border border-blue-400/10 w-full max-w-[400px]">
          <button
            onClick={() => handleModeChange("audio")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-extrabold transition-colors",
              mode === "audio"
                ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] apple-shadow glow"
                : "text-[#B3CFE5] hover:text-[#F6FAFD]"
            )}
            title="Switch to audio upload mode"
          >
            <FileAudio className="w-4 h-4 opacity-70" />
            {t('uploadAudio')}
          </button>
          <button
            onClick={() => handleModeChange("transcript")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-extrabold transition-colors",
              mode === "transcript"
                ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] apple-shadow glow"
                : "text-[#B3CFE5] hover:text-[#F6FAFD]"
            )}
            title="Switch to manual transcript entry mode"
          >
            <FileText className="w-4 h-4 opacity-70" />
            {t('manualEntry')}
          </button>
        </div>
      </div>

      {/* Input Content Area */}
      <div className="glass-blur apple-blur bg-blue-950/18 p-8 md:p-12 rounded-[40px] apple-shadow border border-blue-400/15">
        <div className="space-y-10">
          {mode === "audio" ? (
            <div className="space-y-8">
              {/* Drop zone */}
              {audioFiles.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group w-full aspect-video md:aspect-[3/1] border-2 border-dashed border-blue-400/15 hover:border-[#4A7FA7] rounded-[2.5rem] flex flex-col items-center justify-center gap-6 cursor-pointer transition-colors hover:bg-[#1A3D63]/30"
                >
                  <div className="w-16 h-16 rounded-[2rem] bg-blue-950/18 group-hover:bg-[#4A7FA7] group-hover:scale-110 transition-colors flex items-center justify-center glow">
                    <Upload className="w-7 h-7 text-[#B3CFE5] group-hover:text-[#F6FAFD] transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-[#F6FAFD] group-hover:translate-y-[-2px] transition-transform">{t('uploadSignalFile')}</p>
                    <p className="text-xs font-bold text-[#B3CFE5] uppercase tracking-widest mt-1.5">
                      MP3, M4A, WAV, FLAC, AAC, OGG and more · Max 100 MB · Select multiple for batch
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept="audio/*,.mp3,.m4a,.wav,.ogg,.opus,.flac,.aac,.wma,.aiff,.aif,.webm,.mpeg,.mpga,.caf,.amr,.3gp,.3g2"
                    multiple
                    className="hidden"
                  />
                </div>
              ) : (
                /* File list view — 1 or more files */
                <div className="space-y-3 animate-in fade-in duration-150 duration-150">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#4A7FA7] flex items-center justify-center glow">
                        <FileAudio className="w-5 h-5 text-[#F6FAFD]" />
                      </div>
                      <div>
                        <p className="font-extrabold text-[#F6FAFD]">
                          {audioFiles.length === 1 ? audioFiles[0].name : `${audioFiles.length} files selected`}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] mt-0.5">
                          {(audioFiles.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(2)} MB total
                          {audioFiles.length > 1 ? ' · Batch Mode' : ' · Ready to process'}
                        </p>
                      </div>
                    </div>
                    {!isProcessing && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addMoreRef.current?.click()}
                          className="p-2 hover:bg-blue-500/20 text-[#B3CFE5] hover:text-[#4A7FA7] rounded-xl transition-colors"
                          title="Add more files"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <input
                          type="file"
                          ref={addMoreRef}
                          onChange={onAddMoreFiles}
                          accept="audio/*,.mp3,.m4a,.wav,.ogg,.opus,.flac,.aac,.wma,.aiff,.aif,.webm,.mpeg,.mpga,.caf,.amr,.3gp,.3g2"
                          multiple
                          className="hidden"
                        />
                        <button onClick={removeFile} className="p-2 hover:bg-red-500/20 text-[#B3CFE5] hover:text-red-400 rounded-xl transition-colors" title="Remove all files">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Batch name input — only for multiple files */}
                  {audioFiles.length > 1 && <input
                    type="text"
                    value={batchName}
                    onChange={e => setBatchName(e.target.value)}
                    placeholder="Batch name (optional, e.g. June Campaign Calls)"
                    className="w-full h-10 px-4 rounded-xl glass text-[#F6FAFD] text-sm font-medium outline-none focus:border-[#4A7FA7] transition-colors placeholder:text-[#B3CFE5]/40"
                  />}
                  {/* File list — only show for multiple files */}
                  {audioFiles.length > 1 && <div className="max-h-52 overflow-y-auto space-y-1.5 rounded-2xl bg-black/18 p-3 border border-blue-400/10">
                    {audioFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl glass group hover:border-blue-400/22 transition-colors">
                        <FileAudio className="w-3.5 h-3.5 text-[#4A7FA7] shrink-0" />
                        <span className="text-xs font-medium text-[#F6FAFD] truncate flex-1">{f.name}</span>
                        <span className="text-[10px] text-[#B3CFE5] shrink-0 mr-1">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                        <button
                          onClick={() => setAudioFiles(audioFiles.filter((_, idx) => idx !== i))}
                          className="w-5 h-5 rounded-md hover:bg-red-500/30 flex items-center justify-center text-[#B3CFE5]/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          title={`Remove ${f.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>}
                </div>
              )}

              {/* File size error */}
              {fileSizeError && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 animate-in fade-in duration-150">
                  <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-red-300 leading-snug">{fileSizeError}</p>
                </div>
              )}

              {/* Duplicate file warning */}
              {fileError && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-in fade-in duration-150">
                  <X className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-amber-300 leading-snug">{fileError}</p>
                </div>
              )}

              {/* Batch progress tracker */}
              {batchId && (
                <BatchProgress
                  batchId={batchId}
                  batchName={batchName || undefined}
                  initialErrors={batchIngestErrors}
                  onClose={() => { setBatchId(null); setBatchIngestErrors([]); }}
                />
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-150 duration-150">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#F6FAFD] flex items-center gap-2">
                    <FileText className="w-4 h-4" /> {t('bypassedInput')}
                  </h4>
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-950/18 hover:bg-[#4A7FA7] text-[#B3CFE5] hover:text-[#F6FAFD] text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors cursor-pointer" title="Upload transcript document file (TXT, PDF, DOCX)">
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
                  className="w-full h-48 p-8 rounded-[2.5rem] bg-blue-950/18 border border-transparent focus:border-blue-400/15 focus:bg-[#1A3D63]/50 focus:apple-shadow transition-colors text-base font-medium leading-relaxed resize-none text-[#F6FAFD] outline-none placeholder:text-[#B3CFE5]"
                />
              </div>
            </div>
          )}

          {/* SHARED STRATEGIC CONTEXT GRID */}
          {(audioFiles.length > 0 || manualTranscript.trim() || manualFile) && !isProcessing && !batchId && (
            <div className="space-y-8 pt-10 border-t border-blue-400/10 animate-in slide-in-from-top-8 duration-150">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#F6FAFD] flex items-center gap-2">
                  <Target className="w-4 h-4" /> Strategic Context
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-green-600 bg-green-500/20 px-2 py-1 rounded-md border border-green-500/30 uppercase tracking-widest animate-pulse">Neural Ready</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-blue-400/10">
                {/* Red Flag Single-Select */}
                <div id="red-flag-dropdown" className="relative group/select">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400/80">Risk / High Priority</label>
                    {submitAttempted && selectedRedFlagIds.length === 0 && (
                      <span className="text-[10px] font-bold text-red-400 animate-in fade-in duration-150">Required</span>
                    )}
                  </div>
                  <div
                    onClick={toggleRedFlagOpen}
                    className={cn(
                      "w-full h-16 bg-red-500/10 border rounded-2xl px-14 flex items-center cursor-pointer transition-colors hover:bg-red-500/15",
                      isRedFlagOpen && "border-red-500/30 bg-[#502D55]/50 shadow-lg",
                      submitAttempted && selectedRedFlagIds.length === 0 && !isRedFlagOpen ? "border-red-500/70" : "border-transparent"
                    )}
                  >
                    <span className={cn("font-bold tracking-tight text-base truncate", selectedRedFlagId ? "text-red-400" : "text-[#F8F4E9]")}>
                      {!selectedRedFlagId ? "Identify Red Flags..." : questionnaires.find(q => (q.id || q._id) === selectedRedFlagId)?.name || "Red Flag Selected"}
                    </span>
                  </div>
                  <ShieldAlert className={cn("absolute left-5 top-[65%] -translate-y-1/2 w-5 h-5 transition-colors", selectedRedFlagId ? "text-red-400" : "text-[#F8F4E9]")} />
                  <ChevronRight className={cn("absolute right-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#F8F4E9] transition-transform", isRedFlagOpen ? "-rotate-90 text-red-400" : "rotate-90")} />

                  {isRedFlagOpen && (
                    <div className="absolute top-[105%] left-0 right-0 bg-[#502D55]/95 border border-red-500/30 rounded-2xl p-4 z-[60] space-y-1.5 animate-in fade-in duration-150 lg:max-h-[300px] overflow-y-auto">
                      {/* None / Deselect option */}
                      {selectedRedFlagId && (
                        <div
                          onClick={() => selectRedFlag(selectedRedFlagId)}
                          className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer hover:bg-red-500/10 text-[#F8F4E9]/50 border border-dashed border-red-500/20 mb-1"
                        >
                          <X className="w-4 h-4 text-red-400/60 shrink-0" />
                          <span className="text-xs font-bold">Clear selection</span>
                        </div>
                      )}
                      {redFlagQuestionnaires.map(q => {
                        const qId = q.id || q._id;
                        const isSelected = selectedRedFlagId === qId;
                        return (
                          <div
                            key={`rf-${qId}`}
                            onClick={() => selectRedFlag(qId)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer",
                              isSelected ? "bg-red-500/30 text-[#F8F4E9]" : "hover:bg-red-500/20 text-[#F8F4E9]"
                            )}
                          >
                            {/* Radio circle */}
                            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0", isSelected ? "border-red-400 bg-red-500" : "border-red-400/60")}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span className="text-sm font-bold">{q.name}</span>
                          </div>
                        );
                      })}
                      {redFlagQuestionnaires.length === 0 && (
                        <div className="text-center py-4 text-[#935073]/50 text-xs">
                          No red flag questionnaires available
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Standard Audit Multi-Select */}
                <div id="questionnaire-dropdown" className="relative group/select">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F8F4E9]/80 mb-2 block px-1">Questionaire</label>
                  <div
                    onClick={toggleOtherOpen}
                    className={cn(
                      "w-full h-16 bg-[#2A4A5E]/60 border border-transparent rounded-2xl px-14 flex items-center cursor-pointer transition-colors hover:bg-[#2A4A5E]/80",
                      isOtherOpen && "border-[#5A8FB4]/40 bg-[#2A4A5E]/70 shadow-lg"
                    )}
                  >
                    <span className="font-bold tracking-tight text-base truncate text-[#F8F4E9]">
                      {selectedOtherIds.length === 0 ? "Select Questionaire..." : `${selectedOtherIds.length} Questionaires Selected`}
                    </span>
                  </div>
                  <FileSearch className="absolute left-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#F8F4E9]" />
                  <ChevronRight className={cn("absolute right-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#F8F4E9] transition-transform", isOtherOpen && "-rotate-90")} />

                  {isOtherOpen && (
                    <div className="absolute top-[105%] left-0 right-0 bg-[#2A4A5E]/95 border border-[#5A8FB4]/40 rounded-2xl shadow-2xl p-4 z-50 space-y-1.5 animate-in fade-in duration-150 duration-150 lg:max-h-[300px] overflow-y-auto">
                      {standardQuestionnaires.map(q => {
                        const qId = q.id || q._id;
                        const isChecked = selectedOtherIds.includes(qId);
                        return (
                          <label key={`oa-${qId}`} className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer hover:bg-[#5A8FB4]/20">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => toggleOtherId(qId, e.target.checked)}
                              className="w-4 h-4 rounded-md border-[#5A8FB4] text-[#5A8FB4] focus:ring-[#5A8FB4]"
                            />
                            <span className="text-sm font-bold text-[#F8F4E9]">{q.name}</span>
                          </label>
                        );
                      })}
                      {standardQuestionnaires.length === 0 && (
                        <div className="text-center py-4 text-[#5A8FB4]/50 text-xs">
                          No questionnaires available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Campaign Dropdown */}
                <div id="campaign-dropdown" className="relative group/select">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F8F4E9]/80 mb-2 block px-1">Campaign Name</label>
                  <div
                    onClick={toggleCampaignOpen}
                    className={cn(
                      "w-full h-16 bg-[#2A4A5E]/60 border border-transparent rounded-2xl px-14 flex items-center cursor-pointer transition-colors hover:bg-[#2A4A5E]/80",
                      isCampaignOpen && "border-[#5A8FB4]/40 bg-[#2A4A5E]/70 shadow-lg"
                    )}
                  >
                    <span className="font-bold tracking-tight text-base truncate text-[#F8F4E9]">
                      {!selectedCampaignId ? t('selectPlaceholder') : campaigns.find(c => (c.id || c._id) === selectedCampaignId)?.name || "Campaign Selected"}
                    </span>
                  </div>
                  <Layers className="absolute left-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#F8F4E9]" />
                  <ChevronRight className={cn("absolute right-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#F8F4E9] transition-transform", isCampaignOpen && "-rotate-90")} />

                  {isCampaignOpen && (
                    <div className="absolute top-[105%] left-0 right-0 bg-[#2A4A5E]/95 border border-[#5A8FB4]/40 rounded-2xl shadow-2xl p-4 z-50 space-y-1.5 animate-in fade-in duration-150 duration-150 lg:max-h-[300px] overflow-y-auto">
                      {campaigns.map(c => {
                        const cId = c.id || c._id;
                        const isSelected = selectedCampaignId === cId;
                        return (
                          <div
                            key={cId}
                            onClick={() => selectCampaign(cId)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer",
                              isSelected ? "bg-[#5A8FB4]/30 text-[#F8F4E9]" : "hover:bg-[#5A8FB4]/20 text-[#F8F4E9]"
                            )}
                          >
                            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", isSelected ? "border-[#5A8FB4] bg-[#5A8FB4]" : "border-[#5A8FB4]")}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span className="text-sm font-bold">{c.name}</span>
                          </div>
                        );
                      })}
                      {campaigns.length === 0 && (
                        <div className="text-center py-4 text-[#5A8FB4]/50 text-xs">
                          No campaigns available
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div id="profile-dropdown" className="relative group/select">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F8F4E9]/80 mb-2 block px-1">Intelligence Profile</label>
                  <div
                    onClick={toggleProfileOpen}
                    className={cn(
                      "w-full h-16 bg-[#2A4A5E]/60 border border-transparent rounded-2xl px-14 flex items-center cursor-pointer transition-colors hover:bg-[#2A4A5E]/80",
                      isProfileOpen && "border-[#5A8FB4]/40 bg-[#2A4A5E]/70 shadow-lg"
                    )}
                  >
                    <span className="font-bold tracking-tight text-base truncate text-[#F8F4E9]">
                      {!selectedProfileId ? "Select Profile..." : profiles.find(p => (p.id || p._id) === selectedProfileId)?.name || "Profile Selected"}
                    </span>
                  </div>
                  <Zap className="absolute left-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#F8F4E9]" />
                  <ChevronRight className={cn("absolute right-5 top-[65%] -translate-y-1/2 w-5 h-5 text-[#F8F4E9] transition-transform", isProfileOpen && "-rotate-90")} />

                  {isProfileOpen && (
                    <div className="absolute top-[105%] left-0 right-0 bg-[#2A4A5E]/95 border border-[#5A8FB4]/40 rounded-2xl shadow-2xl p-4 z-50 space-y-1.5 animate-in fade-in duration-150 duration-150 lg:max-h-[300px] overflow-y-auto">
                      {profiles.map(p => {
                        const pId = p.id || p._id;
                        const isSelected = selectedProfileId === pId;
                        return (
                          <div
                            key={pId}
                            onClick={() => selectProfile(pId)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer",
                              isSelected ? "bg-[#5A8FB4]/30 text-[#F8F4E9]" : "hover:bg-[#5A8FB4]/20 text-[#F8F4E9]"
                            )}
                          >
                            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", isSelected ? "border-[#5A8FB4] bg-[#5A8FB4]" : "border-[#5A8FB4]")}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span className="text-sm font-bold">{p.name}</span>
                          </div>
                        );
                      })}
                      {profiles.length === 0 && (
                        <div className="text-center py-4 text-[#5A8FB4]/50 text-xs">
                          No profiles available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Meta Tags Input (Optional) */}
              <div className="space-y-4 pt-6 border-t border-blue-400/10">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5] flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" /> {t('metaTags')}
                    {metaTags.length > 0 && (
                      <span className="text-[9px] font-black text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-400/30">
                        {metaTags.length} tag{metaTags.length !== 1 ? 's' : ''} added
                      </span>
                    )}
                  </label>
                  <span className="text-[9px] font-bold text-[#B3CFE5] uppercase tracking-wider">Comma-separated or Enter</span>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={t('metaTagsPlaceholder')}
                    className="w-full h-12 px-4 rounded-xl bg-blue-950/18 border border-transparent focus:border-blue-400/15 focus:bg-[#1A3D63]/50 text-[#F6FAFD] font-medium transition-colors outline-none placeholder:text-[#B3CFE5]"
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
                    <div className="flex flex-wrap gap-2 p-3 rounded-xl glass">
                      {metaTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-lg text-xs font-bold group hover:bg-blue-500/30 transition-colors"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeMetaTag(idx)}
                            className="w-4 h-4 rounded-full hover:bg-blue-400/40 flex items-center justify-center transition-colors"
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
              <div className="space-y-4 pt-6 border-t border-blue-400/10">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5] flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5" /> Custom Questions (Optional)
                  </label>
                  {customQuestions.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-md text-[9px] font-black">
                      {customQuestions.length} ADDED
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter your question and press Enter..."
                    className="w-full h-12 px-4 rounded-xl bg-blue-950/18 border border-transparent focus:border-blue-400/15 focus:bg-[#1A3D63]/50 text-[#F6FAFD] font-medium transition-colors outline-none placeholder:text-[#B3CFE5]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim();

                        if (value) {
                          setCustomQuestions([...customQuestions, { text: value, weight: 0 }]);
                          input.value = '';
                        }
                      }
                    }}
                  />

                  {/* Display Added Questions */}
                  {customQuestions.length > 0 && (
                    <div className="space-y-2 p-3 rounded-xl glass">
                      {customQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 px-4 py-3 bg-[#1A3D63]/50 border border-blue-400/10 rounded-lg group hover:border-blue-400/22 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#F6FAFD] truncate">{q.text}</p>
                            <p className="text-[10px] font-bold text-[#B3CFE5] uppercase tracking-wider mt-1">
                              Weight: {q.weight}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={q.weight}
                              onChange={(e) => {
                                const updated = [...customQuestions];
                                updated[idx].weight = parseInt(e.target.value) || 0;
                                setCustomQuestions(updated);
                              }}
                              className="w-18 h-8 px-2 rounded-lg bg-blue-950/25 border border-blue-400/10 text-[#F6FAFD] font-bold text-xs text-center outline-none focus:border-blue-400/22 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => removeCustomQ(idx)}
                              className="w-7 h-7 rounded-lg hover:bg-red-500/20 text-[#B3CFE5] hover:text-red-400 flex items-center justify-center transition-colors"
                              title="Remove custom question"
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

              {/* Scoring Method Toggle */}
              <div className="flex items-center justify-between px-1 pt-4 border-t border-blue-400/10">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Scoring Method</label>
                <div className="flex p-1 bg-[#1A3D63]/40 rounded-xl border border-blue-400/10">
                  {(["v4", "v5"] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setSelectedScoringMethod(v)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors",
                        selectedScoringMethod === v
                          ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] shadow-sm"
                          : "text-[#B3CFE5] hover:text-[#F6FAFD]"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setSubmitAttempted(true);
                  if (selectedRedFlagIds.length === 0) return;
                  if (mode === "audio") {
                    audioFiles.length > 1 ? handleBatchUploadSubmit() : handleUploadSubmit();
                  } else {
                    handleTranscriptSubmit();
                  }
                }}

                disabled={isProcessing || !selectedCampaignId || !selectedProfileId}
                className="w-full h-16 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] hover:from-[#4A7FA7]/90 hover:to-[#1A3D63]/90 disabled:bg-[#1A3D63]/50 text-[#F6FAFD] rounded-[1.25rem] font-bold text-sm uppercase tracking-widest transition-colors apple-shadow active:scale-[0.98] flex items-center justify-center gap-3 mt-4 glow"
                title="Submit for AI analysis"
              >
                <ArrowRight className="w-5 h-5 opacity-50" />
                {t('analyze')}
              </button>
            </div>
          )}

          {/* PROCESSING VIEW */}
          {isProcessing && (
            <div className="p-12 rounded-[2.5rem] glass animate-in fade-in duration-150 duration-150">
              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-[2.5rem] border-4 border-blue-400/10 border-t-[#4A7FA7] animate-spin glow" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[#4A7FA7] fill-current animate-pulse delay-700" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-xl font-[850] text-[#F6FAFD] tracking-tight uppercase">AI Signal Analysis</h4>
                  <p className="text-[#B3CFE5] text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
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
                        "flex items-center gap-4 p-4 rounded-2xl border transition-colors duration-150",
                        isActive ? "bg-[#1A3D63]/50 border-blue-400/15 apple-shadow scale-[1.02]" : "bg-transparent border-transparent opacity-30"
                      )}>
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                          isActive ? "bg-[#4A7FA7] text-[#F6FAFD] shadow-lg shadow-[#4A7FA7]/20 glow" : isDone ? "bg-green-500 text-[#F6FAFD]" : "bg-[#4A7FA7]/20 text-[#B3CFE5]"
                        )}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-[10px] font-black uppercase tracking-wider text-[#F6FAFD] leading-none mb-1">{labels.t}</p>
                          <p className="text-[9px] font-bold text-[#B3CFE5] tracking-tight">{labels.s}</p>
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
            <div className="space-y-6 pt-10 border-t border-blue-400/15 animate-in slide-in-from-top-4 duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#B3CFE5]">Intelligence Extraction</h4>
                <div className="flex items-center gap-2">
                  <button onClick={downloadTranscript} className="flex items-center gap-1.5 px-3 py-1 bg-blue-950/18 hover:bg-[#4A7FA7] text-[#B3CFE5] hover:text-[#F6FAFD] text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors" title="Download transcript as text file"><Download className="w-3 h-3" /> Download</button>
                  <span className="text-[10px] uppercase font-black text-green-400 bg-green-500/20 px-2 py-1 rounded-full border border-green-400/30">Signal Locked</span>
                </div>
              </div>
              <textarea
                value={generatedTranscript}
                readOnly
                className="w-full min-h-[160px] p-8 rounded-[2rem] glass text-[#B3CFE5] text-base leading-relaxed italic font-medium apple-shadow outline-none"
              />
              {callAnalytics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { l: "Duration", v: `${callAnalytics.duration_seconds || 0}s` },
                    { l: "Silence", v: `${((callAnalytics.silence?.ratio || 0) * 100).toFixed(1)}%` },
                    { l: "Turns", v: String(callAnalytics.turn_count || 0) },
                    { l: "Diarization", v: `${callAnalytics.speakers?.length || 0} IDs` }
                  ].map((m) => (
                    <div key={m.l} className="flex flex-col items-center justify-center p-4 rounded-2xl glass">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">{m.l}</span>
                      <span className="text-xl font-[850] text-[#F6FAFD] tracking-tight">{m.v}</span>
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
        <p className="text-[10px] font-[850] text-[#B3CFE5] uppercase tracking-widest flex items-center justify-center gap-2">
          Encrypted Signal Tunnel <span className="w-1 h-1 rounded-full bg-[#4A7FA7]" /> Latency: 12ms
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
