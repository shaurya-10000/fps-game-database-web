import { GROUP_GAP_MS, dayLabel, isSameDay } from "@/app/dashboard/chat/chat-shared";
import type { CallEvent, DmMessage, PendingMessage } from "../types";

export interface MessageRow {
  kind: "msg";
  key: string;
  msg: DmMessage;
  isMe: boolean;
  first: boolean;
  last: boolean;
  showSender: boolean;
  status?: PendingMessage["status"];
  pendingId?: string;
}

export type Row =
  | { kind: "day"; key: string; label: string }
  | { kind: "event"; key: string; event: CallEvent }
  | { kind: "system"; key: string; text: string }
  | MessageRow;

type Item =
  | { kind: "msg"; time: Date; order: number; msg: DmMessage; status?: PendingMessage["status"]; pendingId?: string }
  | { kind: "system"; time: Date; order: number; msg: DmMessage }
  | { kind: "event"; time: Date; order: number; event: CallEvent };

interface BuildInput {
  messages: DmMessage[];
  pending: PendingMessage[];
  events: CallEvent[];
  myId: string;
  roomId: string;
  isGroup: boolean;
  /** "Clear chat for me": hide everything up to this time. */
  clearedAt: string | undefined;
  /** "Delete for me": message ids hidden locally. */
  hidden: ReadonlySet<string>;
}

/** Merges messages, unsent messages, system notices and call events into one timeline of grouped rows. */
export function buildRows({ messages, pending, events, myId, roomId, isGroup, clearedAt, hidden }: BuildInput): Row[] {
  const cutoff = clearedAt ? new Date(clearedAt).getTime() : 0;
  const items: Item[] = [];
  let order = 0;

  for (const msg of messages) {
    if (hidden.has(msg._id)) continue;
    const time = new Date(msg.createdAt);
    if (time.getTime() <= cutoff) continue;
    if (msg.system && msg.call) {
      items.push({
        kind: "event",
        time,
        order: order++,
        event: {
          id: msg._id,
          at: msg.createdAt,
          kind: msg.call.kind,
          outcome: msg.call.outcome,
          durationSec: msg.call.durationSec,
          mine: msg.call.callerId === myId,
        },
      });
    } else {
      items.push(msg.system ? { kind: "system", time, order: order++, msg } : { kind: "msg", time, order: order++, msg });
    }
  }

  for (const p of pending) {
    const msg: DmMessage = {
      _id: p.id,
      roomId,
      senderId: myId,
      content: p.content,
      createdAt: p.createdAt,
      ...(p.replyTo ? { replyTo: p.replyTo } : {}),
    };
    items.push({ kind: "msg", time: new Date(p.createdAt), order: order++, msg, status: p.status, pendingId: p.id });
  }

  for (const event of events) {
    const time = new Date(event.at);
    if (time.getTime() > cutoff) items.push({ kind: "event", time, order: order++, event });
  }

  items.sort((a, b) => a.time.getTime() - b.time.getTime() || a.order - b.order);

  const rows: Row[] = [];
  items.forEach((item, i) => {
    const prev = i > 0 ? items[i - 1] : undefined;
    const next = items[i + 1];

    if (!prev || !isSameDay(prev.time, item.time)) {
      rows.push({ kind: "day", key: `day-${item.time.getTime()}-${i}`, label: dayLabel(item.time) });
    }

    if (item.kind === "event") {
      rows.push({ kind: "event", key: `event-${item.event.id}`, event: item.event });
      return;
    }
    if (item.kind === "system") {
      rows.push({ kind: "system", key: `system-${item.msg._id}`, text: item.msg.content });
      return;
    }

    const joinsPrev =
      prev?.kind === "msg" &&
      isSameDay(prev.time, item.time) &&
      prev.msg.senderId === item.msg.senderId &&
      item.time.getTime() - prev.time.getTime() <= GROUP_GAP_MS;
    const joinsNext =
      next?.kind === "msg" &&
      isSameDay(item.time, next.time) &&
      next.msg.senderId === item.msg.senderId &&
      next.time.getTime() - item.time.getTime() <= GROUP_GAP_MS;

    const isMe = item.msg.senderId === myId;
    rows.push({
      kind: "msg",
      key: item.msg._id,
      msg: item.msg,
      isMe,
      first: !joinsPrev,
      last: !joinsNext,
      showSender: isGroup && !isMe && !joinsPrev,
      status: item.status,
      pendingId: item.pendingId,
    });
  });

  return rows;
}