import { api } from "@/lib/api";
import type { DmMessage, GroupSummary } from "./types";

export const HISTORY_PAGE = 50;

const room = (roomId: string) => `/api/chat/rooms/${encodeURIComponent(roomId)}`;
const group = (roomId: string) => `/api/chat/groups/${encodeURIComponent(roomId)}`;

export async function fetchGroups(): Promise<GroupSummary[]> {
  const res = await api<{ groups: GroupSummary[] }>("/api/chat/groups");
  return res.groups;
}

export function createGroup(name: string, memberIds: string[]): Promise<GroupSummary> {
  return api<GroupSummary>("/api/chat/groups", { method: "POST", body: { name, memberIds } });
}

export function renameGroup(roomId: string, name: string): Promise<void> {
  return api<void>(group(roomId), { method: "PATCH", body: { name } });
}

export function addGroupMembers(roomId: string, memberIds: string[]): Promise<void> {
  return api<void>(`${group(roomId)}/members`, { method: "POST", body: { memberIds } });
}

export function removeGroupMember(roomId: string, playerId: string): Promise<void> {
  return api<void>(`${group(roomId)}/members/${encodeURIComponent(playerId)}`, { method: "DELETE" });
}

export async function fetchHistory(roomId: string, before: string, limit = HISTORY_PAGE): Promise<DmMessage[]> {
  const params = new URLSearchParams({ before, limit: String(limit) });
  const res = await api<{ messages: DmMessage[] }>(`${room(roomId)}/history?${params.toString()}`);
  return res.messages;
}

export async function searchMessages(roomId: string, query: string): Promise<DmMessage[]> {
  const res = await api<{ messages: DmMessage[] }>(`${room(roomId)}/search?q=${encodeURIComponent(query)}`);
  return res.messages;
}

export async function fetchPins(roomId: string): Promise<DmMessage[]> {
  const res = await api<{ messages: DmMessage[] }>(`${room(roomId)}/pins`);
  return res.messages;
}

export function pinMessage(roomId: string, messageId: string): Promise<void> {
  return api<void>(`${room(roomId)}/messages/${encodeURIComponent(messageId)}/pin`, { method: "POST" });
}

export function unpinMessage(roomId: string, messageId: string): Promise<void> {
  return api<void>(`${room(roomId)}/messages/${encodeURIComponent(messageId)}/pin`, { method: "DELETE" });
}

export function editMessage(roomId: string, messageId: string, content: string): Promise<void> {
  return api<void>(`${room(roomId)}/messages/${encodeURIComponent(messageId)}`, { method: "PATCH", body: { content } });
}

export function deleteMessage(roomId: string, messageId: string): Promise<void> {
  return api<void>(`${room(roomId)}/messages/${encodeURIComponent(messageId)}`, { method: "DELETE" });
}

export function reactToMessage(roomId: string, messageId: string, emoji: string): Promise<void> {
  return api<void>(`${room(roomId)}/messages/${encodeURIComponent(messageId)}/reactions`, {
    method: "POST",
    body: { emoji },
  });
}

export function blockPlayer(playerId: string): Promise<void> {
  return api<void>("/api/me/blocks", { method: "POST", body: { toPlayerId: playerId } });
}