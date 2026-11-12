"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Search } from "lucide-react";
import type { SearchResult } from "@/lib/friends-api";
import PersonRow, { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./PersonRow";
import type { SearchState } from "./usePlayerSearch";
import type { Relation } from "./types";

interface AddFriendPanelProps {
  username: string;
  query: string;
  trimmed: string;
  results: SearchResult[];
  state: SearchState;
  relationOf: (playerId: string) => Relation;
  onQueryChange: (value: string) => void;
  onAdd: (playerId: string, name: string) => void;
  onAcceptFrom: (playerId: string) => void;
  onCancelTo: (playerId: string) => void;
  onMessage: (playerId: string) => void;
  onUnblock: (playerId: string) => void;
}

export default function AddFriendPanel({
  username,
  query,
  trimmed,
  results,
  state,
  relationOf,
  onQueryChange,
  onAdd,
  onAcceptFrom,
  onCancelTo,
  onMessage,
  onUnblock,
}: AddFriendPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyUsername = async () => {
    try {
      await navigator.clipboard.writeText(username);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable.
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="relative block">
          <span className="sr-only">Search players by name</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search players by name"
            className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-3 text-base text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 sm:text-[14px]"
          />
        </label>
        <p className="mt-2 px-1 text-[12px] text-muted">Type at least 2 letters. Search matches the start of a player&apos;s name.</p>
      </div>

      {state === "loading" && <p className="px-1 py-4 text-[13px] text-muted">Searching...</p>}
      {state === "error" && <p className="px-1 py-4 text-[13px] text-rose-500">Search failed. Try again.</p>}
      {state === "done" && results.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted">
          No players found for &quot;{trimmed}&quot;.
        </p>
      )}

      {state === "done" && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((player) => {
            const relation = relationOf(player._id);
            return (
              <PersonRow key={player._id} name={player.displayName} avatarUrl={player.avatarUrl}>
                {relation === "friend" && (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 text-[12px] font-medium text-emerald-500">
                      <Check size={13} /> Friends
                    </span>
                    <button type="button" onClick={() => onMessage(player._id)} className={SECONDARY_BUTTON}>
                      <span className="inline-flex items-center gap-1.5">
                        <MessageCircle size={13} /> Message
                      </span>
                    </button>
                  </>
                )}
                {relation === "incoming" && (
                  <button type="button" onClick={() => onAcceptFrom(player._id)} className={PRIMARY_BUTTON}>
                    Accept request
                  </button>
                )}
                {relation === "outgoing" && (
                  <button type="button" onClick={() => onCancelTo(player._id)} className={SECONDARY_BUTTON}>
                    Requested - Cancel
                  </button>
                )}
                {relation === "blocked" && (
                  <button type="button" onClick={() => onUnblock(player._id)} className={SECONDARY_BUTTON}>
                    Blocked - Unblock
                  </button>
                )}
                {relation === "none" && (
                  <button type="button" onClick={() => onAdd(player._id, player.displayName)} className={PRIMARY_BUTTON}>
                    Add friend
                  </button>
                )}
              </PersonRow>
            );
          })}
        </ul>
      )}

      {username && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[12px] text-muted">Your name for friends to search</p>
            <p className="truncate font-mono text-[14px] font-semibold text-foreground">{username}</p>
          </div>
          <button type="button" onClick={copyUsername} className={SECONDARY_BUTTON}>
            <span className="inline-flex items-center gap-1.5">
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
