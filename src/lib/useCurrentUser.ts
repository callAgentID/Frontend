"use client";

import { useAuth, useUser, useOrganization } from "@clerk/nextjs";

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

  const rawProfileRole = user?.publicMetadata?.role as string | undefined;
  const isSuperAdmin = rawProfileRole?.toLowerCase() === "super_admin";

  let role: UserRole;

  if (isSuperAdmin) {
    // Super admins keep their global role regardless of org membership
    role = "super_admin";
  } else if (membership?.role) {
    // Active org membership — use the org role
    role = mapOrgRole(membership.role);
  } else if (rawProfileRole) {
    // No org active yet — fall back to profile role
    role = rawProfileRole.toLowerCase() as UserRole;
  } else {
    role = "user";
  }

  return {
    role,
    isSuperAdmin,
    orgId: orgId ?? null,
    hasOrg: !!orgId,
    isLoading: !isLoaded,
  };
}
