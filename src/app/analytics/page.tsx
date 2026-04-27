"use client";

import { useEffect, useState } from "react";
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
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResultsPanel } from "@/components/ResultsPanel";

export default function AnalyticsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [totalCalls, setTotalCalls] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [detailedResult, setDetailedResult] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filter state
  const [reviewFilter, setReviewFilter] = useState<'all' | 'reviewed' | 'unreviewed'>('all');

  // Fetch historical calls with pagination
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://daughterlike-eddy-unmental.ngrok-free.dev";
        const offset = (currentPage - 1) * itemsPerPage;
        const response = await fetch(`${baseUrl}/api/v1/calls/?limit=${itemsPerPage}&offset=${offset}`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          // Sort by created_at descending (newest first)
          let sortedData = data.sort((a, b) => {
            const dateA = new Date(a.created_at || a.ready_at || 0).getTime();
            const dateB = new Date(b.created_at || b.ready_at || 0).getTime();
            return dateB - dateA; // Descending order
          });

          // Apply review filter
          if (reviewFilter !== 'all') {
            sortedData = sortedData.filter(call =>
              reviewFilter === 'reviewed'
                ? call.review_status === 'reviewed'
                : call.review_status !== 'reviewed'
            );
          }

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
  }, [currentPage, itemsPerPage, reviewFilter]);

  // Fetch specific call detail
  const viewDetail = async (callId: string) => {
    setSelectedCallId(callId);
    setIsDetailLoading(true);
    setDetailedResult(null);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://daughterlike-eddy-unmental.ngrok-free.dev";
      const response = await fetch(`${baseUrl}/api/v1/calls/${callId}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
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
  };

  if (selectedCallId) {
    return (
      <div className="p-8 space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
        <div className="flex items-center justify-between max-w-6xl mx-auto border-b border-[#1f3a3408] pb-8">
           <button 
             onClick={closeDetail}
             className="flex items-center gap-2 text-[#1F3A3450] hover:text-[#1F3A34] font-bold text-xs uppercase tracking-widest transition-all"
           >
             <ArrowLeft className="w-4 h-4" /> Back to Signal History
           </button>
           <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-[#1F3A3460] uppercase tracking-widest">Signal Locked</span>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50 animate-pulse" />
           </div>
        </div>

        {isDetailLoading ? (
           <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 rounded-3xl border-4 border-[#1f3a3408] border-t-[#1F3A34] animate-spin" />
              <p className="text-[12px] font-extrabold text-[#1F3A3450] uppercase tracking-[0.2em] animate-pulse">Decrypting High-Fidelity Audit...</p>
           </div>
        ) : (
           detailedResult && <ResultsPanel data={detailedResult} />
        )}
      </div>
    );
  }

  return (
    <div className="p-10 space-y-16 animate-in fade-in duration-1000 max-w-7xl mx-auto">
      {/* Header Intelligence Summary */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between border-b border-[#1f3a3408] pb-12">
        <div>
          <div className="flex items-center gap-3 mb-4 px-1">
            <span className="px-3 py-1 bg-[#1F3A34] text-white text-[10px] uppercase font-[900] tracking-widest rounded-lg">Historical Command</span>
            <span className="text-[11px] font-bold text-[#1F3A3460] uppercase tracking-widest leading-none">Global Signal Archive</span>
          </div>
          <h2 className="text-[52px] font-[850] text-[#1F3A34] tracking-tight leading-none mb-6">Signal Timeline</h2>
          <p className="text-[#1F3A3480] text-[16px] font-medium max-w-lg leading-relaxed">
            Monitoring the evolution of conversation intelligence across all strategically mapped ingestions.
          </p>
        </div>

        <div className="flex gap-4">
           {/* Aggregate Quick Stats */}
           <div className="p-6 rounded-[2.5rem] bg-white apple-shadow border border-[#1f3a3405] min-w-[200px]">
              <div className="flex items-center justify-between mb-4">
                 <div className="p-2 rounded-xl bg-[#1F3A3408] text-[#1F3A3440]"><Activity className="w-4 h-4" /></div>
                 <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">Page {currentPage}</span>
              </div>
              <p className="text-[10px] font-black text-[#1F3A3430] uppercase tracking-widest mb-1">Showing Records</p>
              <h4 className="text-2xl font-[850] text-[#1F3A34]">{calls.length}</h4>
              {totalCalls > 0 && (
                <p className="text-[9px] font-bold text-[#1F3A3440] mt-1">of ~{totalCalls} total</p>
              )}
           </div>
        </div>
      </div>

      {/* Main Historical Table */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-4">
              <h4 className="text-xl font-[850] text-[#1F3A34] tracking-tight">Signal History</h4>
              <div className="h-6 w-[1px] bg-[#1f3a3410]" />
              <div className="flex items-center gap-2 text-[10px] font-black px-3 py-1 bg-[#1F3A3408] rounded-full text-[#1F3A3450]">
                 <Database className="w-3 h-3" /> LIVE
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setIsLoading(true);
                }}
                className="flex items-center gap-2 px-4 h-11 bg-[#1F3A3408] hover:bg-[#1F3A3415] text-[#1F3A34] rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                title="Refresh list"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>

              {/* Review Status Filter */}
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3A3440] pointer-events-none" />
                <select
                  value={reviewFilter}
                  onChange={(e) => {
                    setReviewFilter(e.target.value as 'all' | 'reviewed' | 'unreviewed');
                    setCurrentPage(1);
                  }}
                  className="h-11 pl-11 pr-4 bg-[#1F3A3405] hover:bg-[#1F3A3408] border border-[#1f3a3410] rounded-xl text-sm font-bold text-[#1F3A34] outline-none focus:border-[#1F3A3415] transition-all cursor-pointer appearance-none"
                >
                  <option value="all">All Calls</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="unreviewed">Unreviewed</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3A3420] rotate-90 pointer-events-none" />
              </div>

              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3A3420] group-hover:text-[#1F3A34] transition-colors" />
                 <input
                   disabled
                   placeholder="Search Archive..."
                   className="h-11 bg-[#1F3A3405] border border-transparent focus:border-[#1F3A3415] rounded-xl pl-11 pr-6 text-sm font-bold text-[#1F3A34] outline-none transition-all w-64 placeholder:text-[#1F3A3420]"
                 />
              </div>
           </div>
        </div>

        <div className="w-full bg-white apple-shadow rounded-[3rem] border border-[#1f3a3403] overflow-hidden">
           {isLoading ? (
             <div className="p-20 flex flex-col items-center justify-center space-y-6">
                <div className="w-12 h-12 rounded-2xl border-4 border-[#1f3a3408] border-t-[#1F3A34] animate-spin" />
                <p className="text-[11px] font-black text-[#1F3A3430] uppercase tracking-[0.2em]">Synchronizing Archive...</p>
             </div>
           ) : (
             <div className="divide-y divide-[#1f3a3405]">
                {calls.map((call) => (
                  <div 
                    key={call.call_id}
                    onClick={() => viewDetail(call.call_id)}
                    className="flex items-center gap-6 p-8 hover:bg-[#1F3A3403] transition-all cursor-pointer group"
                  >
                     {/* Score Indicator */}
                     <div className={cn(
                       "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg",
                       (call.overall_score || 0) >= 80 ? "bg-green-500 text-white shadow-green-500/20" :
                       (call.overall_score || 0) >= 50 ? "bg-[#1F3A3415] text-[#1F3A34]" : "bg-red-500 text-white shadow-red-500/20"
                     )}>
                       {(call.overall_score || 0).toFixed(0)}
                     </div>

                     {/* Main Info */}
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                           <h5 className="text-[17px] font-extrabold text-[#1F3A34] tracking-tight truncate group-hover:text-[#1F3A34] transition-colors">Signal #{call.call_id.split('-')[0]}</h5>
                           {call.has_red_flags && <ShieldAlert className="w-5 h-5 text-red-500 fill-red-500/10" />}
                           {call.call_success !== null && call.call_success !== undefined && (
                              <span className={cn(
                                "px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md",
                                call.call_success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              )}>
                                {call.call_success ? '✅' : '❌'}
                              </span>
                           )}
                           {call.review_status === 'reviewed' && (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-blue-50 text-blue-600 border border-blue-200">
                                <Eye className="w-3 h-3" />
                              </span>
                           )}
                        </div>
                        {call.smart_summary && (
                           <p className="text-sm font-medium text-[#1F3A3460] mb-2 line-clamp-2 leading-relaxed">
                              {call.smart_summary}
                           </p>
                        )}
                        <div className="flex items-center gap-5">
                           <span className="flex items-center gap-2 text-[11px] font-black text-[#1F3A3460] uppercase tracking-widest">
                              <Calendar className="w-3.5 h-3.5" /> {new Date(call.created_at).toLocaleDateString()}
                           </span>
                           <span className="w-1.5 h-1.5 rounded-full bg-[#1F3A3415]" />
                           <span className="text-[11px] font-bold text-[#1F3A3480] uppercase tracking-widest px-2 py-0.5 bg-[#1F3A3405] rounded-md">
                              Sentiment: {call.sentiment?.label || 'N/A'}
                           </span>
                        </div>
                     </div>

                     {/* Stats Indicators */}
                     <div className="flex items-center gap-10 pr-6">
                        <div className="text-right hidden md:block">
                           <p className="text-[11px] font-black text-[#1F3A3440] uppercase tracking-widest mb-1 leading-none">Silence Index</p>
                           <p className="text-[15px] font-[850] text-[#1F3A34] tracking-tight">{((call.silence_ratio || 0) * 100).toFixed(0)}%</p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-[#1F3A3408] text-[#1F3A3440] flex items-center justify-center group-hover:bg-[#1F3A34] group-hover:text-white transition-all group-hover:scale-110 shadow-sm">
                           <ArrowUpRight className="w-5 h-5" />
                        </div>
                     </div>
                  </div>
                ))}

                {calls.length === 0 && (
                  <div className="p-20 text-center space-y-4">
                     <History className="w-12 h-12 text-[#1F3A3410] mx-auto" />
                     <p className="text-sm font-bold text-[#1F3A3430] uppercase tracking-widest">No signals found in the history.</p>
                  </div>
                )}
             </div>
           )}
        </div>

        {/* Pagination Controls */}
        {!isLoading && calls.length > 0 && (
          <div className="flex items-center justify-between px-4 py-6">
            <div className="flex items-center gap-4">
              <p className="text-sm font-bold text-[#1F3A3460]">
                Showing <span className="text-[#1F3A34] font-extrabold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-[#1F3A34] font-extrabold">{Math.min(currentPage * itemsPerPage, ((currentPage - 1) * itemsPerPage) + calls.length)}</span>
                {totalCalls > 0 && <span> of <span className="text-[#1F3A34] font-extrabold">{totalCalls}</span></span>}
              </p>

              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1F3A3440] uppercase tracking-wider">Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-9 px-3 bg-[#1F3A3405] border border-[#1f3a3410] rounded-lg text-sm font-bold text-[#1F3A34] outline-none focus:border-[#1F3A3415] transition-all cursor-pointer"
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
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all",
                  currentPage === 1
                    ? "bg-[#1F3A3405] text-[#1F3A3420] cursor-not-allowed"
                    : "bg-[#1F3A3408] text-[#1F3A34] hover:bg-[#1F3A34] hover:text-white shadow-sm"
                )}
                title="First page"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all",
                  currentPage === 1
                    ? "bg-[#1F3A3405] text-[#1F3A3420] cursor-not-allowed"
                    : "bg-[#1F3A3408] text-[#1F3A34] hover:bg-[#1F3A34] hover:text-white shadow-sm"
                )}
                title="Previous page"
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
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all",
                        currentPage === pageNum
                          ? "bg-[#1F3A34] text-white shadow-lg shadow-[#1F3A3420]"
                          : "bg-[#1F3A3405] text-[#1F3A34] hover:bg-[#1F3A3410]"
                      )}
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
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all",
                  calls.length < itemsPerPage
                    ? "bg-[#1F3A3405] text-[#1F3A3420] cursor-not-allowed"
                    : "bg-[#1F3A3408] text-[#1F3A34] hover:bg-[#1F3A34] hover:text-white shadow-sm"
                )}
                title="Next page"
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
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all",
                  (calls.length < itemsPerPage || !totalCalls)
                    ? "bg-[#1F3A3405] text-[#1F3A3420] cursor-not-allowed"
                    : "bg-[#1F3A3408] text-[#1F3A34] hover:bg-[#1F3A34] hover:text-white shadow-sm"
                )}
                title="Last page"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
