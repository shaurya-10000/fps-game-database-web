"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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

// ─── Audio ────────────────────────────────────────────────────────────
let sharedCtx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      sharedCtx = new Ctx();
    }
    if (sharedCtx.state === "suspended") void sharedCtx.resume();
    return sharedCtx;
  } catch {
    return null;
  }
}

// Called on first user interaction anywhere
export function unlockAudio() {
  const ctx = ensureCtx();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

if (typeof window !== "undefined") {
  ["pointerdown", "keydown", "touchstart"].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { once: true, passive: true });
  });
}

function playChime() {
  const ctx = ensureCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") void ctx.resume().then(() => playChimeOnce(ctx));
    else playChimeOnce(ctx);
  } catch { /* ignore */ }
}

function playChimeOnce(ctx: AudioContext) {
  const t = ctx.currentTime;
  [988, 1319].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.1, t + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + i * 0.08);
    osc.stop(t + i * 0.08 + 0.25);
  });
}

// ─── Storage ──────────────────────────────────────────────────────────
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

// ─── Hook ─────────────────────────────────────────────────────────────
export function useNotifications(socket: Socket | null = null) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => load());
  const router = useRouter();

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
    save([notification, ...current]);
    setNotifications([notification, ...current]);
    toast(notification.title, { description: notification.description });
    playChime();
  }, []);

  const markRead = useCallback((id: string) => {
    const next = load().map((n) => (n.id === id ? { ...n, read: true } : n));
    save(next);
    setNotifications(next);
  }, []);

  const markAllRead = useCallback(() => {
    const next = load().map((n) => ({ ...n, read: true }));
    save(next);
    setNotifications(next);
  }, []);

  const clearAll = useCallback(() => {
    save([]);
    setNotifications([]);
  }, []);

  // Navigation helper — uses window.location for reliability across contexts
  const navigateTo = useCallback((n: AppNotification) => {
    markRead(n.id);
    if (n.kind === "message" && n.meta?.senderId) {
      router.push(`/dashboard/dms?dm=${encodeURIComponent(n.meta.senderId)}`);
    } else if (n.kind === "friend-request") {
      router.push("/dashboard/friends");
    }
  }, [markRead, router]);

  // Friend request polling
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
    return () => { cancelled = true; clearInterval(interval); };
  }, [push]);

  // Socket events
  useEffect(() => {
    if (!socket) return;
    const onChatActivity = (a: { roomId: string; senderId: string; senderName: string; preview: string }) => {
      push({
        kind: "message",
        title: a.senderName || "New message",
        description: a.preview || "Sent you a message",
        meta: { roomId: a.roomId, senderId: a.senderId },
      });
    };
    const onIncomingCall = (p: { fromPlayerId: string; offer?: { meta?: { fromName?: string } } }) => {
      push({
        kind: "call",
        title: "Incoming call",
        description: `${p.offer?.meta?.fromName ?? "Someone"} is calling you.`,
        meta: { playerId: p.fromPlayerId },
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

  // Tab title
  useEffect(() => {
    const base = "FPS Game Database";
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
  }, [unreadCount]);

  return { notifications, unreadCount, markRead, markAllRead, clearAll, navigateTo, push };
}


