"use client";

import {
  BarChart3,
  MessageSquareQuote,
  ScrollText,
  Target,
  ShieldAlert,
  Zap,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Clock,
  Sparkles,
  Search,
  Users,
  AlertCircle,
  FileSearch,
  ChevronRight,
  ShieldCheck,
  XCircle,
  Play,
  Pause,
  HelpCircle,
  Eye,
  EyeOff,
  Loader2,
  CircleDot,
  MinusCircle,
  Edit,
  Save,
  X as XIcon,
  History
} from "lucide-react";
import { cn } from "../lib/utils";
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key, useState } from "react";

interface ResultData {
  call_id: string;
  status: string;
  review_status: string;
  overall_score: number;
  score_version?: number; // 🆕 Scoring version (2 = new 0-100 scale)
  smart_summary?: string | null; // 🆕 AI-generated summary
  call_success?: boolean | null; // 🆕 Business outcome (renamed from analysis_success)
  call_success_reason?: string | null; // 🆕 Business insight (renamed from analysis_success_reason)
  user_meta_tags?: string[] | null; // 🆕 User-provided tags
  ai_meta_tags?: string[] | null; // 🆕 AI-generated tags
  final_meta_tags?: string[] | null; // 🆕 Merged unique tags
  custom_questions?: Array<{ text: string; weight: number }> | null; // 🆕 Custom questions
  campaign_name?: string | null;
  questionnaire_name?: string | null;
  script_name?: string | null;
  human_intervention_count?: number;
  human_interventions?: Array<{
    timestamp: string;
    question_id: string;
    template_id: string;
    corrected_score: number;
    corrected_answer: string;
    corrected_evidence: any;
    corrected_reasoning: string;
  }>;
  transcript: {
    utterances: Array<{
      speaker_id: string;
      text: string;
      start_ms: number;
      end_ms: number;
    }>;
    metrics: {
      silence_ratio: number;
      turn_count: number;
    };
    provider_metadata?: { // 🆕 Provider info (check for manual uploads)
      provider: string;
      source: string;
    };
  };
  prepared_script: {
    sections: Array<{
      section_id: number;
      title: string;
      required: boolean;
      anchors?: string[];
    }>;
    questions?: Array<{
      question_id: string;
      question_text: string;
      response_type: string;
      expected_answers?: string[];
      required: boolean;
      purpose?: string;
    }>;
    products?: Array<{
      product_id: string;
      name: string;
      description: string;
      conditions?: string;
    }>;
    branching_points?: Array<{
      decision_id: string;
      question: string;
      yes_action: string;
      no_action: string;
    }>;
    compliance_requirements: Array<{
      label: string;
      severity: string;
    }>;
  };
  qa_result: {
    results: any;
    answers: Array<{
      question_id: string;
      answer: string;
      score: number;
      reasoning_summary: string;
      question_text?: string;
      is_edited?: boolean;
      evidence: Array<{
        quote: string;
      }>;
    }>;
    summary: string;
    overall_score_breakdown?: { // 🆕 Detailed score breakdown
      mode: string;
      score_version: number;
      per_template_scores: Record<string, number>;
      red_flag_score: number;
      avg_scoring_score: number;
      composite_overall_score: number;
    };
  };
  analytics: {
    silence: {
      ratio: number;
      gap_count: number;
    };
    sentiment: {
      overall: {
        label: string;
        score: number;
      };
    };
    red_flags: {
      has_red_flags: boolean;
      flags: Array<{
        label: string;
        severity: string;
        evidence?: string;
      }>;
    };
  };
}

export function ResultsPanel({ data, isHydrating = false }: { data: ResultData, isHydrating?: boolean }) {
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(data?.review_status || 'unreviewed');
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

  if (!data && !isHydrating) return null;

  // Use dummy data for skeletons if data is null during initial hydration
  const safeData: ResultData = data || {
    call_id: 'pending...',
    overall_score: 0,
    review_status: 'unreviewed',
    status: 'processing',
    analytics: { sentiment: { overall: { label: 'analyzing...' } }, red_flags: { has_red_flags: false, flags: [] }, silence: { ratio: 0, gap_count: 0 } },
    qa_result: { summary: 'Processing cognitive audit...', answers: [], results: [] },
    transcript: { utterances: [], metrics: { turn_count: 0, silence_ratio: 0 } },
    prepared_script: { sections: [], compliance_requirements: [] }
  } as any;

  const sentimentLabel = safeData.analytics?.sentiment?.overall?.label || (isHydrating ? 'analyzing...' : 'neutral');
  const isNeutral = sentimentLabel === 'neutral';
  const isPositive = sentimentLabel === 'positive';
  const redFlagsCount = safeData.analytics?.red_flags?.flags?.length || 0;
  const hasRedFlags = !!safeData.analytics?.red_flags?.has_red_flags;

  // Check if audio is available (not from manual upload)
  const hasAudio = safeData.transcript?.provider_metadata?.provider !== 'manual_upload';

  const handleMarkAsReviewed = async () => {
    if (!safeData.call_id || safeData.call_id === 'pending...') return;

    setIsMarkingReviewed(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const response = await fetch(`${baseUrl}/api/v1/results/calls/${safeData.call_id}/reviewed`, {
        method: "PATCH",
        headers: {
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (response.ok) {
        setReviewStatus('reviewed');
        // Optionally show success message
      } else {
        console.error("Failed to mark as reviewed");
        alert("Failed to mark call as reviewed. Please try again.");
      }
    } catch (error) {
      console.error("Error marking as reviewed:", error);
      alert("Error marking call as reviewed. Please try again.");
    } finally {
      setIsMarkingReviewed(false);
    }
  };

  const handleSubmitAllEdits = async () => {
    if (pendingEdits.size === 0 || !safeData.call_id || safeData.call_id === 'pending...') return;

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
      const response = await fetch(`${baseUrl}/api/v1/calls/${safeData.call_id}/interventions`, {
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
        const response = await fetch(`${baseUrl}/api/v1/calls/${safeData.call_id}`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        const updatedData = await response.json();

        if (updatedData.status === 'ready') {
          // Recalculation complete - reload the page
          window.location.reload();
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

  return (
    <div className="w-full space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-10 px-4 sm:px-6">
      {/* Header Pipeline State */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between border-b border-[#1f3a3408] pb-12">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 px-1">
            <span className={cn(
              "px-2 sm:px-3 py-1 text-[8px] sm:text-[10px] uppercase font-[900] tracking-widest rounded-lg transition-all duration-700 whitespace-nowrap",
              isHydrating ? "bg-[#1F3A3420] text-[#1F3A3440] animate-pulse" : "bg-[#1F3A34] text-white shadow-lg shadow-[#1F3A3420]"
            )}>
              {isHydrating ? 'Hydrating Signal...' : 'Audit Ready'}
            </span>
            {safeData.call_success !== null && (
              <span className={cn(
                "px-2 sm:px-3 py-1 text-[8px] sm:text-[10px] uppercase font-[900] tracking-widest rounded-lg whitespace-nowrap",
                safeData.call_success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {safeData.call_success ? '✅ Success' : '❌ Failed'}
              </span>
            )}
            <span className={cn(
              "px-2 sm:px-3 py-1 text-[8px] sm:text-[10px] uppercase font-[900] tracking-widest rounded-lg flex items-center gap-1.5 whitespace-nowrap",
              reviewStatus === 'reviewed' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
            )}>
              {reviewStatus === 'reviewed' ? <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
              {reviewStatus === 'reviewed' ? 'Reviewed' : 'Unreviewed'}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#1F3A3440] uppercase tracking-widest whitespace-nowrap">
              Trace ID: {safeData.call_id?.split('-')[0] || '...'}...
            </span>
          </div>

          {/* Campaign, Questionnaire, Script Info */}
          {(safeData.campaign_name || safeData.questionnaire_name || safeData.script_name) && (
            <div className="flex flex-wrap items-center gap-3 mb-4 px-1">
              {safeData.campaign_name && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#1F3A3460]">Campaign:</span>
                  <span className="text-[10px] font-bold text-[#1F3A34] px-2 py-0.5 bg-purple-50 border border-purple-200 rounded-md">
                    {safeData.campaign_name}
                  </span>
                </div>
              )}
              {safeData.questionnaire_name && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#1F3A3460]">Questionnaire:</span>
                  <span className="text-[10px] font-bold text-[#1F3A34] px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md">
                    {safeData.questionnaire_name}
                  </span>
                </div>
              )}
              {safeData.script_name && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#1F3A3460]">Script:</span>
                  <span className="text-[10px] font-bold text-[#1F3A34] px-2 py-0.5 bg-green-50 border border-green-200 rounded-md">
                    {safeData.script_name}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            {reviewStatus !== 'reviewed' && !isHydrating && (
              <button
                onClick={handleMarkAsReviewed}
                disabled={isMarkingReviewed}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                {isMarkingReviewed ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Mark as Reviewed
                  </>
                )}
              </button>
            )}
          </div>
          <h2 className="text-[32px] sm:text-[42px] md:text-[52px] font-[850] text-[#1F3A34] tracking-tight leading-none mb-6">
            Neural Analysis
          </h2>
          <div className={cn(
            "p-5 rounded-2xl border transition-all duration-700",
            isHydrating ? "bg-[#1F3A3403] border-[#1f3a3405] animate-pulse" : "bg-[#F4F8F9] border-[#1f3a3405]"
          )}>
            <p className="text-[#1F3A3470] text-sm font-medium leading-relaxed italic">
              <Sparkles className={cn("w-4 h-4 inline-block mr-2 text-yellow-500 fill-current", isHydrating && "animate-spin")} />
              "{safeData.smart_summary || safeData.qa_result?.summary || safeData.qa_result?.results?.[0]?.summary || 'Generating neural summary...'}"
            </p>
          </div>
          {safeData.call_success !== null && safeData.call_success_reason && (
            <div className="mt-6">
              <h5 className="text-xs font-black uppercase tracking-widest text-[#1F3A3460] mb-3 px-1">
                Call Success/Failure Summary
              </h5>
              <div className="p-5 rounded-2xl border bg-[#F4F8F9] border-[#1f3a3410]">
                <p className="text-sm font-bold leading-relaxed text-[#1F3A34]">
                  {safeData.call_success_reason}
                </p>
              </div>
            </div>
          )}
          {safeData.final_meta_tags && safeData.final_meta_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-6">
              {safeData.final_meta_tags.map((tag: string) => {
                const isUserTag = safeData.user_meta_tags?.includes(tag);
                const isAiTag = safeData.ai_meta_tags?.includes(tag);
                return (
                  <span
                    key={tag}
                    className={cn(
                      "px-2 sm:px-2.5 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-md border whitespace-nowrap",
                      isUserTag && !isAiTag ? "bg-blue-50 text-blue-700 border-blue-200" :
                        isAiTag && !isUserTag ? "bg-purple-50 text-purple-700 border-purple-200" :
                          "bg-[#1F3A3408] text-[#1F3A34] border-[#1f3a3405]"
                    )}
                    title={isUserTag && !isAiTag ? "User-provided tag" : isAiTag && !isUserTag ? "AI-generated tag" : "User + AI tag"}
                  >
                    #{tag}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <MetricCard
            label="Overall Grade"
            value={isHydrating && !safeData.overall_score ? "..." : (safeData.overall_score || 0).toFixed(0) + "/100"}
            icon={Target}
            color={(safeData.overall_score || 0) >= 80 ? 'green' : (safeData.overall_score || 0) >= 50 ? 'neutral' : 'red'}
            isPending={isHydrating && !safeData.overall_score}
          />
          <MetricCard
            label="Sentiment"
            value={sentimentLabel}
            icon={isPositive ? TrendingUp : TrendingDown}
            color={isPositive ? 'green' : isNeutral ? 'neutral' : 'red'}
            isPending={isHydrating && sentimentLabel === 'analyzing...'}
          />
          <MetricCard
            label="Risk Flags"
            value={hasRedFlags ? redFlagsCount.toString() : "Clean"}
            icon={ShieldAlert}
            color={hasRedFlags ? 'red' : 'green'}
            isPending={isHydrating && !safeData.analytics?.red_flags}
          />
          <MetricCard
            label="Confidence"
            value={isHydrating ? "Processing..." : "High Fidelity"}
            icon={Zap}
            color={isHydrating ? "neutral" : "green"}
            isPending={isHydrating}
          />
        </div>
      </div>

      {/* High-Fidelity Audio Player Integration - Only show if audio is available */}
      {!isHydrating && safeData.call_id !== 'pending...' && hasAudio && (
        <div className="p-8 rounded-[2.5rem] bg-[#1F3A34] text-white apple-shadow-lg border border-[#1f3a3410] flex flex-col md:flex-row items-center gap-8 animate-in fade-in zoom-in-95 duration-700">
          <div className="flex-1 space-y-2">
            <h4 className="text-lg font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" /> Call Audio Signal
            </h4>
            <p className="text-sm font-medium text-white/80">Stream high-fidelity conversation audio with seek support.</p>
          </div>
          <audio
            id="call-audio-player"
            controls
            preload="metadata"
            className="w-full md:w-2/3 h-10 accent-[#F4F8F9] bg-[#1F3A3405] rounded-xl"
            src={`${process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com"}/api/v1/media/calls/${safeData.call_id}/audio`}
          >
            Your browser does not support audio playback.
          </audio>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8 items-start">
        {/* Left Column (8 cols): Audit & Transcript */}
        <div className="lg:col-span-8 space-y-20">

          {/* Audit Scoreboard */}
          <section className="space-y-10">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-2xl font-[850] text-[#1F3A34] tracking-tight flex items-center gap-3">
                <Target className="w-6 h-6 text-[#1F3A3460]" /> Audit Findings
              </h4>
              <div className="flex items-center gap-4 text-[11px] font-[900] text-[#1F3A3440] uppercase tracking-widest">
                {safeData.human_intervention_count !== undefined && safeData.human_intervention_count > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-green-700">{safeData.human_intervention_count} Human Verifications</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Success</span>
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Improvement</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {isHydrating && (!safeData.qa_result?.results || safeData.qa_result.results.length === 0) ? (
                /* Skeleton Loader for Audit Findings */
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={`skel-${i}`} className="bg-[#1F3A3403] rounded-[2.5rem] border border-[#1f3a3405] p-10 space-y-6 animate-pulse">
                    <div className="h-4 w-24 bg-[#1F3A3410] rounded-full" />
                    <div className="h-8 w-3/4 bg-[#1F3A3408] rounded-xl" />
                    <div className="h-20 w-full bg-[#1F3A3405] rounded-2xl" />
                  </div>
                ))
              ) : (
                (safeData.qa_result?.results || []).map((templateResult: any, templateIdx: number) => (
                  <div key={templateIdx} className="space-y-6">
                    {/* Template Header for Custom Questions */}
                    {templateResult.template_id === 'custom_questions' && (
                      <div className="flex items-center gap-3 px-1 mb-4">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <h5 className="text-xl font-[850] text-[#1F3A34] tracking-tight">Custom Questions</h5>
                      </div>
                    )}
                    {/* Answers */}
                    {(templateResult.answers || []).map((answer: any, idx: number) => {
                      // Get original question text for custom questions or from answer.question_text
                      const questionText = answer.question_text ||
                        (templateResult.template_id === 'custom_questions' && safeData.custom_questions
                          ? safeData.custom_questions[parseInt(answer.question_id.replace('custom_', '')) - 1]?.text
                          : null);

                      return (
                        <div key={idx} className="group bg-white rounded-[2.5rem] border border-[#1f3a3410] shadow-2xl shadow-[#1f3a3405] overflow-hidden hover:border-[#1f3a3420] transition-all">
                          <div className="p-10 space-y-6">
                            <div className="flex justify-between items-start gap-8">
                              <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black text-[#1F3A3440] uppercase tracking-[0.2em]">{answer.question_id}</span>
                                    <ChevronRight className="w-3 h-3 text-[#1F3A3420]" />
                                    {(answer.is_edited || (safeData.human_interventions?.some(
                                      (i: any) => i.question_id === answer.question_id && i.template_id === templateResult.template_id
                                    ))) && (
                                        <span className="px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-green-100 text-green-700 rounded-md border border-green-200 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Human Verified
                                        </span>
                                      )}
                                  </div>
                                  {!isRecalculating && !answer.skipped && (
                                    <div className="flex items-center gap-2">
                                      {getPendingEdit(templateResult.template_id, answer.question_id) && (
                                        <span className="px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 rounded-md border border-orange-200">
                                          Pending Edit
                                        </span>
                                      )}
                                      <button
                                        onClick={() => setEditingQuestionId(`${templateResult.template_id}_${answer.question_id}`)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all opacity-0 group-hover:opacity-100"
                                        title="Edit answer"
                                      >
                                        <Edit className="w-3 h-3" />
                                        Edit
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {questionText && (
                                  <p className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                                    Q: {questionText}
                                  </p>
                                )}
                                {/* Show actual answer for custom questions, otherwise reasoning summary */}
                                {templateResult.template_id === 'custom_questions' && answer.answer && answer.answer !== 'yes' && answer.answer !== 'no' ? (
                                  <div className="space-y-2">
                                    <h5 className="text-[19px] font-[850] text-[#1F3A34] tracking-tight leading-snug">{answer.answer}</h5>
                                    <p className="text-sm text-[#1F3A3470] font-medium">{answer.reasoning_summary}</p>
                                  </div>
                                ) : (
                                  <h5 className="text-[19px] font-[850] text-[#1F3A34] tracking-tight leading-snug">{answer.reasoning_summary}</h5>
                                )}
                                {/* Show extracted_info if present */}
                                {answer.extracted_info && (
                                  <div className="mt-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                                    <p className="text-sm font-semibold text-blue-900">{answer.extracted_info}</p>
                                  </div>
                                )}
                              </div>
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
                                templateResult.template_id === 'custom_questions' && answer.answer && answer.answer !== 'yes' && answer.answer !== 'no'
                                  ? 'bg-blue-500 text-white shadow-blue-500/20'
                                  : String(answer.answer || '').toLowerCase() === 'yes'
                                    ? 'bg-green-500 text-white shadow-green-500/20'
                                    : answer.skipped
                                      ? 'bg-gray-400 text-white shadow-gray-400/20'
                                      : 'bg-red-500 text-white shadow-red-500/20'
                              )}>
                                {templateResult.template_id === 'custom_questions' && answer.answer && answer.answer !== 'yes' && answer.answer !== 'no' ? (
                                  <CheckCircle2 className="w-7 h-7" />
                                ) : String(answer.answer || '').toLowerCase() === 'yes' ? (
                                  <ShieldCheck className="w-7 h-7" />
                                ) : answer.skipped ? (
                                  <MinusCircle className="w-7 h-7" />
                                ) : (
                                  <XCircle className="w-7 h-7" />
                                )}
                              </div>
                            </div>

                            {/* Show latest edit if question has interventions - Full width */}
                            {safeData.human_interventions && (() => {
                              const interventions = safeData.human_interventions.filter(
                                (i: any) => i.question_id === answer.question_id && i.template_id === templateResult.template_id
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
                                        onClick={() => setViewHistoryFor({ template_id: templateResult.template_id, question_id: answer.question_id })}
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

                            {(answer.evidence?.length || 0) > 0 && (() => {
                              const evidence = answer.evidence[0];
                              const segmentId = `${answer.question_id}_${evidence?.start_ms}`;
                              const isPlaying = playingSegment === segmentId;

                              return (
                                <div
                                  onClick={() => {
                                    if (!hasAudio) return;

                                    const player = document.getElementById('call-audio-player') as HTMLAudioElement;
                                    if (!player || !evidence) return;

                                    if (isPlaying) {
                                      // Pause
                                      player.pause();
                                      setPlayingSegment(null);
                                    } else {
                                      // Play chunk
                                      const startTime = (evidence.start_ms || 0) / 1000;
                                      const endTime = (evidence.end_ms || evidence.start_ms || 0) / 1000;

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
                                    "p-6 rounded-2xl bg-[#1F3A3405] border border-[#1f3a3408] transition-all relative group/evidence",
                                    hasAudio && "group-hover:border-[#1F3A34] cursor-pointer hover:bg-[#1F3A3410]",
                                    isPlaying && "border-[#1F3A34] bg-[#1F3A3410]"
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <MessageSquareQuote className="w-4 h-4 text-[#1F3A3440]" />
                                      <span className="text-[11px] font-black uppercase tracking-widest text-[#1F3A3450]">Evidence Trace</span>
                                    </div>
                                    {hasAudio && (
                                      <div className={cn(
                                        "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-colors",
                                        isPlaying ? "text-[#1F3A34]" : "text-[#1F3A3440] group-hover/evidence:text-[#1F3A34]"
                                      )}>
                                        {isPlaying ? (
                                          <>
                                            <Pause className="w-2.5 h-2.5 fill-current" /> Pause
                                          </>
                                        ) : (
                                          <>
                                            <Play className="w-2.5 h-2.5 fill-current" /> Play Segment
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[15px] font-bold text-[#1F3A3490] italic leading-relaxed">
                                    "{evidence?.quote || 'No specific quote provided'}"
                                  </p>
                                  <div className="mt-3 text-[10px] font-black text-[#1F3A3440] uppercase tracking-tighter">
                                    {evidence?.start_ms && evidence?.end_ms ? (
                                      <>
                                        {((evidence.start_ms) / 1000).toFixed(1)}s - {((evidence.end_ms) / 1000).toFixed(1)}s
                                        <span className="ml-2 text-[#1F3A3420]">
                                          ({(((evidence.end_ms - evidence.start_ms) / 1000).toFixed(1))}s duration)
                                        </span>
                                      </>
                                    ) : (
                                      <>Starts at {((evidence?.start_ms || 0) / 1000).toFixed(1)}s</>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* New Conversational Transcript */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xl font-[850] text-[#1F3A34] tracking-tight flex items-center gap-3">
                <ScrollText className="w-5 h-5 text-[#1F3A3460]" /> Transcription
              </h4>
              <div className="flex items-center gap-5 text-[11px] font-[900] text-[#1F3A3460] uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {safeData.transcript?.metrics?.turn_count || 0} Turns</div>
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {((safeData.transcript?.utterances?.slice(-1)[0]?.end_ms || 0) / 1000).toFixed(0)}s</div>
              </div>
            </div>

            <div className="p-1.5 w-full rounded-[3.5rem] bg-[#1F3A3415] overflow-hidden">
              <div className="bg-[#F8FBFC] rounded-[3.4rem] p-12 space-y-12 max-h-[850px] overflow-y-auto scrollbar-hide">
                {isHydrating && (safeData.transcript?.utterances || []).length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={`transcript-skel-${i}`} className={cn("flex gap-8 max-w-[85%] animate-pulse", i % 2 === 0 ? "mr-auto" : "ml-auto flex-row-reverse")}>
                      <div className="w-12 h-12 rounded-2xl bg-[#1F3A3410] shrink-0" />
                      <div className="h-16 w-64 bg-[#1F3A3405] rounded-[2rem]" />
                    </div>
                  ))
                ) : (
                  (safeData.transcript?.utterances || []).map((utt, i, arr) => {
                    // Determine if this is agent or customer
                    // Try multiple detection methods:
                    // 1. Check if speaker_id is "user_1" (Agent) or "user_2" (Customer)
                    // 2. Check numeric IDs: speaker 0 = Agent, speaker 1 = Customer
                    // 3. Fallback: alternate based on index and check for speaker changes

                    let isAgent = false;

                    if (utt.speaker_id === "user_1" || utt.speaker_id === "0" || utt.speaker_id === "speaker_0") {
                      isAgent = true;
                    } else if (utt.speaker_id === "user_2" || utt.speaker_id === "1" || utt.speaker_id === "speaker_1") {
                      isAgent = false;
                    } else {
                      // Fallback: detect speaker changes
                      if (i === 0) {
                        isAgent = true; // First utterance is usually agent
                      } else {
                        // If speaker_id changed from previous, alternate
                        isAgent = arr[i - 1].speaker_id !== utt.speaker_id ? !isAgent : isAgent;
                      }
                    }

                    return (
                      <div key={i} className={cn(
                        "flex gap-8 max-w-[85%]",
                        isAgent ? "mr-auto" : "ml-auto flex-row-reverse text-right"
                      )}>
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm",
                          isAgent ? "bg-[#1F3A34] text-white shadow-lg shadow-[#1f3a3420]" : "bg-[#1F3A3420] text-[#1F3A34]"
                        )}>
                          {isAgent ? "A" : "C"}
                        </div>
                        <div className="space-y-2">
                          <p className={cn(
                            "text-[15px] font-[650] leading-relaxed p-6 rounded-[2rem]",
                            isAgent
                              ? "bg-white border border-[#1f3a3408] text-[#1F3A34] shadow-sm"
                              : "bg-[#1F3A34] text-white shadow-xl shadow-[#1f3a3415]"
                          )}>
                            {utt.text}
                          </p>
                          <p className="text-[11px] font-extrabold text-[#1F3A3470] uppercase tracking-widest px-1 mt-1">
                            At {(utt.start_ms / 1000).toFixed(1)}s
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Metrics & Script Reference */}
        <div className="lg:col-span-4 space-y-12 h-fit md:sticky md:top-8">
          {/* Signal Dynamics Card */}
          <div className="rounded-[3rem] bg-[#1F3A34] p-10 shadow-2xl shadow-[#1F3A3440] text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-32 h-32" />
            </div>
            <div className="relative">
              <h4 className="text-2xl font-[850] text-[#F4F8F9] leading-tight mb-8">Signal Dynamics</h4>
              <div className="space-y-6">
                <DynamicStat label="Silence Index" value={((data.analytics?.silence?.ratio || 0) * 100).toFixed(1) + "%"} sub={`${data.analytics?.silence?.gap_count || 0} Gaps Detected`} />
                <DynamicStat label="Intelligence Confidence" value="98.4%" sub="Neural Precision" />
                <DynamicStat label="Interaction Depth" value={(data.transcript?.metrics?.turn_count || 0).toString()} sub="Speaker Alternations" />
              </div>
            </div>
          </div>

          {/* Script Framework Reference */}
          <div className="p-10 rounded-[3rem] border border-[#1f3a3415] bg-white shadow-xl shadow-[#1f3a3405] space-y-8">
            <div className="flex items-center gap-3">
              <FileSearch className="w-6 h-6 text-[#1F3A3460]" />
              <h4 className="text-xl font-[850] text-[#1F3A34] tracking-tight">Script Framework</h4>
            </div>

            {/* Sections */}
            {data.prepared_script?.sections && data.prepared_script.sections.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-black uppercase tracking-widest text-[#1F3A3460]">Sections</h5>
                {data.prepared_script.sections.map((section, index) => (
                  <div key={section.section_id} className="flex items-start gap-3 py-3 border-b border-[#1f3a3408] last:border-0 group">
                    <div className="w-8 h-8 rounded-xl bg-[#1F3A3410] flex items-center justify-center shrink-0 group-hover:bg-[#1F3A34] transition-all">
                      <CircleDot className="w-4 h-4 text-[#1F3A3480] group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-extrabold text-[#1F3A34]">{section.title}</p>
                        {section.required && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200 shrink-0">
                            Required
                          </span>
                        )}
                      </div>
                      {section.anchors && section.anchors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {section.anchors.map((anchor, idx) => (
                            <span key={idx} className="text-[9px] font-semibold text-[#1F3A3470] bg-[#1F3A3405] px-2 py-0.5 rounded-md border border-[#1f3a3408]">
                              "{anchor}"
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Questions */}
            {data.prepared_script?.questions && data.prepared_script.questions.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-black uppercase tracking-widest text-[#1F3A3460]">Questions ({data.prepared_script.questions.length})</h5>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.prepared_script.questions.map((question) => (
                    <div key={question.question_id} className="p-3 rounded-xl bg-[#F4F8F9] border border-[#1f3a3408] space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#1F3A34] leading-tight">{question.question_text}</p>
                        {question.required && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-bold text-[#1F3A3450] bg-white px-2 py-0.5 rounded-md border border-[#1f3a3408]">
                          {question.response_type}
                        </span>
                        {question.expected_answers && question.expected_answers.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {question.expected_answers.map((answer, idx) => (
                              <span key={idx} className="text-[8px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                {answer}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {question.purpose && (
                        <p className="text-[9px] font-medium text-[#1F3A3460] italic">{question.purpose}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {data.prepared_script?.products && data.prepared_script.products.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-black uppercase tracking-widest text-[#1F3A3460]">Products ({data.prepared_script.products.length})</h5>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.prepared_script.products.map((product) => (
                    <div key={product.product_id} className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
                      <p className="text-xs font-extrabold text-purple-900">{product.name}</p>
                      <p className="text-[10px] font-medium text-purple-700 leading-relaxed">{product.description}</p>
                      {product.conditions && (
                        <p className="text-[9px] font-semibold text-purple-600 bg-white px-2 py-1 rounded border border-purple-200">
                          <span className="font-black">Conditions:</span> {product.conditions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Branching Points */}
            {data.prepared_script?.branching_points && data.prepared_script.branching_points.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-black uppercase tracking-widest text-[#1F3A3460]">Branching Logic ({data.prepared_script.branching_points.length})</h5>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.prepared_script.branching_points.map((branch) => (
                    <div key={branch.decision_id} className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                      <p className="text-xs font-bold text-amber-900">{branch.question}</p>
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="text-[8px] font-black uppercase tracking-wider text-green-600 bg-green-100 px-1.5 py-0.5 rounded shrink-0">Yes</span>
                          <p className="text-[9px] font-medium text-amber-800">{branch.yes_action}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-[8px] font-black uppercase tracking-wider text-red-600 bg-red-100 px-1.5 py-0.5 rounded shrink-0">No</span>
                          <p className="text-[9px] font-medium text-amber-800">{branch.no_action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

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
        const interventions = safeData.human_interventions?.filter(
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
      {editingQuestionId && (() => {
        const [templateId, questionId] = editingQuestionId.split('_');
        // Find the answer data
        const templateResult = (safeData.qa_result?.results || []).find((r: any) => r.template_id === templateId);
        const answer = templateResult?.answers?.find((a: any) => a.question_id === questionId);

        if (!answer) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#1f3a3410] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-[#1f3a3408] bg-[#1F3A3402] flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-[850] text-[#1F3A34] tracking-tight">Edit Answer</h3>
            <p className="text-sm font-semibold text-[#1F3A3440] mt-1">Manual correction for {modal.question_id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-[#1F3A3410] flex items-center justify-center transition-all text-[#1F3A3420]"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Current Answer */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-gray-600">Current Answer</p>
            <p className="text-sm font-bold text-gray-900">{modal.current_answer}</p>
            <p className="text-xs font-medium text-gray-600">{modal.current_reasoning}</p>
            <p className="text-xs font-bold text-gray-700">Score: {modal.current_score}</p>
          </div>

          {/* Corrected Answer */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-[#1F3A3440]">
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
              className="w-full h-12 px-4 bg-[#1F3A3403] border border-[#1f3a3410] rounded-xl text-[#1F3A34] font-semibold outline-none focus:border-[#1F3A34] transition-all"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Corrected Score */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-[#1F3A3440]">
              Corrected Score (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={correctedScore}
              onChange={(e) => setCorrectedScore(Number(e.target.value))}
              className="w-full h-12 px-4 bg-[#1F3A3403] border border-[#1f3a3410] rounded-xl text-[#1F3A34] font-semibold outline-none focus:border-[#1F3A34] transition-all"
            />
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-[#1F3A3440]">
              Reason for Correction *
            </label>
            <textarea
              value={correctedReasoning}
              onChange={(e) => setCorrectedReasoning(e.target.value)}
              placeholder="Explain why you're correcting this answer..."
              rows={4}
              className="w-full px-4 py-3 bg-[#1F3A3403] border border-[#1f3a3410] rounded-xl text-[#1F3A34] font-medium outline-none focus:border-[#1F3A34] transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {existingEdit && onRemove && (
              <button
                onClick={onRemove}
                className="h-12 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm uppercase tracking-wider transition-all border border-red-200"
              >
                Remove
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 h-12 bg-[#1F3A34] hover:bg-[#1F3A34]/90 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1F3A3420]"
            >
              <Save className="w-4 h-4" />
              {existingEdit ? 'Update' : 'Add to Queue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, isPending = false }: { label: string, value: string, icon: any, color: 'green' | 'red' | 'neutral', isPending?: boolean }) {
  return (
    <div className={cn(
      "p-6 rounded-[2rem] bg-white apple-shadow border border-[#1f3a3403] group hover:scale-[1.03] transition-all",
      isPending && "animate-pulse"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-[#1F3A3408] text-[#1F3A3440]">
          <Icon className={cn("w-5 h-5 stroke-[1.5px]", isPending && "animate-spin-slow")} />
        </div>
        <div className={cn(
          "w-2 h-2 rounded-full transition-all duration-700",
          isPending ? "bg-[#1F3A3410]" : color === 'green' ? 'bg-green-500 shadow-sm shadow-green-500/50' : color === 'red' ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-[#1F3A3420]'
        )} />
      </div>
      <p className="text-[10px] font-black text-[#1F3A3440] uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <h5 className={cn(
        "text-[18px] font-[850] text-[#1F3A34] tracking-tight truncate",
        isPending && "text-[#1F3A3420]"
      )}>{value}</h5>
    </div>
  );
}

function DynamicStat({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-white/60 mb-1">
        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{label}</span>
        <span className="text-[15px] font-[850] text-white">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-white/40 rounded-full" style={{ width: value.includes('%') ? value : '50%' }} />
      </div>
      <p className="text-[11px] font-bold text-white/50 tracking-tight mt-1.5">{sub}</p>
    </div>
  );
}
