import { api } from "@/lib/api";
import type { FriendshipRow } from "@/lib/api-types";
import { getFriends, getIncomingRequests } from "@/lib/friends-api";
import type { BlockedPlayer, Friend, RequestRow } from "./types";

type NamedRow = FriendshipRow & {
  toPlayerName?: string;
  fromPlayerName?: string;
  createdAt?: string;
  acceptedAt?: string;
};

const fallbackName = (id: string) => id.slice(0, 8);

export async function fetchFriends(): Promise<Friend[]> {
  const rows = (await getFriends()) as NamedRow[];
  return rows
    .map((row) => ({
      rowId: row._id,
      playerId: row.toPlayerId,
      name: row.toPlayerName || fallbackName(row.toPlayerId),
      since: row.acceptedAt ?? row.createdAt ?? "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchIncoming(): Promise<RequestRow[]> {
  const rows = (await getIncomingRequests()) as NamedRow[];
  return rows.map((row) => ({
    rowId: row._id,
    playerId: row.fromPlayerId,
    name: row.fromPlayerName || fallbackName(row.fromPlayerId),
    at: row.createdAt ?? "",
  }));
}

export async function fetchOutgoing(): Promise<RequestRow[]> {
  const res = await api<{ outgoing: NamedRow[] }>("/api/me/friends/requests/outgoing");
  return res.outgoing.map((row) => ({
    rowId: row._id,
    playerId: row.toPlayerId,
    name: row.toPlayerName || fallbackName(row.toPlayerId),
    at: row.createdAt ?? "",
  }));
}

export async function fetchBlocked(): Promise<BlockedPlayer[]> {
  const res = await api<{ blocked: { playerId: string; displayName: string; createdAt: string }[] }>("/api/me/blocks");
  return res.blocked.map((b) => ({ playerId: b.playerId, name: b.displayName, at: b.createdAt }));
}

/** Cancels a request you sent, or declines one sent to you. */
export function cancelRequest(otherId: string): Promise<void> {
  return api<void>(`/api/me/friends/requests/${encodeURIComponent(otherId)}`, { method: "DELETE" });
}

export function unblockPlayer(playerId: string): Promise<void> {
  return api<void>(`/api/me/blocks/${encodeURIComponent(playerId)}`, { method: "DELETE" });
}

export async function fetchMuted(): Promise<string[]> {
  const res = await api<{ muted: string[] }>("/api/me/mutes");
  return res.muted ?? [];
}

export function mutePlayer(playerId: string): Promise<void> {
  return api<void>("/api/me/mutes", { method: "POST", body: { toPlayerId: playerId } });
}

export function unmutePlayer(playerId: string): Promise<void> {
  return api<void>(`/api/me/mutes/${encodeURIComponent(playerId)}`, { method: "DELETE" });
}