"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  ArrowLeft,
  Activity,
  BarChart3,
  ChevronRight,
  XCircle,
  Play,
  Pause,
  Clock,
  Shield,
  Edit,
  Save,
  X as XIcon,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RedFlagItemSkeleton, DetailViewSkeleton } from "@/components/Skeleton";

interface RedFlagSummary {
  id: string;
  call_id: string;
  score: number;
  has_critical_issues: boolean;
  requires_immediate_attention: boolean;
  flags_count: number;
  file_name?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

interface RedFlagDetail {
  id: string;
  call_id: string;
  score: number;
  has_critical_issues: boolean;
  requires_immediate_attention: boolean;
  full_result: any;
  file_name?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  human_interventions?: Array<{
    timestamp: string;
    question_id: string;
    template_id: string;
    corrected_score: number;
    corrected_answer: string;
    corrected_evidence: any;
    corrected_reasoning: string;
  }>;
}

interface Stats {
  total_red_flag_calls: number;
  critical_issues_count: number;
  immediate_attention_count: number;
  average_score: number;
}

function RedFlagsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('redFlags');

  const [redFlags, setRedFlags] = useState<RedFlagSummary[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail view state
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<RedFlagDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [playingSegment, setPlayingSegment] = useState<string | null>(null);

  // Batch intervention state
  const [pendingEdits, setPendingEdits] = useState<Map<string, {
    template_id: string;
    question_id: string;
    corrected_answer: string;
    corrected_score: number;
    corrected_reasoning: string;
    corrected_evidence?: any[];
  }>>(new Map());
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [viewHistoryFor, setViewHistoryFor] = useState<{ template_id: string; question_id: string } | null>(null);

  // Filter state
  const [filterCritical, setFilterCritical] = useState<boolean | null>(null);
  const [filterAttention, setFilterAttention] = useState<boolean | null>(null);
  const [minScore, setMinScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Read call ID from URL and reset when removed
  useEffect(() => {
    const callIdFromUrl = searchParams.get('callId');
    if (callIdFromUrl && callIdFromUrl !== selectedCallId) {
      viewDetail(callIdFromUrl);
    } else if (!callIdFromUrl && selectedCallId) {
      // Reset to list view when callId is removed from URL
      setSelectedCallId(null);
      setDetailData(null);
      setPlayingSegment(null);
      setPendingEdits(new Map());
      setEditingQuestionId(null);
      setViewHistoryFor(null);
    }
  }, [searchParams]);

  // Fetch red flags list with filters
  const fetchRedFlags = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const params = new URLSearchParams({
        skip: String((currentPage - 1) * itemsPerPage),
        limit: String(itemsPerPage),
      });

      if (filterCritical !== null) params.append("has_critical_issues", String(filterCritical));
      if (filterAttention !== null) params.append("requires_immediate_attention", String(filterAttention));
      if (minScore) params.append("min_score", minScore);
      if (maxScore) params.append("max_score", maxScore);

      const response = await fetch(`${baseUrl}/api/v1/red-flags/?${params.toString()}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });

      if (response.ok) {
        const data = await response.json();
        // Sort by score ascending (lower scores first - worse compliance)
        const sortedData = Array.isArray(data)
          ? data.sort((a, b) => a.score - b.score)
          : [];
        setRedFlags(sortedData);
      } else {
        throw new Error("Failed to fetch red flags");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const response = await fetch(`${baseUrl}/api/v1/red-flags/stats`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  useEffect(() => {
    fetchRedFlags();
    fetchStats();
  }, [currentPage, filterCritical, filterAttention, minScore, maxScore]);

  // View detail
  const viewDetail = async (callId: string) => {
    setSelectedCallId(callId);
    setDetailLoading(true);
    setDetailData(null);

    // Update URL
    router.push(`/red-flags?callId=${callId}`, { scroll: false });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const response = await fetch(`${baseUrl}/api/v1/red-flags/${callId}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });

      if (response.ok) {
        const data = await response.json();
        setDetailData(data);
      } else if (response.status === 404) {
        alert("Red flag analysis not found for this call. It may not have been processed yet.");
        closeDetail();
      } else {
        throw new Error("Failed to fetch red flag details");
      }
    } catch (err) {
      console.error("Failed to fetch detail:", err);
      alert("Failed to load red flag details. Please try again.");
      closeDetail();
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedCallId(null);
    setDetailData(null);
    setPlayingSegment(null);
    setPendingEdits(new Map());
    setEditingQuestionId(null);
    setViewHistoryFor(null);
    router.push('/red-flags', { scroll: false });
  };

  const handleSubmitAllEdits = async () => {
    if (pendingEdits.size === 0 || !selectedCallId) return;

    setIsRecalculating(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";

      // Convert pending edits Map to interventions array
      const interventions = Array.from(pendingEdits.values()).map(edit => ({
        template_id: edit.template_id,
        question_id: edit.question_id,
        corrected_answer: edit.corrected_answer,
        corrected_score: edit.corrected_score,
        corrected_reasoning: edit.corrected_reasoning,
        ...(edit.corrected_evidence && { corrected_evidence: edit.corrected_evidence })
      }));

      // Submit all interventions in a single request
      const response = await fetch(`${baseUrl}/api/v1/calls/${selectedCallId}/interventions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ interventions }),
      });

      if (!response.ok) {
        console.error("Failed to record interventions");
        alert("Failed to record interventions. Please try again.");
        setIsRecalculating(false);
        return;
      }

      const result = await response.json();
      console.log("Interventions recorded:", result);

      // Clear pending edits
      setPendingEdits(new Map());

      // Start polling for completion
      pollForCompletion();
    } catch (error) {
      console.error("Error recording interventions:", error);
      alert("Error recording interventions. Please try again.");
      setIsRecalculating(false);
    }
  };

  const addPendingEdit = (edit: {
    template_id: string;
    question_id: string;
    corrected_answer: string;
    corrected_score: number;
    corrected_reasoning: string;
    corrected_evidence?: any[];
  }) => {
    const key = `${edit.template_id}_${edit.question_id}`;
    setPendingEdits(new Map(pendingEdits.set(key, edit)));
    setEditingQuestionId(null);
  };

  const removePendingEdit = (template_id: string, question_id: string) => {
    const key = `${template_id}_${question_id}`;
    const newEdits = new Map(pendingEdits);
    newEdits.delete(key);
    setPendingEdits(newEdits);
  };

  const getPendingEdit = (template_id: string, question_id: string): {
    template_id: string;
    question_id: string;
    corrected_answer: string;
    corrected_score: number;
    corrected_reasoning: string;
    corrected_evidence?: any[];
  } | undefined => {
    const key = `${template_id}_${question_id}`;
    return pendingEdits.get(key);
  };

  const pollForCompletion = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
    const maxAttempts = 60; // Poll for max 5 minutes (60 * 5 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/v1/calls/${selectedCallId}`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        const updatedData = await response.json();

        if (updatedData.status === 'ready') {
          // Recalculation complete - reload the detail view
          if (selectedCallId) {
            viewDetail(selectedCallId);
          }
          setIsRecalculating(false);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          // Timeout - stop polling
          console.error("Polling timeout - recalculation taking too long");
          alert("Recalculation is taking longer than expected. Please refresh the page manually.");
          setIsRecalculating(false);
        }
      } catch (error) {
        console.error("Error polling for completion:", error);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000);
        } else {
          setIsRecalculating(false);
        }
      }
    };

    poll();
  };

  // Mark as reviewed
  const markAsReviewed = async (callId: string, reviewedBy: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const response = await fetch(`${baseUrl}/api/v1/red-flags/${callId}/review?reviewed_by=${encodeURIComponent(reviewedBy)}`, {
        method: "PATCH",
        headers: { "ngrok-skip-browser-warning": "true" }
      });

      if (response.ok) {
        // Refresh data
        if (detailData) {
          setDetailData({
            ...detailData,
            reviewed_at: new Date().toISOString(),
            reviewed_by: reviewedBy
          });
        }
        fetchRedFlags();
      } else {
        alert("Failed to mark as reviewed");
      }
    } catch (err) {
      console.error("Failed to mark as reviewed:", err);
      alert("Failed to mark as reviewed. Please try again.");
    }
  };

  // Detail view
  if (selectedCallId) {
    return (
      <div className="p-8 space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
        <div className="flex items-center justify-between max-w-6xl mx-auto border-b border-[#4A7FA7]/30 pb-8">
          <button
            onClick={closeDetail}
            className="flex items-center gap-2 text-[#B3CFE5] hover:text-[#F6FAFD] font-bold text-xs uppercase tracking-widest transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Red Flags
          </button>
          {detailData && !detailData.reviewed_at && (
            <button
              onClick={() => {
                const name = prompt("Enter your name to mark this as reviewed:");
                if (name) markAsReviewed(selectedCallId, name);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#4A7FA7]/20 active:scale-95"
            >
              <Eye className="w-4 h-4" />
              Mark as Reviewed
            </button>
          )}
        </div>

        {detailLoading ? (
          <DetailViewSkeleton />
        ) : detailData ? (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-[#1A3D63]/60 glow rounded-[2.5rem] border border-[#4A7FA7]/30 p-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-[850] text-[#F6FAFD] tracking-tight mb-2">
                    Red Flag Analysis
                  </h2>
                  <p className="text-sm font-medium text-[#B3CFE5]">
                    {detailData.file_name || `Call ID: ${detailData.call_id}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {detailData.has_critical_issues && (
                    <span className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-black uppercase tracking-wider">
                      Critical Issues
                    </span>
                  )}
                  {detailData.requires_immediate_attention && (
                    <span className="px-3 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-black uppercase tracking-wider">
                      Immediate Attention
                    </span>
                  )}
                  {detailData.reviewed_at && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A7FA7]/20 text-[#4A7FA7] border border-[#4A7FA7]/30 rounded-lg text-xs font-black uppercase tracking-wider">
                      <Eye className="w-3 h-3" /> Reviewed
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-[#1A3D63]/40 border border-[#4A7FA7]/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] mb-2">Risk Score</p>
                  <p className="text-3xl font-[850] text-[#F6FAFD]">{detailData.score.toFixed(1)}</p>
                </div>
                <div className="p-6 rounded-2xl bg-[#1A3D63]/40 border border-[#4A7FA7]/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] mb-2">Created</p>
                  <p className="text-sm font-bold text-[#F6FAFD]">{new Date(detailData.created_at).toLocaleString()}</p>
                </div>
                {detailData.reviewed_at && (
                  <div className="p-6 rounded-2xl bg-[#4A7FA7]/20 border border-[#4A7FA7]/30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#4A7FA7] mb-2">Reviewed By</p>
                    <p className="text-sm font-bold text-[#F6FAFD]">{detailData.reviewed_by}</p>
                    <p className="text-xs text-[#B3CFE5] mt-1">{new Date(detailData.reviewed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Player - Check if audio is available */}
            {detailData.full_result?.provider_metadata?.provider !== 'manual' && (
              <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white border border-[#4A7FA7]/30 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-2">
                  <h4 className="text-lg font-black uppercase tracking-widest text-[#B3CFE5] flex items-center gap-2">
                    <Play className="w-4 h-4 fill-current" /> Call Audio Signal
                  </h4>
                  <p className="text-sm font-medium text-[#F6FAFD]/80">Stream high-fidelity conversation audio with seek support.</p>
                </div>
                <audio
                  id="red-flag-audio-player"
                  controls
                  preload="metadata"
                  className="w-full md:w-2/3 h-10 accent-[#4A7FA7] bg-[#1A3D63]/40 rounded-xl"
                  src={`${process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com"}/api/v1/media/calls/${detailData.call_id}/audio`}
                >
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            {/* Questionnaire Results */}
            {detailData.full_result?.answers && (
              <div className="bg-[#1A3D63]/60 glow rounded-[2.5rem] border border-[#4A7FA7]/30 p-10 space-y-6">
                <div className="border-b border-[#4A7FA7]/30 pb-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-[850] text-[#F6FAFD] tracking-tight">Questionnaire Analysis</h3>
                    {detailData.human_interventions && detailData.human_interventions.length > 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-[#4A7FA7]/20 rounded-lg border border-[#4A7FA7]/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7FA7]" />
                        <span className="text-xs font-black uppercase tracking-wider text-[#4A7FA7]">{detailData.human_interventions.length} Human Verifications</span>
                      </span>
                    )}
                  </div>
                  {detailData.full_result.summary && (
                    <div className="p-4 bg-[#1A3D63]/40 rounded-xl border border-[#4A7FA7]/30">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] mb-2">Overall Summary</p>
                      <p className="text-sm font-bold text-[#F6FAFD] leading-relaxed">{detailData.full_result.summary}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {detailData.full_result.answers.map((answer: any, idx: number) => {
                    const templateId = 'red_flags'; // Red flags template ID
                    const questionId = answer.question_id || `q${idx + 1}`;

                    return (
                      <div
                        key={questionId}
                        className="group p-6 rounded-2xl bg-[#1A3D63]/40 border border-[#4A7FA7]/30 hover:bg-[#1A3D63]/60 transition-all space-y-4"
                      >
                        {/* Header Row with Question ID, Badges, and Edit Button */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">
                              Question {questionId}
                            </span>
                            {answer.skipped && (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-[#1A3D63]/60 text-[#B3CFE5] border border-[#4A7FA7]/30">
                                Skipped
                              </span>
                            )}
                            {(answer.is_edited || (detailData.human_interventions?.some(
                              (i: any) => i.question_id === questionId && i.template_id === templateId
                            ))) && (
                                <span className="px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-green-100 text-green-700 rounded-md border border-green-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Human Verified
                                </span>
                              )}
                          </div>
                          {!isRecalculating && !answer.skipped && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {getPendingEdit(templateId, questionId) && (
                                <span className="px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 rounded-md border border-orange-200">
                                  Pending Edit
                                </span>
                              )}
                              <button
                                onClick={() => setEditingQuestionId(`${templateId}_${questionId}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#4A7FA7] bg-[#1A3D63]/40 hover:bg-[#1A3D63]/60 rounded-lg border border-[#4A7FA7]/30 transition-all"
                                title="Edit answer"
                              >
                                <Edit className="w-3 h-3" />
                                Edit
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Question Text - Full Width */}
                        {answer.question_text && (
                          <p className="text-sm font-bold text-[#4A7FA7] bg-[#1A3D63]/60 px-3 py-2 rounded-lg border border-[#4A7FA7]/30 mb-4">
                            Q: {answer.question_text}
                          </p>
                        )}

                        {/* Answer and Score Row */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            {answer.reasoning_summary && (
                              <p className="text-sm font-bold text-[#F6FAFD]">{answer.reasoning_summary}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 shrink-0 ml-6">
                            <div className="text-right">
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5]">Answer</p>
                              <p className={cn(
                                "text-sm font-black uppercase tracking-wider",
                                answer.answer === "yes" ? "text-green-600" : "text-red-600"
                              )}>
                                {answer.answer}
                              </p>
                            </div>
                            <div className={cn(
                              "w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-lg",
                              answer.score >= 70 ? "bg-green-500 text-white shadow-green-500/20" :
                                answer.score >= 40 ? "bg-yellow-500 text-white shadow-yellow-500/20" :
                                  "bg-red-500 text-white shadow-red-500/20"
                            )}>
                              <p className="text-2xl font-black">{answer.score}</p>
                              <p className="text-[8px] font-bold opacity-70">SCORE</p>
                            </div>
                          </div>
                        </div>

                        {/* Show latest edit if question has interventions - Full width */}
                        {detailData.human_interventions && (() => {
                          const interventions = detailData.human_interventions.filter(
                            (i: any) => i.question_id === questionId && i.template_id === templateId
                          );

                          if (interventions.length === 0) return null;

                          const latest = interventions[interventions.length - 1];

                          return (
                            <div className="p-4 rounded-xl bg-green-50 border border-green-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-green-600" />
                                  <p className="text-xs font-bold text-green-900">
                                    Last edited: {new Date(latest.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                {interventions.length > 1 && (
                                  <button
                                    onClick={() => setViewHistoryFor({ template_id: templateId, question_id: questionId })}
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-green-700 hover:text-green-900 hover:bg-green-100 rounded-md transition-all"
                                  >
                                    <History className="w-3 h-3" />
                                    View History ({interventions.length})
                                  </button>
                                )}
                              </div>
                              <p className="text-xs font-medium text-green-700 italic">"{latest.corrected_reasoning}"</p>
                              <div className="flex items-center gap-4 pt-2 border-t border-green-200">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-wider text-green-600">Answer</p>
                                  <p className="text-sm font-bold text-green-900">{latest.corrected_answer}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-wider text-green-600">Score</p>
                                  <p className="text-sm font-bold text-green-900">{latest.corrected_score}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {answer.evidence && answer.evidence.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-[#4A7FA7]/30">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5] mb-3">Evidence</p>
                            <div className="space-y-2">
                              {answer.evidence.map((ev: any, evIdx: number) => {
                                const hasAudio = detailData.full_result?.provider_metadata?.provider !== 'manual';
                                const segmentId = `${answer.question_id}_${ev.start_ms}`;
                                const isPlaying = playingSegment === segmentId;

                                return (
                                  <div
                                    key={evIdx}
                                    onClick={() => {
                                      if (!hasAudio || ev.start_ms < 0) return;

                                      const player = document.getElementById('red-flag-audio-player') as HTMLAudioElement;
                                      if (!player) return;

                                      if (isPlaying) {
                                        player.pause();
                                        setPlayingSegment(null);
                                      } else {
                                        const startTime = (ev.start_ms || 0) / 1000;
                                        const endTime = (ev.end_ms || ev.start_ms || 0) / 1000;

                                        player.currentTime = startTime;
                                        player.play();
                                        setPlayingSegment(segmentId);

                                        // Stop at end_ms
                                        const checkTime = () => {
                                          if (player.currentTime >= endTime) {
                                            player.pause();
                                            setPlayingSegment(null);
                                          } else if (playingSegment === segmentId) {
                                            requestAnimationFrame(checkTime);
                                          }
                                        };
                                        requestAnimationFrame(checkTime);
                                      }
                                    }}
                                    className={cn(
                                      "p-3 bg-[#1A3D63]/20 rounded-xl border border-[#4A7FA7]/20 transition-all",
                                      hasAudio && ev.start_ms >= 0 && "cursor-pointer hover:border-[#4A7FA7]/40 hover:bg-[#1A3D63]/30",
                                      isPlaying && "border-[#4A7FA7] bg-[#1A3D63]/40"
                                    )}
                                  >
                                    <p className="text-xs text-[#F6FAFD] leading-relaxed italic mb-2">"{ev.quote}"</p>
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-4">
                                        <span className="text-[9px] font-bold text-[#B3CFE5] uppercase tracking-wider">
                                          Match: {(ev.score * 100).toFixed(1)}%
                                        </span>
                                        {ev.start_ms >= 0 && (
                                          <span className="text-[9px] font-bold text-[#B3CFE5] uppercase tracking-wider">
                                            {Math.floor(ev.start_ms / 1000)}s - {Math.floor(ev.end_ms / 1000)}s
                                          </span>
                                        )}
                                      </div>
                                      {hasAudio && ev.start_ms >= 0 && (
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
                                          {isPlaying ? (
                                            <>
                                              <Pause className="w-3 h-3 fill-current text-[#4A7FA7]" />
                                              <span className="text-[#4A7FA7]">Playing</span>
                                            </>
                                          ) : (
                                            <>
                                              <Play className="w-3 h-3 fill-current text-[#B3CFE5]" />
                                              <span className="text-[#B3CFE5]">Play</span>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-4 text-[9px] font-bold text-[#B3CFE5] uppercase tracking-wider">
                          <span>Weight: {answer.weight}</span>
                          <span className="w-1 h-1 rounded-full bg-[#4A7FA7]/30" />
                          <span>Confidence: {answer.confidence}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Floating Submit Button */}
            {pendingEdits.size > 0 && !isRecalculating && (
              <div className="fixed bottom-8 right-8 z-40 animate-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white rounded-2xl shadow-2xl border border-[#1f3a3410] p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                      <span className="text-lg font-black text-orange-700">{pendingEdits.size}</span>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-[#1F3A3460]">
                        Pending Edits
                      </p>
                      <p className="text-[10px] font-medium text-[#1F3A3440]">
                        Ready to submit
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPendingEdits(new Map())}
                      className="flex-1 h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleSubmitAllEdits}
                      className="flex-1 h-10 px-4 bg-[#1F3A34] hover:bg-[#1F3A34]/90 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1F3A3420]"
                    >
                      <Save className="w-3 h-3" />
                      Submit All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recalculating Overlay */}
            {isRecalculating && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-[#1F3A34] animate-spin mx-auto" />
                  <h3 className="text-xl font-[850] text-[#1F3A34]">Recalculating...</h3>
                  <p className="text-sm font-medium text-[#1F3A3470]">
                    Submitting {pendingEdits.size} change{pendingEdits.size !== 1 ? 's' : ''} and regenerating scores. This may take a few moments.
                  </p>
                </div>
              </div>
            )}

            {/* Edit History Modal */}
            {viewHistoryFor && (() => {
              const interventions = detailData?.human_interventions?.filter(
                (i: any) => i.question_id === viewHistoryFor.question_id && i.template_id === viewHistoryFor.template_id
              ) || [];

              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-3xl shadow-2xl border border-[#1f3a3410] animate-in zoom-in-95 duration-200">
                    <div className="p-8 border-b border-[#1f3a3408] bg-[#1F3A3402] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <History className="w-6 h-6 text-[#1F3A3460]" />
                        <div>
                          <h3 className="text-2xl font-[850] text-[#1F3A34] tracking-tight">Edit History</h3>
                          <p className="text-sm font-semibold text-[#1F3A3440] mt-1">
                            {viewHistoryFor.question_id} - {interventions.length} edit{interventions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setViewHistoryFor(null)}
                        className="w-10 h-10 rounded-xl hover:bg-[#1F3A3410] flex items-center justify-center transition-all text-[#1F3A3420]"
                      >
                        <XIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-8 overflow-y-auto max-h-[60vh] space-y-4">
                      {interventions.map((intervention: any, idx: number) => (
                        <div
                          key={idx}
                          className={cn(
                            "p-6 rounded-2xl border space-y-3",
                            idx === interventions.length - 1
                              ? "bg-green-50 border-green-200"
                              : "bg-gray-50 border-gray-200"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-[#1F3A3460]" />
                              <p className="text-xs font-bold text-[#1F3A34]">
                                {new Date(intervention.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {idx === interventions.length - 1 && (
                              <span className="px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-green-200 text-green-800 rounded-md">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-[#1F3A3440] mb-1">Answer</p>
                              <p className="text-sm font-bold text-[#1F3A34]">{intervention.corrected_answer}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-[#1F3A3440] mb-1">Score</p>
                              <p className="text-sm font-bold text-[#1F3A34]">{intervention.corrected_score}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-[#1F3A3440] mb-1">Reasoning</p>
                            <p className="text-sm font-medium text-[#1F3A3470] italic">"{intervention.corrected_reasoning}"</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 border-t border-[#1f3a3408] bg-[#F4F8F9]">
                      <button
                        onClick={() => setViewHistoryFor(null)}
                        className="w-full h-12 bg-[#1F3A34] hover:bg-[#1F3A34]/90 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Intervention Modal */}
            {editingQuestionId && detailData && (() => {
              // editingQuestionId format: "red_flags_IMMEDIATE_ATTENTION_REASONS"
              // We need to extract: templateId="red_flags", questionId="IMMEDIATE_ATTENTION_REASONS"
              const templateId = 'red_flags'; // We know it's always red_flags for this page
              const questionId = editingQuestionId.replace('red_flags_', ''); // Remove template prefix

              // Find the answer data
              const answer = detailData.full_result?.answers?.find((a: any, idx: number) => {
                const answerQuestionId = a.question_id || `q${idx + 1}`;
                return answerQuestionId === questionId;
              });

              if (!answer) {
                console.log('Answer not found for questionId:', questionId);
                console.log('Available answers:', detailData.full_result?.answers?.map((a: any, idx: number) => a.question_id || `q${idx + 1}`));
                return null;
              }

              const existingEdit = getPendingEdit(templateId, questionId);

              return (
                <InterventionModal
                  modal={{
                    template_id: templateId,
                    question_id: questionId,
                    current_answer: existingEdit?.corrected_answer || answer.answer || '',
                    current_score: existingEdit?.corrected_score || answer.score || 0,
                    current_reasoning: existingEdit?.corrected_reasoning || answer.reasoning_summary || ''
                  }}
                  onClose={() => setEditingQuestionId(null)}
                  onSubmit={(edit) => addPendingEdit(edit)}
                  existingEdit={existingEdit}
                  onRemove={() => {
                    removePendingEdit(templateId, questionId);
                    setEditingQuestionId(null);
                  }}
                />
              );
            })()}
          </div>
        ) : null}
      </div>
    );
  }

  // List view
  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white glow">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-[900] text-[#F6FAFD] tracking-tight">{t('title')}</h1>
          </div>
          <p className="text-[#B3CFE5] text-sm font-medium">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#1A3D63]/60 glow rounded-2xl border border-[#4A7FA7]/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-5 h-5 text-[#4A7FA7]" />
              <div className="w-2 h-2 rounded-full bg-[#4A7FA7]" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] mb-1">{t('totalCalls')}</p>
            <p className="text-2xl font-[850] text-[#F6FAFD]">{stats.total_red_flag_calls}</p>
          </div>

          <div className="bg-[#1A3D63]/60 glow rounded-2xl border border-[#4A7FA7]/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <XCircle className="w-5 h-5 text-red-500" />
              <div className="w-2 h-2 rounded-full bg-red-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] mb-1">{t('criticalIssues')}</p>
            <p className="text-2xl font-[850] text-[#F6FAFD]">{stats.critical_issues_count}</p>
          </div>

          <div className="bg-[#1A3D63]/60 glow rounded-2xl border border-[#4A7FA7]/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <div className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] mb-1">{t('needsAttention')}</p>
            <p className="text-2xl font-[850] text-[#F6FAFD]">{stats.immediate_attention_count}</p>
          </div>

          <div className="bg-[#1A3D63]/60 glow rounded-2xl border border-[#4A7FA7]/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-5 h-5 text-[#4A7FA7]" />
              <div className="w-2 h-2 rounded-full bg-[#4A7FA7]" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] mb-1">{t('avgScore')}</p>
            <p className="text-2xl font-[850] text-[#F6FAFD]">{stats.average_score.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#1A3D63]/60 glow rounded-2xl border border-[#4A7FA7]/30 p-6 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#F6FAFD] flex items-center gap-2">
          <Filter className="w-4 h-4" /> {t('filters')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('criticalFilter')}</label>
            <select
              value={filterCritical === null ? "" : String(filterCritical)}
              onChange={(e) => setFilterCritical(e.target.value === "" ? null : e.target.value === "true")}
              className="w-full h-12 bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl px-4 text-[#F6FAFD] font-semibold text-sm outline-none cursor-pointer"
            >
              <option value="">{t('all')}</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('attentionFilter')}</label>
            <select
              value={filterAttention === null ? "" : String(filterAttention)}
              onChange={(e) => setFilterAttention(e.target.value === "" ? null : e.target.value === "true")}
              className="w-full h-12 bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl px-4 text-[#F6FAFD] font-semibold text-sm outline-none cursor-pointer"
            >
              <option value="">{t('all')}</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('minScore')}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder="0"
              className="w-full h-12 bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl px-4 text-[#F6FAFD] font-semibold text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('maxScore')}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              placeholder="100"
              className="w-full h-12 bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl px-4 text-[#F6FAFD] font-semibold text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* Red Flags List */}
      <div className="bg-[#1A3D63]/60 glow rounded-[2.5rem] border border-[#4A7FA7]/30 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[#4A7FA7]/20">
            {[1, 2, 3, 4].map((i) => (
              <RedFlagItemSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="p-20 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-red-400 font-bold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
            >
              Retry
            </button>
          </div>
        ) : redFlags.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-[#4A7FA7] mx-auto" />
            <p className="text-[#B3CFE5] font-bold">No red flags found. All calls are compliant!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#4A7FA7]/20">
            {redFlags.map((flag) => (
              <div
                key={flag.id}
                onClick={() => viewDetail(flag.call_id)}
                className="flex items-center gap-6 p-8 hover:bg-[#1A3D63]/80 transition-all cursor-pointer group"
              >
                {/* Priority Icon */}
                {flag.has_critical_issues && (
                  <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
                    <Shield className="w-5 h-5 text-white fill-white" />
                  </div>
                )}

                {/* Score Badge */}
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-lg",
                  flag.score >= 80 ? "bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63] text-white shadow-[#4A7FA7]/20" :
                    flag.score >= 60 ? "bg-yellow-500 text-white shadow-yellow-500/20" :
                      flag.score >= 40 ? "bg-orange-500 text-white shadow-orange-500/20" :
                        "bg-red-500 text-white shadow-red-500/20"
                )}>
                  {flag.score.toFixed(0)}
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="text-[17px] font-extrabold text-[#F6FAFD] tracking-tight truncate">
                      {flag.file_name || `Call #${flag.call_id.split('-')[0]}`}
                    </h5>
                    {!flag.reviewed_at ? (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        Pending Review
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-[#4A7FA7]/20 text-[#4A7FA7] border border-[#4A7FA7]/30">
                        <Eye className="w-3 h-3" />
                        Reviewed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-5">
                    <span className="text-[10px] font-bold text-[#B3CFE5] uppercase tracking-widest">
                      ID: {flag.call_id.split('-')[0]}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4A7FA7]/30" />
                    <span className="flex items-center gap-2 text-[11px] font-black text-[#B3CFE5] uppercase tracking-widest">
                      <AlertCircle className="w-3.5 h-3.5" /> {flag.flags_count} Flag{flag.flags_count !== 1 ? 's' : ''}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4A7FA7]/30" />
                    <span className="text-[11px] font-bold text-[#B3CFE5] uppercase tracking-widest">
                      {new Date(flag.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="w-11 h-11 rounded-2xl bg-[#1A3D63]/40 text-[#4A7FA7] flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-[#4A7FA7] group-hover:to-[#1A3D63] group-hover:text-white transition-all group-hover:scale-110 shadow-sm">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

interface InterventionModalProps {
  modal: {
    template_id: string;
    question_id: string;
    current_answer: string;
    current_score: number;
    current_reasoning: string;
  };
  onClose: () => void;
  onSubmit: (payload: {
    template_id: string;
    question_id: string;
    corrected_answer: string;
    corrected_score: number;
    corrected_reasoning: string;
    corrected_evidence?: any[];
  }) => void;
  existingEdit?: {
    template_id: string;
    question_id: string;
    corrected_answer: string;
    corrected_score: number;
    corrected_reasoning: string;
    corrected_evidence?: any[];
  };
  onRemove?: () => void;
}

function InterventionModal({ modal, onClose, onSubmit, existingEdit, onRemove }: InterventionModalProps) {
  const [correctedAnswer, setCorrectedAnswer] = useState(existingEdit?.corrected_answer || modal.current_answer);
  const [correctedScore, setCorrectedScore] = useState(existingEdit?.corrected_score || modal.current_score);
  const [correctedReasoning, setCorrectedReasoning] = useState(existingEdit?.corrected_reasoning || '');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = () => {
    if (!correctedReasoning.trim()) {
      alert('Please provide a reason for this correction.');
      return;
    }

    onSubmit({
      template_id: modal.template_id,
      question_id: modal.question_id,
      corrected_answer: correctedAnswer,
      corrected_score: correctedScore,
      corrected_reasoning: correctedReasoning,
    });
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1A3D63] w-full max-w-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col rounded-3xl shadow-2xl border border-[#4A7FA7]/30 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 md:p-8 border-b border-[#4A7FA7]/20 bg-[#0A1931]/60 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-xl md:text-2xl font-[850] text-[#F6FAFD] tracking-tight">Edit Answer</h3>
            <p className="text-xs md:text-sm font-semibold text-[#B3CFE5] mt-1 truncate">Manual correction for {modal.question_id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-[#1A3D63]/60 flex items-center justify-center transition-all text-[#B3CFE5] flex-shrink-0"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto flex-1">
          {/* Current Answer */}
          <div className="p-4 rounded-xl bg-[#0A1931]/60 border border-[#4A7FA7]/20 space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-[#B3CFE5]">Current Answer</p>
            <p className="text-sm font-bold text-[#F6FAFD]">{modal.current_answer}</p>
            <p className="text-xs font-medium text-[#B3CFE5]">{modal.current_reasoning}</p>
            <p className="text-xs font-bold text-[#B3CFE5]">Score: {modal.current_score}</p>
          </div>

          {/* Corrected Answer */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-[#B3CFE5]">
              Corrected Answer
            </label>
            <select
              value={correctedAnswer}
              onChange={(e) => {
                const val = e.target.value;
                setCorrectedAnswer(val);
                // Auto-set score based on answer
                if (val.toLowerCase() === 'yes') setCorrectedScore(100);
                else if (val.toLowerCase() === 'no') setCorrectedScore(0);
              }}
              className="w-full h-12 px-4 bg-[#0A1931] border border-[#4A7FA7]/30 rounded-xl text-[#F6FAFD] font-semibold outline-none focus:border-[#4A7FA7] transition-all"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Corrected Score */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-[#B3CFE5]">
              Corrected Score (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={correctedScore}
              onChange={(e) => setCorrectedScore(Number(e.target.value))}
              className="w-full h-12 px-4 bg-[#0A1931] border border-[#4A7FA7]/30 rounded-xl text-[#F6FAFD] font-semibold outline-none focus:border-[#4A7FA7] transition-all"
            />
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-[#B3CFE5]">
              Reason for Correction *
            </label>
            <textarea
              value={correctedReasoning}
              onChange={(e) => setCorrectedReasoning(e.target.value)}
              placeholder="Explain why you're correcting this answer..."
              rows={4}
              className="w-full px-4 py-3 bg-[#0A1931] border border-[#4A7FA7]/30 rounded-xl text-[#F6FAFD] font-medium outline-none focus:border-[#4A7FA7] transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sticky bottom-0 bg-[#1A3D63] pb-2">
            {existingEdit && onRemove && (
              <button
                onClick={onRemove}
                className="h-11 sm:h-12 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all border border-red-500/30"
              >
                Remove
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 h-11 sm:h-12 bg-[#0A1931] hover:bg-[#0A1931]/80 text-[#B3CFE5] rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all border border-[#4A7FA7]/20"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] hover:opacity-90 text-[#F6FAFD] rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4A7FA7]/20"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{existingEdit ? 'Update' : 'Add to Queue'}</span>
              <span className="sm:hidden">{existingEdit ? 'Update' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function RedFlagsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-[#1A3D63]/40 border-t-[#4A7FA7] animate-spin" />
      </div>
    }>
      <RedFlagsPageContent />
    </Suspense>
  );
}
