"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Zap,
  RefreshCw,
  Users,
  History,
  TrendingUp,
  TrendingDown,
  Building2,
  PlusCircle,
  MinusCircle,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { RoleGuard } from "@/components/RoleGuard";
import {
  usePoints,
  PointsBalance as IPointsBalance,
  PointsUser,
  PointsLedgerEntry,
  OrganizationInfo
} from "@/lib/usePoints";

function PointsPageContent() {
  const t = useTranslations("points");
  const tCommon = useTranslations("common");
  const { isSuperAdmin, role } = useCurrentUser();
  const isAdminOrManager = isSuperAdmin || role === "admin" || role === "manager";

  const {
    getOrgBalance,
    getOrgUsers,
    getOrgLedger,
    getOrgBalanceAdmin,
    getOrgUsersAdmin,
    getOrgLedgerAdmin,
    adjustOrgPoints,
    getOrganizations,
  } = usePoints();

  // State
  const [balance, setBalance] = useState<IPointsBalance | null>(null);
  const [users, setUsers] = useState<PointsUser[]>([]);
  const [ledger, setLedger] = useState<PointsLedgerEntry[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"users" | "ledger">("ledger");

  // Search/Filter state
  const [userSearch, setUserSearch] = useState<string>("");
  const [ledgerSearch, setLedgerSearch] = useState<string>("");

  // Adjustment Modal / Form State (Super Admin)
  const [adjustOperation, setAdjustOperation] = useState<"add" | "remove">("add");
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState<boolean>(false);
  const [adjustMessage, setAdjustMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const ensureArray = <T,>(val: any): T[] => {
    if (Array.isArray(val)) return val;
    if (Array.isArray(val?.entries)) return val.entries;
    if (Array.isArray(val?.users)) return val.users;
    if (Array.isArray(val?.ledger)) return val.ledger;
    if (Array.isArray(val?.items)) return val.items;
    if (Array.isArray(val?.data)) return val.data;
    return [];
  };

  // Fetch initial data or when selected org changes
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isSuperAdmin && selectedOrgId) {
        const [balData, usersData, ledgerData] = await Promise.allSettled([
          getOrgBalanceAdmin(selectedOrgId),
          getOrgUsersAdmin(selectedOrgId),
          getOrgLedgerAdmin(selectedOrgId),
        ]);

        if (balData.status === "fulfilled" && balData.value) setBalance(balData.value);
        if (usersData.status === "fulfilled") setUsers(ensureArray<PointsUser>(usersData.value));
        if (ledgerData.status === "fulfilled") setLedger(ensureArray<PointsLedgerEntry>(ledgerData.value));
      } else {
        const [balData, usersData, ledgerData] = await Promise.allSettled([
          getOrgBalance(),
          isAdminOrManager ? getOrgUsers() : Promise.resolve([]),
          isAdminOrManager ? getOrgLedger() : Promise.resolve([]),
        ]);

        if (balData.status === "fulfilled" && balData.value) setBalance(balData.value);
        if (usersData.status === "fulfilled") setUsers(ensureArray<PointsUser>(usersData.value));
        if (ledgerData.status === "fulfilled") setLedger(ensureArray<PointsLedgerEntry>(ledgerData.value));
      }
    } catch (err) {
      console.error("Failed to fetch points data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    isSuperAdmin,
    selectedOrgId,
    isAdminOrManager,
    getOrgBalance,
    getOrgUsers,
    getOrgLedger,
    getOrgBalanceAdmin,
    getOrgUsersAdmin,
    getOrgLedgerAdmin,
  ]);

  // Load Super Admin Organizations list once
  useEffect(() => {
    if (isSuperAdmin) {
      getOrganizations()
        .then((orgs) => {
          setOrganizations(ensureArray<OrganizationInfo>(orgs));
        })
        .catch((err) => console.error("Failed to fetch organizations:", err));
    }
  }, [isSuperAdmin, getOrganizations]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Adjustment Submit
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAmount || isNaN(parseFloat(adjustAmount)) || parseFloat(adjustAmount) <= 0) {
      setAdjustMessage({ type: "error", text: "Please enter a valid positive point amount." });
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustMessage({ type: "error", text: "Please provide a reason for this adjustment." });
      return;
    }

    const orgIdToAdjust = isSuperAdmin && selectedOrgId ? selectedOrgId : balance?.organization_id;
    if (!orgIdToAdjust) {
      setAdjustMessage({ type: "error", text: "No active organization selected." });
      return;
    }

    setIsSubmittingAdjust(true);
    setAdjustMessage(null);

    try {
      await adjustOrgPoints(orgIdToAdjust, {
        operation: adjustOperation,
        points: parseFloat(adjustAmount).toFixed(6),
        reason: adjustReason.trim(),
      });

      setAdjustMessage({ type: "success", text: t("adjustmentSuccess") });
      setAdjustAmount("");
      setAdjustReason("");
      fetchData();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("points-updated"));
      }
    } catch (err: any) {
      setAdjustMessage({ type: "error", text: err?.message || "Failed to adjust points balance." });
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const rawBalance = balance ? (balance.available_points ?? balance.balance ?? 0) : 0;
  const numericBalance = typeof rawBalance === "number" ? rawBalance : parseFloat(String(rawBalance) || "0");
  const formattedBalance = isNaN(numericBalance) ? "0.00" : numericBalance.toFixed(2);
  const formattedMinutes = isNaN(numericBalance) ? 0 : Math.floor(numericBalance);

  // Filtered Users
  const safeUsersList = ensureArray<PointsUser>(users);
  const filteredUsers = safeUsersList.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.user_name || "").toLowerCase().includes(q) ||
      (u.user_email || "").toLowerCase().includes(q) ||
      (u.user_id || "").toLowerCase().includes(q)
    );
  });

  // Filtered Ledger
  const safeLedgerList = ensureArray<PointsLedgerEntry>(ledger);
  const filteredLedger = safeLedgerList.filter((item) => {
    const q = ledgerSearch.toLowerCase();
    const op = (item.entry_type || item.operation || "").toLowerCase();
    const actor = (item.created_by || item.actor_name || item.actor_user_id || item.user_id || "").toLowerCase();
    return (
      (item.reason || "").toLowerCase().includes(q) ||
      op.includes(q) ||
      actor.includes(q) ||
      (item.call_id || "").toLowerCase().includes(q)
    );
  });

  return (
    <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white glow shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-[900] text-[#F6FAFD] tracking-tight">{t("title")}</h1>
          </div>
          <p className="text-[#B3CFE5] text-sm font-medium pl-1">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Super Admin Org Selector */}
          {isSuperAdmin && (
            <div className="relative flex items-center">
              <Building2 className="w-4 h-4 text-[#4A7FA7] absolute left-3 pointer-events-none" />
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="h-10 pl-9 pr-4 bg-[#1A3D63]/50 border border-blue-400/20 rounded-xl text-xs font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-colors"
              >
                <option value="">Current Active Organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name || org.slug || org.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {tCommon("refresh")}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <div className="p-6 glass-card rounded-3xl border border-blue-400/20 bg-gradient-to-br from-[#1A3D63]/40 via-[#0A1931]/60 to-[#040C1E]/80 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Zap className="w-32 h-32 text-[#4A7FA7]" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">{t("balance")}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-[900] text-[#F6FAFD] tracking-tight">{formattedBalance}</span>
            <span className="text-sm font-bold text-[#4A7FA7]">pts</span>
          </div>
          <p className="text-xs font-semibold text-[#B3CFE5]">
            ≈ {formattedMinutes} {t("equivalentMinutes")}
          </p>
          <div className="pt-2 text-[10px] text-[#B3CFE5]/60 font-medium border-t border-blue-400/10">
            {t("sharedNote")}
          </div>
        </div>

        {/* Total Users Usage Summary */}
        <div className="p-6 glass-card rounded-3xl border border-blue-400/20 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4A7FA7]/20 border border-blue-400/20 flex items-center justify-center text-[#4A7FA7]">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">{t("usersTab")}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-[900] text-[#F6FAFD]">{filteredUsers.length}</span>
            <span className="text-xs font-bold text-[#B3CFE5]">active users</span>
          </div>
          <p className="text-xs font-semibold text-[#B3CFE5]">
            Total User Consumed Points Recorded
          </p>
        </div>

        {/* Total Ledger Transactions */}
        <div className="p-6 glass-card rounded-3xl border border-blue-400/20 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4A7FA7]/20 border border-blue-400/20 flex items-center justify-center text-[#4A7FA7]">
            <History className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">{t("ledgerTab")}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-[900] text-[#F6FAFD]">{filteredLedger.length}</span>
            <span className="text-xs font-bold text-[#B3CFE5]">transactions</span>
          </div>
          <p className="text-xs font-semibold text-[#B3CFE5]">
            Complete Audit Log Entries
          </p>
        </div>
      </div>

      {/* Super Admin Adjustment Section */}
      {isSuperAdmin && (
        <div className="p-6 glass-card rounded-3xl border border-blue-400/20 bg-blue-950/20 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#4A7FA7]" />
            <h3 className="text-base font-black text-[#F6FAFD]">{t("adjustPoints")}</h3>
          </div>

          <form onSubmit={handleAdjustmentSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] mb-1.5">
                {t("operation")}
              </label>
              <div className="flex rounded-xl bg-black/25 p-1 border border-blue-400/15">
                <button
                  type="button"
                  onClick={() => setAdjustOperation("add")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-colors",
                    adjustOperation === "add" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "text-[#B3CFE5]"
                  )}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {t("credit")}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustOperation("remove")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-colors",
                    adjustOperation === "remove" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-[#B3CFE5]"
                  )}
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  {t("debit")}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] mb-1.5">
                {t("amount")}
              </label>
              <input
                type="number"
                step="0.000001"
                min="0.000001"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder={t("amountPlaceholder")}
                className="w-full h-10 bg-black/25 border border-blue-400/20 rounded-xl px-3 text-xs font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] mb-1.5">
                {t("reason")}
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder={t("reasonPlaceholder")}
                className="w-full h-10 bg-black/25 border border-blue-400/20 rounded-xl px-3 text-xs font-bold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-colors"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmittingAdjust}
                className="w-full h-10 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white rounded-xl font-extrabold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmittingAdjust ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {t("submitAdjustment")}
              </button>
            </div>
          </form>

          {adjustMessage && (
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl text-xs font-bold border animate-in fade-in duration-150",
                adjustMessage.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              )}
            >
              {adjustMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {adjustMessage.text}
            </div>
          )}
        </div>
      )}

      {/* Main Tabs Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-blue-400/15 pb-4">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("ledger")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
              activeTab === "ledger"
                ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white shadow-lg glow"
                : "text-[#B3CFE5] hover:text-[#F6FAFD] bg-blue-950/30 border border-blue-400/10"
            )}
          >
            <History className="w-4 h-4" />
            {t("ledgerTab")} ({filteredLedger.length})
          </button>
          {isAdminOrManager && (
            <button
              onClick={() => setActiveTab("users")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
                activeTab === "users"
                  ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white shadow-lg glow"
                  : "text-[#B3CFE5] hover:text-[#F6FAFD] bg-blue-950/30 border border-blue-400/10"
              )}
            >
              <Users className="w-4 h-4" />
              {t("usersTab")} ({filteredUsers.length})
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#B3CFE5]/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={activeTab === "ledger" ? ledgerSearch : userSearch}
            onChange={(e) => (activeTab === "ledger" ? setLedgerSearch(e.target.value) : setUserSearch(e.target.value))}
            placeholder={`Filter ${activeTab}...`}
            className="w-full h-9 pl-9 pr-3 bg-black/25 border border-blue-400/18 rounded-xl text-xs font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-colors"
          />
        </div>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-[#4A7FA7] animate-spin" />
        </div>
      ) : activeTab === "ledger" ? (
        <div className="glass-card rounded-3xl border border-blue-400/20 overflow-hidden">
          {filteredLedger.length === 0 ? (
            <div className="p-12 text-center text-[#B3CFE5]/60 text-sm font-semibold">
              {t("noLedger")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-blue-400/18 bg-blue-950/40 text-[#B3CFE5] font-black uppercase tracking-wider">
                    <th className="py-3.5 px-4">{t("date")}</th>
                    <th className="py-3.5 px-4">{t("type")}</th>
                    <th className="py-3.5 px-4 text-right">{t("pointsAmount")}</th>
                    <th className="py-3.5 px-4 text-right">{t("resultingBalance")}</th>
                    <th className="py-3.5 px-4">{t("reasonCol")}</th>
                    <th className="py-3.5 px-4">{t("actor")}</th>
                    <th className="py-3.5 px-4">{t("callId")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-400/10">
                  {filteredLedger.map((item) => {
                    const rawOp = (item.entry_type || item.operation || "").toLowerCase();
                    const numPts = typeof item.points === "number" ? item.points : parseFloat(String(item.points || "0"));
                    const numBal = typeof item.balance_after === "number" ? item.balance_after : parseFloat(String(item.balance_after || "0"));
                    
                    const isNegative = !isNaN(numPts) && numPts < 0;
                    const isDebit = isNegative || rawOp === "debit" || rawOp === "remove" || rawOp === "deduction";
                    const isCredit = !isDebit;

                    const formattedDate = item.created_at ? new Date(item.created_at).toLocaleString() : "—";
                    const actorStr = item.created_by || item.actor_name || item.actor_user_id || item.user_id || "System";
                    const pointsStr = isNegative
                      ? `${numPts.toFixed(4)}`
                      : (isCredit ? `+${numPts.toFixed(4)}` : `-${Math.abs(numPts).toFixed(4)}`);

                    return (
                      <tr key={item.id} className="hover:bg-blue-950/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#B3CFE5] whitespace-nowrap">{formattedDate}</td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                              isCredit
                                ? "bg-green-500/15 text-green-400 border border-green-500/25"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                            )}
                          >
                            {isCredit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {rawOp || (isCredit ? t("credit") : t("debit"))}
                          </span>
                        </td>
                        <td
                          className={cn(
                            "py-3 px-4 text-right font-black whitespace-nowrap",
                            isCredit ? "text-green-400" : "text-amber-400"
                          )}
                        >
                          {pointsStr}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-[#F6FAFD] whitespace-nowrap">
                          {numBal.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 text-[#F6FAFD] font-medium max-w-xs truncate" title={item.reason}>
                          {item.reason || "—"}
                        </td>
                        <td className="py-3 px-4 text-[#B3CFE5] font-medium whitespace-nowrap">
                          {actorStr}
                        </td>
                        <td className="py-3 px-4 text-[#B3CFE5]/60 font-mono text-[11px] whitespace-nowrap">
                          {item.call_id ? item.call_id.substring(0, 12) + "..." : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-3xl border border-blue-400/20 overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-[#B3CFE5]/60 text-sm font-semibold">
              {t("noUsers")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-blue-400/18 bg-blue-950/40 text-[#B3CFE5] font-black uppercase tracking-wider">
                    <th className="py-3.5 px-4">{t("userName")}</th>
                    <th className="py-3.5 px-4">{t("email")}</th>
                    <th className="py-3.5 px-4">User ID</th>
                    <th className="py-3.5 px-4 text-right">{t("totalUsed")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-400/10">
                  {filteredUsers.map((u) => {
                    const rawUsed = u.total_points_used ?? u.total_minutes_used ?? 0;
                    const numUsed = typeof rawUsed === "number" ? rawUsed : parseFloat(String(rawUsed) || "0");
                    return (
                      <tr key={u.user_id} className="hover:bg-blue-950/20 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#F6FAFD]">{u.user_name || "—"}</td>
                        <td className="py-3 px-4 text-[#B3CFE5] font-medium">{u.user_email || "—"}</td>
                        <td className="py-3 px-4 text-[#B3CFE5]/60 font-mono text-[11px]">{u.user_id}</td>
                        <td className="py-3 px-4 text-right font-black text-[#F6FAFD]">{numUsed.toFixed(4)} pts</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function PointsPage() {
  return (
    <RoleGuard allow={["admin", "manager"]}>
      <PointsPageContent />
    </RoleGuard>
  );
}
