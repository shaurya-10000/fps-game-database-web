"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { acceptFriendRequest, blockPlayer, sendFriendRequest, unfriend } from "@/lib/friends-api";
import {
  cancelRequest,
  fetchBlocked,
  fetchFriends,
  fetchIncoming,
  fetchMuted,
  fetchOutgoing,
  mutePlayer,
  unblockPlayer,
  unmutePlayer,
} from "./api";
import type { BlockedPlayer, Friend, RequestRow } from "./types";

type Notify = (text: string, tone?: "error" | "info") => void;

function describe(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code === "BLOCKED") return "You can't send a request to this player.";
    if (err.code === "ALREADY_FRIENDS") return "You're already friends.";
    if (err.status === 429) return "Too many requests. Try again in a moment.";
  }
  return fallback;
}

export function useFriendsData(notify: Notify) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<RequestRow[]>([]);
  const [outgoing, setOutgoing] = useState<RequestRow[]>([]);
  const [blocked, setBlocked] = useState<BlockedPlayer[]>([]);
  const [muted, setMuted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetches everything and applies it once the requests settle.
  const refresh = useCallback(
    () =>
      Promise.all([
        fetchFriends().catch(() => null),
        fetchIncoming().catch(() => null),
        fetchOutgoing().catch(() => null),
        fetchBlocked().catch(() => null),
        fetchMuted().catch(() => null),
      ]).then(([f, i, o, b, m]) => {
        if (f) setFriends(f);
        if (i) setIncoming(i);
        if (o) setOutgoing(o);
        if (b) setBlocked(b);
        if (m) setMuted(m);
        setError(!f && !i ? "Couldn't load your friends." : null);
        setLoading(false);
      }),
    [],
  );

  const load = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      return refresh();
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Pick up changes made elsewhere when you come back to the tab.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const run = useCallback(
    async (action: () => Promise<void>, success: string, failure: string) => {
      try {
        await action();
        notify(success, "info");
      } catch (err) {
        notify(describe(err, failure), "error");
      }
      await load(true);
    },
    [load, notify],
  );

  return {
    friends,
    incoming,
    outgoing,
    blocked,
    muted,
    loading,
    error,
    reload: load,
    addFriend: (playerId: string, name: string) =>
      run(() => sendFriendRequest(playerId), `Friend request sent to ${name}.`, "Couldn't send the request."),
    accept: (request: RequestRow) =>
      run(() => acceptFriendRequest(request.playerId), `You and ${request.name} are now friends.`, "Couldn't accept the request."),
    decline: (request: RequestRow) =>
      run(() => cancelRequest(request.playerId), `Declined the request from ${request.name}.`, "Couldn't decline the request."),
    cancel: (request: RequestRow) =>
      run(() => cancelRequest(request.playerId), `Canceled your request to ${request.name}.`, "Couldn't cancel the request."),
    removeFriend: (friend: Friend) =>
      run(() => unfriend(friend.playerId), `Removed ${friend.name} from your friends.`, "Couldn't remove this friend."),
    block: (playerId: string, name: string) =>
      run(() => blockPlayer(playerId), `Blocked ${name}.`, "Couldn't block this player."),
    unblock: (player: BlockedPlayer) =>
      run(() => unblockPlayer(player.playerId), `Unblocked ${player.name}.`, "Couldn't unblock this player."),
    mute: (friend: Friend) => run(() => mutePlayer(friend.playerId), `Muted ${friend.name} in Global Chat.`, "Couldn't mute this player."),
    unmute: (friend: Friend) =>
      run(() => unmutePlayer(friend.playerId), `Unmuted ${friend.name}.`, "Couldn't unmute this player."),
  };
}