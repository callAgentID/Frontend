"use client";

import { OrganizationProfile } from "@clerk/nextjs";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OrganizationSettingsPage() {
  const { role, isSuperAdmin, isLoading } = useCurrentUser();
  const router = useRouter();

  // Only admins and super admins can access this page
  useEffect(() => {
    if (!isLoading && role && !isSuperAdmin && role.toLowerCase() !== "admin") {
      router.replace("/");
    }
  }, [isLoading, role, isSuperAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-10 h-10 rounded-2xl border-4 border-[#1A3D63]/40 border-t-[#4A7FA7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-[850] text-[#F6FAFD] tracking-tight">Organization Settings</h1>
        <p className="text-sm font-medium text-[#B3CFE5] mt-1">
          Manage your organization, invite members, and configure roles.
        </p>
      </div>

      <div className="flex justify-start">
        <OrganizationProfile
          appearance={{
            elements: {
              card: "bg-[#0A1931] border border-blue-400/15 rounded-3xl shadow-2xl",
              navbar: "bg-[#061224] border-r border-blue-400/10",
              navbarButton: "text-[#B3CFE5] hover:text-[#F6FAFD] hover:bg-blue-950/40",
              navbarButtonActive: "text-[#F6FAFD] bg-[#1A3D63]/60",
              pageScrollBox: "bg-transparent",
              formFieldInput: "bg-[#061224] border-blue-400/20 text-[#F6FAFD] rounded-xl",
              formButtonPrimary: "bg-[#2C8FFF] hover:bg-[#1A6FD4] rounded-xl font-bold",
              badge: "bg-[#1A3D63] text-[#B3CFE5] border-blue-400/20",
              memberListTableRow: "border-blue-400/10",
              tableHead: "text-[#B3CFE5] text-[10px] uppercase tracking-wider",
            }
          }}
        />
      </div>
    </div>
  );
}
