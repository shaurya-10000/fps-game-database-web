"use client";

import { useRef } from "react";
import { Ban, Inbox, UserPlus, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabId } from "./types";

interface TabDef {
  id: TabId;
  label: string;
  icon: LucideIcon;
  count?: number;
  /** Highlight the count (something needs attention). */
  alert?: boolean;
}

interface FriendsTabsProps {
  value: TabId;
  onChange: (id: TabId) => void;
  friendsCount: number;
  requestsCount: number;
  blockedCount: number;
}

export default function FriendsTabs({ value, onChange, friendsCount, requestsCount, blockedCount }: FriendsTabsProps) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const tabs: TabDef[] = [
    { id: "friends", label: "Friends", icon: Users, count: friendsCount },
    { id: "requests", label: "Requests", icon: Inbox, count: requestsCount, alert: requestsCount > 0 },
    { id: "add", label: "Add friend", icon: UserPlus },
    { id: "blocked", label: "Blocked", icon: Ban, count: blockedCount },
  ];

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
    <div role="tablist" aria-label="Friends sections" className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab, index) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) refs.current.set(tab.id, el);
            }}
            id={`friends-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`friends-panel-${tab.id}`}
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
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-center font-mono text-[11px] font-bold leading-5",
                  tab.alert ? "bg-accent text-background" : "bg-foreground/10 text-muted",
                )}
              >
                {tab.count}
              </span>
            )}
            {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />}
          </button>
        );
      })}
    </div>
  );
}