"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useRef } from "react";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";

// Cache token for 3 minutes — conservative to avoid near-expiry failures
const TOKEN_TTL = 3 * 60 * 1000;

export function useApi() {
  const { getToken } = useAuth();

  const tokenCache = useRef<{ token: string | null; expiresAt: number }>({
    token: null,
    expiresAt: 0,
  });

  const getFreshToken = useCallback(async (): Promise<string | null> => {
    const token = await getToken();
    tokenCache.current = { token, expiresAt: Date.now() + TOKEN_TTL };
    return token;
  }, [getToken]);

  const buildHeaders = (token: string | null, init: RequestInit): Record<string, string> => {
    const headers: Record<string, string> = {
      "ngrok-skip-browser-warning": "true",
      ...(init.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (init.body && !(init.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  const apiFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      // Use cached token if still valid
      let token: string | null;
      if (tokenCache.current.token && Date.now() < tokenCache.current.expiresAt) {
        token = tokenCache.current.token;
      } else {
        token = await getFreshToken();
      }

      const response = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: buildHeaders(token, init),
      });

      // On 401/403 — cached token expired before TTL (clock skew / early revocation)
      // Clear cache, fetch a brand-new token, and retry ONCE
      if (response.status === 401 || response.status === 403) {
        tokenCache.current = { token: null, expiresAt: 0 }; // bust cache
        const freshToken = await getFreshToken();

        return fetch(`${BASE_URL}${path}`, {
          ...init,
          headers: buildHeaders(freshToken, init),
        });
      }

      return response;
    },
    [getFreshToken]
  );

  return { apiFetch, BASE_URL };
}
