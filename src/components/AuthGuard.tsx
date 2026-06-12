"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // While Clerk is loading, show nothing
  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center" >
        <div className="w-10 h-10 rounded-2xl border-4 border-[#1A3D63]/40 border-t-[#4A7FA7] animate-spin" />
      </div>
    );
  }

  // Not signed in — show nothing while redirect happens
  if (!isSignedIn) return null;

  return <>{children}</>;
}
