"use client";

import { useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const BAR_COUNT = 30;

/** Deterministic pseudo-waveform so each voice note looks distinct. */
function waveform(seed: string): number[] {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let x = hash >>> 0;
  const bars: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    bars.push(0.25 + ((x % 1000) / 1000) * 0.75);
  }
  return bars;
}

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function VoiceMessage({ src, isMe }: { src: string; isMe: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const bars = useMemo(() => waveform(src), [src]);

  // MediaRecorder files often report Infinity until fully played.
  const seekable = Number.isFinite(duration) && duration > 0;
  const progress = seekable ? current / duration : 0;
  const label = playing || current > 0 ? clock(current) : seekable ? clock(duration) : "Voice";

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  };

  const cycleRate = () => {
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const seek = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !seekable) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrent(audio.currentTime);
  };

  return (
    <div className="flex w-56 items-center gap-3 sm:w-64">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => {
          setPlaying(true);
          if (audioRef.current) audioRef.current.playbackRate = rate;
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current",
          isMe ? "bg-[color:var(--chat-sent-fg,var(--background))]/20 text-[color:var(--chat-sent-fg,var(--background))]" : "bg-accent/15 text-accent",
        )}
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="translate-x-px" />}
      </button>
      <div
        onClick={seek}
        aria-hidden="true"
        className={cn("flex h-8 flex-1 items-center gap-[2px]", seekable && "cursor-pointer")}
      >
        {bars.map((height, i) => {
          const played = i / BAR_COUNT < progress;
          return (
            <span
              key={i}
              className={cn(
                "w-[3px] rounded-full transition-colors",
                played
                  ? isMe ? "bg-[color:var(--chat-sent-fg,var(--background))]" : "bg-accent"
                  : isMe ? "bg-[color:var(--chat-sent-fg,var(--background))]/35" : "bg-foreground/20",
              )}
              style={{ height: `${Math.round(height * 100)}%` }}
            />
          );
        })}
      </div>
      <span className={cn("w-9 shrink-0 text-right font-mono text-[11px] tabular-nums", isMe ? "text-[color:var(--chat-sent-fg,var(--background))]/80" : "text-muted")}>
        {label}
      </span>
      <button
        type="button"
        onClick={cycleRate}
        aria-label={`Playback speed ${rate}x. Click to change.`}
        title="Playback speed"
        className="w-9 shrink-0 rounded-full bg-black/10 py-0.5 text-center font-mono text-[10px] font-semibold tabular-nums opacity-80 transition-opacity hover:opacity-100"
      >
        {rate}x
      </button>
    </div>
  );
}