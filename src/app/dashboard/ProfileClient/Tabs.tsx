"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabDef<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface TabsProps<T extends string> {
  tabs: TabDef<T>[];
  value: T;
  onChange: (id: T) => void;
  idPrefix: string;
}

/** Accessible tab list: arrow keys, Home and End move between tabs. */
export default function Tabs<T extends string>({ tabs, value, onChange, idPrefix }: TabsProps<T>) {
  const refs = useRef(new Map<string, HTMLButtonElement>());

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const target =
      event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (target === null) return;
    event.preventDefault();
    const next = tabs[(target + tabs.length) % tabs.length];
    if (next) {
      onChange(next.id);
      refs.current.get(next.id)?.focus();
    }
  };

  return (
    <div role="tablist" aria-label="Profile sections" className="flex gap-1 overflow-x-auto border-b border-border [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {tabs.map((tab, index) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) refs.current.set(tab.id, el);
            }}
            id={`${idPrefix}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 px-4 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              active ? "text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            <tab.icon size={15} />
            {tab.label}
            {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />}
          </button>
        );
      })}
    </div>
  );
}
