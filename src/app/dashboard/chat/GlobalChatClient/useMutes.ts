"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

/** The people you muted. Their messages are hidden for you in open rooms. */
export function useMutes(onError: (message: string) => void) {
  const [muted, setMuted] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    api<{ muted: string[] }>("/api/me/mutes")
      .then((res) => {
        if (!cancelled) setMuted(res.muted ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const mute = useCallback(
    async (playerId: string) => {
      try {
        await api("/api/me/mutes", { method: "POST", body: { toPlayerId: playerId } });
        setMuted((prev) => (prev.includes(playerId) ? prev : [...prev, playerId]));
      } catch {
        onError("Couldn't mute that player.");
      }
    },
    [onError],
  );

  const unmute = useCallback(
    async (playerId: string) => {
      try {
        await api(`/api/me/mutes/${encodeURIComponent(playerId)}`, { method: "DELETE" });
        setMuted((prev) => prev.filter((id) => id !== playerId));
      } catch {
        onError("Couldn't unmute that player.");
      }
    },
    [onError],
  );

  return { muted, mute, unmute };
}