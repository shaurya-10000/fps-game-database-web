"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "fps.dms.recent";
const MAX_RECENT = 20;

function save(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage may be full or disabled.
  }
}

/** Remembers which conversations you opened last so they float to the top of the list. */
export function useRecentChats() {
  const [ids, setIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === "string");
      }
    } catch {
      // Ignore unreadable storage.
    }
    return [];
  });

  const touch = useCallback((playerId: string) => {
    setIds((prev) => {
      const next = [playerId, ...prev.filter((id) => id !== playerId)].slice(0, MAX_RECENT);
      save(next);
      return next;
    });
  }, []);

  const forget = useCallback((playerId: string) => {
    setIds((prev) => {
      const next = prev.filter((id) => id !== playerId);
      save(next);
      return next;
    });
  }, []);

  return { ids, touch, forget };
}
