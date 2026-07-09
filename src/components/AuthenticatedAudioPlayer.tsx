"use client";

import { useEffect, useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { useApi } from "@/lib/useApi";

type AudioState =
  | { status: "loading"; src: null; error: null }
  | { status: "ready"; src: string; error: null }
  | { status: "error"; src: null; error: string };

interface AuthenticatedAudioPlayerProps {
  callId: string;
  id?: string;
  className?: string;
  preload?: "none" | "metadata" | "auto";
}

const URL_KEYS = ["url", "audio_url", "audioUrl", "presigned_url", "presignedUrl", "signed_url", "media_url"];

function getAudioUrlFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  for (const key of URL_KEYS) {
    const value = (payload as Record<string, unknown>)[key];
    if (typeof value === "string" && value.length > 0) return value;
  }

  return null;
}

export function AuthenticatedAudioPlayer({
  callId,
  id,
  className,
  preload = "metadata",
}: AuthenticatedAudioPlayerProps) {
  const { apiFetch } = useApi();
  const [audio, setAudio] = useState<AudioState>({ status: "loading", src: null, error: null });

  useEffect(() => {
    if (!callId || callId === "pending...") return;

    let isActive = true;
    let objectUrl: string | null = null;

    const loadAudio = async () => {
      setAudio({ status: "loading", src: null, error: null });

      try {
        const response = await apiFetch(`/api/v1/media/calls/${callId}/audio?as_json=true`, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Audio request failed with ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const payload = await response.json();
          const url = getAudioUrlFromPayload(payload);
          if (!url) throw new Error("Audio response did not include a playable URL");
          if (isActive) setAudio({ status: "ready", src: url, error: null });
          return;
        }

        const blob = await response.blob();
        if (blob.size === 0) throw new Error("Audio file is empty");

        objectUrl = URL.createObjectURL(blob);
        if (!isActive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        if (isActive) setAudio({ status: "ready", src: objectUrl, error: null });
      } catch (error) {
        if (!isActive) return;
        setAudio({
          status: "error",
          src: null,
          error: error instanceof Error ? error.message : "Unable to load call audio",
        });
      }
    };

    loadAudio();

    return () => {
      isActive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [apiFetch, callId]);

  if (audio.status === "loading") {
    return (
      <div className="w-full md:w-2/3 h-10 rounded-xl bg-blue-950/20 border border-blue-400/15 flex items-center justify-center gap-2 text-xs font-bold text-[#B3CFE5]">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading audio...
      </div>
    );
  }

  if (audio.status === "error") {
    return (
      <div className="w-full md:w-2/3 min-h-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-300">
        <XCircle className="w-4 h-4 shrink-0" />
        {audio.error}
      </div>
    );
  }

  return (
    <audio
      id={id}
      controls
      preload={preload}
      className={className}
      src={audio.src}
    >
      Your browser does not support audio playback.
    </audio>
  );
}
