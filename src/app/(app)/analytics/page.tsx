"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useApi } from "@/lib/useApi";
import { createPortal } from 'react-dom';
import {
  BarChart3,
  Search,
  ArrowLeft,
  Calendar,
  Filter,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  Zap,
  ChevronRight,
  ArrowUpRight,
  Database,
  History,
  Activity,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Eye,
  Trash2,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLLMCost, formatTokens } from "@/lib/formatters";
import { ResultsPanel } from "@/components/ResultsPanel";
import { CallListItemSkeleton, DetailViewSkeleton } from "@/components/Skeleton";
import { CallFilters, CallFilterParams } from "@/components/CallFilters";

function AnalyticsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('analytics');
  const { apiFetch } = useApi();

  const [calls, setCalls] = useState<any[]>([]);
  const [totalCalls, setTotalCalls] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [detailedResult, setDetailedResult] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filter state
  const [filters, setFilters] = useState<CallFilterParams>({});

  // Delete state
  const [deleteConfirmCallId, setDeleteConfirmCallId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Read call ID from URL on mount and reset when removed
  useEffect(() => {
    const callIdFromUrl = searchParams.get('callId');
    if (callIdFromUrl) {
      setSelectedCallId(callIdFromUrl);
    } else {
      // Reset to list view when callId is removed from URL
      setSelectedCallId(null);
      setDetailedResult(null);
    }
  }, [searchParams]);

  // Build query string from filters
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.append('limit', itemsPerPage.toString());
    params.append('offset', ((currentPage - 1) * itemsPerPage).toString());

    // Add all filter parameters
    if (filters.status) filters.status.forEach(s => params.append('status', s));
    if (filters.review_status) filters.review_status.forEach(rs => params.append('review_status', rs));
    if (filters.campaign_id) filters.campaign_id.forEach(cid => params.append('campaign_id', cid));
    if (filters.questionnaire_id) filters.questionnaire_id.forEach(qid => params.append('questionnaire_id', qid));
    if (filters.agent_id) filters.agent_id.forEach(aid => params.append('agent_id', aid));
    if (filters.customer_id) filters.customer_id.forEach(cid => params.append('customer_id', cid));
    if (filters.call_success !== undefined && filters.call_success !== null) params.append('call_success', filters.call_success.toString());
    if (filters.min_score !== undefined) params.append('min_score', filters.min_score.toString());
    if (filters.max_score !== undefined) params.append('max_score', filters.max_score.toString());
    if (filters.language) params.append('language', filters.language);
    if (filters.batch_id) params.append('batch_id', filters.batch_id);
    if (filters.tag) filters.tag.forEach(t => params.append('tag', t));
    if (filters.search) params.append('search', filters.search);
    if (filters.sentiment) params.append('sentiment', filters.sentiment);
    if (filters.created_after) params.append('created_after', filters.created_after);
    if (filters.created_before) params.append('created_before', filters.created_before);

    return params.toString();
  };

  // Fetch historical calls with pagination and filters
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const queryString = buildQueryString();
        const response = await apiFetch(`/api/v1/calls/?${queryString}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          // Sort by created_at descending (newest first)
          const sortedData = data.sort((a, b) => {
            const dateA = new Date(a.created_at || a.ready_at || 0).getTime();
            const dateB = new Date(b.created_at || b.ready_at || 0).getTime();
            return dateB - dateA; // Descending order
          });

          setCalls(sortedData);

          // Try to get total count from headers or estimate
          const totalCount = response.headers.get('X-Total-Count');
          if (totalCount) {
            setTotalCalls(parseInt(totalCount));
          } else {
            // Estimate: if we got full page, there might be more
            setTotalCalls(data.length === itemsPerPage ? (currentPage * itemsPerPage) + 1 : (currentPage - 1) * itemsPerPage + data.length);
          }
        }
      } catch (err) {
        console.error("Failed to fetch historical signals:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [currentPage, itemsPerPage, filters]);

  // Fetch specific call detail
  const viewDetail = async (callId: string) => {
    setSelectedCallId(callId);
    setIsDetailLoading(true);
    setDetailedResult(null);

    // Update URL with call ID
    router.push(`/analytics?callId=${callId}`, { scroll: false });

    try {
      const response = await apiFetch(`/api/v1/calls/${callId}`);
      const data = await response.json();
      setDetailedResult(data);
    } catch (err) {
      console.error("Failed to fetch audit detail:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedCallId(null);
    setDetailedResult(null);

    // Remove call ID from URL
    router.push('/analytics', { scroll: false });
  };

  const handleDeleteCall = async (callId: string) => {
    setIsDeleting(true);
    try {
      const response = await apiFetch(`/api/v1/calls/${callId}`, {
        method: "DELETE",
        headers: { "Accept": "*/*" }
      });

      if (response.ok) {
        // Remove deleted call from list
        setCalls(calls.filter(call => call.call_id !== callId));
        setDeleteConfirmCallId(null);

        // If we deleted the currently viewed call, close detail view
        if (selectedCallId === callId) {
          closeDetail();
        }
      } else {
        console.error("Failed to delete call");
        alert("Failed to delete call. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting call:", error);
      alert("Error deleting call. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch call detail when URL contains callId on mount or refresh
  useEffect(() => {
    if (selectedCallId && !detailedResult && !isDetailLoading) {
      const fetchCallDetail = async () => {
        setIsDetailLoading(true);
        try {
          const response = await apiFetch(`/api/v1/calls/${selectedCallId}`);
          const data = await response.json();
          setDetailedResult(data);
        } catch (err) {
          console.error("Failed to fetch audit detail:", err);
        } finally {
          setIsDetailLoading(false);
        }
      };
      fetchCallDetail();
    }
  }, [selectedCallId]);

  if (selectedCallId) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-10 animate-in fade-in duration-150 duration-150">
        <div className="flex items-center justify-between border-b border-blue-400/18 pb-8">
          <button
            onClick={closeDetail}
            className="flex items-center gap-2 text-[#B3CFE5] hover:text-[#F6FAFD] font-bold text-xs uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Signal History
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-[#B3CFE5] uppercase tracking-widest">Signal Locked</span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#4A7FA7] shadow-sm shadow-[#4A7FA7]/50 animate-pulse" />
          </div>
        </div>

        {isDetailLoading ? (
          <DetailViewSkeleton />
        ) : (
          detailedResult && <ResultsPanel data={detailedResult} />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-16 animate-in fade-in duration-150 duration-150">
      {/* Header Intelligence Summary */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between border-b border-blue-400/18 pb-12">
        <div>
          <div className="flex items-center gap-3 mb-4 px-1">
            <span className="px-3 py-1 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white text-[10px] uppercase font-[900] tracking-widest rounded-lg">Historical Command</span>
            <span className="text-[11px] font-bold text-[#B3CFE5] uppercase tracking-widest leading-none">Global Signal Archive</span>
          </div>
          <h2 className="text-[32px] sm:text-[42px] md:text-[52px] font-[850] text-[#F6FAFD] tracking-tight leading-none mb-6">{t('title')}</h2>
          <p className="text-[#B3CFE5] text-[16px] font-medium max-w-lg leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex gap-4">
          {/* Aggregate Quick Stats */}
          <div className="p-6 rounded-[2.5rem] glass-card min-w-[200px]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-blue-950/20 text-[#4A7FA7]"><Activity className="w-4 h-4" /></div>
              <span className="text-[10px] font-black text-[#4A7FA7] bg-blue-950/20 px-2 py-0.5 rounded-md">Page {currentPage}</span>
            </div>
            <p className="text-[10px] font-black text-[#B3CFE5] uppercase tracking-widest mb-1">{t('showingRecords')}</p>
            <h4 className="text-2xl font-[850] text-[#F6FAFD]">{calls.length}</h4>
            {totalCalls > 0 && (
              <p className="text-[9px] font-bold text-[#B3CFE5] mt-1">of ~{totalCalls} total</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Historical Table */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <h4 className="text-xl font-[850] text-[#F6FAFD] tracking-tight">{t('signalHistory')}</h4>

          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setCurrentPage(1);
                setIsLoading(true);
              }}
              className="flex items-center gap-2 px-4 h-11 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
              title="Refresh call history"
            >
              <RefreshCw className="w-4 h-4" />
              {t('refresh')}
            </button>

          </div>
        </div>

        {/* Advanced Filters */}
        <CallFilters
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(1); // Reset to first page when filters change
          }}
        />

        <div className="w-full glass-card rounded-[3rem] border border-blue-400/18 overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-[#4A7FA7]/20">
              {[1, 2, 3, 4, 5].map((i) => (
                <CallListItemSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[#4A7FA7]/20">
              {calls.map((call) => (
                <div
                  key={call.call_id}
                  className="flex items-center gap-6 p-8 hover:bg-[#1A3D63]/80 transition-colors group"
                >
                  {/* Score Indicator */}
                  <div
                    onClick={() => viewDetail(call.call_id)}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg cursor-pointer",
                      (call.overall_score || 0) >= 80 ? "bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63] text-white shadow-[#4A7FA7]/20" :
                        (call.overall_score || 0) >= 50 ? "bg-blue-950/20 text-[#F6FAFD]" : "bg-red-500 text-white shadow-red-500/20"
                    )}>
                    {(call.overall_score || 0).toFixed(0)}
                  </div>

                  {/* Main Info */}
                  <div
                    onClick={() => viewDetail(call.call_id)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <h5 className="text-[17px] font-extrabold text-[#F6FAFD] tracking-tight truncate group-hover:text-[#B3CFE5] transition-colors">
                        {call.file_name || `Call #${call.call_id.split('-')[0]}`}
                      </h5>
                      {call.has_red_flags && <ShieldAlert className="w-5 h-5 text-red-500 fill-red-500/10" />}
                      {call.call_success !== null && call.call_success !== undefined && (
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md",
                          call.call_success ? "bg-[#4A7FA7]/20 text-[#4A7FA7] border border-blue-400/18" : "bg-red-100 text-red-700"
                        )}>
                          {call.call_success ? '✅' : '❌'}
                        </span>
                      )}
                      {call.review_status === 'reviewed' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-[#4A7FA7]/20 text-[#4A7FA7] border border-blue-400/18">
                          <Eye className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    {call.smart_summary && (
                      <p className="text-sm font-medium text-[#B3CFE5] mb-2 line-clamp-2 leading-relaxed">
                        {call.smart_summary}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-[#B3CFE5] uppercase tracking-widest">
                        ID: {call.call_id.split('-')[0]}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#4A7FA7]/30" />
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-[#B3CFE5] uppercase tracking-widest">
                        <Calendar className="w-3 h-3" /> {new Date(call.created_at).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#4A7FA7]/30" />
                      <span className="text-[10px] font-bold text-[#B3CFE5] uppercase tracking-widest px-2 py-0.5 bg-blue-950/20 rounded-md">
                        {call.sentiment?.label || 'N/A'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#4A7FA7]/30" />
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#4A7FA7]/10 border border-blue-400/12 rounded-md">
                        <Zap className="w-3 h-3 text-[#4A7FA7]" />
                        <span className="text-[10px] font-black text-[#B3CFE5]/60 uppercase tracking-widest">LLM Cost:</span>
                        <span className="text-[10px] font-black text-[#F6FAFD] uppercase tracking-widest">
                          {formatLLMCost(call.total_llm_cost_usd)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#4A7FA7]/10 border border-blue-400/12 rounded-md">
                        <Database className="w-3 h-3 text-[#4A7FA7]" />
                        <span className="text-[10px] font-black text-[#B3CFE5]/60 uppercase tracking-widest">Tokens:</span>
                        <span className="text-[10px] font-black text-[#F6FAFD] uppercase tracking-widest">
                          {formatTokens(call.total_llm_tokens)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Stats Indicators */}
                  <div className="flex items-center gap-4 pr-6">
                    <div
                      onClick={() => viewDetail(call.call_id)}
                      className="text-right hidden md:block cursor-pointer"
                    >
                      <p className="text-[11px] font-black text-[#B3CFE5] uppercase tracking-widest mb-1 leading-none">Silence</p>
                      <p className="text-[15px] font-[850] text-[#F6FAFD] tracking-tight">{((call.silence_ratio || 0) * 100).toFixed(0)}%</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmCallId(call.call_id);
                      }}
                      className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete call"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div
                      onClick={() => viewDetail(call.call_id)}
                      className="w-11 h-11 rounded-2xl bg-blue-950/20 text-[#4A7FA7] flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-[#4A7FA7] group-hover:to-[#1A3D63] group-hover:text-white transition-colors group-hover:scale-110 shadow-sm cursor-pointer"
                      title="View call details"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}

              {calls.length === 0 && (
                <div className="p-20 text-center space-y-4">
                  <History className="w-12 h-12 text-[#4A7FA7] mx-auto" />
                  <p className="text-sm font-bold text-[#B3CFE5] uppercase tracking-widest">No signals found in the history.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!isLoading && calls.length > 0 && (
          <div className="flex items-center justify-between px-4 py-6">
            <div className="flex items-center gap-4">
              <p className="text-sm font-bold text-[#B3CFE5]">
                {t('showing')} <span className="text-[#F6FAFD] font-extrabold">{((currentPage - 1) * itemsPerPage) + 1}</span> {t('to')} <span className="text-[#F6FAFD] font-extrabold">{Math.min(currentPage * itemsPerPage, ((currentPage - 1) * itemsPerPage) + calls.length)}</span>
                {totalCalls > 0 && <span> {t('of')} <span className="text-[#F6FAFD] font-extrabold">{totalCalls}</span></span>}
              </p>

              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#B3CFE5] uppercase tracking-wider">{t('perPage')}</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-9 px-3 glass rounded-lg text-sm font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-colors cursor-pointer"
                  title="Select number of records per page"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors",
                  currentPage === 1
                    ? "bg-[#1A3D63]/20 text-[#4A7FA7]/30 cursor-not-allowed"
                    : "bg-blue-950/20 text-[#4A7FA7] hover:bg-gradient-to-r hover:from-[#4A7FA7] hover:to-[#1A3D63] hover:text-white shadow-sm"
                )}
                title="Go to first page"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors",
                  currentPage === 1
                    ? "bg-[#1A3D63]/20 text-[#4A7FA7]/30 cursor-not-allowed"
                    : "bg-blue-950/20 text-[#4A7FA7] hover:bg-gradient-to-r hover:from-[#4A7FA7] hover:to-[#1A3D63] hover:text-white shadow-sm"
                )}
                title="Go to previous page"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, Math.ceil(totalCalls / itemsPerPage) || 5) }, (_, i) => {
                  const totalPages = Math.ceil(totalCalls / itemsPerPage) || currentPage + 2;
                  let pageNum;

                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  if (pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-colors",
                        currentPage === pageNum
                          ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white shadow-lg shadow-[#4A7FA7]/30"
                          : "bg-[#1A3D63]/20 text-[#4A7FA7] hover:bg-blue-950/20"
                      )}
                      title={`Go to page ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={calls.length < itemsPerPage}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors",
                  calls.length < itemsPerPage
                    ? "bg-[#1A3D63]/20 text-[#4A7FA7]/30 cursor-not-allowed"
                    : "bg-blue-950/20 text-[#4A7FA7] hover:bg-gradient-to-r hover:from-[#4A7FA7] hover:to-[#1A3D63] hover:text-white shadow-sm"
                )}
                title="Go to next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Last Page (estimated) */}
              <button
                onClick={() => {
                  const estimatedLastPage = Math.ceil(totalCalls / itemsPerPage);
                  if (estimatedLastPage > currentPage) {
                    setCurrentPage(estimatedLastPage);
                  }
                }}
                disabled={calls.length < itemsPerPage || !totalCalls}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors",
                  (calls.length < itemsPerPage || !totalCalls)
                    ? "bg-[#1A3D63]/20 text-[#4A7FA7]/30 cursor-not-allowed"
                    : "bg-blue-950/20 text-[#4A7FA7] hover:bg-gradient-to-r hover:from-[#4A7FA7] hover:to-[#1A3D63] hover:text-white shadow-sm"
                )}
                title="Go to last page"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal - Rendered via Portal */}
      {mounted && deleteConfirmCallId && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/50 animate-in fade-in duration-150 duration-150">
          <div className="bg-[#1A3D63]/95 glow w-full max-w-md rounded-3xl shadow-2xl border border-red-500/50 overflow-hidden animate-in fade-in duration-150 duration-150">
            <div className="p-8 border-b border-red-500/30 bg-red-500/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-[850] text-[#F6FAFD] tracking-tight">Delete Call</h3>
                <p className="text-sm font-semibold text-red-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <p className="text-sm font-medium text-[#B3CFE5] leading-relaxed">
                Are you sure you want to delete this call and all its associated data (analytics, red flags, artifacts, jobs, and embeddings)?
              </p>
              <div className="p-4 rounded-xl glass">
                <p className="text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-1">Call ID</p>
                <p className="text-sm font-mono font-semibold text-[#F6FAFD] break-all">{deleteConfirmCallId}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setDeleteConfirmCallId(null)}
                  disabled={isDeleting}
                  className="flex-1 h-12 bg-blue-950/20 hover:bg-blue-950/30 disabled:opacity-50 disabled:cursor-not-allowed text-[#B3CFE5] rounded-xl font-bold text-sm uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCall(deleteConfirmCallId)}
                  disabled={isDeleting}
                  className="flex-1 h-12 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-[#1A3D63]/40 border-t-[#4A7FA7] animate-spin" />
      </div>
    }>
      <AnalyticsPageContent />
    </Suspense>
  );
}
