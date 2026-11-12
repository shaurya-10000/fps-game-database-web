"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Hand, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStickToBottom } from "../hooks/useStickToBottom";
import type { CallEvent, DmMessage, PendingMessage } from "../types";
import type { MenuItem } from "../ui/DropdownMenu";
import EmptyState from "../ui/EmptyState";
import CallEventRow from "./CallEventRow";
import MessageBubble from "./MessageBubble";
import SystemRow from "./SystemRow";
import { buildRows } from "./group-messages";

interface MessageListProps {
  messages: DmMessage[];
  pending: PendingMessage[];
  events: CallEvent[];
  loading: boolean;
  hasMore: boolean;
  loadingOlder: boolean;
  myId: string;
  peerName: string;
  roomId: string;
  isGroup: boolean;
  canModerate: boolean;
  allowPin?: boolean;
  myName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  senderMenu?: (msg: DmMessage) => MenuItem[];
  peerReadAt?: number | null;
  starredIds?: ReadonlySet<string>;
  onToggleStar?: (msg: DmMessage) => void;
  onForward?: (msg: DmMessage) => void;
  wallpaper?: React.CSSProperties;
  clearedAt: string | undefined;
  hidden: string[];
  jumpRequest: { id: string; nonce: number } | null;
  onLoadOlder: () => void;
  onReply: (msg: DmMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onTogglePin: (msg: DmMessage) => void;
  onEdit: (msg: DmMessage) => void;
  onDeleteForMe: (msg: DmMessage) => void;
  onDeleteForAll: (msg: DmMessage) => void;
  onJump: (messageId: string) => void;
  onRetry: (pendingId: string) => void;
  onDiscard: (pendingId: string) => void;
}

type Row = ReturnType<typeof buildRows>[number];

function findReceipt(rows: readonly Row[], peerReadAt: number | null | undefined): { key: string; seen: boolean } | null {
  if (peerReadAt === undefined) return null;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row?.kind === "msg" && row.isMe && !row.status) {
      return { key: row.key, seen: peerReadAt !== null && peerReadAt >= new Date(row.msg.createdAt).getTime() };
    }
  }
  return null;
}

function MessagesSkeleton() {
  const widths = ["w-40", "w-56", "w-32", "w-48", "w-64"];
  return (
    <div className="space-y-3" aria-label="Loading messages">
      {widths.map((w, i) => (
        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
          <div className={cn("h-9 animate-pulse rounded-2xl bg-foreground/10", w)} />
        </div>
      ))}
    </div>
  );
}

export default function MessageList({
  messages,
  pending,
  events,
  loading,
  hasMore,
  loadingOlder,
  myId,
  peerName,
  roomId,
  isGroup,
  canModerate,
  allowPin = true,
  myName,
  emptyTitle,
  emptyDescription,
  senderMenu,
  peerReadAt,
  starredIds,
  onToggleStar,
  onForward,
  wallpaper,
  clearedAt,
  hidden,
  jumpRequest,
  onLoadOlder,
  onReply,
  onReact,
  onTogglePin,
  onEdit,
  onDeleteForMe,
  onDeleteForAll,
  onJump,
  onRetry,
  onDiscard,
}: MessageListProps) {
  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);
  const rows = useMemo(
    () => buildRows({ messages, pending, events, myId, roomId, isGroup, clearedAt, hidden: hiddenSet }),
    [messages, pending, events, myId, roomId, isGroup, clearedAt, hiddenSet],
  );

  const lastRow = rows[rows.length - 1];
  const lastIsMine = lastRow?.kind === "msg" && lastRow.isMe;
  const empty = rows.length === 0;

  const receipt = findReceipt(rows, peerReadAt);

  const tailKey = lastRow?.key ?? "";
  const { ref, atBottom, hasNew, onScroll, scrollToBottom } = useStickToBottom<HTMLDivElement>(tailKey, roomId, lastIsMine);

  const anchor = useRef<{ height: number; top: number } | null>(null);
  const firstId = messages[0]?._id ?? "";
  useLayoutEffect(() => {
    const el = ref.current;
    const saved = anchor.current;
    if (!el || !saved) return;
    anchor.current = null;
    el.scrollTop = el.scrollHeight - saved.height + saved.top;
  }, [firstId, ref]);

  const loadOlder = () => {
    const el = ref.current;
    if (el) anchor.current = { height: el.scrollHeight, top: el.scrollTop };
    onLoadOlder();
  };

  const [flashId, setFlashId] = useState<string | null>(null);
  useEffect(() => {
    if (!jumpRequest) return;
    const target = ref.current?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(jumpRequest.id)}"]`);
    if (!target) return;
    target.scrollIntoView({ block: "center", behavior: "smooth" });
    setFlashId(jumpRequest.id);
    const timer = setTimeout(() => setFlashId(null), 1800);
    return () => clearTimeout(timer);
  }, [jumpRequest, ref]);

  return (
    <div className="relative min-h-0 flex-1">
      {wallpaper && <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={wallpaper} />}
      <div ref={ref} onScroll={onScroll} className="absolute inset-0 overflow-y-auto px-3 py-4 sm:px-6">
        
        {/* Centering wrapper */}
        <div className="flex min-h-full w-full flex-col">
          
          {hasMore && !loading && (
            <div className="mb-2 flex justify-center">
              <button
                type="button"
                onClick={loadOlder}
                disabled={loadingOlder}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-60"
              >
                {loadingOlder && <LoaderCircle size={13} className="animate-spin" />}
                Load earlier messages
              </button>
            </div>
          )}

          <div className={cn("flex flex-1 flex-col", empty && !loading ? "justify-center" : "justify-end")}>
            {loading && empty && <MessagesSkeleton />}

            {!loading && empty && (
              <EmptyState
                icon={Hand}
                title={emptyTitle ?? "No messages yet"}
                description={
                  emptyDescription ??
                  `Say hello${isGroup ? " to the group" : ` to ${peerName}`}. Messages here are only visible to ${isGroup ? "its members" : "the two of you"}.`
                }
              />
            )}

            {rows.map((row) => {
              switch (row.kind) {
                case "day":
                  return (
                    <div key={row.key} className="sticky top-1 z-10 my-4 flex justify-center">
                      <span className="rounded-full border border-border bg-background/90 px-3 py-1 text-[11px] font-semibold text-muted backdrop-blur">
                        {row.label}
                      </span>
                    </div>
                  );
                case "event":
                  return <CallEventRow key={row.key} event={row.event} />;
                case "system":
                  return <SystemRow key={row.key} text={row.text} />;
                case "msg":
                  return (
                    <MessageBubble
                      key={row.key}
                      row={row}
                      peerName={peerName}
                      myId={myId}
                      myName={myName}
                      canModerate={canModerate}
                      allowPin={allowPin}
                      senderMenu={senderMenu}
                      receipt={receipt && receipt.key === row.key ? (receipt.seen ? "seen" : "sent") : undefined}
                      starredIds={starredIds}
                      onToggleStar={onToggleStar}
                      onForward={onForward}
                      flash={flashId === row.msg._id}
                      onReply={onReply}
                      onReact={onReact}
                      onTogglePin={onTogglePin}
                      onEdit={onEdit}
                      onDeleteForMe={onDeleteForMe}
                      onDeleteForAll={onDeleteForAll}
                      onJump={onJump}
                      onRetry={onRetry}
                      onDiscard={onDiscard}
                    />
                  );
              }
            })}
          </div>
        </div>
      </div>

      {!atBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-[12px] font-semibold text-foreground shadow-lg transition-colors hover:bg-surface"
        >
          <ArrowDown size={14} />
          {hasNew ? "New messages" : "Jump to latest"}
        </button>
      )}
    </div>
  );
}

