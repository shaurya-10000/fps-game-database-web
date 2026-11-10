"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export type Selection =
  | { kind: "dm"; roomId: string; playerId: string; name: string }
  | { kind: "group"; roomId: string };

const OPEN_FAILED = "Couldn't open that conversation. Please try again.";

async function resolveDm(playerId: string, knownName?: string): Promise<Selection> {
  const res = await api<{ roomId: string; targetUsername: string }>(
    `/api/chat/dm-by-id/${encodeURIComponent(playerId)}`,
  );
  return { kind: "dm", playerId, roomId: res.roomId, name: knownName || res.targetUsername };
}

export function useConversation(onError: (message: string) => void) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const openDm = useCallback(
    async (playerId: string, knownName?: string) => {
      setOpeningId(playerId);
      try {
        setSelection(await resolveDm(playerId, knownName));
      } catch {
        onError(OPEN_FAILED);
      } finally {
        setOpeningId(null);
      }
    },
    [onError],
  );

  const openGroup = useCallback((roomId: string) => setSelection({ kind: "group", roomId }), []);
  const close = useCallback(() => setSelection(null), []);

  // Deep link from other pages: /dashboard/dms?dm=<playerId>
  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get("dm");
    if (!target) return;
    window.history.replaceState(null, "", window.location.pathname);
    resolveDm(target)
      .then((next) => setSelection(next))
      .catch(() => onError(OPEN_FAILED));
  }, [onError]);

  return { selection, openingId, openDm, openGroup, close };
}