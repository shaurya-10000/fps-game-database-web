"use client";

import { useState } from "react";
import { ChevronDown, Pin } from "lucide-react";
import type { DmMessage } from "../types";

interface PinnedBarProps {
  pins: DmMessage[];
  onJump: (messageId: string) => void;
  onOpenAll: () => void;
}

export default function PinnedBar({ pins, onJump, onOpenAll }: PinnedBarProps) {
  const [index, setIndex] = useState(0);
  const current = pins.length > 0 ? pins[index % pins.length] : undefined;
  if (!current) return null;

  const preview = current.audioUrl ? "Voice message" : current.content;

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface/60 px-4 py-2">
      <Pin size={14} className="shrink-0 text-accent" />
      <button type="button" onClick={() => onJump(current._id)} className="min-w-0 flex-1 text-left">
        <span className="block text-[11px] font-semibold text-accent">
          Pinned message{pins.length > 1 ? ` ${(index % pins.length) + 1} of ${pins.length}` : ""}
        </span>
        <span className="block truncate text-[13px] text-foreground/80">{preview}</span>
      </button>
      {pins.length > 1 && (
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % pins.length)}
          aria-label="Show next pinned message"
          className="rounded-full p-1.5 text-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <ChevronDown size={16} />
        </button>
      )}
      <button type="button" onClick={onOpenAll} className="shrink-0 text-[12px] font-semibold text-accent hover:underline">
        View all
      </button>
    </div>
  );
}