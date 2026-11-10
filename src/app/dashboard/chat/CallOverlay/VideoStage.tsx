"use client";

import { useState } from "react";
import { MicOff } from "lucide-react";
import type { CallState } from "@/lib/webrtc";
import { cn } from "@/lib/utils";
import CallAvatar from "./CallAvatar";
import { StreamVideo } from "./StreamMedia";
import { useAudioLevel } from "./useAudioLevel";

interface TileProps {
  stream: MediaStream | null;
  visible: boolean;
  mirror?: boolean;
  fit: "cover" | "contain";
  name: string;
  hint: string;
  compact?: boolean;
  micOff?: boolean;
  speaking?: boolean;
  /** Marks the element picture-in-picture should pop out. */
  remote?: boolean;
}

function Tile({ stream, visible, mirror, fit, name, hint, compact, micOff, speaking, remote }: TileProps) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-zinc-900 transition-shadow duration-150",
        speaking && "shadow-[inset_0_0_0_3px_rgb(52_211_153)]",
      )}
    >
      {visible && stream ? (
        <StreamVideo stream={stream} mirror={mirror} fit={fit} remote={remote} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-800 to-zinc-950">
          <CallAvatar name={name || "?"} size={compact ? "sm" : "lg"} speaking={speaking} />
          <span className={cn("text-white/60", compact ? "text-[10px]" : "text-sm")}>{hint}</span>
        </div>
      )}
      {micOff && (
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] text-rose-300 backdrop-blur">
          <MicOff size={12} /> Muted
        </span>
      )}
    </div>
  );
}

interface VideoStageProps {
  call: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

export default function VideoStage({ call, localStream, remoteStream }: VideoStageProps) {
  const [swapped, setSwapped] = useState(false);

  const remoteVisible = call.remote.screenSharing || !call.remote.videoOff;
  const localVisible = call.isScreenSharing || (call.hasCamera && !call.isVideoOff);
  const name = call.targetName || "Unknown";
  const remoteSpeaking = useAudioLevel(remoteStream, !call.remote.muted);

  const remoteTile = (compact: boolean) => (
    <Tile
      stream={remoteStream}
      visible={remoteVisible}
      fit={call.remote.screenSharing ? "contain" : "cover"}
      name={name}
      hint="Camera off"
      compact={compact}
      micOff={call.remote.muted}
      speaking={remoteSpeaking}
      remote
    />
  );

  const localTile = (compact: boolean) => (
    <Tile
      stream={localStream}
      visible={localVisible}
      mirror={!call.isScreenSharing}
      fit={call.isScreenSharing ? "contain" : "cover"}
      name="You"
      hint={call.hasCamera ? "Camera off" : "No camera"}
      compact={compact}
      micOff={call.isMuted}
    />
  );

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0">{swapped ? localTile(false) : remoteTile(false)}</div>

      <button
        type="button"
        onClick={() => setSwapped((s) => !s)}
        aria-label="Swap video views"
        title="Click to swap"
        className="absolute bottom-32 right-4 z-20 aspect-video w-32 overflow-hidden rounded-2xl border-2 border-white/20 bg-zinc-800 shadow-2xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:w-56"
      >
        {swapped ? remoteTile(true) : localTile(true)}
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          {swapped ? name : "You"}
        </span>
      </button>
    </div>
  );
}