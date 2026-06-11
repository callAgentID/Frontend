"use client";

import { useState, useEffect, useRef } from "react";
import { useApi } from "@/lib/useApi";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  FileAudio,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  X,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResultsPanel } from "./ResultsPanel";

interface BatchCall {
  call_id: string;
  file_name: string;
  status: string;
  overall_score?: number | null;
  error_message?: string | null;
}

interface BatchStatus {
  batch_id: string;
  name?: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  total_calls: number;
  queued_calls: number;
  processing_calls: number;
  ready_calls: number;
  failed_calls: number;
  calls: BatchCall[];
}

interface IngestError {
  file_name: string;
  error: string;
}

interface BatchProgressProps {
  batchId: string;
  batchName?: string;
  initialErrors?: IngestError[];
  onClose?: () => void;
}

const CALL_STATUS_ICON: Record<string, React.ReactNode> = {
  QUEUED:     <Clock className="w-3.5 h-3.5 text-[#B3CFE5]" />,
  PROCESSING: <Loader2 className="w-3.5 h-3.5 text-[#4A7FA7] animate-spin" />,
  READY:      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
  FAILED:     <XCircle className="w-3.5 h-3.5 text-red-400" />,
};

export function BatchProgress({ batchId, batchName, initialErrors = [], onClose }: BatchProgressProps) {
  const { apiFetch } = useApi();
  const [batch, setBatch] = useState<BatchStatus | null>(null);
  const [callsExpanded, setCallsExpanded] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedCallData, setSelectedCallData] = useState<any>(null);
  const [isLoadingCall, setIsLoadingCall] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isComplete = batch?.status === "COMPLETED" || batch?.status === "FAILED";

  const fetchBatch = async () => {
    try {
      const res = await apiFetch(`/api/v1/batches/${batchId}`);
      if (!res.ok) return;
      const data: BatchStatus = await res.json();
      setBatch(data);
      // Auto-expand calls list when completed
      if (data.status === "COMPLETED" || data.status === "FAILED") {
        setCallsExpanded(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      console.error("Failed to fetch batch:", err);
    }
  };

  useEffect(() => {
    fetchBatch();
    intervalRef.current = setInterval(fetchBatch, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [batchId]);

  const handleCallClick = async (call: BatchCall) => {
    if (call.status !== "READY" || !call.call_id) return;
    if (selectedCallId === call.call_id) {
      // Toggle off
      setSelectedCallId(null);
      setSelectedCallData(null);
      return;
    }
    setSelectedCallId(call.call_id);
    setIsLoadingCall(true);
    setSelectedCallData(null);
    try {
      const res = await apiFetch(`/api/v1/calls/${call.call_id}`);
      if (res.ok) setSelectedCallData(await res.json());
    } catch (err) {
      console.error("Failed to fetch call:", err);
    } finally {
      setIsLoadingCall(false);
    }
  };

  const progress = batch
    ? Math.round(((batch.ready_calls + batch.failed_calls) / batch.total_calls) * 100)
    : 0;

  const allFailed = batch && batch.failed_calls === batch.total_calls;

  return (
    <div className="rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border border-[#4A7FA7]/30"
      style={{ background: '#0D1F35' }}>

      {/* ── Header ─────────────────────────────────── */}
      <div className="p-4 flex items-center gap-4">
        {/* Status icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          isComplete ? (allFailed ? "bg-red-500/20" : "bg-green-500/20") : "bg-[#4A7FA7]/20"
        )}>
          {isComplete
            ? allFailed
              ? <XCircle className="w-5 h-5 text-red-400" />
              : <CheckCircle2 className="w-5 h-5 text-green-400" />
            : <Loader2 className="w-5 h-5 text-[#4A7FA7] animate-spin" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-black text-[#F6FAFD] truncate">
              {batchName || `Batch ${batchId.split('-')[0]}`}
            </p>
            <span className={cn(
              "text-xs font-black shrink-0 ml-2",
              isComplete ? (allFailed ? "text-red-400" : "text-green-400") : "text-[#B3CFE5]"
            )}>{progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#0A1931]/60 rounded-full overflow-hidden">
            <div className={cn(
              "h-full rounded-full transition-all duration-700",
              allFailed ? "bg-red-500" : isComplete ? "bg-green-400" : "bg-gradient-to-r from-[#4A7FA7] to-[#B3CFE5]"
            )} style={{ width: `${progress}%` }} />
          </div>

          {/* Stats row */}
          {batch && (
            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold">
              {batch.ready_calls > 0 && <span className="text-green-400">{batch.ready_calls} done</span>}
              {batch.processing_calls > 0 && <span className="text-[#4A7FA7]">{batch.processing_calls} processing</span>}
              {batch.queued_calls > 0 && <span className="text-[#B3CFE5]">{batch.queued_calls} queued</span>}
              {batch.failed_calls > 0 && <span className="text-red-400">{batch.failed_calls} failed</span>}
              <span className="text-[#B3CFE5]/40">/ {batch.total_calls} total</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {batch && (
            <button
              onClick={() => setCallsExpanded(!callsExpanded)}
              className="w-8 h-8 rounded-lg hover:bg-[#4A7FA7]/20 flex items-center justify-center text-[#B3CFE5] transition-all"
              title={callsExpanded ? "Collapse" : "Expand calls"}
            >
              {callsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-[#B3CFE5] hover:text-red-400 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Ingest errors ──────────────────────────── */}
      {initialErrors.length > 0 && (
        <div className="px-4 pb-3">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-red-400">
              {initialErrors.length} file{initialErrors.length !== 1 ? 's' : ''} failed to ingest
            </p>
            {initialErrors.map((e, i) => (
              <div key={i} className="flex items-start gap-2">
                <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-[#B3CFE5]">
                  <span className="font-bold text-red-300">{e.file_name}</span>: {e.error}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Calls list ─────────────────────────────── */}
      {callsExpanded && batch && (
        <div className="border-t border-[#4A7FA7]/20">
          {/* Section header */}
          <div className="px-4 py-2 flex items-center justify-between bg-[#0A1931]/40">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">
              {isComplete ? "Results — click any call to view details" : "Live progress"}
            </span>
            {isComplete && (
              <span className="text-[10px] font-bold text-green-400">{batch.ready_calls} ready</span>
            )}
          </div>

          <div className="divide-y divide-[#4A7FA7]/10 max-h-72 overflow-y-auto">
            {batch.calls.map(call => {
              const isReady = call.status?.toUpperCase() === "READY";
              const isFailed = call.status?.toUpperCase() === "FAILED";
              const isSelected = selectedCallId === call.call_id;
              const score = call.overall_score;

              return (
                <div key={call.call_id}>
                  <div
                    onClick={() => handleCallClick(call)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-all",
                      isReady ? "cursor-pointer hover:bg-[#1A3D63]/60 group" : "cursor-default",
                      isSelected ? "bg-[#1A3D63]/60 border-l-2 border-[#4A7FA7]" : ""
                    )}
                  >
                    <FileAudio className="w-4 h-4 text-[#B3CFE5]/40 shrink-0" />

                    <p className="flex-1 text-xs font-medium text-[#F6FAFD] truncate">{call.file_name}</p>

                    {/* Score badge */}
                    {score != null && (
                      <span className={cn(
                        "text-xs font-black px-2 py-0.5 rounded-lg shrink-0",
                        score >= 80 ? "text-green-400 bg-green-400/10" :
                        score >= 50 ? "text-[#F6FAFD] bg-[#1A3D63]/60" :
                                      "text-red-400 bg-red-400/10"
                      )}>
                        {score.toFixed(0)}
                      </span>
                    )}

                    {/* Error */}
                    {isFailed && call.error_message && (
                      <span className="text-[10px] text-red-400 truncate max-w-[100px]" title={call.error_message}>
                        {call.error_message}
                      </span>
                    )}

                    {/* Status icon / expand arrow */}
                    <div className="shrink-0 flex items-center gap-1">
                      {CALL_STATUS_ICON[call.status?.toUpperCase()] ?? CALL_STATUS_ICON.QUEUED}
                      {isReady && (
                        <ArrowUpRight className={cn(
                          "w-3.5 h-3.5 transition-colors",
                          isSelected ? "text-[#4A7FA7]" : "text-[#B3CFE5]/30 group-hover:text-[#4A7FA7]"
                        )} />
                      )}
                    </div>
                  </div>

                  {/* ── Inline call detail ── */}
                  {isSelected && (
                    <div className="border-t border-[#4A7FA7]/20 bg-[#0A1931]/40">
                      {isLoadingCall ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="w-8 h-8 text-[#4A7FA7] animate-spin" />
                        </div>
                      ) : selectedCallData ? (
                        <div className="p-4">
                          <ResultsPanel data={selectedCallData} />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
