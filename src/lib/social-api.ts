import { api } from "./api";

export async function getMutedIds(): Promise<string[]> {
  const res = await api<{ muted?: string[] }>("/api/me/mutes");
  return res?.muted ?? [];
}

export function mutePlayer(playerId: string): Promise<void> {
  return api<void>("/api/me/mutes", { method: "POST", body: { toPlayerId: playerId } });
}

export function unmutePlayer(playerId: string): Promise<void> {
  return api<void>(`/api/me/mutes/${encodeURIComponent(playerId)}`, { method: "DELETE" });
}