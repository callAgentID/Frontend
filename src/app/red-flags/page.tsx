"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  ChevronRight,
  XCircle,
  Calendar,
  User
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
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
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

  // Filter state
  const [filterCritical, setFilterCritical] = useState<boolean | null>(null);
  const [filterAttention, setFilterAttention] = useState<boolean | null>(null);
  const [minScore, setMinScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Read call ID from URL
  useEffect(() => {
    const callIdFromUrl = searchParams.get('callId');
    if (callIdFromUrl && callIdFromUrl !== selectedCallId) {
      viewDetail(callIdFromUrl);
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
        setRedFlags(Array.isArray(data) ? data : []);
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
    router.push('/red-flags', { scroll: false });
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
        <div className="flex items-center justify-between max-w-6xl mx-auto border-b border-[#1f3a3408] pb-8">
          <button
            onClick={closeDetail}
            className="flex items-center gap-2 text-[#1F3A3450] hover:text-[#1F3A34] font-bold text-xs uppercase tracking-widest transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Red Flags
          </button>
          {detailData && !detailData.reviewed_at && (
            <button
              onClick={() => {
                const name = prompt("Enter your name to mark this as reviewed:");
                if (name) markAsReviewed(selectedCallId, name);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
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
            <div className="bg-white rounded-[2.5rem] border border-[#1f3a3410] p-10 apple-shadow">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-[850] text-[#1F3A34] tracking-tight mb-2">
                    Red Flag Analysis
                  </h2>
                  <p className="text-sm font-medium text-[#1F3A3460]">Call ID: {detailData.call_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  {detailData.has_critical_issues && (
                    <span className="px-3 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-black uppercase tracking-wider">
                      Critical Issues
                    </span>
                  )}
                  {detailData.requires_immediate_attention && (
                    <span className="px-3 py-1.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-black uppercase tracking-wider">
                      Immediate Attention
                    </span>
                  )}
                  {detailData.reviewed_at && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-black uppercase tracking-wider">
                      <Eye className="w-3 h-3" /> Reviewed
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-[#F4F8F9] border border-[#1f3a3408]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3440] mb-2">Risk Score</p>
                  <p className="text-3xl font-[850] text-[#1F3A34]">{detailData.score.toFixed(1)}</p>
                </div>
                <div className="p-6 rounded-2xl bg-[#F4F8F9] border border-[#1f3a3408]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3440] mb-2">Created</p>
                  <p className="text-sm font-bold text-[#1F3A34]">{new Date(detailData.created_at).toLocaleString()}</p>
                </div>
                {detailData.reviewed_at && (
                  <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Reviewed By</p>
                    <p className="text-sm font-bold text-blue-700">{detailData.reviewed_by}</p>
                    <p className="text-xs text-blue-600 mt-1">{new Date(detailData.reviewed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Questionnaire Results */}
            {detailData.full_result?.answers && (
              <div className="bg-white rounded-[2.5rem] border border-[#1f3a3410] p-10 apple-shadow space-y-6">
                <div className="flex items-center justify-between border-b border-[#1f3a3408] pb-6">
                  <h3 className="text-xl font-[850] text-[#1F3A34] tracking-tight">Questionnaire Analysis</h3>
                  {detailData.full_result.summary && (
                    <div className="px-4 py-2 bg-[#1F3A3405] rounded-xl border border-[#1f3a3410]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3440] mb-1">Overall Summary</p>
                      <p className="text-xs font-bold text-[#1F3A34]">{detailData.full_result.summary}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {detailData.full_result.answers.map((answer: any, idx: number) => (
                    <div
                      key={answer.question_id || idx}
                      className="p-6 rounded-2xl border border-[#1f3a3410] bg-[#F4F8F9]/30 hover:bg-[#F4F8F9]/60 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3460]">
                              Question {answer.question_id || idx + 1}
                            </span>
                            {answer.skipped && (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                                Skipped
                              </span>
                            )}
                          </div>
                          {answer.reasoning_summary && (
                            <p className="text-sm font-bold text-[#1F3A34] mb-2">{answer.reasoning_summary}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#1F3A3460]">Answer</p>
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

                      {answer.evidence && answer.evidence.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#1f3a3410]">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#1F3A3460] mb-3">Evidence</p>
                          <div className="space-y-2">
                            {answer.evidence.map((ev: any, evIdx: number) => (
                              <div key={evIdx} className="p-3 bg-white rounded-xl border border-[#1f3a3408]">
                                <p className="text-xs text-[#1F3A34] leading-relaxed italic">"{ev.quote}"</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-[9px] font-bold text-[#1F3A3460] uppercase tracking-wider">
                                    Match Score: {(ev.score * 100).toFixed(1)}%
                                  </span>
                                  {ev.start_ms > 0 && (
                                    <span className="text-[9px] font-bold text-[#1F3A3460] uppercase tracking-wider">
                                      {Math.floor(ev.start_ms / 1000)}s - {Math.floor(ev.end_ms / 1000)}s
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-4 text-[9px] font-bold text-[#1F3A3460] uppercase tracking-wider">
                        <span>Weight: {answer.weight}</span>
                        <span className="w-1 h-1 rounded-full bg-[#1F3A3420]" />
                        <span>Confidence: {answer.confidence}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  // List view
  return (
    <main className="flex-1 overflow-y-auto bg-[#F4F8F9]/50 p-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center text-white apple-shadow">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-[900] text-[#1F3A34] tracking-tight">{t('title')}</h1>
          </div>
          <p className="text-[#1F3A3470] text-sm font-medium">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-[#1f3a3408] p-6 apple-shadow">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-5 h-5 text-[#1F3A3460]" />
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3440] mb-1">{t('totalCalls')}</p>
            <p className="text-2xl font-[850] text-[#1F3A34]">{stats.total_red_flag_calls}</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#1f3a3408] p-6 apple-shadow">
            <div className="flex items-center justify-between mb-4">
              <XCircle className="w-5 h-5 text-red-500" />
              <div className="w-2 h-2 rounded-full bg-red-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3440] mb-1">{t('criticalIssues')}</p>
            <p className="text-2xl font-[850] text-[#1F3A34]">{stats.critical_issues_count}</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#1f3a3408] p-6 apple-shadow">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <div className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3440] mb-1">{t('needsAttention')}</p>
            <p className="text-2xl font-[850] text-[#1F3A34]">{stats.immediate_attention_count}</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#1f3a3408] p-6 apple-shadow">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-5 h-5 text-[#1F3A3460]" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1F3A3440] mb-1">{t('avgScore')}</p>
            <p className="text-2xl font-[850] text-[#1F3A34]">{stats.average_score.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#1f3a3410] p-6 apple-shadow space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#1F3A34] flex items-center gap-2">
          <Filter className="w-4 h-4" /> {t('filters')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">{t('criticalFilter')}</label>
            <select
              value={filterCritical === null ? "" : String(filterCritical)}
              onChange={(e) => setFilterCritical(e.target.value === "" ? null : e.target.value === "true")}
              className="w-full h-12 bg-[#1F3A3405] border border-[#1f3a3410] rounded-xl px-4 text-[#1F3A34] font-semibold text-sm outline-none cursor-pointer"
            >
              <option value="">{t('all')}</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">{t('attentionFilter')}</label>
            <select
              value={filterAttention === null ? "" : String(filterAttention)}
              onChange={(e) => setFilterAttention(e.target.value === "" ? null : e.target.value === "true")}
              className="w-full h-12 bg-[#1F3A3405] border border-[#1f3a3410] rounded-xl px-4 text-[#1F3A34] font-semibold text-sm outline-none cursor-pointer"
            >
              <option value="">{t('all')}</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">{t('minScore')}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder="0"
              className="w-full h-12 bg-[#1F3A3405] border border-[#1f3a3410] rounded-xl px-4 text-[#1F3A34] font-semibold text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">{t('maxScore')}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              placeholder="100"
              className="w-full h-12 bg-[#1F3A3405] border border-[#1f3a3410] rounded-xl px-4 text-[#1F3A34] font-semibold text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* Red Flags List */}
      <div className="bg-white rounded-[2.5rem] border border-[#1f3a3408] overflow-hidden apple-shadow">
        {loading ? (
          <div className="divide-y divide-[#1f3a3405]">
            {[1, 2, 3, 4].map((i) => (
              <RedFlagItemSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="p-20 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-red-700 font-bold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
            >
              Retry
            </button>
          </div>
        ) : redFlags.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-[#1F3A3440] font-bold">No red flags found. All calls are compliant!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1f3a3405]">
            {redFlags.map((flag) => (
              <div
                key={flag.id}
                onClick={() => viewDetail(flag.call_id)}
                className="flex items-center gap-6 p-8 hover:bg-[#1F3A3403] transition-all cursor-pointer group"
              >
                {/* Score Badge */}
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-lg",
                  flag.score >= 70 ? "bg-red-500 text-white shadow-red-500/20" :
                    flag.score >= 40 ? "bg-orange-500 text-white shadow-orange-500/20" :
                      "bg-yellow-500 text-white shadow-yellow-500/20"
                )}>
                  {flag.score.toFixed(0)}
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="text-[17px] font-extrabold text-[#1F3A34] tracking-tight truncate">
                      Call #{flag.call_id.split('-')[0]}
                    </h5>
                    {flag.has_critical_issues && (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-red-100 text-red-700 border border-red-200">
                        Critical
                      </span>
                    )}
                    {flag.requires_immediate_attention && (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-orange-100 text-orange-700 border border-orange-200">
                        Urgent
                      </span>
                    )}
                    {flag.reviewed_at && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-blue-50 text-blue-600 border border-blue-200">
                        <Eye className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-5">
                    <span className="flex items-center gap-2 text-[11px] font-black text-[#1F3A3460] uppercase tracking-widest">
                      <AlertCircle className="w-3.5 h-3.5" /> {flag.flags_count} Flag{flag.flags_count !== 1 ? 's' : ''}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1F3A3415]" />
                    <span className="text-[11px] font-bold text-[#1F3A3480] uppercase tracking-widest">
                      {new Date(flag.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="w-11 h-11 rounded-2xl bg-[#1F3A3408] text-[#1F3A3440] flex items-center justify-center group-hover:bg-[#1F3A34] group-hover:text-white transition-all group-hover:scale-110 shadow-sm">
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

export default function RedFlagsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-[#1f3a3408] border-t-[#1F3A34] animate-spin" />
      </div>
    }>
      <RedFlagsPageContent />
    </Suspense>
  );
}
