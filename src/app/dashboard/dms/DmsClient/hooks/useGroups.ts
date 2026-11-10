"use client";

import { useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { fetchGroups } from "../api";
import type { GroupSummary } from "../types";

/** My group chats, refreshed live whenever the server reports a membership or name change. */
export function useGroups(socket: Socket | null) {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    () =>
      fetchGroups()
        .then((list) => setGroups(list))
        .catch(() => {
          // Keep whatever we already had.
        })
        .finally(() => setLoading(false)),
    [],
  );

  const upsert = useCallback((group: GroupSummary) => {
    setGroups((prev) => [group, ...prev.filter((g) => g.roomId !== group.roomId)]);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => void reload();
    socket.on("group_updated", refresh);
    socket.io.on("reconnect", refresh);
    return () => {
      socket.off("group_updated", refresh);
      socket.io.off("reconnect", refresh);
    };
  }, [socket, reload]);

  return { groups, loading, reload, upsert };
}