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
  X
} from "lucide-react";
import { cn } from "../lib/utils";

type InputMode = "audio" | "transcript";

export function InputSection({ onTranscriptReady }: { onTranscriptReady?: (transcript: string) => void }) {
  const [mode, setMode] = useState<InputMode>("audio");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [manualTranscript, setManualTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedTranscript, setGeneratedTranscript] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleModeChange = (newMode: InputMode) => {
    // Clear data from other mode upon switching
    if (newMode === "audio") setManualTranscript("");
    else {
      setAudioFile(null);
      setGeneratedTranscript("");
    }
    setMode(newMode);
    setIsProcessing(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith("audio/") || ["audio/mpeg", "audio/wav", "audio/x-m4a"].includes(file.type))) {
      setAudioFile(file);
      setGeneratedTranscript("");
    }
  };

  const handleUploadSubmit = async () => {
    if (!audioFile) return;
    setIsProcessing(true);

    // Mock Backend Simulation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockTranscript = "This is a simulated transcript from the Conversation Intel speech-to-text service. The system successfully analyzed the primary voice signals and generated this text output for verification.";
    setGeneratedTranscript(mockTranscript);
    setIsProcessing(false);
    if (onTranscriptReady) onTranscriptReady(mockTranscript);
  };

  const [showManualSuccess, setShowManualSuccess] = useState(false);

  const handleTranscriptSubmit = () => {
    if (!manualTranscript.trim()) return;
    setShowManualSuccess(true);
    if (onTranscriptReady) onTranscriptReady(manualTranscript);
  };

  const removeFile = () => {
    setAudioFile(null);
    setGeneratedTranscript("");
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
                  accept="audio/*"
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

                {/* Submit/Process Button */}
                <button
                  onClick={handleUploadSubmit}
                  disabled={isProcessing}
                  className="w-full h-16 rounded-[1.25rem] bg-[#1F3A34] hover:bg-[#1F3A34E0] disabled:bg-[#1F3A3450] text-white text-base font-extrabold shadow-xl shadow-[#1F3A3420] transition-all flex items-center justify-center gap-3 overflow-hidden relative group"
                >
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : generatedTranscript ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                      Begin Transcription
                    </>
                  )}
                </button>

                {/* Generated Transcript Result area */}
                {generatedTranscript && (
                  <div className="space-y-6 pt-6 border-t border-[#1f3a3410] animate-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#1F3A3450]">Generated Transcript</h4>
                      <span className="text-[10px] uppercase font-black text-green-600 bg-green-500/10 px-2 py-1 rounded-full">AI Verified</span>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-[#F4F8F9] border border-[#1f3a3408] text-[#1F3A3480] text-base leading-relaxed italic font-medium apple-shadow">
                      "{generatedTranscript}"
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Direct Input Area */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#1F3A34] flex items-center gap-2">
                <FileText className="w-4 h-4" /> Bypassed Input
              </h4>
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
