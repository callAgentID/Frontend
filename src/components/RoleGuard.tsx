"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";

interface RoleGuardProps {
  allow: string[];
  children: React.ReactNode;
}

export function RoleGuard({ allow, children }: RoleGuardProps) {
  const { role, isSuperAdmin, isLoading } = useCurrentUser();
  const router = useRouter();

  const normalized = role?.toLowerCase() ?? null;
  const allowed = !isLoading && (
    isSuperAdmin ||
    (normalized !== null && allow.map(r => r.toLowerCase()).includes(normalized))
  );

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace("/");
    }
  }, [isLoading, allowed, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-10 h-10 rounded-2xl border-4 border-[#1A3D63]/40 border-t-[#4A7FA7] animate-spin" />
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
