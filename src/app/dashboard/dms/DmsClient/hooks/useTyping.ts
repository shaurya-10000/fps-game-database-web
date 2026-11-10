"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

interface TypingEvent {
  roomId: string;
  playerId: string;
  name: string;
  typing: boolean;
}

const SEND_EVERY_MS = 2500;
const IDLE_STOP_MS = 3500;
const EXPIRE_MS = 6000;

/** Shows who is typing in a room and tells the room when you are. */
export function useTyping(socket: Socket | null, roomId: string | null, myId: string) {
  const [typers, setTypers] = useState<Record<string, string>>({});
  const expiry = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef(0);
  const active = useRef(false);
  const myIdRef = useRef(myId);

  useEffect(() => {
    myIdRef.current = myId;
  });

  useEffect(() => {
    setTypers({});
    const timers = expiry.current;
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    if (!socket || !roomId) return;

    const drop = (playerId: string) => {
      const timer = timers.get(playerId);
      if (timer) clearTimeout(timer);
      timers.delete(playerId);
      setTypers((prev) => {
        if (!(playerId in prev)) return prev;
        const { [playerId]: _removed, ...rest } = prev;
        void _removed;
        return rest;
      });
    };

    const onTyping = (event: TypingEvent) => {
      if (event.roomId !== roomId || event.playerId === myIdRef.current) return;
      if (!event.typing) {
        drop(event.playerId);
        return;
      }
      setTypers((prev) => ({ ...prev, [event.playerId]: event.name }));
      const previous = timers.get(event.playerId);
      if (previous) clearTimeout(previous);
      timers.set(event.playerId, setTimeout(() => drop(event.playerId), EXPIRE_MS));
    };

    socket.on("typing", onTyping);
    return () => {
      socket.off("typing", onTyping);
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [socket, roomId]);

  const stopTyping = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = null;
    if (active.current && socket && roomId) socket.emit("typing", { roomId, typing: false });
    active.current = false;
    lastSent.current = 0;
  }, [socket, roomId]);

  const notifyTyping = useCallback(() => {
    if (!socket || !roomId) return;
    const now = Date.now();
    if (!active.current || now - lastSent.current > SEND_EVERY_MS) {
      socket.emit("typing", { roomId, typing: true });
      lastSent.current = now;
      active.current = true;
    }
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, IDLE_STOP_MS);
  }, [socket, roomId, stopTyping]);

  // Leaving a room (or the page) ends the "typing" state.
  useEffect(() => () => stopTyping(), [stopTyping]);

  return { typingNames: Object.values(typers), notifyTyping, stopTyping };
}