"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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
  // Reads searchParams so it re-runs when the URL changes (e.g. from notification click).
  useEffect(() => {
    const target = searchParams.get("dm");
    if (!target) return;
    // Clean the URL so a refresh doesn't re-open the same DM
    router.replace(pathname);
    resolveDm(target)
      .then((next) => setSelection(next))
      .catch(() => onError(OPEN_FAILED));
  }, [searchParams, pathname, router, onError]);

  return { selection, openingId, openDm, openGroup, close };
}
