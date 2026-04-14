"use client";

import { useState, useRef } from "react";
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
  FileUp
} from "lucide-react";
import { cn } from "../lib/utils";

type InputMode = "audio" | "transcript";

type CallAnalytics = {
  silence: { total_duration_ms: number; ratio: number; longest_gap_ms: number; gap_count: number };
  speakers: { speaker_id: string; talk_time_ms: number; turn_count: number; talk_ratio: number }[];
  total_talk_time_ms: number;
  turn_count: number;
  duration_seconds?: number;
};

export function InputSection({ onTranscriptReady }: { onTranscriptReady?: (transcript: string) => void }) {
  const [mode, setMode] = useState<InputMode>("audio");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [manualTranscript, setManualTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<"uploading" | "transcribing" | "idle">("idle");
  const [generatedTranscript, setGeneratedTranscript] = useState("");
  const [callAnalytics, setCallAnalytics] = useState<CallAnalytics | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://daughterlike-eddy-unmental.ngrok-free.dev";
        const response = await fetch(`${baseUrl}/api/v1/calls/${callId}`, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });
        if (!response.ok) return;

        const data = await response.json();

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
          if (data.analytics) {
            setCallAnalytics({
              ...data.analytics,
              duration_seconds: data.transcript.duration_seconds,
            });
          }
          if (onTranscriptReady) onTranscriptReady(formattedTranscript);
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
    }, 30000);
  };

  const handleUploadSubmit = async () => {
    if (!audioFile) return;
    setIsProcessing(true);
    setProcessingStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("file", audioFile);

      // Hardcoded values from provided API spec
      formData.append("campaign_id", "e7d412fc-8608-4e31-b24f-0503a324f007");
      formData.append("questionnaire_template_id", "84fd5501-5826-46ea-a16d-94ce2eeedb7c");
      formData.append("processing_profile_id", "538a81e1-65ce-4309-aef9-0dde84d3e727");
      formData.append("language", "en");

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://daughterlike-eddy-unmental.ngrok-free.dev";
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
    } catch (error) {
      console.error("API Error:", error);
      alert("Failed to connect to the analysis engine. Please check your connection.");
      setIsProcessing(false);
      setProcessingStatus("idle");
    }
  };

  const [showManualSuccess, setShowManualSuccess] = useState(false);

  const handleTranscriptSubmit = () => {
    if (!manualTranscript.trim()) return;
    setShowManualSuccess(true);
    if (onTranscriptReady) onTranscriptReady(manualTranscript);
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
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setManualTranscript(content);
        setShowManualSuccess(false); // Reset success if new file uploaded
      };
      reader.readAsText(file);
    }
  };

  const removeFile = () => {
    setAudioFile(null);
    setGeneratedTranscript("");
    setCallAnalytics(null);
    setProcessingError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section className="max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header & Subtext */}
      <div className="flex flex-col gap-2 items-center text-center px-4">
        <h3 className="text-3xl font-[850] text-[#1F3A34] tracking-tight">Signal Input</h3>
        <p className="text-[#1F3A3450] text-sm font-semibold max-w-sm">Provide your conversation data for deep intelligence analysis.</p>
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
            Audio Upload
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
            Manual Entry
          </button>
        </div>
      </div>

      {/* Input Content Area */}
      <div className="glass-blur apple-blur bg-white p-8 md:p-12 rounded-[40px] apple-shadow border border-[#1f3a3405]">
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
                  <p className="text-lg font-extrabold text-[#1F3A34] group-hover:translate-y-[-2px] transition-transform">Upload Signal File</p>
                  <p className="text-xs font-bold text-[#1F3A3440] uppercase tracking-widest mt-1.5">MP3, WAV, M4A up to 50MB</p>
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
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                {/* Selected File Card */}
                <div className="flex items-center gap-6 p-6 rounded-3xl bg-[#1F3A3408] border border-[#1f3a3405]">
                  <div className="w-14 h-14 rounded-2xl bg-[#1F3A34] flex items-center justify-center shadow-lg shadow-[#1F3A3420]">
                    <FileAudio className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-[850] text-[#1F3A34] truncate">{audioFile.name}</p>
                    <p className="text-[11px] font-bold text-[#1F3A3440] uppercase tracking-widest mt-1">{(audioFile.size / 1024 / 1024).toFixed(2)} MB • Ready to Process</p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-3 text-[#1F3A3440] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Submit/Process Button / Loading State / Error State */}
                {processingError ? (
                  <div className="w-full p-5 rounded-[1.25rem] bg-red-500/8 border border-red-500/20 flex items-start gap-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                      <X className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-red-600">Transcription Failed</p>
                      <p className="text-xs text-red-500/80 mt-1 font-medium leading-relaxed">{processingError}</p>
                    </div>
                    <button
                      onClick={() => setProcessingError(null)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ) : isProcessing ? (
                  /* ── Premium loading card ── */
                  <div className="w-full rounded-[1.5rem] bg-[#1F3A34] overflow-hidden shadow-2xl shadow-[#1F3A3430] animate-in fade-in zoom-in-95 duration-500">
                    {/* Animated shimmer bar */}
                    <div className="h-1 w-full bg-white/10 relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.6s_ease-in-out_infinite]" />
                    </div>

                    <div className="p-7 space-y-6">
                      {/* Title row */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-11 h-11 shrink-0">
                          <div className="absolute inset-0 rounded-2xl bg-white/10 animate-ping" />
                          <div className="relative w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        </div>
                        <div>
                          <p className="text-white font-[850] text-base tracking-tight">
                            {processingStatus === "uploading" ? "Uploading Signal" : "AI Transcription Engine"}
                          </p>
                          <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-0.5 animate-pulse">
                            {processingStatus === "uploading" ? "Sending audio to server..." : "Parsing speech patterns..."}
                          </p>
                        </div>
                      </div>

                      {/* Step indicators */}
                      <div className="space-y-3">
                        {[
                          { key: "uploading", label: "Upload Signal", sub: "Secure transfer to analysis cluster" },
                          { key: "transcribing", label: "Speech Recognition", sub: "Neural model processing audio" },
                          { key: "done", label: "Analytics Generation", sub: "Speaker diarization & metrics" },
                        ].map((step, i) => {
                          const order = ["uploading", "transcribing", "done"];
                          const currentIdx = processingStatus === "uploading" ? 0 : processingStatus === "transcribing" ? 1 : 2;
                          const stepIdx = i;
                          const isDone = stepIdx < currentIdx;
                          const isActive = stepIdx === currentIdx;
                          return (
                            <div key={step.key} className="flex items-center gap-4">
                              <div className={cn(
                                "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500",
                                isDone ? "bg-green-400" : isActive ? "bg-white/20" : "bg-white/8"
                              )}>
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : isActive ? (
                                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-white/20" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn("text-sm font-bold transition-colors", isActive ? "text-white" : isDone ? "text-white/70" : "text-white/30")}>{step.label}</p>
                                <p className={cn("text-[10px] font-semibold transition-colors", isActive ? "text-white/50 animate-pulse" : isDone ? "text-white/40" : "text-white/15")}>{step.sub}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleUploadSubmit}
                    disabled={isProcessing}
                    className="w-full h-16 rounded-[1.25rem] bg-[#1F3A34] hover:bg-[#1F3A34E0] disabled:bg-[#1F3A3450] text-white text-base font-extrabold shadow-xl shadow-[#1F3A3420] transition-all flex items-center justify-center gap-3 overflow-hidden relative group"
                  >
                    {generatedTranscript ? (
                      <><CheckCircle2 className="w-6 h-6 text-green-400" /> Transcription Complete</>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                        Begin Transcription
                      </>
                    )}
                  </button>
                )}

                {/* Generated Transcript Result area */}
                {generatedTranscript && (
                  <div className="space-y-6 pt-6 border-t border-[#1f3a3410] animate-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#1F3A3450]">Generated Transcript</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={downloadTranscript}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#1F3A3408] hover:bg-[#1F3A3415] text-[#1F3A3480] text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                          <Download className="w-3 h-3" /> Download .txt
                        </button>
                        <span className="text-[10px] uppercase font-black text-green-600 bg-green-500/10 px-2 py-1 rounded-full">AI Verified</span>
                      </div>
                    </div>
                    <textarea
                      value={generatedTranscript}
                      onChange={(e) => handleGeneratedTranscriptChange(e.target.value)}
                      className="w-full min-h-[160px] p-8 rounded-[2rem] bg-[#F4F8F9] border border-[#1f3a3410] text-[#1F3A3480] text-base leading-relaxed italic font-medium apple-shadow resize-none outline-none focus:bg-white focus:border-[#1f3a3420] transition-all"
                    />

                    {/* Analytics Panel */}
                    {callAnalytics && (
                      <div className="space-y-5 pt-6 border-t border-[#1f3a3410] animate-in slide-in-from-bottom-4 duration-700">
                        <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#1F3A3450]">Call Analytics</h4>

                        {/* Top Metrics Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: "Duration", value: `${callAnalytics.duration_seconds ? Math.round(callAnalytics.duration_seconds) : "—"}s` },
                            { label: "Silence", value: `${(callAnalytics.silence.ratio * 100).toFixed(1)}%` },
                            { label: "Turns", value: String(callAnalytics.turn_count) },
                            { label: "Longest Gap", value: `${(callAnalytics.silence.longest_gap_ms / 1000).toFixed(1)}s` },
                          ].map((m) => (
                            <div key={m.label} className="flex flex-col items-center justify-center gap-1 p-4 rounded-2xl bg-[#1F3A3406] border border-[#1f3a3408]">
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3440]">{m.label}</span>
                              <span className="text-2xl font-[850] text-[#1F3A34] tracking-tight">{m.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Speaker Breakdown */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3440]">Speaker Breakdown</p>
                          {callAnalytics.speakers.map((sp) => (
                            <div key={sp.speaker_id} className="flex items-center gap-4">
                              <span className="text-xs font-black text-[#1F3A34] w-20 shrink-0">Speaker {sp.speaker_id}</span>
                              <div className="flex-1 h-2.5 rounded-full bg-[#1F3A3410] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#1F3A34] transition-all duration-1000"
                                  style={{ width: `${(sp.talk_ratio * 100).toFixed(1)}%` }}
                                />
                              </div>
                              <span className="text-xs font-black text-[#1F3A3460] w-16 text-right shrink-0">
                                {(sp.talk_ratio * 100).toFixed(1)}% · {sp.turn_count}t
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Direct Input Area */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#1F3A34] flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Bypassed Input
                </h4>
                <label className="flex items-center gap-2 px-3 py-1.5 bg-[#1F3A3408] hover:bg-[#1F3A3415] text-[#1F3A3480] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer">
                  <FileUp className="w-3.5 h-3.5" /> Upload .txt File
                  <input type="file" accept=".txt" className="hidden" onChange={handleManualFileUpload} />
                </label>
              </div>
              <textarea
                value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                placeholder="Paste your conversation transcript here for immediate analysis..."
                className="w-full h-64 p-8 rounded-[2.5rem] bg-[#1F3A3405] border border-transparent focus:border-[#1f3a3410] focus:bg-white focus:apple-shadow transition-all text-base font-medium leading-relaxed resize-none text-[#1F3A34] outline-none placeholder:text-[#1F3A3430]"
              />
            </div>

            <button
              onClick={handleTranscriptSubmit}
              disabled={!manualTranscript.trim() || showManualSuccess}
              className={cn(
                "w-full h-16 rounded-[1.25rem] transition-all flex items-center justify-center gap-3 active:scale-[0.98]",
                showManualSuccess
                  ? "bg-green-500 text-white shadow-xl shadow-green-500/20"
                  : "bg-[#1F3A34] hover:bg-[#1F3A34E0] disabled:bg-[#1F3A3450] text-white shadow-xl shadow-[#1F3A3420]"
              )}
            >
              {showManualSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Signal Ready • Configure Below
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 text-white/50" />
                  Analyze Transcript
                </>
              )}
            </button>
          </div>
        )}
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
