"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import {
  HISTORY_PAGE,
  deleteMessage,
  editMessage,
  fetchHistory,
  fetchPins,
  pinMessage,
  reactToMessage,
  unpinMessage,
} from "../api";
import type { DmMessage, PendingMessage, PinInfo, ReplyRef } from "../types";

const HISTORY_TIMEOUT_MS = 8000;
const SEND_TIMEOUT_MS = 10000;

interface RoomEvent {
  roomId: string;
  messageId: string;
}

/**
 * Live state for one room: messages (with edits, deletes, reactions and pins applied in real time),
 * older-page loading, optimistic sending with retry, and message actions.
 */
export function useRoomMessages(
  socket: Socket | null,
  roomId: string | null,
  myId: string,
  onError: (message: string) => void,
) {
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [pins, setPins] = useState<DmMessage[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [loading, setLoading] = useState(() => Boolean(socket && roomId));
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Switching rooms (or sockets) starts from a clean slate. Done while rendering so stale messages never paint.
  const [scope, setScope] = useState({ socket, roomId });
  if (scope.socket !== socket || scope.roomId !== roomId) {
    setScope({ socket, roomId });
    setMessages([]);
    setPins([]);
    setPending([]);
    setHasMore(false);
    setLoading(Boolean(socket && roomId));
  }

  // Refs hold the latest values so async code and socket handlers never read stale state.
  const messagesRef = useRef<DmMessage[]>([]);
  const pinsRef = useRef<DmMessage[]>([]);
  const pendingRef = useRef<PendingMessage[]>([]);
  const roomRef = useRef<string | null>(roomId);
  const myIdRef = useRef(myId);
  const onErrorRef = useRef(onError);
  const hasMoreRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const counter = useRef(0);

  useEffect(() => {
    myIdRef.current = myId;
    onErrorRef.current = onError;
  });

  const commitMessages = useCallback((next: DmMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  }, []);
  const commitPins = useCallback((next: DmMessage[]) => {
    pinsRef.current = next;
    setPins(next);
  }, []);
  const commitPending = useCallback((next: PendingMessage[]) => {
    pendingRef.current = next;
    setPending(next);
  }, []);

  const patchMessage = useCallback(
    (id: string, change: (m: DmMessage) => DmMessage) => {
      commitMessages(messagesRef.current.map((m) => (m._id === id ? change(m) : m)));
      commitPins(pinsRef.current.map((m) => (m._id === id ? change(m) : m)));
    },
    [commitMessages, commitPins],
  );

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const armTimeout = useCallback(
    (id: string) => {
      clearTimer(id);
      timers.current.set(
        id,
        setTimeout(() => {
          timers.current.delete(id);
          commitPending(pendingRef.current.map((m) => (m.id === id ? { ...m, status: "failed" } : m)));
        }, SEND_TIMEOUT_MS),
      );
    },
    [clearTimer, commitPending],
  );

  const refreshPins = useCallback(async () => {
    const target = roomRef.current;
    if (!target) return;
    try {
      const list = await fetchPins(target);
      if (roomRef.current === target) commitPins(list);
    } catch {
      // Pins are a convenience; ignore failures.
    }
  }, [commitPins]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  useEffect(() => {
    roomRef.current = roomId;
    messagesRef.current = [];
    pinsRef.current = [];
    pendingRef.current = [];
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
    hasMoreRef.current = false;
    if (!socket || !roomId) return;

    const mine = (e: { roomId: string }) => e.roomId === roomId;

    const onHistory = (history: DmMessage[]) => {
      const first = history[0];
      if (first && first.roomId !== roomId) return; // stale history from a previous room
      commitMessages(history);
      hasMoreRef.current = history.length >= HISTORY_PAGE;
      setHasMore(hasMoreRef.current);
      setLoading(false);
      void refreshPins();
    };

    const onNew = (msg: DmMessage) => {
      // The socket stays joined to earlier rooms, so ignore their traffic.
      if (msg.roomId && msg.roomId !== roomId) return;
      if (!messagesRef.current.some((m) => m._id === msg._id)) commitMessages([...messagesRef.current, msg]);

      // Our own message coming back from the server replaces its "sending" copy.
      if (msg.content && msg.senderId === myIdRef.current) {
        const match = pendingRef.current.find((p) => p.content === msg.content);
        if (match) {
          clearTimer(match.id);
          commitPending(pendingRef.current.filter((p) => p.id !== match.id));
        }
      }
    };

    const onPinned = (e: RoomEvent & { pinned: PinInfo }) => {
      if (!mine(e)) return;
      patchMessage(e.messageId, (m) => ({ ...m, pinned: e.pinned }));
      void refreshPins();
    };

    const onUnpinned = (e: RoomEvent) => {
      if (!mine(e)) return;
      commitMessages(
        messagesRef.current.map((m) => {
          if (m._id !== e.messageId) return m;
          const { pinned: _removed, ...rest } = m;
          void _removed;
          return rest;
        }),
      );
      commitPins(pinsRef.current.filter((m) => m._id !== e.messageId));
    };

    const onDeleted = (e: RoomEvent) => {
      if (!mine(e)) return;
      commitMessages(
        messagesRef.current.map((m) => {
          if (m._id !== e.messageId) return m;
          const { audioUrl: _a, pinned: _p, reactions: _r, replyTo: _t, ...rest } = m;
          void _a;
          void _p;
          void _r;
          void _t;
          return { ...rest, deleted: true, content: "" };
        }),
      );
      commitPins(pinsRef.current.filter((m) => m._id !== e.messageId));
    };

    const onEdited = (e: RoomEvent & { content: string; editedAt: string }) => {
      if (!mine(e)) return;
      patchMessage(e.messageId, (m) => ({ ...m, content: e.content, editedAt: e.editedAt }));
    };

    const onReactions = (e: RoomEvent & { reactions: Record<string, string[]> }) => {
      if (!mine(e)) return;
      patchMessage(e.messageId, (m) => ({ ...m, reactions: e.reactions }));
    };

    const join = () => socket.emit("join_room", roomId);

    socket.on("room_history", onHistory);
    socket.on("new_message", onNew);
    socket.on("message_pinned", onPinned);
    socket.on("message_unpinned", onUnpinned);
    socket.on("message_deleted", onDeleted);
    socket.on("message_edited", onEdited);
    socket.on("message_reactions", onReactions);
    socket.io.on("reconnect", join);
    join();
    const timeout = setTimeout(() => setLoading(false), HISTORY_TIMEOUT_MS);

    return () => {
      clearTimeout(timeout);
      socket.off("room_history", onHistory);
      socket.off("new_message", onNew);
      socket.off("message_pinned", onPinned);
      socket.off("message_unpinned", onUnpinned);
      socket.off("message_deleted", onDeleted);
      socket.off("message_edited", onEdited);
      socket.off("message_reactions", onReactions);
      socket.io.off("reconnect", join);
    };
  }, [socket, roomId, clearTimer, commitMessages, commitPins, commitPending, patchMessage, refreshPins]);

  /** Loads one older page. Resolves to true if it added messages. */
  const loadOlder = useCallback(async (): Promise<boolean> => {
    const target = roomRef.current;
    const oldest = messagesRef.current[0];
    if (!target || !oldest || !hasMoreRef.current || loadingOlderRef.current) return false;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const page = await fetchHistory(target, oldest.createdAt, HISTORY_PAGE);
      if (roomRef.current !== target) return false;
      const known = new Set(messagesRef.current.map((m) => m._id));
      commitMessages([...page.filter((m) => !known.has(m._id)), ...messagesRef.current]);
      hasMoreRef.current = page.length >= HISTORY_PAGE;
      setHasMore(hasMoreRef.current);
      return page.length > 0;
    } catch {
      onErrorRef.current("Couldn't load earlier messages.");
      return false;
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [commitMessages]);

  const send = useCallback(
    (text: string, replyTo?: ReplyRef) => {
      if (!socket || !roomId) return;
      counter.current += 1;
      const id = `pending-${Date.now()}-${counter.current}`;
      const entry: PendingMessage = {
        id,
        content: text,
        createdAt: new Date().toISOString(),
        status: "sending",
        ...(replyTo ? { replyTo } : {}),
      };
      commitPending([...pendingRef.current, entry]);
      armTimeout(id);
      socket.emit("send_message", { roomId, content: text, ...(replyTo ? { replyToId: replyTo.messageId } : {}) });
    },
    [socket, roomId, armTimeout, commitPending],
  );

  const retry = useCallback(
    (id: string) => {
      const target = pendingRef.current.find((p) => p.id === id);
      if (!target || !socket || !roomId) return;
      commitPending(pendingRef.current.map((p) => (p.id === id ? { ...p, status: "sending" } : p)));
      armTimeout(id);
      socket.emit("send_message", {
        roomId,
        content: target.content,
        ...(target.replyTo ? { replyToId: target.replyTo.messageId } : {}),
      });
    },
    [socket, roomId, armTimeout, commitPending],
  );

  const discard = useCallback(
    (id: string) => {
      clearTimer(id);
      commitPending(pendingRef.current.filter((p) => p.id !== id));
    },
    [clearTimer, commitPending],
  );

  const run = useCallback(async (action: () => Promise<void>, failure: string) => {
    try {
      await action();
    } catch {
      onErrorRef.current(failure);
    }
  }, []);

  const react = useCallback(
    (messageId: string, emoji: string) => {
      if (roomId) void run(() => reactToMessage(roomId, messageId, emoji), "Couldn't add that reaction.");
    },
    [roomId, run],
  );

  const setPinned = useCallback(
    (messageId: string, pinned: boolean) => {
      if (!roomId) return;
      void run(
        () => (pinned ? pinMessage(roomId, messageId) : unpinMessage(roomId, messageId)),
        pinned ? "Couldn't pin that message (50 pins max)." : "Couldn't unpin that message.",
      );
    },
    [roomId, run],
  );

  const edit = useCallback(
    async (messageId: string, content: string) => {
      if (roomId) await run(() => editMessage(roomId, messageId, content), "Couldn't save your edit.");
    },
    [roomId, run],
  );

  const remove = useCallback(
    async (messageId: string) => {
      if (roomId) await run(() => deleteMessage(roomId, messageId), "Couldn't delete that message.");
    },
    [roomId, run],
  );

  const getMessages = useCallback(() => messagesRef.current, []);

  return {
    messages,
    pins,
    pending,
    loading,
    hasMore,
    loadingOlder,
    loadOlder,
    getMessages,
    send,
    retry,
    discard,
    react,
    setPinned,
    edit,
    remove,
  };
}