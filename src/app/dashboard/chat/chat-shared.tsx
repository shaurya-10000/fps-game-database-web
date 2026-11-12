"use client";

// Shared types and tiny helpers used by both the Global and Friends chat
// surfaces. Kept dependency-free so either page can import it.

export interface ChatMessage {
  _id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
  audioUrl?: string;
}

export interface Room {
  id: string;
  name: string;
  type: "global" | "region" | "dm" | "group";
}

export const GLOBAL_ROOM_ID = "global_chat";
export const GROUP_GAP_MS = 5 * 60 * 1000;

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayLabel(t: Date): string {
  const now = new Date();
  const yest = new Date();
  yest.setDate(now.getDate() - 1);
  if (t.toDateString() === now.toDateString()) return "Today";
  if (t.toDateString() === yest.toDateString()) return "Yesterday";
  return t.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ChatAvatar({
  name,
  size = 32,
  isMe = false,
  avatarUrl,
}: {
  name: string;
  size?: number;
  isMe?: boolean;
  avatarUrl?: string | null;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name.slice(0, 2).toUpperCase();
  const colors = [
    "bg-rose-500/20 text-rose-500",
    "bg-blue-500/20 text-blue-500",
    "bg-emerald-500/20 text-emerald-500",
    "bg-amber-500/20 text-amber-500",
    "bg-violet-500/20 text-violet-500",
    "bg-cyan-500/20 text-cyan-500",
  ];
  const colorIndex =
    name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    colors.length;
  const colorClass = isMe ? "bg-accent/20 text-accent" : colors[colorIndex];
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${colorClass}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}




