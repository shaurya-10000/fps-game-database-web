"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";

/** Shared socket plus live connection status. Never disconnects: the CallProvider owns the socket lifecycle. */
export function useDmSocket() {
  const [socket] = useState<Socket | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return getSocket();
    } catch {
      return null;
    }
  });

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!socket) return () => undefined;
      socket.on("connect", onChange);
      socket.on("disconnect", onChange);
      return () => {
        socket.off("connect", onChange);
        socket.off("disconnect", onChange);
      };
    },
    [socket],
  );

  const connected = useSyncExternalStore(
    subscribe,
    () => socket?.connected ?? false,
    () => false,
  );

  return { socket, connected };
}