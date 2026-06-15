"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Shield,
  Search,
  RefreshCw,
  ChevronDown,
  Check,
  Loader2,
  AlertTriangle,
  Crown,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useApi } from "@/lib/useApi";
import { useCurrentUser } from "@/lib/useCurrentUser";

type Role = "admin" | "manager" | "user";

interface BackendUser {
  id: string;
  clerk_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: Role;
  created_at?: string;
  last_active?: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  admin: { label: "Admin", color: "text-yellow-400", bg: "bg-yellow-400/15", border: "border-yellow-400/30", icon: Crown },
  manager: { label: "Manager", color: "text-[#63B3ED]", bg: "bg-[#63B3ED]/15", border: "border-[#63B3ED]/30", icon: UserCheck },
  user: { label: "User", color: "text-[#B3CFE5]", bg: "bg-[#B3CFE5]/10", border: "border-[#B3CFE5]/20", icon: Users },
};

const getRoleConfig = (role: string) =>
  ROLE_CONFIG[role?.toLowerCase()] ?? ROLE_CONFIG["user"];

export default function UsersPage() {
  const t = useTranslations('users');
  const tc = useTranslations('common');
  const { apiFetch } = useApi();
  const { role: myRole, isLoading: roleLoading } = useCurrentUser();

  const [users, setUsers] = useState<BackendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  // Role edit state
  const [editingUser, setEditingUser] = useState<BackendUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("user");
  const [isSaving, setIsSaving] = useState(false);
  const [dropdownOpenFor, setDropdownOpenFor] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/users/");
      if (res.status === 403) { setError("Access denied. Admin role required."); return; }
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading) fetchUsers();
  }, [roleLoading]);

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const res = await apiFetch(`/api/v1/users/${editingUser.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: selectedRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      // Update local state immediately
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: selectedRole } : u));
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message || "Failed to update role. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (user: BackendUser) => {
    setEditingUser(user);
    setSelectedRole(user.role);
  };

  const filtered = users.filter(u =>
  (u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase()))
  );

  // Role counts
  const counts = { admin: 0, manager: 0, user: 0 };
  users.forEach(u => { if (u.role in counts) counts[u.role]++; });

  if (!roleLoading && myRole?.toLowerCase() !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-black text-[#F6FAFD]">{tc('accessDenied')}</h2>
        <p className="text-[#B3CFE5] text-sm font-medium">{tc('accessDeniedDesc')}</p>
      </div>
    );
  }

  return (
    <main className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white glow shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-[900] text-[#F6FAFD] tracking-tight">{t('title')}</h1>
          </div>
          <p className="text-[#B3CFE5] text-sm font-medium pl-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors shrink-0"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t('refresh')}
        </button>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {(["admin", "manager", "user"] as Role[]).map(role => {
          const cfg = getRoleConfig(role);
          const Icon = cfg.icon;
          return (
            <div key={role} className={cn("p-5 rounded-2xl border flex items-center gap-4", cfg.bg, cfg.border)}>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.bg, cfg.border, "border")}>
                <Icon className={cn("w-5 h-5", cfg.color)} />
              </div>
              <div>
                <p className={cn("text-2xl font-[900]", cfg.color)}>{counts[role]}</p>
                <p className="text-xs font-bold text-[#B3CFE5] uppercase tracking-wider">{cfg.label}s</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3CFE5]/60 group-focus-within:text-[#4A7FA7] transition-colors" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-12 bg-blue-950/30 border border-blue-400/18 rounded-xl pl-11 pr-4 text-sm font-medium text-[#F6FAFD] placeholder:text-[#B3CFE5]/50 outline-none focus:border-[#4A7FA7] transition-colors"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-blue-950/20 rounded-2xl border border-blue-400/12 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-10 bg-red-500/10 border border-red-500/30 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-red-400 font-bold">{error}</p>
          <button onClick={fetchUsers} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider">{t('retryConnection')}</button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-blue-400/18 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-3 border-b border-blue-400/12 bg-black/15">
            <span className="col-span-4 text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">{t('user')}</span>
            <span className="col-span-3 text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] hidden md:block">{t('email')}</span>
            <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">{t('role')}</span>
            <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] hidden lg:block">{t('joined')}</span>
            <span className="col-span-1 text-[10px] font-black uppercase tracking-widest text-[#B3CFE5] text-right">{t('actions')}</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#4A7FA7]/10">
            {filtered.length === 0 ? (
              <div className="p-16 text-center">
                <Users className="w-10 h-10 text-[#4A7FA7]/40 mx-auto mb-3" />
                <p className="text-[#B3CFE5] font-semibold text-sm">{t('noUsers')}</p>
              </div>
            ) : (
              filtered.map(user => {
                const cfg = getRoleConfig(user.role);
                const RoleIcon = cfg.icon;
                const initials = user.first_name
                  ? user.first_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                  : user.email?.[0]?.toUpperCase() ?? "U";

                return (
                  user.email != "" &&
                  <div key={user.id} className="grid grid-cols-12 px-6 py-4 hover:bg-blue-950/20 transition-colors items-center group">
                    {/* Name + Avatar */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex flex-row gap-1">
                        <p className="text-sm font-bold text-[#F6FAFD] truncate">{user.first_name || "—"}</p>
                        <p className="text-sm font-bold text-[#F6FAFD] truncate">{user.last_name || "—"}</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-3 hidden md:flex items-center gap-2 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-[#B3CFE5]/40 shrink-0" />
                      <span className="text-sm font-medium text-[#B3CFE5] truncate">{user.email}</span>
                    </div>

                    {/* Role Badge */}
                    <div className="col-span-2">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                        cfg.bg, cfg.color, cfg.border
                      )}>
                        <RoleIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Joined */}
                    <div className="col-span-2 hidden lg:flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#B3CFE5]/40 shrink-0" />
                      <span className="text-xs font-medium text-[#B3CFE5]">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                      </span>
                    </div>

                    {/* Edit button */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => openEditModal(user)}
                        className="px-3 py-1.5 bg-[#4A7FA7]/20 hover:bg-[#4A7FA7]/40 text-[#4A7FA7] hover:text-[#F6FAFD] rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors border border-blue-400/18 opacity-0 group-hover:opacity-100"
                      >
                        {t('editRole')}
                      </button>
                    </div>
                  </div>

                );
              })
            )}
          </div>

          {/* Footer count */}
          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-blue-400/12 bg-black/15">
              <p className="text-xs font-bold text-[#B3CFE5]">
                {t('showing', { from: 1, to: filtered.length })} {t('ofTotal', { total: users.length })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Role Modal */}
      {mounted && editingUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 animate-in fade-in duration-150 duration-150">
          <div className="bg-[#1A3D63]/95 glow w-full max-w-md rounded-3xl shadow-2xl border border-blue-400/18 overflow-hidden animate-in fade-in duration-150 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-blue-400/12 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {editingUser.first_name
                    ? editingUser.first_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                    : editingUser.email?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <p className="text-sm font-black text-[#F6FAFD]">{editingUser.first_name || editingUser.email}</p>
                  <p className="text-[10px] text-[#B3CFE5] font-medium">{editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-xl hover:bg-[#4A7FA7]/20 flex items-center justify-center text-[#B3CFE5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Role Selector */}
            <div className="p-6 space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">{t('assignRole')}</label>
              <div className="space-y-2">
                {(["admin", "manager", "user"] as Role[]).map(role => {
                  const cfg = getRoleConfig(role);
                  const RoleIcon = cfg.icon;
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left",
                        isSelected
                          ? cn(cfg.bg, cfg.border, "shadow-lg")
                          : "bg-black/25 border-blue-400/12 hover:border-blue-400/22"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                        isSelected ? cn(cfg.bg, cfg.border) : "bg-blue-950/30 border-blue-400/12"
                      )}>
                        <RoleIcon className={cn("w-4 h-4", isSelected ? cfg.color : "text-[#B3CFE5]")} />
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-black", isSelected ? cfg.color : "text-[#F6FAFD]")}>{cfg.label}</p>
                        <p className="text-[10px] text-[#B3CFE5]/60 font-medium mt-0.5">
                          {role === "admin" && t('adminDesc')}
                          {role === "manager" && t('managerDesc')}
                          {role === "user" && t('userDesc')}
                        </p>
                      </div>
                      {isSelected && <Check className={cn("w-4 h-4 shrink-0", cfg.color)} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-blue-400/12 flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 h-11 bg-black/25 hover:bg-black/35 text-[#B3CFE5] rounded-xl font-bold text-sm uppercase tracking-wider transition-colors"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={isSaving || selectedRole === editingUser.role}
                className="flex-1 h-11 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {tc('saving')}</>
                ) : (
                  <><Shield className="w-4 h-4" /> {t('saveRole')}</>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
