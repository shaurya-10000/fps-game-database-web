"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import { api } from "@/lib/api";

export type NotificationKind = "message" | "call" | "friend-request" | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  createdAt: number;
  read: boolean;
  meta?: { roomId?: string; senderId?: string; playerId?: string };
}

const STORAGE_KEY = "fps.notifications";
const MAX_NOTIFICATIONS = 50;

function load(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function save(list: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_NOTIFICATIONS)));
  } catch {
    // Storage unavailable.
  }
}

export function useNotifications(socket: Socket | null = null) {
  // Lazy initializer reads from localStorage on first render (client only)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => load());

  const push = useCallback(
    (n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
      const notification: AppNotification = {
        ...n,
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        createdAt: Date.now(),
        read: false,
      };
      setNotifications((prev) => {
        const next = [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
        save(next);
        return next;
      });
      // Fire toast
      toast(notification.title, { description: notification.description });
    },
    []
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    save([]);
  }, []);

  // Poll friend requests on mount + every 60s
  useEffect(() => {
    let cancelled = false;

    async function pollFriendRequests() {
      try {
        const res = await api<{ incoming: Array<{ fromPlayerId: string; fromPlayerName?: string; createdAt: string }> }>(
          "/api/me/friends/requests"
        );
        if (cancelled) return;
        const current = load();
        const existingIds = new Set(current.filter((n) => n.kind === "friend-request").map((n) => n.meta?.playerId));
        for (const req of res.incoming ?? []) {
          if (!existingIds.has(req.fromPlayerId)) {
            push({
              kind: "friend-request",
              title: "New friend request",
              description: `${req.fromPlayerName ?? "Someone"} wants to be your friend.`,
              meta: { playerId: req.fromPlayerId },
            });
          }
        }
      } catch {
        // Ignore
      }
    }

    void pollFriendRequests();
    const interval = setInterval(pollFriendRequests, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [push]);

  // Subscribe to socket events
  useEffect(() => {
    if (!socket) return;

    const onChatActivity = (activity: {
      roomId: string;
      kind: "dm" | "group";
      senderId: string;
      senderName: string;
      preview: string;
    }) => {
      // Only notify when the tab is not focused or user is not in that room
      push({
        kind: "message",
        title: activity.senderName || "New message",
        description: activity.preview || "Sent you a message",
        meta: { roomId: activity.roomId, senderId: activity.senderId },
      });
    };

    const onIncomingCall = (payload: { fromPlayerId: string; offer?: { meta?: { fromName?: string } } }) => {
      push({
        kind: "call",
        title: "Incoming call",
        description: `${payload.offer?.meta?.fromName ?? "Someone"} is calling you.`,
        meta: { playerId: payload.fromPlayerId },
      });
    };

    socket.on("chat_activity", onChatActivity);
    socket.on("incoming_call", onIncomingCall);

    return () => {
      socket.off("chat_activity", onChatActivity);
      socket.off("incoming_call", onIncomingCall);
    };
  }, [socket, push]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAllRead, clearAll };
}



