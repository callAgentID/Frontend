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
  X,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useApi } from "@/lib/useApi";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { RoleGuard } from "@/components/RoleGuard";
import { toast } from "@/components/Toast";

type Role = "super_admin" | "admin" | "manager" | "user";

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

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null ? value as UnknownRecord : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeRole(value: unknown): Role {
  const role = String(value ?? "user").toLowerCase().replace(/^org:/, "");
  return role === "super_admin" || role === "admin" || role === "manager" || role === "user" || role === "member"
    ? (role === "member" ? "user" : role)
    : "user";
}

function normalizeUser(value: unknown): BackendUser | null {
  const user = asRecord(value);
  if (!user) return null;
  const id = user.id ?? user.clerk_id ?? user.user_id;
  if (typeof id !== "string" || !id) return null;

  const name = typeof user.name === "string" ? user.name.trim() : "";
  const nameParts = name && !/^none(\s+none)?$/i.test(name) ? name.split(/\s+/) : [];
  return {
    id,
    clerk_id: typeof user.clerk_id === "string" ? user.clerk_id : id,
    email: typeof user.email === "string" ? user.email : "",
    first_name: typeof user.first_name === "string" ? user.first_name : nameParts[0],
    last_name: typeof user.last_name === "string" ? user.last_name : nameParts.slice(1).join(" "),
    role: normalizeRole(user.role),
    created_at: typeof user.created_at === "string" ? user.created_at : undefined,
    last_active: typeof user.last_active === "string" ? user.last_active : undefined,
  };
}

// Super-admin user responses are grouped by organization. Flatten those
// memberships into the same table shape used by the rest of this page.
function extractUsers(payload: unknown): BackendUser[] {
  const root = asRecord(payload);
  const entries = Array.isArray(payload) ? payload : [payload];
  const organizations = entries.flatMap(entry => asArray(asRecord(entry)?.organizations));
  const rawUsers = organizations.length
    ? organizations.flatMap(organization => asArray(asRecord(organization)?.users))
    : asArray(root?.users ?? payload);
  const users = rawUsers.map(normalizeUser).filter((user): user is BackendUser => user !== null);
  return Array.from(new Map(users.map(user => [user.id, user])).values());
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  super_admin: { label: "Super Admin", color: "text-purple-400", bg: "bg-purple-400/15", border: "border-purple-400/30", icon: Shield },
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
  const { isLoading: roleLoading, isSuperAdmin } = useCurrentUser();

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/users/");
      if (res.status === 403) { setError("Access denied. Admin role required."); return; }
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(extractUsers(data));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading && isSuperAdmin) fetchUsers();
  }, [roleLoading, isSuperAdmin]);

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const updatedFirstName = firstName.trim();
      const updatedLastName = lastName.trim();
      if (!updatedFirstName || !updatedLastName) throw new Error("First name and last name are required.");
      if (updatedFirstName !== (editingUser.first_name || "") || updatedLastName !== (editingUser.last_name || "")) {
        const nameResponse = await fetch(`/api/admin/users/${editingUser.id}/name`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName: updatedFirstName, lastName: updatedLastName }),
        });
        const nameBody = await nameResponse.json().catch(() => ({}));
        if (!nameResponse.ok) throw new Error(nameBody.message || "Failed to update user name");
      }
      if (selectedRole !== editingUser.role) {
        const res = await apiFetch(`/api/v1/users/${editingUser.id}/role`, {
          method: "PUT",
          body: JSON.stringify({ role: selectedRole }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || body.message || "Failed to update role");
        }
      }
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, first_name: updatedFirstName, last_name: updatedLastName, role: selectedRole } : u));
      setEditingUser(null);
      toast("User updated successfully", "success");
    } catch (err: any) {
      toast(err.message || "Failed to update role. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (user: BackendUser) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setFirstName(user.first_name || "");
    setLastName(user.last_name || "");
  };

  const handleInviteUser = async () => {
    setIsInviting(true);
    try {
      const response = await fetch("/api/admin/users/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, firstName: inviteFirstName, lastName: inviteLastName }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Failed to send invitation");
      setIsInviteOpen(false); setInviteEmail(""); setInviteFirstName(""); setInviteLastName("");
      toast("CallBlick invitation sent. The user can create their organization after joining.", "success");
    } catch (err: any) {
      toast(err.message || "Failed to send invitation.", "error");
    } finally {
      setIsInviting(false);
    }
  };

  const filtered = users.filter(u =>
  (u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase()))
  );

  // Role counts
  const counts = { super_admin: 0, admin: 0, manager: 0, user: 0 };
  users.forEach(u => { if (u.role in counts) counts[u.role]++; });

  return (
    <RoleGuard allow={[]}>
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
        <div className="flex gap-3">
          <button onClick={() => setIsInviteOpen(true)} className="flex items-center gap-2 px-5 py-2.5 border border-blue-400/25 bg-blue-950/25 text-[#B3CFE5] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-950/40 transition-colors shrink-0"><UserPlus className="w-4 h-4" /> Invite user</button>
          <button onClick={fetchUsers} disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors shrink-0">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}{t('refresh')}</button>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {(["super_admin", "admin", "manager", "user"] as Role[]).map(role => {
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
              <div className="grid grid-cols-2 gap-3">
                <label><span className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">First name</span><input value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-blue-400/18 bg-blue-950/30 px-3 py-2.5 text-sm font-medium text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" /></label>
                <label><span className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">Last name</span><input value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-blue-400/18 bg-blue-950/30 px-3 py-2.5 text-sm font-medium text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" /></label>
              </div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">{t('assignRole')}</label>
              <div className="space-y-2">
                {(["super_admin", "admin", "manager", "user"] as Role[]).map(role => {
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
                          {role === "super_admin" && "Full access to everything"}
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
                disabled={isSaving || (selectedRole === editingUser.role && firstName.trim() === (editingUser.first_name || "") && lastName.trim() === (editingUser.last_name || ""))}
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
      {mounted && isInviteOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 animate-in fade-in duration-150"><div className="w-full max-w-lg overflow-hidden rounded-3xl border border-blue-400/18 bg-[#1A3D63]/95 shadow-2xl"><div className="flex items-center justify-between border-b border-blue-400/12 p-6"><div><h3 className="text-xl font-black text-[#F6FAFD]">Invite user</h3><p className="mt-1 text-sm text-[#B3CFE5]">They will receive a CallBlick invitation email.</p></div><button onClick={() => setIsInviteOpen(false)} className="text-[#B3CFE5] hover:text-white"><X className="w-5 h-5" /></button></div><div className="space-y-4 p-6"><label className="block"><span className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">Email</span><input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-blue-400/18 bg-blue-950/30 px-3 py-2.5 text-sm text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" /></label><div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">First name</span><input value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-blue-400/18 bg-blue-950/30 px-3 py-2.5 text-sm text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" /></label><label><span className="text-[10px] font-black uppercase tracking-widest text-[#B3CFE5]">Last name</span><input value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-blue-400/18 bg-blue-950/30 px-3 py-2.5 text-sm text-[#F6FAFD] outline-none focus:border-[#4A7FA7]" /></label></div></div><div className="flex gap-3 border-t border-blue-400/12 p-6"><button onClick={() => setIsInviteOpen(false)} disabled={isInviting} className="flex-1 rounded-xl bg-black/25 py-3 text-sm font-bold text-[#B3CFE5]">Cancel</button><button onClick={handleInviteUser} disabled={isInviting || !inviteEmail.trim() || !inviteFirstName.trim() || !inviteLastName.trim()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] py-3 text-sm font-black text-white disabled:opacity-40">{isInviting && <Loader2 className="w-4 h-4 animate-spin" />} Send invitation</button></div></div>
        </div>, document.body
      )}
    </main>
    </RoleGuard>
  );
}
