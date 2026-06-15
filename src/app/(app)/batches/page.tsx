"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useApi } from "@/lib/useApi";
import {
  Layers,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Trash2,
  ArrowLeft,
  FileAudio,
  ChevronDown,
  ChevronRight,
  Calendar,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { ResultsPanel } from "@/components/ResultsPanel";

interface BatchCall {
  call_id: string;
  file_name: string;
  status: string;
  overall_score?: number | null;
  error_message?: string | null;
}

interface Batch {
  batch_id: string;
  name?: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  total_calls: number;
  queued_calls: number;
  processing_calls: number;
  ready_calls: number;
  failed_calls: number;
  created_at?: string;
  calls?: BatchCall[];
}

const STATUS_CONFIG = {
  QUEUED:     { label: "Queued",     color: "text-[#B3CFE5]",  bg: "bg-[#B3CFE5]/10",  icon: Clock },
  PROCESSING: { label: "Processing", color: "text-[#4A7FA7]",  bg: "bg-[#4A7FA7]/15",  icon: Loader2 },
  COMPLETED:  { label: "Completed",  color: "text-green-400",  bg: "bg-green-400/10",  icon: CheckCircle2 },
  FAILED:     { label: "Failed",     color: "text-red-400",    bg: "bg-red-400/10",    icon: XCircle },
};

function BatchesContent() {
  const t = useTranslations('batches');
  const tc = useTranslations('common');
  const { apiFetch } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Call detail state
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedCallData, setSelectedCallData] = useState<any>(null);
  const [isCallLoading, setIsCallLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/v1/batches/?limit=50");
      if (!res.ok) throw new Error("Failed to fetch batches");
      const data = await res.json();
      setBatches(Array.isArray(data) ? data : (data.items ?? []));
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatchDetail = async (batchId: string) => {
    setIsDetailLoading(true);
    try {
      const res = await apiFetch(`/api/v1/batches/${batchId}`);
      if (!res.ok) throw new Error("Failed to fetch batch detail");
      const data = await res.json();
      setSelectedBatch(data);
    } catch (err) {
      console.error("Failed to fetch batch detail:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleDelete = async (batchId: string) => {
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/v1/batches/${batchId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete batch");
      setBatches(batches.filter(b => b.batch_id !== batchId));
      if (selectedBatch?.batch_id === batchId) setSelectedBatch(null);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete batch");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCallClick = async (callId: string) => {
    if (selectedCallId === callId) {
      setSelectedCallId(null);
      setSelectedCallData(null);
      return;
    }
    setSelectedCallId(callId);
    setIsCallLoading(true);
    setSelectedCallData(null);
    try {
      const res = await apiFetch(`/api/v1/calls/${callId}`);
      if (res.ok) setSelectedCallData(await res.json());
    } catch (err) {
      console.error("Failed to fetch call:", err);
    } finally {
      setIsCallLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    const idFromUrl = searchParams.get("id");
    if (idFromUrl) fetchBatchDetail(idFromUrl);
  }, []);

  const progress = (b: Batch) =>
    b.total_calls > 0 ? Math.round(((b.ready_calls + b.failed_calls) / b.total_calls) * 100) : 0;

  if (selectedBatch) {
    const cfg = STATUS_CONFIG[selectedBatch.status] ?? STATUS_CONFIG.QUEUED;
    const pct = progress(selectedBatch);

    return (
      <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-150 duration-150">
        <div className="flex items-center justify-between border-b border-blue-400/15 pb-6">
          <button onClick={() => setSelectedBatch(null)} className="flex items-center gap-2 text-[#B3CFE5] hover:text-[#F6FAFD] font-bold text-xs uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('backToBatches')}
          </button>
          <button
            onClick={() => setDeleteConfirmId(selectedBatch.batch_id)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <Trash2 className="w-4 h-4" /> {t('deleteBatch')}
          </button>
        </div>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white glow shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-[900] text-[#F6FAFD] tracking-tight truncate">
                {selectedBatch.name || `Batch ${selectedBatch.batch_id.split('-')[0]}`}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider", cfg.bg, cfg.color)}>
                  {({ QUEUED: t('queued'), PROCESSING: t('processing'), FAILED: t('failed') } as Record<string, string>)[selectedBatch.status] ?? cfg.label}
                </span>
                <span className="text-xs text-[#B3CFE5]">{selectedBatch.total_calls} calls</span>
                {selectedBatch.created_at && (
                  <span className="text-xs text-[#B3CFE5] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(selectedBatch.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="p-5 rounded-2xl glass-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-[#F6FAFD]">{t('processingProgress')}</span>
              <span className="text-sm font-black text-[#F6FAFD]">{pct}%</span>
            </div>
            <div className="h-3 bg-black/25 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4A7FA7] to-green-400 transition-colors duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: t('ready'), value: selectedBatch.ready_calls, color: "text-green-400" },
                { label: t('processing'), value: selectedBatch.processing_calls, color: "text-[#4A7FA7]" },
                { label: t('queued'), value: selectedBatch.queued_calls, color: "text-[#B3CFE5]" },
                { label: t('failed'), value: selectedBatch.failed_calls, color: "text-red-400" },
              ].map(s => (
                <div key={s.label}>
                  <p className={cn("text-xl font-[900]", s.color)}>{s.value}</p>
                  <p className="text-[10px] font-bold text-[#B3CFE5] uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calls table */}
        <div className="bg-blue-950/25 rounded-2xl border border-blue-400/15 overflow-hidden">
          <div className="px-5 py-3 border-b border-blue-400/10 bg-black/18 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#B3CFE5]">{t('calls')}</h3>
            <Activity className="w-4 h-4 text-[#4A7FA7]" />
          </div>
          <div className="divide-y divide-[#4A7FA7]/10">
            {(selectedBatch.calls || []).map(call => {
              const callStatus = call.status?.toUpperCase() as keyof typeof STATUS_CONFIG;
              const callCfg = STATUS_CONFIG[callStatus] ?? STATUS_CONFIG.QUEUED;
              const CallIcon = callCfg.icon;
              const isReady = call.status?.toUpperCase() === "READY";
              const isSelected = selectedCallId === call.call_id;

              return (
                <div key={call.call_id}>
                  {/* Row */}
                  <div
                    onClick={() => isReady && handleCallClick(call.call_id)}
                    className={cn(
                      "px-5 py-4 flex items-center gap-4 transition-colors group",
                      isReady ? "cursor-pointer hover:bg-blue-950/25" : "cursor-default",
                      isSelected ? "bg-blue-950/25 border-l-2 border-[#4A7FA7]" : ""
                    )}
                  >
                    <FileAudio className="w-4 h-4 text-[#B3CFE5]/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#F6FAFD] truncate">{call.file_name}</p>
                      {call.error_message && (
                        <p className="text-[11px] text-red-400 mt-0.5 truncate">{call.error_message}</p>
                      )}
                    </div>
                    {call.overall_score != null && (
                      <span className={cn(
                        "text-sm font-black px-2 py-0.5 rounded-lg shrink-0",
                        call.overall_score >= 80 ? "text-green-400 bg-green-400/10" :
                        call.overall_score >= 50 ? "text-[#F6FAFD] bg-blue-950/18" :
                        "text-red-400 bg-red-400/10"
                      )}>
                        {call.overall_score.toFixed(0)}
                      </span>
                    )}
                    <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0", callCfg.bg, callCfg.color)}>
                      {({ QUEUED: t('queued'), PROCESSING: t('processing'), FAILED: t('failed') } as Record<string, string>)[callStatus] ?? callCfg.label}
                    </span>
                    {isReady && (
                      <ChevronDown className={cn(
                        "w-4 h-4 shrink-0 transition-transform text-[#4A7FA7]",
                        isSelected ? "rotate-180" : "rotate-0 opacity-0 group-hover:opacity-100"
                      )} />
                    )}
                  </div>

                  {/* Inline call detail */}
                  {isSelected && (
                    <div className="border-t border-blue-400/10 bg-black/18 px-4 py-6">
                      {isCallLoading ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="w-8 h-8 text-[#4A7FA7] animate-spin" />
                        </div>
                      ) : selectedCallData ? (
                        <ResultsPanel data={selectedCallData} />
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-150 duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white glow shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-[900] text-[#F6FAFD] tracking-tight">{t('title')}</h1>
          </div>
          <p className="text-[#B3CFE5] text-sm font-medium pl-1">{t('subtitle')}</p>
        </div>
        <button onClick={fetchBatches} disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors shrink-0">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t('refresh')}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-blue-950/18 rounded-2xl border border-blue-400/10 animate-pulse" />)}
        </div>
      ) : batches.length === 0 ? (
        <div className="p-16 text-center space-y-4">
          <Layers className="w-12 h-12 text-[#4A7FA7]/40 mx-auto" />
          <p className="text-[#B3CFE5] font-semibold">{t('noBatches')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map(batch => {
            const cfg = STATUS_CONFIG[batch.status] ?? STATUS_CONFIG.QUEUED;
            const StatusIcon = cfg.icon;
            const pct = progress(batch);
            return (
              <div key={batch.batch_id}
                className="p-5 glass-card rounded-2xl hover:border-[#4A7FA7]/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
                    <StatusIcon className={cn("w-5 h-5", cfg.color, batch.status === "PROCESSING" && "animate-spin")} />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => fetchBatchDetail(batch.batch_id)}>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-black text-[#F6FAFD] truncate">
                        {batch.name || `Batch ${batch.batch_id.split('-')[0]}`}
                      </p>
                      <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0", cfg.bg, cfg.color)}>
                        {({ QUEUED: t('queued'), PROCESSING: t('processing'), FAILED: t('failed') } as Record<string, string>)[batch.status] ?? cfg.label}
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-black/25 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#4A7FA7] to-green-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[#B3CFE5] shrink-0">
                        {batch.ready_calls}/{batch.total_calls} {t('ready').toLowerCase()}
                      </span>
                      {batch.failed_calls > 0 && (
                        <span className="text-[10px] font-bold text-red-400 shrink-0">{batch.failed_calls} {t('failed').toLowerCase()}</span>
                      )}
                    </div>
                    {batch.created_at && (
                      <p className="text-[10px] text-[#B3CFE5]/60 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(batch.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteConfirmId(batch.batch_id); }}
                    className="w-9 h-9 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchBatchDetail(batch.batch_id)}
                    className="w-9 h-9 rounded-xl bg-blue-950/18 hover:bg-gradient-to-r hover:from-[#4A7FA7] hover:to-[#1A3D63] text-[#4A7FA7] hover:text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm modal */}
      {mounted && deleteConfirmId && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 animate-in fade-in duration-150 duration-150">
          <div className="bg-[#1A3D63]/95 glow w-full max-w-md rounded-3xl border border-red-500/40 overflow-hidden animate-in fade-in duration-150 duration-150">
            <div className="p-6 border-b border-red-500/20 bg-red-500/10 flex items-center gap-4">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
              <div>
                <h3 className="text-lg font-black text-[#F6FAFD]">{t('deleteConfirmTitle')}</h3>
                <p className="text-sm text-red-400 mt-0.5">{t('deleteConfirmDesc')}</p>
              </div>
            </div>
            <div className="p-6 flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-11 bg-black/25 text-[#B3CFE5] rounded-xl font-bold text-sm uppercase tracking-wider transition-colors hover:bg-black/35">
                {tc('cancel')}
              </button>
              <button onClick={() => handleDelete(deleteConfirmId)} disabled={isDeleting}
                className="flex-1 h-11 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" /> {tc('deleting')}</> : <><Trash2 className="w-4 h-4" /> {tc('delete')}</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function BatchesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#4A7FA7] animate-spin" /></div>}>
      <BatchesContent />
    </Suspense>
  );
}
