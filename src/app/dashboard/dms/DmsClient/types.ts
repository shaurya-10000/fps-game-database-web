import type { ChatMessage } from "@/app/dashboard/chat/chat-shared";

export interface ReplyRef {
  messageId: string;
  senderId: string;
  senderName: string;
  preview: string;
}

export interface PinInfo {
  by: string;
  at: string;
  byName?: string;
}

/** A chat message including the fields added for replies, reactions, pins, edits and deletes. */
export interface DmMessage extends ChatMessage {
  system?: boolean;
  replyTo?: ReplyRef;
  reactions?: Record<string, string[]>;
  pinned?: PinInfo;
  editedAt?: string;
  deleted?: boolean;
  /** Present on the system message that records a finished call. */
  call?: {
    kind: "voice" | "video";
    outcome: "completed" | "declined" | "no-answer" | "cancelled";
    durationSec: number;
    callerId: string;
  };
}

export interface DmFriend {
  rowId: string;
  playerId: string;
  name: string;
  avatarUrl?: string | null;
}

export interface GroupMember {
  playerId: string;
  name: string;
  isAdmin: boolean;
}

export interface GroupSummary {
  roomId: string;
  name: string;
  createdBy: string;
  members: GroupMember[];
}

export type Conversation =
  | { kind: "dm"; roomId: string; playerId: string; name: string }
  | { kind: "group"; roomId: string; name: string; group: GroupSummary };

export function conversationKey(c: Conversation): string {
  return c.kind === "dm" ? `dm:${c.playerId}` : `group:${c.roomId}`;
}

export interface PendingMessage {
  id: string;
  content: string;
  createdAt: string;
  status: "sending" | "failed";
  replyTo?: ReplyRef;
}

/** A finished call shown inline in the conversation. */
export interface CallEvent {
  id: string;
  at: string;
  kind: "voice" | "video";
  outcome: "completed" | "declined" | "no-answer" | "cancelled";
  durationSec: number;
  /** True when you placed the call. */
  mine: boolean;
}

export type PanelKind = "search" | "pins" | "info" | "links" | "starred";

/** Pushed by the server to every other participant when a message is sent (drives unread badges). */
export interface ChatActivity {
  roomId: string;
  kind: "dm" | "group";
  senderId: string;
  senderName: string;
  preview: string;
  messageId: string;
  createdAt: string;
}

/** Same id the server derives for a DM between two players. */
export function dmRoomId(a: string, b: string): string {
  const sorted = [a, b].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
}

/** A starred message, saved with a snapshot so it can be listed without loading the whole chat. */
export interface StarredMessage {
  id: string;
  senderName: string;
  content: string;
  at: string;
}
