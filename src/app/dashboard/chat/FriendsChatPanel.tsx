"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { FriendshipRow } from "@/lib/api-types";

interface FriendsChatPanelProps {
  activeRoomId: string;
  onOpenDm: (roomId: string, name: string, playerId: string) => void;
}

interface NamedRow extends FriendshipRow {
  toPlayerName?: string;
}

export default function FriendsChatPanel({ activeRoomId, onOpenDm }: FriendsChatPanelProps) {
  const [rows, setRows] = useState<NamedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ friends: NamedRow[] }>("/api/me/friends")
      .then((res) => {
        if (!cancelled) setRows(res.friends ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load friends.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function openDm(friend: NamedRow) {
    setOpeningId(friend.toPlayerId);
    try {
      const res = await api<{ roomId: string; targetUsername: string }>(
        `/api/chat/dm-by-id/${encodeURIComponent(friend.toPlayerId)}`
      );
      onOpenDm(res.roomId, friend.toPlayerName || res.targetUsername, friend.toPlayerId);
    } catch {
      setError("Could not open that DM.");
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
          Friends
        </div>
        <div className="mt-0.5 text-[12px] text-muted">
          Tap a friend to open a direct message.
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="px-2 py-6 text-center text-[12px] text-muted">Loading…</div>
        )}

        {error && (
          <div className="mx-2 my-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-400">
            {error}
          </div>
        )}

        {!loading && rows.length === 0 && !error && (
          <div className="px-3 py-8 text-center text-[12px] text-muted">
            No friends yet. Add some from the Friends page.
          </div>
        )}

        <ul className="space-y-0.5">
          {rows.map((f) => {
            const name = f.toPlayerName || f.toPlayerId.slice(0, 8);
            const isOpening = openingId === f.toPlayerId;
            return (
              <li key={f._id}>
                <button
                  type="button"
                  onClick={() => void openDm(f)}
                  disabled={isOpening}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors ${
                    activeRoomId.includes(f.toPlayerId)
                      ? "bg-foreground/[0.06] text-foreground"
                      : "text-muted hover:bg-foreground/[0.04] hover:text-foreground"
                  } disabled:opacity-60`}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent">
                    {name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {name}
                  </span>
                  <span className="text-[10px] text-muted">
                    {isOpening ? "…" : "DM"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
