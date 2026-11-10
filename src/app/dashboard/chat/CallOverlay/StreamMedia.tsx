"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface StreamVideoProps {
  stream: MediaStream | null;
  /** Mirror the picture (use for your own camera). */
  mirror?: boolean;
  fit?: "cover" | "contain";
  className?: string;
  /** Marks the other person's video, so picture-in-picture knows which element to pop out. */
  remote?: boolean;
}

/** Video element that always stays in sync with a MediaStream held in React state. Always muted: audio plays through <StreamAudio>. */
export function StreamVideo({ stream, mirror = false, fit = "cover", className, remote = false }: StreamVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    if (stream) void el.play().catch(() => undefined);
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      {...(remote ? { "data-call-remote-video": "" } : {})}
      className={cn(
        "h-full w-full",
        fit === "cover" ? "object-cover" : "object-contain",
        mirror && "-scale-x-100",
        className,
      )}
    />
  );
}

type SinkElement = HTMLAudioElement & { setSinkId?: (sinkId: string) => Promise<void> };

/** Whether this browser can route audio to a chosen speaker (Chromium-based browsers). */
export function supportsSpeakerSelection(): boolean {
  return typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;
}

/** Invisible element that plays the remote party's audio for every call type. */
export function StreamAudio({ stream, sinkId }: { stream: MediaStream | null; sinkId?: string }) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    if (stream) void el.play().catch(() => undefined);
  }, [stream]);

  useEffect(() => {
    const el = ref.current as SinkElement | null;
    if (!el?.setSinkId) return;
    void el.setSinkId(sinkId ?? "").catch(() => undefined);
  }, [sinkId]);

  return <audio ref={ref} autoPlay />;
}