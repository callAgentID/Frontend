"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useRef, useEffect } from "react";
import { apiErrorDetail, apiErrorMessage } from "./billing";

const CONFIGURED_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://u2pszs8vpk.execute-api.eu-central-1.amazonaws.com/api/v1";

function getValidatedBaseUrl() {
  const url = new URL(CONFIGURED_BASE_URL);

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTPS in production");
  }

  return url.toString().replace(/\/$/, "");
}

const BASE_URL = getValidatedBaseUrl();

function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseHasPrefix = BASE_URL.endsWith("/api/v1");
  const pathHasPrefix = normalizedPath === "/api/v1" || normalizedPath.startsWith("/api/v1/");
  // Backend calls are always versioned. Keeping this normalization here also
  // prevents a future missed prefix from silently targeting the API root.
  const versionedPath = pathHasPrefix ? normalizedPath : `/api/v1${normalizedPath}`;
  const resolvedPath = baseHasPrefix
    ? versionedPath.slice("/api/v1".length) || "/"
    : versionedPath;
  return `${BASE_URL}${resolvedPath}`;
}

const TOKEN_TTL = 3 * 60 * 1000;

export function useApi() {
  const { getToken, orgId, userId } = useAuth();

  const tokenCache = useRef<{ token: string | null; expiresAt: number; orgId: string | null; userId: string | null }>({
    token: null,
    expiresAt: 0,
    orgId: null,
    userId: null,
  });

  // Never reuse a Clerk token across a user or organization boundary.
  useEffect(() => {
    if (tokenCache.current.orgId !== orgId || tokenCache.current.userId !== userId) {
      tokenCache.current = { token: null, expiresAt: 0, orgId: orgId ?? null, userId: userId ?? null };
    }
  }, [orgId, userId]);

  const getFreshToken = useCallback(async (): Promise<string | null> => {
    const token = await getToken();
    tokenCache.current = { token, expiresAt: Date.now() + TOKEN_TTL, orgId: orgId ?? null, userId: userId ?? null };
    return token;
  }, [getToken, orgId, userId]);

  const buildHeaders = (token: string | null, init: RequestInit): Record<string, string> => {
    const headers: Record<string, string> = {
      "ngrok-skip-browser-warning": "true",
      ...(init.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  const apiFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      let token: string | null;
      const cache = tokenCache.current;
      if (cache.token && Date.now() < cache.expiresAt && cache.orgId === (orgId ?? null) && cache.userId === (userId ?? null)) {
        token = cache.token;
      } else {
        token = await getFreshToken();
      }

      let response = await fetch(buildApiUrl(path), {
        ...init,
        headers: buildHeaders(token, init),
      });

      // A 401 may be an expired session token. A 403 is an authorization result,
      // so it must never be retried as though it were an authentication failure.
      if (response.status === 401) {
        tokenCache.current = { token: null, expiresAt: 0, orgId: orgId ?? null, userId: userId ?? null };
        const freshToken = await getFreshToken();

        response = await fetch(buildApiUrl(path), {
          ...init,
          headers: buildHeaders(freshToken, init),
        });
        if (response.status === 401 && typeof window !== "undefined") {
          const returnTo = `${window.location.pathname}${window.location.search}`;
          window.sessionStorage.setItem("auth:returnTo", returnTo);
          if (!window.location.pathname.startsWith("/sign-in")) {
            window.location.assign(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
          }
        }
      }

      if (response.status === 402 && typeof window !== "undefined") {
        const body = await response.clone().json().catch(() => null);
        const detail = {
          ...apiErrorDetail(body),
          message: apiErrorMessage(
            body,
            "This action requires an active subscription or additional minutes.",
            response.status
          ),
        };
        const returnTo = `${window.location.pathname}${window.location.search}`;
        window.sessionStorage.setItem("billing:returnTo", returnTo);
        window.dispatchEvent(new CustomEvent("billing:payment-required", {
          detail: { error: detail, returnTo },
        }));
      }

      return response;
    },
    [getFreshToken, orgId, userId]
  );

  return { apiFetch, BASE_URL };
}
