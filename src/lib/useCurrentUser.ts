"use client";

import { useUser } from "@clerk/nextjs";

export type UserRole = "Admin" | "Super_admin" | "manager" | "user" | null;

export function useCurrentUser() {
  const { user, isLoaded } = useUser();

  // Normalize to capitalized regardless of how backend stores it
  const raw = user?.publicMetadata?.role as string | undefined;
  const role: UserRole = raw
    ? ((raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()) as UserRole)
    : null;

  return { role, isLoading: !isLoaded };
}
