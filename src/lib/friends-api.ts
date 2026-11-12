import { api } from "./api";
import type { FriendshipRow } from "./api-types";

export interface SearchResult {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export async function searchPlayers(q: string): Promise<SearchResult[]> {
  const res = await api<{ results: SearchResult[] }>(`/api/me/players/search?q=${encodeURIComponent(q)}`);
  return res.results;
}

export async function getFriends(): Promise<FriendshipRow[]> {
  const res = await api<{ friends: FriendshipRow[] }>("/api/me/friends");
  return res.friends;
}

export async function getIncomingRequests(): Promise<FriendshipRow[]> {
  const res = await api<{ incoming: FriendshipRow[] }>("/api/me/friends/requests");
  return res.incoming;
}

export async function sendFriendRequest(toPlayerId: string): Promise<void> {
  await api("/api/me/friends/requests", {
    method: "POST",
    body: { toPlayerId },
  });
}

export async function acceptFriendRequest(fromPlayerId: string): Promise<void> {
  await api(`/api/me/friends/requests/${fromPlayerId}/accept`, {
    method: "POST",
  });
}

export async function unfriend(otherId: string): Promise<void> {
  await api(`/api/me/friends/${otherId}`, { method: "DELETE" });
}

export async function blockPlayer(targetPlayerId: string): Promise<void> {
  await api("/api/me/blocks", {
    method: "POST",
    body: { toPlayerId: targetPlayerId },
  });
}
