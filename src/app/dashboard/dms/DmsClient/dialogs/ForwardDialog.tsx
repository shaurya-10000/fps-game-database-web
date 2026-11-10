"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { ChatAvatar } from "@/app/dashboard/chat/chat-shared";
import type { DmFriend, GroupSummary } from "../types";
import GroupAvatar from "../ui/GroupAvatar";
import Modal from "../ui/Modal";

export type ForwardTarget = { kind: "dm"; friend: DmFriend } | { kind: "group"; group: GroupSummary };

interface ForwardDialogProps {
  preview: string;
  friends: DmFriend[];
  groups: GroupSummary[];
  onForward: (target: ForwardTarget) => Promise<void> | void;
  onClose: () => void;
}

export default function ForwardDialog({ preview, friends, groups, onForward, onClose }: ForwardDialogProps) {
  const [query, setQuery] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const targets = useMemo(() => {
    const all: { key: string; name: string; target: ForwardTarget }[] = [
      ...groups.map((group) => ({ key: `group:${group.roomId}`, name: group.name, target: { kind: "group", group } as ForwardTarget })),
      ...friends.map((friend) => ({ key: `dm:${friend.playerId}`, name: friend.name, target: { kind: "dm", friend } as ForwardTarget })),
    ];
    const q = query.trim().toLowerCase();
    return q ? all.filter((t) => t.name.toLowerCase().includes(q)) : all;
  }, [friends, groups, query]);

  const send = async (key: string, target: ForwardTarget) => {
    setBusyKey(key);
    try {
      await onForward(target);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <Modal title="Forward message" description="Pick a chat to send it to." busy={busyKey !== null} onClose={onClose}>
      <div className="space-y-3 px-6 py-5">
        <p className="line-clamp-2 break-words rounded-xl border-l-2 border-accent bg-surface px-3 py-2 text-[12px] text-muted">{preview}</p>

        <label className="relative block">
          <span className="sr-only">Search chats</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-base text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 sm:text-[13px]"
          />
        </label>

        <ul className="max-h-64 space-y-0.5 overflow-y-auto">
          {targets.map(({ key, name, target }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => void send(key, target)}
                disabled={busyKey !== null}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-foreground/[0.05] disabled:opacity-60"
              >
                {target.kind === "dm" ? <ChatAvatar name={name} size={36} /> : <GroupAvatar name={name} size={36} />}
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-foreground">{name}</span>
                {target.kind === "group" && <span className="text-[11px] text-muted">Group</span>}
                {busyKey === key && <LoaderCircle size={15} className="animate-spin text-muted" />}
              </button>
            </li>
          ))}
          {targets.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-muted">No chats match your search.</li>}
        </ul>
      </div>
    </Modal>
  );
}