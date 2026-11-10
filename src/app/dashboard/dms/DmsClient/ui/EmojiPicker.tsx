"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { EMOJI_CATEGORIES } from "./emoji";

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onPick, onClose }: EmojiPickerProps) {
  const [categoryId, setCategoryId] = useState(EMOJI_CATEGORIES[0]?.id ?? "");
  const rootRef = useRef<HTMLDivElement>(null);
  const category = EMOJI_CATEGORIES.find((c) => c.id === categoryId) ?? EMOJI_CATEGORIES[0];

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Emoji picker"
      className="absolute bottom-full right-0 z-20 mb-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-background p-3 shadow-2xl"
    >
      <div className="mb-2 flex gap-1" role="tablist">
        {EMOJI_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.id === categoryId}
            onClick={() => setCategoryId(c.id)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[12px] font-semibold transition-colors",
              c.id === categoryId ? "bg-accent/15 text-accent" : "text-muted hover:bg-foreground/[0.06] hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto">
        {category?.emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick(emoji)}
            className="flex size-9 items-center justify-center rounded-lg text-xl transition-colors hover:bg-foreground/[0.08]"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}