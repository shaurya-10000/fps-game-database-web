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
    window.dispatchEvent(new Event("fps-notifications-changed"));
  } catch { /* ignore */ }
}

// Simple chime using Web Audio API (no assets needed)
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const t = ctx.currentTime;
    [988, 1319].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.08, t + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.25);
    });
    setTimeout(() => void ctx.close().catch(() => undefined), 500);
  } catch { /* audio not allowed yet */ }
}

export function useNotifications(socket: Socket | null = null) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => load());

  // Listen for changes from other components/tabs
  useEffect(() => {
    const onChange = () => setNotifications(load());
    window.addEventListener("fps-notifications-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("fps-notifications-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const push = useCallback((n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    const notification: AppNotification = {
      ...n,
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
      read: false,
    };
    const current = load();
    const next = [notification, ...current].slice(0, MAX_NOTIFICATIONS);
    save(next);
    setNotifications(next);
    toast(notification.title, { description: notification.description });
    playChime();
  }, []);

  const markRead = useCallback((id: string) => {
    const current = load();
    const next = current.map((n) => (n.id === id ? { ...n, read: true } : n));
    save(next);
    setNotifications(next);
  }, []);

  const markAllRead = useCallback(() => {
    const current = load();
    const next = current.map((n) => ({ ...n, read: true }));
    save(next);
    setNotifications(next);
  }, []);

  const clearAll = useCallback(() => {
    save([]);
    setNotifications([]);
  }, []);

  // Poll friend requests
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
      } catch { /* ignore */ }
    }
    void pollFriendRequests();
    const interval = setInterval(pollFriendRequests, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [push]);

  // Socket events
  useEffect(() => {
    if (!socket) return;
    const onChatActivity = (a: { senderName: string; preview: string }) => {
      push({ kind: "message", title: a.senderName || "New message", description: a.preview || "Sent you a message" });
    };
    const onIncomingCall = (p: { fromPlayerId: string; offer?: { meta?: { fromName?: string } } }) => {
      push({ kind: "call", title: "Incoming call", description: `${p.offer?.meta?.fromName ?? "Someone"} is calling you.` });
    };
    socket.on("chat_activity", onChatActivity);
    socket.on("incoming_call", onIncomingCall);
    return () => {
      socket.off("chat_activity", onChatActivity);
      socket.off("incoming_call", onIncomingCall);
    };
  }, [socket, push]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Update browser tab title
  useEffect(() => {
    const base = "FPS Game Database";
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
  }, [unreadCount]);

  return { notifications, unreadCount, markRead, markAllRead, clearAll };
}
