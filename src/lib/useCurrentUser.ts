"use client";

import { useAuth, useUser } from "@clerk/nextjs";

export type UserRole = "Admin" | "Super_admin" | "Manager" | "User" | null;

export function useCurrentUser() {
  const { user, isLoaded } = useUser();
  const { orgId } = useAuth();

  const raw = user?.publicMetadata?.role as string | undefined;
  const role: UserRole = raw
    ? ((raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()) as UserRole)
    : null;

  const isSuperAdmin = raw?.toLowerCase() === "super_admin";

  return {
    role,
    isSuperAdmin,
    orgId: orgId ?? null,
    hasOrg: !!orgId,
    isLoading: !isLoaded,
  };
}
