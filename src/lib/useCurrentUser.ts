"use client";

import { useAuth, useUser, useOrganization } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useApi } from "./useApi";

export type UserRole = "admin" | "super_admin" | "manager" | "user" | null;

// Maps Clerk org role slugs → app role names
// Clerk defaults: "org:admin" | "org:member"
// Custom roles you may have set in Clerk Dashboard will also appear here
function mapOrgRole(clerkRole: string): UserRole {
  const r = clerkRole.toLowerCase();
  if (r === "org:admin" || r === "admin") return "admin";
  if (r === "org:manager" || r === "manager") return "manager";
  if (r === "org:member" || r === "member" || r === "user" || r === "org:user") return "user";
  // Catch-all: strip "org:" prefix and return as-is
  return (r.replace("org:", "") as UserRole) ?? "user";
}

export function useCurrentUser() {
  const { user, isLoaded } = useUser();
  const { orgId } = useAuth();
  const { membership } = useOrganization();
  const { apiFetch } = useApi();
  const [backendRole, setBackendRole] = useState<string | null>(null);
  const [isBackendRoleLoading, setIsBackendRoleLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    apiFetch("/api/v1/users/me")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load current user");
        const data = await response.json();
        if (!cancelled) setBackendRole(data?.user?.role ?? null);
      })
      .catch(() => {
        if (!cancelled) setBackendRole(null);
      })
      .finally(() => {
        if (!cancelled) setIsBackendRoleLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiFetch, isLoaded]);

  const rawProfileRole = user?.publicMetadata?.role as string | undefined;
  const isSuperAdmin = backendRole === "Super_admin" || rawProfileRole?.toLowerCase() === "super_admin";

  let role: UserRole;

  if (isSuperAdmin) {
    role = "super_admin";
  } else if (membership?.role) {
    role = mapOrgRole(membership.role);
  } else if (rawProfileRole) {
    role = rawProfileRole.toLowerCase() as UserRole;
  } else {
    role = "user";
  }

  return {
    role,
    isSuperAdmin,
    orgId: orgId ?? null,
    hasOrg: !!orgId,
    isLoading: !isLoaded || isBackendRoleLoading,
  };
}
