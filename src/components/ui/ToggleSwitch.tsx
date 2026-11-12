"use client";

import { cn } from "@/lib/utils";

export function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200",
        enabled ? "bg-white" : "bg-zinc-700"
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full shadow-sm transition-transform duration-200",
          enabled ? "translate-x-[18px] bg-black" : "translate-x-0.5 bg-zinc-400"
        )}
      />
    </div>
  );
}
