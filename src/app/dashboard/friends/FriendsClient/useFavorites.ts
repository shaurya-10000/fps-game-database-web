"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "fps.friends.favorites";

/** Friends you starred. Saved in this browser. */
export function useFavorites() {
  const [ids, setIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === "string");
    } catch {
      // Ignore unreadable storage.
    }
    return [];
  });

  const toggle = useCallback((playerId: string) => {
    setIds((prev) => {
      const next = prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage may be full or disabled.
      }
      return next;
    });
  }, []);

  return { ids, toggle };
}
