"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OrganizationSwitcher } from "@clerk/nextjs";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  // Super admin is determined by global profile metadata (they don't need an org)
  const isSuperAdmin = (user?.publicMetadata?.role as string | undefined)?.toLowerCase() === "super_admin";

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-10 h-10 rounded-2xl border-4 border-[#1A3D63]/40 border-t-[#4A7FA7] animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) return null;

  // Non-super-admins must have an active organization selected
  if (!isSuperAdmin && !orgId) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ background: '#020912' }}>
        <div className="flex flex-col items-center gap-6 p-10 rounded-3xl border border-blue-400/15 bg-white/[0.03] backdrop-blur-xl max-w-md w-full mx-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#4A7FA7]/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-[#4A7FA7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[#F6FAFD] tracking-tight">Select an Organization</h2>
            <p className="text-sm font-medium text-[#B3CFE5]">
              You need to create or join an organization to access the platform.
            </p>
          </div>
          <OrganizationSwitcher
            hidePersonal={true}
            afterCreateOrganizationUrl="/"
            afterSelectOrganizationUrl="/"
            appearance={{
              elements: {
                rootBox: "w-full",
                organizationSwitcherTrigger: "w-full justify-between px-4 py-2.5 rounded-xl bg-[#1A3D63]/60 border border-blue-400/20 text-[#F6FAFD] text-sm font-semibold",
              }
            }}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
