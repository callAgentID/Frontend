"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useRef, useEffect } from "react";

const CONFIGURED_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";

function getValidatedBaseUrl() {
  const url = new URL(CONFIGURED_BASE_URL);

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_BASE_URL must use HTTPS in production");
  }

  return url.toString().replace(/\/$/, "");
}

const BASE_URL = getValidatedBaseUrl();

const TOKEN_TTL = 3 * 60 * 1000;

export function useApi() {
  const { getToken, orgId } = useAuth();

  const tokenCache = useRef<{ token: string | null; expiresAt: number; orgId: string | null }>({
    token: null,
    expiresAt: 0,
    orgId: null,
  });

  // Bust cache whenever the active organization changes
  useEffect(() => {
    if (tokenCache.current.orgId !== orgId) {
      tokenCache.current = { token: null, expiresAt: 0, orgId: orgId ?? null };
    }
  }, [orgId]);

  const getFreshToken = useCallback(async (): Promise<string | null> => {
    const token = await getToken();
    tokenCache.current = { token, expiresAt: Date.now() + TOKEN_TTL, orgId: orgId ?? null };
    return token;
  }, [getToken, orgId]);

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
      let token: string | null;
      const cache = tokenCache.current;
      if (cache.token && Date.now() < cache.expiresAt && cache.orgId === (orgId ?? null)) {
        token = cache.token;
      } else {
        token = await getFreshToken();
      }

      const response = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: buildHeaders(token, init),
      });

      // On 401/403 — bust cache and retry once with a fresh token
      if (response.status === 401 || response.status === 403) {
        tokenCache.current = { token: null, expiresAt: 0, orgId: orgId ?? null };
        const freshToken = await getFreshToken();

        return fetch(`${BASE_URL}${path}`, {
          ...init,
          headers: buildHeaders(freshToken, init),
        });
      }

      return response;
    },
    [getFreshToken, orgId]
  );

  return { apiFetch, BASE_URL };
}
