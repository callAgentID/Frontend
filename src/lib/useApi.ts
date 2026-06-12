"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useRef } from "react";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";

const TOKEN_TTL = 4 * 60 * 1000; // 4 minutes — Clerk tokens expire at 5min

export function useApi() {
  const { getToken } = useAuth();

  // Cache token to avoid calling getToken() on every single request
  const tokenCache = useRef<{ token: string | null; expiresAt: number }>({
    token: null,
    expiresAt: 0,
  });

  const apiFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      // Reuse cached token if still valid
      let token: string | null;
      if (tokenCache.current.token && Date.now() < tokenCache.current.expiresAt) {
        token = tokenCache.current.token;
      } else {
        token = await getToken();
        tokenCache.current = { token, expiresAt: Date.now() + TOKEN_TTL };
      }

      const headers: Record<string, string> = {
        "ngrok-skip-browser-warning": "true",
        ...(init.headers as Record<string, string>),
      };

      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (init.body && !(init.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      return fetch(`${BASE_URL}${path}`, { ...init, headers });
    },
    [getToken]
  );

  return { apiFetch, BASE_URL };
}
