"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";

/**
 * Returns a `apiFetch` function that automatically injects:
 * - Authorization: Bearer <clerk_jwt>
 * - ngrok-skip-browser-warning: true
 *
 * Usage:
 *   const { apiFetch } = useApi();
 *   const data = await apiFetch("/api/v1/calls/");
 */
export function useApi() {
  const { getToken } = useAuth();

  const apiFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const token = await getToken();

      const headers: Record<string, string> = {
        "ngrok-skip-browser-warning": "true",
        ...(init.headers as Record<string, string>),
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Only set Content-Type for non-FormData bodies
      if (init.body && !(init.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      return fetch(`${BASE_URL}${path}`, { ...init, headers });
    },
    [getToken]
  );

  return { apiFetch, BASE_URL };
}
