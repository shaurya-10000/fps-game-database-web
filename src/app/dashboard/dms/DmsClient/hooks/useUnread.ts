"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { api } from "@/lib/api";
import type { ChatActivity } from "../types";

/**
 * Unread counts for chats that are not open, driven by the server's `chat_activity` events.
 * Counts are for this browser session (they reset on reload).
 */
export function useUnread(
  socket: Socket | null,
  activeRoomId: string | null,
  myId: string,
  onActivity: (activity: ChatActivity) => void,
) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const activeRef = useRef(activeRoomId);
  const myIdRef = useRef(myId);
  const onActivityRef = useRef(onActivity);

  useEffect(() => {
    activeRef.current = activeRoomId;
    myIdRef.current = myId;
    onActivityRef.current = onActivity;
  });

  const clear = useCallback((roomId: string) => {
    setCounts((prev) => {
      if (!prev[roomId]) return prev;
      const { [roomId]: _removed, ...rest } = prev;
      void _removed;
      return rest;
    });
  }, []);

  // Start from the server's counts so unread badges survive a reload, and refresh after reconnects.
  useEffect(() => {
    if (!socket) return;
    let cancelled = false;
    const load = () => {
      api<{ counts: Record<string, number> }>("/api/chat/unread")
        .then((res) => {
          if (cancelled) return;
          const { [activeRef.current ?? ""]: _open, ...rest } = res.counts;
          void _open;
          setCounts(rest);
        })
        .catch(() => undefined);
    };
    load();
    socket.io.on("reconnect", load);
    return () => {
      cancelled = true;
      socket.io.off("reconnect", load);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const onChatActivity = (activity: ChatActivity) => {
      if (activity.senderId === myIdRef.current) return;
      const watching = activity.roomId === activeRef.current && document.visibilityState === "visible";
      if (!watching) setCounts((prev) => ({ ...prev, [activity.roomId]: (prev[activity.roomId] ?? 0) + 1 }));
      onActivityRef.current(activity);
    };
    socket.on("chat_activity", onChatActivity);
    return () => {
      socket.off("chat_activity", onChatActivity);
    };
  }, [socket]);

  // Opening a chat (or coming back to the tab while it is open) marks it as read.
  useEffect(() => {
    if (!activeRoomId) return;
    clear(activeRoomId);
    const onVisible = () => {
      if (document.visibilityState === "visible") clear(activeRoomId);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [activeRoomId, clear]);

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  // Show the count in the browser tab title.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = total > 0 ? `(${total}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [total]);

  return { counts, total, clear };
}