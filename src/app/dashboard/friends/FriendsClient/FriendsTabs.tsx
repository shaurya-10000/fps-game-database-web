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
    <div role="tablist" aria-label="Friends sections" className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface/30 p-1.5 sm:flex sm:gap-1">
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
              "relative flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              active 
                ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                : "text-muted hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <tab.icon size={15} className={active ? "text-foreground" : "text-muted"} />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  tab.alert ? "bg-rose-500 text-white" : "bg-foreground/10 text-muted"
                )}
              >
                {tab.count > 99 ? "99+" : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
