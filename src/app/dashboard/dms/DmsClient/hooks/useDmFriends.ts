"use client";

import { useCallback, useEffect, useState } from "react";
import { getFriends } from "@/lib/friends-api";
import type { FriendshipRow } from "@/lib/api-types";
import type { DmFriend } from "../types";

interface NamedFriendRow extends FriendshipRow {
  toPlayerName?: string;
}

function toDmFriend(row: NamedFriendRow): DmFriend {
  return {
    rowId: row._id,
    playerId: row.toPlayerId,
    name: row.toPlayerName || row.toPlayerId.slice(0, 8),
    avatarUrl: row.avatarUrl ?? null,
  };
}

export function useDmFriends() {
  const [friends, setFriends] = useState<DmFriend[]>([]);
  const [selfId, setSelfId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(
    () =>
      getFriends()
        .then((list) => {
          const rows = list as NamedFriendRow[];
          setFriends(rows.map(toDmFriend).sort((a, b) => a.name.localeCompare(b.name)));
          // friendship rows are stored from my side, so fromPlayerId is my real server-side id
          setSelfId(rows[0]?.fromPlayerId ?? "");
          setError(null);
        })
        .catch(() => setError("Couldn't load your friends."))
        .finally(() => setLoading(false)),
    [],
  );

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    void fetchFriends();
  }, [fetchFriends]);

  return { friends, selfId, loading, error, reload };
}
