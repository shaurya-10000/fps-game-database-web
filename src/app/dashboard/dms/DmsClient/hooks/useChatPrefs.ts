"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeTheme, type ChatThemeSetting } from "../themes";
import type { StarredMessage } from "../types";

const STORAGE_KEY = "fps.dms.prefs";

interface Prefs {
  pinnedChats: string[];
  mutedChats: string[];
  archivedChats: string[];
  clearedAt: Record<string, string>;
  hidden: Record<string, string[]>;
  themes: Record<string, ChatThemeSetting>;
  starred: Record<string, StarredMessage[]>;
}

const EMPTY: Prefs = {
  pinnedChats: [],
  mutedChats: [],
  archivedChats: [],
  clearedAt: {},
  hidden: {},
  themes: {},
  starred: {},
};

function asObject<T>(value: unknown): Record<string, T> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, T>) : {};
}

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function read(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    return {
      pinnedChats: asList(parsed["pinnedChats"]),
      mutedChats: asList(parsed["mutedChats"]),
      archivedChats: asList(parsed["archivedChats"]),
      clearedAt: asObject<string>(parsed["clearedAt"]),
      hidden: asObject<string[]>(parsed["hidden"]),
      themes: Object.fromEntries(
        Object.entries(asObject<unknown>(parsed["themes"])).flatMap(([roomId, raw]): [string, ChatThemeSetting][] => {
          const theme = normalizeTheme(raw);
          return theme ? [[roomId, theme]] : [];
        }),
      ),
      starred: asObject<StarredMessage[]>(parsed["starred"]),
    };
  } catch {
    return EMPTY;
  }
}

function toggled(list: string[], key: string): string[] {
  return list.includes(key) ? list.filter((k) => k !== key) : [key, ...list];
}

/** Per-browser chat preferences: pinned, muted and archived chats, themes, stars, and local clearing/deleting. */
export function useChatPrefs() {
  const [prefs, setPrefs] = useState<Prefs>(EMPTY);

  useEffect(() => {
    setPrefs(read());
  }, []);

  const update = useCallback((change: (prev: Prefs) => Prefs) => {
    setPrefs((prev) => {
      const next = change(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage may be full or disabled; the change still applies for this session.
      }
      return next;
    });
  }, []);

  const togglePinChat = useCallback((key: string) => update((p) => ({ ...p, pinnedChats: toggled(p.pinnedChats, key) })), [update]);
  const toggleMute = useCallback((key: string) => update((p) => ({ ...p, mutedChats: toggled(p.mutedChats, key) })), [update]);
  const toggleArchive = useCallback(
    (key: string) =>
      update((p) => {
        const archiving = !p.archivedChats.includes(key);
        return {
          ...p,
          archivedChats: toggled(p.archivedChats, key),
          pinnedChats: archiving ? p.pinnedChats.filter((k) => k !== key) : p.pinnedChats,
        };
      }),
    [update],
  );

  const clearChat = useCallback(
    (roomId: string) => update((p) => ({ ...p, clearedAt: { ...p.clearedAt, [roomId]: new Date().toISOString() } })),
    [update],
  );

  /** Clears the history for you and takes the chat out of your pinned and archived lists. */
  const deleteChat = useCallback(
    (roomId: string, key: string) =>
      update((p) => ({
        ...p,
        clearedAt: { ...p.clearedAt, [roomId]: new Date().toISOString() },
        pinnedChats: p.pinnedChats.filter((k) => k !== key),
        archivedChats: p.archivedChats.filter((k) => k !== key),
        starred: { ...p.starred, [roomId]: [] },
      })),
    [update],
  );

  const hideMessage = useCallback(
    (roomId: string, messageId: string) =>
      update((p) => ({ ...p, hidden: { ...p.hidden, [roomId]: [...(p.hidden[roomId] ?? []), messageId] } })),
    [update],
  );

  const setTheme = useCallback(
    (roomId: string, setting: ChatThemeSetting | null) =>
      update((p) => {
        const { [roomId]: _old, ...rest } = p.themes;
        void _old;
        return { ...p, themes: setting ? { ...rest, [roomId]: setting } : rest };
      }),
    [update],
  );

  const toggleStar = useCallback(
    (roomId: string, message: StarredMessage) =>
      update((p) => {
        const current = p.starred[roomId] ?? [];
        const next = current.some((s) => s.id === message.id)
          ? current.filter((s) => s.id !== message.id)
          : [message, ...current].slice(0, 200);
        return { ...p, starred: { ...p.starred, [roomId]: next } };
      }),
    [update],
  );

  return {
    pinnedChats: prefs.pinnedChats,
    mutedChats: prefs.mutedChats,
    archivedChats: prefs.archivedChats,
    clearedAt: prefs.clearedAt,
    hidden: prefs.hidden,
    themes: prefs.themes,
    starred: prefs.starred,
    togglePinChat,
    toggleMute,
    toggleArchive,
    clearChat,
    deleteChat,
    hideMessage,
    setTheme,
    toggleStar,
  };
}