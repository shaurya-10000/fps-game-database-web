"use client";

import { useRef, useState } from "react";
import { GripHorizontal, Maximize2, Mic, MicOff, PhoneOff } from "lucide-react";
import type { CallState } from "@/lib/webrtc";
import { cn } from "@/lib/utils";
import CallAvatar from "./CallAvatar";
import CallTimer from "./CallTimer";
import { StreamVideo } from "./StreamMedia";
import { pillLabel } from "./copy";
import { useAudioLevel } from "./useAudioLevel";

interface MiniCallProps {
  call: CallState;
  remoteStream: MediaStream | null;
  onExpand: () => void;
  onMute: () => void;
  onEnd: () => void;
}

const MARGIN = 8;

/** A small draggable call window, so you can keep chatting or browsing during a call. */
export default function MiniCall({ call, remoteStream, onExpand, onMute, onEnd }: MiniCallProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const remoteVideoOn = call.remote.screenSharing || !call.remote.videoOff;
  const showVideo = call.status === "active" && remoteVideoOn && remoteStream !== null;
  const speaking = useAudioLevel(remoteStream, call.status === "active" && !call.remote.muted);
  const live = call.status === "active" || call.status === "connecting" || call.status === "calling";

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const origin = drag.current;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!origin || !rect) return;
    const x = Math.min(Math.max(MARGIN, event.clientX - origin.dx), window.innerWidth - rect.width - MARGIN);
    const y = Math.min(Math.max(MARGIN, event.clientY - origin.dy), window.innerHeight - rect.height - MARGIN);
    setPos({ x, y });
  };

  return (
    <div
      ref={cardRef}
      role="region"
      aria-label="Call in progress"
      style={pos ? { left: pos.x, top: pos.y } : undefined}
      className={cn(
        "fixed z-[55] w-64 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 text-white shadow-2xl",
        pos ? "" : "bottom-28 right-4",
      )}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        className="flex cursor-grab touch-none items-center justify-center bg-white/5 py-1 active:cursor-grabbing"
        title="Drag to move"
      >
        <GripHorizontal size={14} className="text-white/40" />
      </div>

      {showVideo ? (
        <div className="aspect-video bg-black">
          <StreamVideo stream={remoteStream} fit={call.remote.screenSharing ? "contain" : "cover"} />
        </div>
      ) : (
        <div className="flex justify-center bg-gradient-to-b from-zinc-900 to-zinc-950 py-4">
          <CallAvatar name={call.targetName || "?"} size="sm" speaking={speaking} pulsing={call.status === "calling"} />
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{call.targetName || "Call"}</p>
          <p className="text-[11px] text-white/60">
            {call.status === "active" && call.connection === "connected" ? <CallTimer since={call.connectedAt} /> : pillLabel(call)}
          </p>
        </div>
        {live && (
          <button
            type="button"
            onClick={onMute}
            aria-label={call.isMuted ? "Unmute" : "Mute"}
            aria-pressed={call.isMuted}
            className={cn(
              "flex size-8 items-center justify-center rounded-full transition-colors",
              call.isMuted ? "bg-rose-500/25 text-rose-300" : "bg-white/10 hover:bg-white/20",
            )}
          >
            {call.isMuted ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
        )}
        <button
          type="button"
          onClick={onExpand}
          aria-label="Expand call"
          title="Expand call"
          className="flex size-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        >
          <Maximize2 size={15} />
        </button>
        {live && (
          <button
            type="button"
            onClick={onEnd}
            aria-label="End call"
            className="flex size-8 items-center justify-center rounded-full bg-rose-500 transition-colors hover:bg-rose-600"
          >
            <PhoneOff size={15} />
          </button>
        )}
      </div>
    </div>
  );
}