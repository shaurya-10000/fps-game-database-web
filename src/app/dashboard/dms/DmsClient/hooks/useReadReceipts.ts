"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { api } from "@/lib/api";

interface ReadEvent {
  roomId: string;
  playerId: string;
  at: string;
}

interface RoomReads {
  roomId: string | null;
  reads: Record<string, number>;
}

const NO_READS: Record<string, number> = {};

/**
 * Tells the room when you have read it and returns when each participant last did (epoch ms by player id).
 * `lastMessageId` changes whenever a new message arrives, so a visible, open chat keeps marking itself read.
 */
export function useReadReceipts(socket: Socket | null, roomId: string | null, lastMessageId: string) {
  const [state, setState] = useState<RoomReads>({ roomId: null, reads: NO_READS });

  // Receipts belong to one room, so a snapshot from the previous room is never exposed.
  const reads = state.roomId === roomId ? state.reads : NO_READS;

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    api<{ reads: Record<string, string> }>(`/api/chat/rooms/${encodeURIComponent(roomId)}/reads`)
      .then((res) => {
        if (cancelled) return;
        setState({
          roomId,
          reads: Object.fromEntries(Object.entries(res.reads).map(([id, iso]) => [id, new Date(iso).getTime()])),
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    if (!socket || !roomId) return;
    const onRead = (event: ReadEvent) => {
      if (event.roomId !== roomId) return;
      setState((prev) => ({
        roomId,
        reads: { ...(prev.roomId === roomId ? prev.reads : NO_READS), [event.playerId]: new Date(event.at).getTime() },
      }));
    };
    socket.on("read_receipt", onRead);
    return () => {
      socket.off("read_receipt", onRead);
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (!socket || !roomId) return;
    const mark = () => {
      if (document.visibilityState === "visible") socket.emit("mark_read", { roomId });
    };
    mark();
    document.addEventListener("visibilitychange", mark);
    return () => document.removeEventListener("visibilitychange", mark);
  }, [socket, roomId, lastMessageId]);

  return reads;
}