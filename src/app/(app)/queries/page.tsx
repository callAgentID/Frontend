"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Trash2,
  Building2,
  Mail,
  Clock,
  Phone,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/useApi";
import { toast } from "@/components/Toast";
import { RoleGuard } from "@/components/RoleGuard";

interface QueryRequest {
  id: string;
  name: string;
  work_email: string;
  company: string;
  expected_monthly_call_hours: number;
  use_case: string;
  created_at: string;
  updated_at: string;
}

interface QueryResponse {
  items: QueryRequest[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

const PAGE_SIZE = 20;

export default function QueriesPage() {
  const { apiFetch } = useApi();

  const [queries, setQueries] = useState<QueryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteQuery, setConfirmDeleteQuery] = useState<QueryRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchQueries = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        page_size: String(PAGE_SIZE),
        ...(search ? { search } : {}),
      });
      const res = await apiFetch(`/api/v1/query-requests?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch queries (${res.status})`);
      const data: QueryResponse = await res.json();
      setQueries(data.items);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || "Failed to fetch queries");
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, search]);

  useEffect(() => {
    fetchQueries(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Reset to page 1 when search changes (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      fetchQueries(1);
    }, 400);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async () => {
    if (!confirmDeleteQuery) return;
    setIsDeleting(true);
    setDeletingId(confirmDeleteQuery.id);
    try {
      const res = await apiFetch(`/api/v1/query-requests/${confirmDeleteQuery.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setQueries(prev => prev.filter(q => q.id !== confirmDeleteQuery.id));
      setTotal(prev => prev - 1);
      setConfirmDeleteQuery(null);
      toast("Query request deleted successfully", "success");
    } catch (err: any) {
      toast(err.message || "Failed to delete query request", "error");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <RoleGuard allow={[]}>
    <main className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white glow shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-[900] text-[#F6FAFD] tracking-tight">Query Requests</h1>
          </div>
          <p className="text-[#B3CFE5] text-sm font-medium pl-1">
            Manage and review inbound query requests from potential customers.
          </p>
        </div>
        <button
          onClick={() => fetchQueries(page)}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors shrink-0"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Queries", value: total, color: "text-[#63B3ED]", bg: "bg-[#63B3ED]/10", border: "border-[#63B3ED]/25", icon: MessageSquare },
          { label: "This Page", value: queries.length, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/25", icon: Building2 },
          { label: "Total Pages", value: totalPages, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25", icon: Clock },
        ].map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} className={cn("p-5 rounded-2xl border flex items-center gap-4", bg, border)}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", bg, border)}>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <div>
              <p className={cn("text-2xl font-[900]", color)}>{value}</p>
              <p className="text-xs font-bold text-[#B3CFE5] uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3CFE5]/60 group-focus-within:text-[#4A7FA7] transition-colors" />
        <input
          type="text"
          placeholder="Search by name, email, company or use case..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-12 bg-blue-950/30 border border-blue-400/18 rounded-xl pl-11 pr-4 text-sm font-medium text-[#F6FAFD] placeholder:text-[#B3CFE5]/50 outline-none focus:border-[#4A7FA7] transition-colors"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-blue-950/20 rounded-2xl border border-blue-400/12 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-10 bg-red-500/10 border border-red-500/30 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-red-400 font-bold">{error}</p>
          <button
            onClick={() => fetchQueries(page)}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-blue-400/18 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-3 border-b border-blue-400/12 bg-black/15">
            <span className="col-span-3 text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">Name / Company</span>
            <span className="col-span-3 text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] hidden md:block">Work Email</span>
            <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">Use Case</span>
            <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] hidden lg:block">Call Hrs / mo</span>
            <span className="col-span-1 text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] hidden lg:block">Submitted</span>
            <span className="col-span-1 text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] text-right">Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#4A7FA7]/10">
            {queries.length === 0 ? (
              <div className="p-16 text-center">
                <MessageSquare className="w-10 h-10 text-[#4A7FA7]/40 mx-auto mb-3" />
                <p className="text-[#B3CFE5] font-semibold text-sm">No query requests found</p>
                {search && (
                  <p className="text-[#B3CFE5]/60 text-xs mt-1">Try adjusting your search term</p>
                )}
              </div>
            ) : (
              queries.map(query => {
                const initials = query.name
                  ? query.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                  : query.work_email?.[0]?.toUpperCase() ?? "Q";

                return (
                  <div
                    key={query.id}
                    className="grid grid-cols-12 px-6 py-4 hover:bg-blue-950/20 transition-colors items-center group"
                  >
                    {/* Name + Company */}
                    <div className="col-span-3 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#F6FAFD] truncate">{query.name}</p>
                        <p className="text-xs text-[#B3CFE5]/70 font-medium truncate flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 shrink-0" />
                          {query.company}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-3 hidden md:flex items-center gap-2 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-[#B3CFE5]/40 shrink-0" />
                      <span className="text-sm font-medium text-[#B3CFE5] truncate">{query.work_email}</span>
                    </div>

                    {/* Use Case */}
                    <div className="col-span-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-[#63B3ED]/10 text-[#63B3ED] border-[#63B3ED]/25">
                        {query.use_case}
                      </span>
                    </div>

                    {/* Call Hours */}
                    <div className="col-span-2 hidden lg:flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#B3CFE5]/40 shrink-0" />
                      <span className="text-sm font-medium text-[#B3CFE5]">
                        {query.expected_monthly_call_hours.toLocaleString()} hrs
                      </span>
                    </div>

                    {/* Date */}
                    <div className="col-span-1 hidden lg:flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#B3CFE5]/40 shrink-0" />
                      <span className="text-[10px] font-medium text-[#B3CFE5]/70">
                        {new Date(query.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Delete */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => setConfirmDeleteQuery(query)}
                        disabled={deletingId === query.id}
                        className="p-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-red-500/20 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete query request"
                      >
                        {deletingId === query.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer + Pagination */}
          {queries.length > 0 && (
            <div className="px-6 py-3 border-t border-blue-400/12 bg-black/15 flex items-center justify-between gap-4">
              <p className="text-xs font-bold text-[#B3CFE5]">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} queries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-blue-400/18 bg-blue-950/20 text-[#B3CFE5] hover:bg-blue-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-[#B3CFE5] px-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-blue-400/18 bg-blue-950/20 text-[#B3CFE5] hover:bg-blue-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {mounted && confirmDeleteQuery && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-[#1A3D63]/95 glow w-full max-w-md rounded-3xl shadow-2xl border border-red-500/30 overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-blue-400/12 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#F6FAFD]">Delete Query Request</p>
                  <p className="text-[10px] text-[#B3CFE5] font-medium mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmDeleteQuery(null)}
                className="w-8 h-8 rounded-xl hover:bg-[#4A7FA7]/20 flex items-center justify-center text-[#B3CFE5] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Details */}
            <div className="p-6 space-y-3">
              <p className="text-sm text-[#B3CFE5]">
                Are you sure you want to delete the query request from{" "}
                <span className="font-bold text-[#F6FAFD]">{confirmDeleteQuery.name}</span>?
              </p>
              <div className="rounded-xl border border-blue-400/18 bg-blue-950/20 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#B3CFE5]">
                  <Mail className="w-3.5 h-3.5 text-[#4A7FA7]" />
                  <span>{confirmDeleteQuery.work_email}</span>
                </div>
                <div className="flex items-center gap-2 text-[#B3CFE5]">
                  <Building2 className="w-3.5 h-3.5 text-[#4A7FA7]" />
                  <span>{confirmDeleteQuery.company}</span>
                </div>
                <div className="flex items-center gap-2 text-[#B3CFE5]">
                  <Phone className="w-3.5 h-3.5 text-[#4A7FA7]" />
                  <span>{confirmDeleteQuery.expected_monthly_call_hours} expected hrs/mo · {confirmDeleteQuery.use_case}</span>
                </div>
                <div className="flex items-center gap-2 text-[#B3CFE5]">
                  <Calendar className="w-3.5 h-3.5 text-[#4A7FA7]" />
                  <span>Submitted {formatDate(confirmDeleteQuery.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-blue-400/12 flex gap-3">
              <button
                onClick={() => setConfirmDeleteQuery(null)}
                disabled={isDeleting}
                className="flex-1 h-11 bg-black/25 hover:bg-black/35 text-[#B3CFE5] rounded-xl font-bold text-sm uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 h-11 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                  : <><Trash2 className="w-4 h-4" /> Delete</>
                }
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
    </RoleGuard>
  );
}
