"use client";

import { useCallback } from "react";
import { useApi } from "./useApi";

export interface PointsBalance {
  organization_id: string;
  organization_name?: string;
  available_points?: string | number;
  balance?: string | number;
}

export interface PointsUser {
  user_id: string;
  user_name?: string;
  user_email?: string;
  total_points_used?: string | number;
  total_minutes_used?: string | number;
}

export interface PointsLedgerEntry {
  id: string;
  organization_id: string;
  entry_type?: string;
  operation?: string;
  points: string | number;
  balance_after: string | number;
  duration_seconds?: number | null;
  call_id?: string | null;
  user_id?: string | null;
  created_by?: string | null;
  actor_id?: string | null;
  actor_user_id?: string | null;
  actor_name?: string | null;
  reason: string;
  created_at: string;
}

export interface PointsAdjustment {
  operation: "add" | "remove";
  points: string;
  reason: string;
}

export interface OrganizationInfo {
  id: string;
  name?: string;
  slug?: string;
}

const extractErrorMessage = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (data?.detail?.message) return data.detail.message;
    if (data?.message) return data.message;
  } catch {}
  return fallback;
};

export function usePoints() {
  const { apiFetch } = useApi();

  const getOrgBalance = useCallback(async (): Promise<PointsBalance> => {
    const res = await apiFetch("/api/v1/points/balance");
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, "Failed to fetch points balance"));
    }
    return res.json();
  }, [apiFetch]);

  const getOrgUsers = useCallback(async (): Promise<PointsUser[]> => {
    const res = await apiFetch("/api/v1/points/users");
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, "Failed to fetch points users"));
    }
    return res.json();
  }, [apiFetch]);

  const getOrgLedger = useCallback(async (): Promise<PointsLedgerEntry[]> => {
    const res = await apiFetch("/api/v1/points/ledger");
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, "Failed to fetch points ledger"));
    }
    return res.json();
  }, [apiFetch]);

  const getOrgBalanceAdmin = useCallback(async (orgId: string): Promise<PointsBalance> => {
    const res = await apiFetch(`/api/v1/points/organizations/${orgId}/balance`);
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, "Failed to fetch org balance"));
    }
    return res.json();
  }, [apiFetch]);

  const getOrgUsersAdmin = useCallback(async (orgId: string): Promise<PointsUser[]> => {
    const res = await apiFetch(`/api/v1/points/organizations/${orgId}/users`);
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, "Failed to fetch org users"));
    }
    return res.json();
  }, [apiFetch]);

  const getOrgLedgerAdmin = useCallback(async (orgId: string): Promise<PointsLedgerEntry[]> => {
    const res = await apiFetch(`/api/v1/points/organizations/${orgId}/ledger`);
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, "Failed to fetch org ledger"));
    }
    return res.json();
  }, [apiFetch]);

  const adjustOrgPoints = useCallback(async (orgId: string, adjustment: PointsAdjustment): Promise<any> => {
    const res = await apiFetch(`/api/v1/points/organizations/${orgId}/adjustments`, {
      method: "POST",
      body: JSON.stringify(adjustment),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, "Failed to adjust points balance"));
    }
    return res.json();
  }, [apiFetch]);

  const getOrganizations = useCallback(async (): Promise<OrganizationInfo[]> => {
    const res = await apiFetch("/api/v1/organizations");
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, "Failed to fetch organizations"));
    }
    return res.json();
  }, [apiFetch]);

  return {
    getOrgBalance,
    getOrgUsers,
    getOrgLedger,
    getOrgBalanceAdmin,
    getOrgUsersAdmin,
    getOrgLedgerAdmin,
    adjustOrgPoints,
    getOrganizations,
  };
}