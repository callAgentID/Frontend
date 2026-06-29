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
  Users,
  FileSearch,
  ChevronRight,
  ChevronDown,
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
  History,
  Search,
  Layers
} from "lucide-react";
import { cn } from "../lib/utils";
import { formatLLMCost, formatTokens } from "../lib/formatters";
import { useApi } from "../lib/useApi";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, ChartLegend);
import { useState, useEffect } from "react";
import { createPortal } from 'react-dom';

interface ResultData {
  call_id: string;
  status: string;
  review_status: string;
  overall_score: number;
  score_version?: number;
  smart_summary?: string | null;
  call_success?: boolean | null;
  call_success_reason?: string | null;
  script_follow_score?: number | null;
  user_meta_tags?: string[] | null;
  ai_meta_tags?: string[] | null;
  final_meta_tags?: string[] | null;
  custom_questions?: Array<{ text: string; weight: number }> | null;
  campaign_name?: string | null;
  questionnaire_name?: string | null;
  script_name?: string | null;
  batch_id?: string | null;
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
  llm_usage_summary?: {
    total_tokens: number;
    total_cost_usd: number;
    breakdown_by_stage: Array<{
      stage: string;
      model: string;
      provider: string;
      tokens: number;
      cost_usd: number;
    }>;
  };
  transcript: {
    utterances: Array<{
      speaker_id: string;
      text: string;
      start_ms: number;
      end_ms: number;
      sentiment?: string;
      emotion?: string;
      confidence?: number;
    }>;
    speakers?: Array<{
      speaker_id: string;
      role?: string;
      talk_time_ms?: number;
      turn_count: number;
      avg_sentiment: number;
      avg_sentiment_label?: string;
    }>;
    metrics: {
      silence_ratio: number;
      turn_count: number;
      total_silence_ms?: number;
      initial_silence_ms?: number;
      end_silence_ms?: number;
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
  const { apiFetch, BASE_URL } = useApi();
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
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const toggleAnswer = (key: string) => setExpandedAnswer(prev => prev === key ? null : key);
  const toggleSection = (key: string) => setExpandedSection(prev => prev === key ? null : key);

  // Auto-expand first section of first template result
  useEffect(() => {
    const firstResult = data?.qa_result?.results?.[0];
    if (firstResult) {
      const firstSection = firstResult.sections?.[0];
      const key = firstSection
        ? `${firstResult.template_id}||${firstSection.section_id}`
        : `${firstResult.template_id}||default`;
      setExpandedSection(key);
    }
  }, [data?.call_id]);

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
      const response = await apiFetch(`/api/v1/results/calls/${safeData.call_id}/reviewed`, {
        method: "PATCH",
        headers: { "Accept": "application/json" },
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
      const response = await apiFetch(`/api/v1/calls/${safeData.call_id}/interventions`, {
        method: "POST",
        headers: { "Accept": "application/json" },
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
    const maxAttempts = 60; // Poll for max 5 minutes (60 * 5 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await apiFetch(`/api/v1/calls/${safeData.call_id}`);
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
    <div className="w-full space-y-16 animate-in fade-in duration-150 duration-150 pb-20 mt-10 px-4 sm:px-6">
      {/* Header Pipeline State */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between border-b border-blue-400/10 pb-12">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 px-1">
            <span className={cn(
              "px-2 sm:px-3 py-1 text-[8px] sm:text-[10px] uppercase font-[900] tracking-widest rounded-lg transition-colors duration-150 whitespace-nowrap",
              isHydrating ? "bg-[#1A3D63]/20 text-[#B3CFE5]/40 animate-pulse" : "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] shadow-lg shadow-[#4A7FA7]/20"
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
            <span className="text-[9px] sm:text-[10px] font-bold text-[#B3CFE5]/40 uppercase tracking-widest whitespace-nowrap">
              Trace ID: {safeData.call_id?.split('-')[0] || '...'}...
            </span>
            {safeData.batch_id && (
              <a
                href={`/batches?id=${safeData.batch_id}`}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors"
                style={{
                  background: 'rgba(44,143,255,0.10)',
                  border: '1px solid rgba(44,143,255,0.22)',
                  color: 'rgba(44,143,255,0.85)',
                }}
                title={`View batch: ${safeData.batch_id}`}
              >
                <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Batch: {safeData.batch_id.split('-')[0]}...
              </a>
            )}
          </div>

          {/* Campaign, Questionnaire, Script Info */}
          {(safeData.campaign_name || safeData.questionnaire_name || safeData.script_name) && (
            <div className="flex flex-wrap items-center gap-3 mb-4 px-1">
              {safeData.campaign_name && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5]">Campaign:</span>
                  <span className="text-[10px] font-bold text-[#F6FAFD] px-2 py-0.5 glass-card rounded-md">
                    {safeData.campaign_name}
                  </span>
                </div>
              )}
              {safeData.questionnaire_name && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5]">Questionnaire:</span>
                  <span className="text-[10px] font-bold text-[#F6FAFD] px-2 py-0.5 glass-card rounded-md">
                    {safeData.questionnaire_name}
                  </span>
                </div>
              )}
              {safeData.script_name && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5]">Script:</span>
                  <span className="text-[10px] font-bold text-[#F6FAFD] px-2 py-0.5 glass-card rounded-md">
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
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
                title="Mark this call as reviewed"
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
          <h2 className="text-[32px] sm:text-[42px] md:text-[52px] font-[850] text-[#F6FAFD] tracking-tight leading-none mb-6">
            Neural Analysis
          </h2>
          <div className={cn(
            "p-5 rounded-2xl border transition-colors duration-150",
            isHydrating ? "bg-[#1A3D63]/20 border-[#4A7FA7]/10 animate-pulse" : "bg-blue-950/20 border-blue-400/15"
          )}>
            <p className="text-[#B3CFE5] text-sm font-medium leading-relaxed italic">
              <Sparkles className={cn("w-4 h-4 inline-block mr-2 text-yellow-500 fill-current", isHydrating && "animate-spin")} />
              "{safeData.smart_summary || safeData.qa_result?.summary || safeData.qa_result?.results?.[0]?.summary || 'Generating neural summary...'}"
            </p>
          </div>
          {safeData.call_success !== null && safeData.call_success_reason && (
            <div className="mt-6">
              <h5 className="text-xs font-black uppercase tracking-widest text-[#B3CFE5] mb-3 px-1">
                Call Success/Failure Summary
              </h5>
              <div className="p-5 rounded-2xl border bg-blue-950/20 border-blue-400/15">
                <p className="text-sm font-bold leading-relaxed text-[#F6FAFD]">
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
                          "bg-[#1A3D63]/30 text-[#B3CFE5] border-blue-400/10"
                    )}
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
            href={`/red-flags?callId=${safeData.call_id}`}
          />
          <MetricCard
            label="Confidence"
            value={isHydrating ? "Processing..." : "High Fidelity"}
            icon={Zap}
            color={isHydrating ? "neutral" : "green"}
            isPending={isHydrating}
          />
          <MetricCard
            label="Script Follow"
            value={safeData.script_follow_score != null ? safeData.script_follow_score.toFixed(0) + "/100" : "N/A"}
            icon={ScrollText}
            color={safeData.script_follow_score == null ? 'neutral' : safeData.script_follow_score >= 80 ? 'green' : safeData.script_follow_score >= 50 ? 'neutral' : 'red'}
            isPending={isHydrating}
            className="col-span-2"
          />
        </div>
      </div>

      {/* High-Fidelity Audio Player Integration - Only show if audio is available */}
      {!isHydrating && safeData.call_id !== 'pending...' && hasAudio && (
        <div className="p-8 rounded-[2.5rem] glass-card text-white apple-shadow-lg border border-blue-400/15 flex flex-col md:flex-row items-center gap-8 animate-in fade-in duration-150 duration-150">
          <div className="flex-1 space-y-2">
            <h4 className="text-lg font-black uppercase tracking-widest text-[#B3CFE5]/50 flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" /> Call Audio Signal
            </h4>
            <p className="text-sm font-medium text-[#B3CFE5]/80">Stream high-fidelity conversation audio with seek support.</p>
          </div>
          <audio
            id="call-audio-player"
            controls
            preload="metadata"
            className="w-full md:w-2/3 h-10 accent-[#4A7FA7] bg-blue-950/20 rounded-xl"
            src={`${BASE_URL}/api/v1/media/calls/${safeData.call_id}/audio`}
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
              <h4 className="text-2xl font-[850] text-[#F6FAFD] tracking-tight flex items-center gap-3">
                <Target className="w-6 h-6 text-[#4A7FA7]" /> Audit Findings
              </h4>
              <div className="flex items-center gap-4 text-[11px] font-[900] text-[#B3CFE5] uppercase tracking-widest">
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
                  <div key={`skel-${i}`} className="bg-[#1A3D63]/20 rounded-[2.5rem] border border-[#4A7FA7]/10 p-10 space-y-6 animate-pulse">
                    <div className="h-4 w-24 bg-[#1A3D63]/30 rounded-full" />
                    <div className="h-8 w-3/4 bg-[#1A3D63]/20 rounded-xl" />
                    <div className="h-20 w-full bg-[#1A3D63]/10 rounded-2xl" />
                  </div>
                ))
              ) : (
                (safeData.qa_result?.results || []).map((templateResult: any, templateIdx: number) => {
                  // Normalize: new format has sections[], old format has flat answers[]
                  const sections: Array<{ section_id: string; title: string; answers: any[] }> =
                    templateResult.sections?.length > 0
                      ? templateResult.sections
                      : [{ section_id: 'default', title: templateResult.template_id === 'custom_questions' ? 'Custom Questions' : '', answers: templateResult.answers || [] }];

                  return (
                  <div key={templateIdx} className="space-y-8">
                    {/* Template-level summary / overall score */}
                    {(templateResult.overall_score != null || templateResult.summary) && (
                      <div className="flex items-center justify-between px-1 py-3 border-b border-blue-400/10">
                        {templateResult.summary && (
                          <p className="text-sm font-medium text-[#B3CFE5] italic flex-1 pr-6">"{templateResult.summary}"</p>
                        )}
                        {templateResult.overall_score != null && (
                          <span className={cn(
                            "shrink-0 px-3 py-1.5 rounded-xl text-sm font-black border",
                            templateResult.overall_score >= 80 ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : templateResult.overall_score >= 50 ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                          )}>
                            {templateResult.overall_score.toFixed(1)}/100
                          </span>
                        )}
                      </div>
                    )}

                    {/* Sections */}
                    {sections.map((section: any, sectionIdx: number) => {
                      const sectionKey = `${templateResult.template_id}||${section.section_id || sectionIdx}`;
                      const isSectionExpanded = expandedSection === sectionKey;
                      const passCount = (section.answers || []).filter((a: any) => String(a.answer || '').toLowerCase() === 'yes').length;
                      const totalCount = section.answers?.length || 0;

                      return (
                      <div key={section.section_id || sectionIdx} className="rounded-2xl border border-blue-400/15 bg-blue-950/15 overflow-hidden">
                        {/* Section accordion header */}
                        <button
                          onClick={() => toggleSection(sectionKey)}
                          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-blue-950/25 transition-colors text-left"
                        >
                          <div className={cn(
                            "p-2 rounded-xl shrink-0",
                            templateResult.template_id === 'custom_questions' ? "bg-purple-50 text-purple-600" : "bg-blue-500/10 text-[#4A7FA7]"
                          )}>
                            {templateResult.template_id === 'custom_questions'
                              ? <HelpCircle className="w-4 h-4" />
                              : <FileSearch className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              {section.title && (
                                <h5 className="text-sm font-[850] text-[#F6FAFD] tracking-tight">{section.title}</h5>
                              )}
                              <span className="text-[10px] font-black text-[#B3CFE5]/50 uppercase tracking-widest">
                                {totalCount} questions
                              </span>
                            </div>
                          </div>
                          {/* Pass/fail mini stats */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="flex items-center gap-1 text-[10px] font-black text-green-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />{passCount}
                            </span>
                            <span className="text-[#B3CFE5]/30 text-[10px]">/</span>
                            <span className="text-[10px] font-black text-[#B3CFE5]/60">{totalCount}</span>
                          </div>
                          <ChevronDown className={cn("w-4 h-4 text-[#B3CFE5]/40 shrink-0 transition-transform duration-200", isSectionExpanded && "rotate-180")} />
                        </button>

                        {/* Section body — answers */}
                        {isSectionExpanded && (
                        <div className="px-3 pb-3 space-y-2 border-t border-blue-400/10">
                        {(section.answers || []).map((answer: any, idx: number) => {
                      // Get original question text for custom questions or from answer.question_text
                      const questionText = answer.question_text ||
                        (templateResult.template_id === 'custom_questions' && safeData.custom_questions
                          ? safeData.custom_questions[parseInt(answer.question_id.replace('custom_', '')) - 1]?.text
                          : null);

                      const answerKey = `${templateResult.template_id}||${answer.question_id}`;
                      const isExpanded = expandedAnswer === answerKey;
                      const isCustomFreeText = templateResult.template_id === 'custom_questions' && answer.answer && answer.answer !== 'yes' && answer.answer !== 'no';
                      const isYes = String(answer.answer || '').toLowerCase() === 'yes';
                      const isPartial = !isYes && !answer.skipped && String(answer.evidence_quality || '').toUpperCase() === 'PARTIAL';
                      const iconBgClass = isCustomFreeText
                        ? 'bg-blue-500 text-white shadow-blue-500/20'
                        : isYes
                          ? 'bg-green-500 text-white shadow-green-500/20'
                          : answer.skipped
                            ? 'bg-gray-400 text-white shadow-gray-400/20'
                            : isPartial
                              ? 'bg-amber-500 text-white shadow-amber-500/20'
                              : 'bg-red-500 text-white shadow-red-500/20';

                      return (
                        <div key={idx} className="group bg-blue-950/25 rounded-2xl border border-blue-400/15 shadow-sm shadow-[#0A1931]/50 hover:border-[#4A7FA7]/50 transition-colors">

                          {/* ── Accordion Header (always visible) ── */}
                          <button
                            onClick={() => toggleAnswer(answerKey)}
                            className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-blue-950/20 transition-colors"
                          >
                            {/* Status icon */}
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md", iconBgClass)}>
                              {isCustomFreeText ? <CheckCircle2 className="w-5 h-5" />
                                : isYes ? <ShieldCheck className="w-5 h-5" />
                                : answer.skipped ? <MinusCircle className="w-5 h-5" />
                                : isPartial ? <MinusCircle className="w-5 h-5" />
                                : <XCircle className="w-5 h-5" />}
                            </div>

                            {/* Question info */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {answer.evidence_quality && (() => {
                                  const eq = String(answer.evidence_quality).toUpperCase();
                                  const tooltipText =
                                    eq === 'DIRECT'  ? "Direct evidence — a clear, explicit quote supports this answer" :
                                    eq === 'PARTIAL' ? "Partial evidence — some supporting context found but not conclusive" :
                                    eq === 'NONE'    ? "No evidence — answer is inferred with no supporting quote" :
                                    `Evidence quality: ${answer.evidence_quality}`;
                                  return (
                                    <span className="relative group/eq cursor-help">
                                      <span className={cn(
                                        "px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border",
                                        eq === 'DIRECT'  ? "bg-green-50 text-green-700 border-green-200" :
                                        eq === 'PARTIAL' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                           "bg-gray-50 text-gray-500 border-gray-200"
                                      )}>
                                        {answer.evidence_quality}
                                      </span>
                                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 rounded-lg bg-[#0A1931] border border-blue-400/20 text-[11px] font-medium text-[#B3CFE5] leading-snug shadow-xl opacity-0 group-hover/eq:opacity-100 transition-opacity duration-150 z-[999] whitespace-normal text-center">
                                        {tooltipText}
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0A1931]" />
                                      </span>
                                    </span>
                                  );
                                })()}
                                {answer.weight != null && (
                                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border bg-blue-950/30 text-[#B3CFE5] border-blue-400/20">
                                    Weight: {answer.weight}
                                  </span>
                                )}
                                {(answer.is_edited || safeData.human_interventions?.some(
                                  (i: any) => i.question_id === answer.question_id && i.template_id === templateResult.template_id
                                )) && (
                                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-green-100 text-green-700 rounded-md border border-green-200 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Human Verified
                                  </span>
                                )}
                                {getPendingEdit(templateResult.template_id, answer.question_id) && (
                                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 rounded-md border border-orange-200">
                                    Pending Edit
                                  </span>
                                )}
                              </div>
                              {questionText && (
                                <p className="text-sm font-semibold text-[#F6FAFD] truncate">{questionText}</p>
                              )}
                            </div>

                            {/* Chevron */}
                            <ChevronDown className={cn("w-4 h-4 text-[#B3CFE5]/50 shrink-0 transition-transform duration-200", isExpanded && "rotate-180")} />
                          </button>

                          {/* ── Accordion Body (expanded details) ── */}
                          {isExpanded && (
                            <div className="px-6 pb-6 space-y-6 border-t border-blue-400/10 pt-5">
                              {/* Edit button */}
                              {!isRecalculating && !answer.skipped && (
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => setEditingQuestionId(`${templateResult.template_id}||${answer.question_id}`)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                                    title="Edit this answer and provide human correction"
                                  >
                                    <Edit className="w-3 h-3" />
                                    Edit
                                  </button>
                                </div>
                              )}

                              {/* Reasoning */}
                              {templateResult.template_id === 'custom_questions' && answer.answer && answer.answer !== 'yes' && answer.answer !== 'no' ? (
                                <div className="space-y-2">
                                  <h5 className="text-[19px] font-[850] text-[#F6FAFD] tracking-tight leading-snug">{answer.answer}</h5>
                                  <p className="text-sm text-[#B3CFE5] font-medium">{answer.reasoning_summary}</p>
                                </div>
                              ) : (
                                <h5 className="text-[17px] font-[850] text-[#F6FAFD] tracking-tight leading-snug">{answer.reasoning_summary}</h5>
                              )}

                              {answer.extracted_info && (
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                                  <p className="text-sm font-semibold text-blue-900">{answer.extracted_info}</p>
                                </div>
                              )}

                              {/* Human intervention */}
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
                                        <p className="text-xs font-bold text-green-900">Last edited: {new Date(latest.timestamp).toLocaleString()}</p>
                                      </div>
                                      {interventions.length > 1 && (
                                        <button
                                          onClick={() => setViewHistoryFor({ template_id: templateResult.template_id, question_id: answer.question_id })}
                                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-green-700 hover:text-green-900 hover:bg-green-100 rounded-md transition-colors"
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

                              {/* Evidence */}
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
                                        player.pause();
                                        setPlayingSegment(null);
                                      } else {
                                        const startTime = (evidence.start_ms || 0) / 1000;
                                        const endTime = (evidence.end_ms || evidence.start_ms || 0) / 1000;
                                        player.currentTime = startTime;
                                        player.play();
                                        setPlayingSegment(segmentId);
                                        let rafId: number;
                                        const checkTime = () => {
                                          if (player.currentTime >= endTime) {
                                            player.pause();
                                            setPlayingSegment(null);
                                          } else {
                                            rafId = requestAnimationFrame(checkTime);
                                          }
                                        };
                                        rafId = requestAnimationFrame(checkTime);
                                        const cancel = () => cancelAnimationFrame(rafId);
                                        player.addEventListener('pause', cancel, { once: true });
                                        player.addEventListener('ended', cancel, { once: true });
                                      }
                                    }}
                                    className={cn(
                                      "p-6 rounded-2xl glass transition-colors relative group/evidence",
                                      hasAudio && "cursor-pointer hover:bg-blue-950/25",
                                      isPlaying && "border-[#4A7FA7] bg-blue-950/25"
                                    )}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <MessageSquareQuote className="w-4 h-4 text-[#B3CFE5]" />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-[#B3CFE5]">Evidence Trace</span>
                                      </div>
                                      {hasAudio && (
                                        <div className={cn(
                                          "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-colors",
                                          isPlaying ? "text-[#4A7FA7]" : "text-[#B3CFE5] group-hover/evidence:text-[#4A7FA7]"
                                        )}>
                                          {isPlaying ? <><Pause className="w-2.5 h-2.5 fill-current" /> Pause</> : <><Play className="w-2.5 h-2.5 fill-current" /> Play Segment</>}
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-[15px] font-bold text-[#B3CFE5] italic leading-relaxed">
                                      "{evidence?.quote || 'No specific quote provided'}"
                                    </p>
                                    <div className="mt-3 text-[10px] font-black text-[#B3CFE5] uppercase tracking-tighter">
                                      {evidence?.start_ms && evidence?.end_ms ? (
                                        <>
                                          {(evidence.start_ms / 1000).toFixed(1)}s - {(evidence.end_ms / 1000).toFixed(1)}s
                                          <span className="ml-2 text-[#B3CFE5]/40">({((evidence.end_ms - evidence.start_ms) / 1000).toFixed(1)}s duration)</span>
                                        </>
                                      ) : (
                                        <>Starts at {((evidence?.start_ms || 0) / 1000).toFixed(1)}s</>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                        })}
                        </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Speakers Section */}
          {safeData.transcript?.speakers && safeData.transcript.speakers.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xl font-[850] text-[#F6FAFD] tracking-tight flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#4A7FA7]" /> Speakers
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {safeData.transcript.speakers.map((speaker) => {
                  // Determine display name - show speaker_id formatted if role is unknown or missing
                  const displayName = speaker.role && speaker.role.toLowerCase() !== 'unknown'
                    ? speaker.role
                    : `Speaker ${speaker.speaker_id}`;

                  return (
                    <div
                      key={speaker.speaker_id}
                      className="p-6 rounded-[2rem] glass-card shadow-xl space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center font-black text-[#F6FAFD] text-lg">
                          {speaker.speaker_id === "user_1" || speaker.speaker_id === "0" || speaker.speaker_id === "speaker_0" ? "A" : "C"}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#F6FAFD]">
                            {displayName}
                          </p>
                          <p className="text-[10px] font-bold text-[#B3CFE5] uppercase tracking-wider">
                            ID: {speaker.speaker_id}
                          </p>
                        </div>
                      </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-black/25 border border-blue-400/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">Turn Count</span>
                        <span className="text-lg font-[850] text-[#F6FAFD]">{speaker.turn_count}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-black/25 border border-blue-400/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">Avg Sentiment</span>
                        <div className="flex items-center gap-2">
                          {speaker.avg_sentiment_label && (
                            <span className={cn(
                              "px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border",
                              speaker.avg_sentiment_label === 'positive' ? "bg-green-50 text-green-700 border-green-200" :
                              speaker.avg_sentiment_label === 'negative' ? "bg-red-50 text-red-700 border-red-200" :
                              "bg-gray-50 text-gray-700 border-gray-200"
                            )}>
                              {speaker.avg_sentiment_label}
                            </span>
                          )}
                          <span className={cn(
                            "text-lg font-[850]",
                            (speaker.avg_sentiment || 0) > 0 ? "text-green-400" : (speaker.avg_sentiment || 0) < 0 ? "text-red-400" : "text-[#B3CFE5]"
                          )}>
                            {(speaker.avg_sentiment !== undefined && speaker.avg_sentiment !== null) ? speaker.avg_sentiment.toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>

                      {speaker.talk_time_ms !== undefined && speaker.talk_time_ms !== null && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-black/25 border border-blue-400/10">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">Talk Time</span>
                          <span className="text-lg font-[850] text-[#F6FAFD]">{(speaker.talk_time_ms / 1000).toFixed(1)}s</span>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Call Metrics Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xl font-[850] text-[#F6FAFD] tracking-tight flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-[#4A7FA7]" /> Call Metrics
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-5 rounded-[1.5rem] glass-card shadow-lg">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5] mb-2">Total Silence</p>
                <p className="text-2xl font-[850] text-[#F6FAFD]">
                  {((safeData.transcript?.metrics?.total_silence_ms || 0) / 1000).toFixed(1)}s
                </p>
              </div>

              <div className="p-5 rounded-[1.5rem] glass-card shadow-lg">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5] mb-2">Silence Ratio</p>
                <p className="text-2xl font-[850] text-[#F6FAFD]">
                  {((safeData.transcript?.metrics?.silence_ratio || 0) * 100).toFixed(1)}%
                </p>
              </div>

              <div className="p-5 rounded-[1.5rem] glass-card shadow-lg">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5] mb-2">Turn Count</p>
                <p className="text-2xl font-[850] text-[#F6FAFD]">
                  {safeData.transcript?.metrics?.turn_count || 0}
                </p>
              </div>

              <div className="p-5 rounded-[1.5rem] glass-card shadow-lg">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5] mb-2">Initial Silence</p>
                <p className="text-2xl font-[850] text-[#F6FAFD]">
                  {((safeData.transcript?.metrics?.initial_silence_ms || 0) / 1000).toFixed(1)}s
                </p>
              </div>

              <div className="p-5 rounded-[1.5rem] glass-card shadow-lg">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5] mb-2">End Silence</p>
                <p className="text-2xl font-[850] text-[#F6FAFD]">
                  {((safeData.transcript?.metrics?.end_silence_ms || 0) / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
          </section>

          {/* New Conversational Transcript */}
          <section className="space-y-6">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <h4 className="text-xl font-[850] text-[#F6FAFD] tracking-tight flex items-center gap-3 shrink-0">
                <ScrollText className="w-5 h-5 text-[#4A7FA7]" /> Transcription
              </h4>
              <div className="flex items-center gap-3 flex-1 justify-end">
                {/* Search bar */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B3CFE5]/50 pointer-events-none" />
                  <input
                    type="text"
                    value={transcriptSearch}
                    onChange={e => setTranscriptSearch(e.target.value)}
                    placeholder="Search transcript..."
                    className="w-full h-9 pl-9 pr-8 rounded-xl bg-blue-950/30 border border-blue-400/15 text-xs font-medium text-[#F6FAFD] placeholder:text-[#B3CFE5]/40 outline-none focus:border-blue-400/35 transition-colors"
                  />
                  {transcriptSearch && (
                    <button
                      onClick={() => setTranscriptSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B3CFE5]/50 hover:text-[#F6FAFD]"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Stats */}
                <div className="flex items-center gap-4 text-[11px] font-[900] text-[#B3CFE5] uppercase tracking-widest shrink-0">
                  {transcriptSearch ? (
                    <span className="text-[#4A7FA7]">
                      {(safeData.transcript?.utterances || []).filter(u => u.text.toLowerCase().includes(transcriptSearch.toLowerCase())).length} matches
                    </span>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {safeData.transcript?.metrics?.turn_count || 0} Turns</div>
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {((safeData.transcript?.utterances?.slice(-1)[0]?.end_ms || 0) / 1000).toFixed(0)}s</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-1.5 w-full rounded-[3.5rem] bg-[#4A7FA7]/20 overflow-hidden">
              <div className="bg-[#0A1931] rounded-[3.4rem] p-12 space-y-12 max-h-[850px] overflow-y-auto scrollbar-hide">
                {isHydrating && (safeData.transcript?.utterances || []).length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={`transcript-skel-${i}`} className={cn("flex gap-8 max-w-[85%] animate-pulse", i % 2 === 0 ? "mr-auto" : "ml-auto flex-row-reverse")}>
                      <div className="w-12 h-12 rounded-2xl bg-[#1A3D63]/30 shrink-0" />
                      <div className="h-16 w-64 bg-[#1A3D63]/20 rounded-[2rem]" />
                    </div>
                  ))
                ) : (
                  (safeData.transcript?.utterances || [])
                  .filter(utt => !transcriptSearch || utt.text.toLowerCase().includes(transcriptSearch.toLowerCase()))
                  .map((utt, i, arr) => {
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
                          isAgent ? "bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] shadow-lg shadow-[#4A7FA7]/20" : "bg-blue-950/25 text-[#F6FAFD]"
                        )}>
                          {isAgent ? "A" : "C"}
                        </div>
                        <div className="space-y-2">
                          <p className={cn(
                            "text-[15px] font-[650] leading-relaxed p-6 rounded-[2rem]",
                            isAgent
                              ? "bg-[#4A7FA7]/30 border border-blue-400/10 text-[#F6FAFD] shadow-sm"
                              : "bg-blue-950/25 text-[#F6FAFD] shadow-sm shadow-[#0A1931]/50"
                          )}>
                            {utt.text}
                          </p>

                          {/* Sentiment and Emotion badges */}
                          <div className={cn(
                            "flex flex-wrap items-center gap-2 px-1",
                            isAgent ? "justify-start" : "justify-end"
                          )}>
                            {utt.sentiment && (
                              <span
                                className={cn(
                                  "px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border",
                                  utt.sentiment === 'positive' ? "bg-green-50 text-green-700 border-green-200" :
                                  utt.sentiment === 'negative' ? "bg-red-50 text-red-700 border-red-200" :
                                  "bg-gray-50 text-gray-700 border-gray-200"
                                )}
                                title={`Sentiment: ${utt.sentiment}`}
                              >
                                {utt.sentiment}
                              </span>
                            )}
                            {utt.emotion && (
                              <span
                                className="px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border bg-purple-50 text-purple-700 border-purple-200"
                                title={`Emotion: ${utt.emotion}`}
                              >
                                {utt.emotion}
                              </span>
                            )}
                            <span className="text-[11px] font-extrabold text-[#B3CFE5] uppercase tracking-widest">
                              At {(utt.start_ms / 1000).toFixed(1)}s
                            </span>
                          </div>
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
        <div className="lg:col-span-4 space-y-12 md:sticky md:top-8 md:max-h-[calc(100vh-4rem)] md:overflow-y-auto md:pr-2">
          {/* Signal Dynamics Card */}
          <div className="rounded-[2rem] p-8 overflow-hidden relative group glass-card">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-32 h-32" />
            </div>
            <div className="relative">
              <h4 className="text-2xl font-[850] text-[#F6FAFD] leading-tight mb-8">Signal Dynamics</h4>
              <div className="space-y-6">
                <DynamicStat label="Silence Index" value={((data.analytics?.silence?.ratio || 0) * 100).toFixed(1) + "%"} sub={`${data.analytics?.silence?.gap_count || 0} Gaps Detected`} />
                <DynamicStat label="Intelligence Confidence" value="98.4%" sub="Neural Precision" />
                <DynamicStat label="Interaction Depth" value={(data.transcript?.metrics?.turn_count || 0).toString()} sub="Speaker Alternations" />
              </div>
            </div>
          </div>

          {/* LLM Cost Breakdown Card */}
          {data.llm_usage_summary && <LLMCostBreakdown llm={data.llm_usage_summary} />}

          {/* Script Framework Reference */}
          <div className="p-10 rounded-[3rem] border border-blue-400/15 bg-blue-950/25 shadow-sm shadow-[#0A1931]/30 space-y-8">
            <div className="flex items-center gap-3">
              <FileSearch className="w-6 h-6 text-[#4A7FA7]" />
              <h4 className="text-xl font-[850] text-[#F6FAFD] tracking-tight">Script Framework</h4>
            </div>

            {/* Sections */}
            {data.prepared_script?.sections && data.prepared_script.sections.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-black uppercase tracking-widest text-[#B3CFE5]">Sections</h5>
                {data.prepared_script.sections.map((section) => (
                  <div key={section.section_id} className="flex items-start gap-3 py-3 border-b border-blue-400/10 last:border-0 group">
                    <div className="w-8 h-8 rounded-xl bg-blue-950/25 flex items-center justify-center shrink-0 group-hover:bg-gradient-to-r group-hover:from-[#4A7FA7] group-hover:to-[#1A3D63] transition-colors">
                      <CircleDot className="w-4 h-4 text-[#B3CFE5] group-hover:text-[#F6FAFD] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-extrabold text-[#F6FAFD]">{section.title}</p>
                        {section.required && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200 shrink-0">
                            Required
                          </span>
                        )}
                      </div>
                      {section.anchors && section.anchors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {section.anchors.map((anchor, idx) => (
                            <span key={idx} className="text-[9px] font-semibold text-[#B3CFE5] bg-blue-950/20 px-2 py-0.5 rounded-md border border-blue-400/10">
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
                <h5 className="text-xs font-black uppercase tracking-widest text-[#B3CFE5]">Questions ({data.prepared_script.questions.length})</h5>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.prepared_script.questions.map((question) => (
                    <div key={question.question_id} className="p-3 rounded-xl glass space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#F6FAFD] leading-tight">{question.question_text}</p>
                        {question.required && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-bold text-[#B3CFE5] bg-[#0A1931] px-2 py-0.5 rounded-md border border-blue-400/10">
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
                        <p className="text-[9px] font-medium text-[#B3CFE5] italic">{question.purpose}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {data.prepared_script?.products && data.prepared_script.products.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-black uppercase tracking-widest text-[#B3CFE5]">Products ({data.prepared_script.products.length})</h5>
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
                <h5 className="text-xs font-black uppercase tracking-widest text-[#B3CFE5]">Branching Logic ({data.prepared_script.branching_points.length})</h5>
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
          <div className="bg-[#1A3D63]/90 rounded-2xl shadow-2xl border border-blue-400/15 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <span className="text-lg font-black text-orange-700">{pendingEdits.size}</span>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#B3CFE5]">
                  Pending Edits
                </p>
                <p className="text-[10px] font-medium text-[#B3CFE5]/70">
                  Ready to submit
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingEdits(new Map())}
                className="flex-1 h-10 px-4 bg-[#0A1931] hover:bg-black/35 text-[#B3CFE5] rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-blue-400/10"
                title="Clear all pending edits"
              >
                Clear All
              </button>
              <button
                onClick={handleSubmitAllEdits}
                className="flex-1 h-10 px-4 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] hover:opacity-90 text-[#F6FAFD] rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#4A7FA7]/20"
                title="Submit all pending edits and recalculate scores"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-3xl p-8 shadow-2xl max-w-md text-center space-y-4 border border-blue-400/15">
            <Loader2 className="w-12 h-12 text-[#4A7FA7] animate-spin mx-auto" />
            <h3 className="text-xl font-[850] text-[#F6FAFD]">Recalculating...</h3>
            <p className="text-sm font-medium text-[#B3CFE5]">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 animate-in fade-in duration-150 duration-150">
            <div className="bg-[#1A3D63] w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-3xl shadow-2xl border border-blue-400/15 animate-in fade-in duration-150 duration-150">
              <div className="p-8 border-b border-blue-400/10 bg-black/25 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="w-6 h-6 text-[#4A7FA7]" />
                  <div>
                    <h3 className="text-2xl font-[850] text-[#F6FAFD] tracking-tight">Edit History</h3>
                    <p className="text-sm font-semibold text-[#B3CFE5] mt-1">
                      {viewHistoryFor.question_id} - {interventions.length} edit{interventions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewHistoryFor(null)}
                  className="w-10 h-10 rounded-xl hover:bg-blue-950/25 flex items-center justify-center transition-colors text-[#B3CFE5]"
                  title="Close history modal"
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
                        <Clock className="w-4 h-4 text-[#B3CFE5]" />
                        <p className="text-xs font-bold text-[#F6FAFD]">
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
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5] mb-1">Answer</p>
                        <p className="text-sm font-bold text-[#F6FAFD]">{intervention.corrected_answer}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5] mb-1">Score</p>
                        <p className="text-sm font-bold text-[#F6FAFD]">{intervention.corrected_score}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5] mb-1">Reasoning</p>
                      <p className="text-sm font-medium text-[#B3CFE5] italic">"{intervention.corrected_reasoning}"</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-blue-400/10 bg-black/25">
                <button
                  onClick={() => setViewHistoryFor(null)}
                  className="w-full h-12 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] hover:opacity-90 text-[#F6FAFD] rounded-xl font-bold text-sm uppercase tracking-wider transition-colors"
                  title="Close history modal"
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
        const separatorIdx = editingQuestionId.indexOf('||');
        const templateId = editingQuestionId.slice(0, separatorIdx);
        const questionId = editingQuestionId.slice(separatorIdx + 2);
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/50 animate-in fade-in duration-150 duration-150">
      <div className="bg-[#1A3D63] w-full max-w-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col rounded-3xl shadow-2xl border border-blue-400/15 overflow-hidden animate-in fade-in duration-150 duration-150">
        <div className="p-6 md:p-8 border-b border-blue-400/10 bg-black/25 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-xl md:text-2xl font-[850] text-[#F6FAFD] tracking-tight">Edit Answer</h3>
            <p className="text-xs md:text-sm font-semibold text-[#B3CFE5] mt-1 truncate">Manual correction for {modal.question_id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-blue-950/25 flex items-center justify-center transition-colors text-[#B3CFE5] flex-shrink-0"
            title="Close edit dialog"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto flex-1">
          {/* Current Answer */}
          <div className="p-4 rounded-xl bg-black/25 border border-blue-400/10 space-y-2">
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
              className="w-full h-12 px-4 bg-[#0A1931] border border-blue-400/15 rounded-xl text-[#F6FAFD] font-semibold outline-none focus:border-[#4A7FA7] transition-colors"
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
              className="w-full h-12 px-4 bg-[#0A1931] border border-blue-400/15 rounded-xl text-[#F6FAFD] font-semibold outline-none focus:border-[#4A7FA7] transition-colors"
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
              className="w-full px-4 py-3 bg-[#0A1931] border border-blue-400/15 rounded-xl text-[#F6FAFD] font-medium outline-none focus:border-[#4A7FA7] transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sticky bottom-0 bg-[#1A3D63] pb-2">
            {existingEdit && onRemove && (
              <button
                onClick={onRemove}
                className="h-11 sm:h-12 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors border border-red-200"
                title="Remove this pending edit"
              >
                Remove
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 h-11 sm:h-12 bg-[#0A1931] hover:bg-black/35 text-[#B3CFE5] rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors border border-blue-400/10"
              title="Cancel and close dialog"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] hover:opacity-90 text-[#F6FAFD] rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#4A7FA7]/20"
              title={existingEdit ? "Update this pending edit" : "Add edit to queue for batch submission"}
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

function MetricCard({ label, value, icon: Icon, color, isPending = false, className, href }: { label: string, value: string, icon: any, color: 'green' | 'red' | 'neutral', isPending?: boolean, className?: string, href?: string }) {
  const inner = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-blue-950/20 text-[#4A7FA7]">
          <Icon className={cn("w-5 h-5 stroke-[1.5px]", isPending && "animate-spin-slow")} />
        </div>
        <div className={cn(
          "w-2 h-2 rounded-full transition-colors duration-150",
          isPending ? "bg-[#B3CFE5]/30" : color === 'green' ? 'bg-green-500 shadow-sm shadow-green-500/50' : color === 'red' ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-[#B3CFE5]/40'
        )} />
      </div>
      <p className="text-[10px] font-black text-[#B3CFE5] uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <h5 className={cn(
        "text-[18px] font-[850] text-[#F6FAFD] tracking-tight truncate",
        isPending && "text-[#B3CFE5]/40"
      )}>{value}</h5>
    </>
  );

  const baseClass = cn(
    "p-6 rounded-[2rem] bg-blue-950/25 apple-shadow border border-blue-400/15 group hover:scale-[1.03] transition-colors",
    isPending && "animate-pulse",
    href && "cursor-pointer hover:border-[#4A7FA7]/50",
    className
  );

  if (href) {
    return <a href={href} className={baseClass}>{inner}</a>;
  }

  return <div className={baseClass}>{inner}</div>;
}

// ─── LLM Cost Breakdown ──────────────────────────────────

const STAGE_COLORS = [
  "#63B3ED", "#9A75EA", "#48C78E", "#FFB74D",
  "#FC6E6E", "#38D3CB", "#FF914D", "#EC6FAA",
];

function LLMCostBreakdown({ llm }: {
  llm: {
    total_tokens: number;
    total_cost_usd: number;
    breakdown_by_stage: Array<{ stage: string; model: string; provider: string; tokens: number; cost_usd: number }>;
  }
}) {
  // Group by model
  const byModel: Record<string, { tokens: number; cost_usd: number; stages: typeof llm.breakdown_by_stage }> = {};
  (llm.breakdown_by_stage || []).forEach(s => {
    const key = s.model || s.provider || "unknown";
    if (!byModel[key]) byModel[key] = { tokens: 0, cost_usd: 0, stages: [] };
    byModel[key].tokens += s.tokens;
    byModel[key].cost_usd += s.cost_usd;
    byModel[key].stages.push(s);
  });

  const modelKeys = Object.keys(byModel);
  const totalCost = llm.total_cost_usd || 0;
  const monthlyCost = totalCost * 30;
  const yearlyCost = totalCost * 365;

  const barData = {
    labels: modelKeys.map(k => k.length > 12 ? k.slice(0, 12) + "…" : k),
    datasets: [{
      label: "Cost (USD)",
      data: modelKeys.map(k => byModel[k].cost_usd),
      backgroundColor: modelKeys.map((_, i) => STAGE_COLORS[i % STAGE_COLORS.length] + "CC"),
      borderColor: modelKeys.map((_, i) => STAGE_COLORS[i % STAGE_COLORS.length]),
      borderWidth: 2,
      borderRadius: 6,
    }]
  };

  return (
    <div className="w-full rounded-[2rem] bg-[#0D1F35] border border-blue-400/15 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-blue-400/10">
        <h4 className="text-base font-black text-[#F6FAFD] tracking-tight flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#FFB74D]" />
          Cost Breakdown & Token Usage
        </h4>
      </div>

      <div className="p-4 space-y-4">

        {/* ── Token Usage — full-width cards ── */}
        <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] px-1">Token Usage</p>

        {modelKeys.length === 0 ? (
          <div className="w-full p-4 rounded-xl glass text-center">
            <p className="text-xs text-[#B3CFE5]/50 font-semibold">No stage data available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {modelKeys.map((model, i) => {
              const m = byModel[model];
              const color = STAGE_COLORS[i % STAGE_COLORS.length];
              return (
                <div key={model} className="w-full rounded-xl border border-blue-400/10 bg-blue-950/20 overflow-hidden">
                  {/* Model name row */}
                  <div className="w-full px-4 py-2.5 bg-black/20 border-b border-blue-400/10 flex items-center justify-between gap-3">
                    <span className="text-xs font-black text-[#F6FAFD] truncate flex-1">{model}</span>
                    <span className="text-xs font-black shrink-0" style={{ color }}>{formatLLMCost(m.cost_usd)}</span>
                  </div>
                  {/* Stats row — 3 cols */}
                  <div className="w-full grid grid-cols-3 divide-x divide-[#4A7FA7]/20 text-center py-3">
                    <div className="px-3">
                      <p className="text-[9px] font-bold uppercase text-[#B3CFE5]/60 mb-1">Tokens</p>
                      <p className="text-xs font-black text-[#F6FAFD]">{formatTokens(m.tokens)}</p>
                    </div>
                    <div className="px-3">
                      <p className="text-[9px] font-bold uppercase text-[#B3CFE5]/60 mb-1">Stages</p>
                      <p className="text-xs font-black text-[#F6FAFD]">{m.stages.length}</p>
                    </div>
                    <div className="px-3">
                      <p className="text-[9px] font-bold uppercase text-[#B3CFE5]/60 mb-1">Cost</p>
                      <p className="text-xs font-black" style={{ color }}>{formatLLMCost(m.cost_usd)}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Total row */}
            <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#4A7FA7]/20 border border-blue-400/22">
              <span className="text-xs font-black uppercase tracking-wider text-[#B3CFE5]">Total</span>
              <div className="text-right">
                <p className="text-sm font-black text-[#F6FAFD]">{formatLLMCost(totalCost)}</p>
                <p className="text-[10px] font-semibold text-[#B3CFE5]">{formatTokens(llm.total_tokens)} tokens</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Bar Chart — full width ── */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] px-1">Cost Breakdown Chart</p>
          <div className="w-full h-48 bg-blue-950/20 rounded-xl border border-blue-400/10 p-3">
            {modelKeys.length > 0 ? (
              <Bar data={barData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "rgba(10,25,49,0.95)",
                    titleColor: "#F6FAFD",
                    bodyColor: "#B3CFE5",
                    borderColor: "rgba(74,127,167,0.4)",
                    borderWidth: 1,
                    callbacks: { label: (ctx) => ` ${formatLLMCost(ctx.parsed.y)}` }
                  }
                },
                scales: {
                  x: { ticks: { color: "#B3CFE5", font: { size: 9 } }, grid: { color: "rgba(74,127,167,0.08)" } },
                  y: { ticks: { color: "#B3CFE5", font: { size: 9 } }, grid: { color: "rgba(74,127,167,0.08)" } }
                }
              }} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-[#B3CFE5]/50 font-semibold">No data</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Projections — 2 equal cols, full width ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Monthly Projection", value: monthlyCost, sub: "est. per month" },
            { label: "Yearly Projection",  value: yearlyCost,  sub: "est. per year"  },
          ].map(({ label, value, sub }) => (
            <div key={label} className="w-full rounded-xl bg-blue-950/20 border border-[#4A7FA7]/25 overflow-hidden">
              <div className="px-4 py-2 bg-black/20 border-b border-blue-400/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5]">{label}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-base font-[900] text-[#F6FAFD] leading-none">{formatLLMCost(value)}</p>
                <p className="text-[9px] font-semibold text-[#B3CFE5]/60 mt-1">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pipeline stages — full width ── */}
        {llm.breakdown_by_stage && llm.breakdown_by_stage.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] px-1">By Pipeline Stage</p>
            {llm.breakdown_by_stage.map((stage, i) => (
              <div key={i} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl glass">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }} />
                <span className="text-xs font-semibold text-[#B3CFE5] capitalize truncate flex-1">
                  {stage.stage.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-black text-[#F6FAFD] shrink-0">{formatLLMCost(stage.cost_usd)}</span>
              </div>
            ))}
          </div>
        )}

      </div>
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
