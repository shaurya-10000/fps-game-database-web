"use client";

import { useRef, useState } from "react";
import { Ban, Check, CheckCheck, Pin, Star } from "lucide-react";
import { ChatAvatar } from "@/app/dashboard/chat/chat-shared";
import { cn } from "@/lib/utils";
import type { DmMessage } from "../types";
import { nameColor } from "../ui/colors";
import { HEART_REACTION } from "../ui/emoji";
import DropdownMenu, { type MenuItem } from "../ui/DropdownMenu";
import MessageActions from "./MessageActions";
import MessageText from "./MessageText";
import ReactionBar from "./ReactionBar";
import ReplyQuote from "./ReplyQuote";
import VoiceMessage from "./VoiceMessage";
import type { MessageRow } from "./group-messages";

interface MessageBubbleProps {
  row: MessageRow;
  peerName: string;
  myId: string;
  /** Your display name, used to highlight messages that @mention you. */
  myName?: string;
  canModerate: boolean;
  allowPin: boolean;
  starredIds?: ReadonlySet<string>;
  onToggleStar?: (msg: DmMessage) => void;
  onForward?: (msg: DmMessage) => void;
  flash: boolean;
  /** Delivery state shown under your latest message in a DM. */
  receipt?: "sent" | "seen";
  /** Extra actions for another person's avatar and name (message, add friend, mute...). */
  senderMenu?: (msg: DmMessage) => MenuItem[];
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

export default function MessageBubble({
  row,
  peerName,
  myId,
  myName,
  canModerate,
  allowPin,
  starredIds,
  onToggleStar,
  onForward,
  flash,
  receipt,
  senderMenu,
  onReply,
  onReact,
  onTogglePin,
  onEdit,
  onDeleteForMe,
  onDeleteForAll,
  onJump,
  onRetry,
  onDiscard,
}: MessageBubbleProps) {
  const { msg, isMe, first, last, showSender, status, pendingId } = row;
  const time = new Date(msg.createdAt);
  const shortTime = time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const senderName = msg.senderName || peerName;
  const isVoice = Boolean(msg.audioUrl);
  const deleted = Boolean(msg.deleted);
  const sent = !status;

  const mentionsMe =
    !isMe && !deleted && Boolean(myName) && msg.content.toLowerCase().includes(`@${(myName ?? "").toLowerCase()}`);
  const senderItems = !isMe && senderMenu ? senderMenu(msg) : [];

  // Your bubbles use the chat theme's gradient. It spans the screen, so bubbles shade as you scroll.
  const bubbleStyle: React.CSSProperties = {
    fontSize: "var(--chat-font-size, 14px)",
    ...(isMe && !deleted
      ? {
          background: "var(--chat-sent-bg, var(--accent))",
          backgroundAttachment: "fixed",
          color: "var(--chat-sent-fg, var(--background))",
        }
      : {}),
  };

  // Swipe a message to the right to reply (touch screens).
  const [swipe, setSwipe] = useState(0);
  const touch = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const canSwipe = sent && !deleted;
  const onTouchStart = (event: React.TouchEvent) => {
    const point = event.touches[0];
    if (canSwipe && point) touch.current = { x: point.clientX, y: point.clientY, active: false };
  };
  const onTouchMove = (event: React.TouchEvent) => {
    const start = touch.current;
    const point = event.touches[0];
    if (!start || !point) return;
    const dx = point.clientX - start.x;
    if (!start.active) {
      if (Math.abs(point.clientY - start.y) > 12) {
        touch.current = null;
        return;
      }
      if (dx <= 10) return;
      start.active = true;
    }
    setSwipe(Math.min(Math.max(dx, 0), 72));
  };
  const onTouchEnd = () => {
    if (touch.current?.active && swipe >= 56) onReply(msg);
    touch.current = null;
    setSwipe(0);
  };

  const avatar = <ChatAvatar name={senderName} size={32} avatarUrl={msg.senderAvatarUrl} />;

  const actions = sent ? (
    <MessageActions
      msg={msg}
      isMe={isMe}
      canModerate={canModerate}
      allowPin={allowPin}
      starred={starredIds?.has(msg._id) ?? false}
      onToggleStar={onToggleStar}
      onForward={onForward}
      onReply={onReply}
      onReact={onReact}
      onTogglePin={onTogglePin}
      onEdit={onEdit}
      onDeleteForMe={onDeleteForMe}
      onDeleteForAll={onDeleteForAll}
    />
  ) : null;

  return (
    <div
      data-message-id={msg._id}
      className={cn(
        "group flex items-end gap-2 rounded-xl py-0.5 transition-colors duration-500",
        isMe ? "justify-end" : "justify-start",
        first ? "mt-3" : "mt-0",
        flash && "bg-accent/15",
      )}
    >
      {!isMe && (
        <div className="w-8 shrink-0">
          {last ? (
            senderItems.length > 0 ? (
              <DropdownMenu
                label={`Options for ${senderName}`}
                items={senderItems}
                align="start"
                trigger={avatar}
                triggerClassName="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              />
            ) : (
              avatar
            )
          ) : null}
        </div>
      )}
      {isMe && actions}

      <div
        className={cn("flex min-w-0 max-w-[80%] flex-col", isMe ? "items-end" : "items-start")}
        style={{
          transform: swipe ? `translateX(${swipe}px)` : undefined,
          transition: swipe ? "none" : "transform 150ms ease-out",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {showSender &&
          (senderItems.length > 0 ? (
            <DropdownMenu
              label={`Options for ${senderName}`}
              items={senderItems}
              align="start"
              trigger={senderName}
              triggerClassName={cn(
                "mb-1 rounded px-1 text-[12px] font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                nameColor(msg.senderId),
              )}
            />
          ) : (
            <span className={cn("mb-1 px-1 text-[12px] font-semibold", nameColor(msg.senderId))}>{senderName}</span>
          ))}

        <div
          title={time.toLocaleString()}
          style={bubbleStyle}
          onDoubleClick={sent && !deleted ? () => onReact(msg._id, HEART_REACTION) : undefined}
          className={cn(
            "max-w-full rounded-2xl text-[14px] leading-[1.45] transition-opacity",
            isVoice ? "px-2.5 py-2" : "px-3.5 py-2",
            deleted
              ? "border border-dashed border-border bg-transparent text-muted"
              : isMe
                ? "bg-accent text-background"
                : "border border-border bg-surface text-foreground",
            last && !deleted && (isMe ? "rounded-br-md" : "rounded-bl-md"),
            mentionsMe && "border-accent/60 bg-accent/10 ring-1 ring-accent/40",
            status === "sending" && "opacity-70",
            status === "failed" && "ring-1 ring-rose-500/60",
          )}
        >
          {deleted ? (
            <span className="flex items-center gap-1.5 text-[13px] italic">
              <Ban size={13} /> This message was deleted
            </span>
          ) : (
            <>
              {msg.replyTo && (
                <ReplyQuote reply={msg.replyTo} isMe={isMe} onJump={() => onJump(msg.replyTo?.messageId ?? "")} />
              )}
              {msg.audioUrl ? (
                <VoiceMessage src={msg.audioUrl} isMe={isMe} />
              ) : (
                <MessageText text={msg.content} {...(!isMe && myName ? { mention: myName } : {})} />
              )}
              {msg.editedAt && <span className="ml-1.5 select-none text-[10px] opacity-70">(edited)</span>}
            </>
          )}
        </div>

        {msg.reactions && !deleted && (
          <ReactionBar reactions={msg.reactions} myId={myId} isMe={isMe} onToggle={(emoji) => onReact(msg._id, emoji)} />
        )}

        {status === "sending" && <span className="mt-1 px-1 text-[11px] text-muted">Sending...</span>}
        {status === "failed" && pendingId && (
          <span className="mt-1 flex items-center gap-2 px-1 text-[11px]">
            <span className="text-rose-500">Not sent</span>
            <button type="button" onClick={() => onRetry(pendingId)} className="font-semibold text-accent hover:underline">
              Retry
            </button>
            <button type="button" onClick={() => onDiscard(pendingId)} className="text-muted hover:underline">
              Delete
            </button>
          </span>
        )}
        {sent && (last || msg.pinned || starredIds?.has(msg._id)) && !deleted && (
          <span className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-muted">
            {msg.pinned && <Pin size={11} className="text-accent" aria-label="Pinned" />}
            {starredIds?.has(msg._id) && <Star size={11} className="text-amber-500" fill="currentColor" aria-label="Starred" />}
            {last && shortTime}
            {receipt === "seen" && (
              <span className="inline-flex items-center gap-1 font-medium text-accent">
                <CheckCheck size={13} /> Seen
              </span>
            )}
            {receipt === "sent" && (
              <span className="inline-flex items-center gap-1">
                <Check size={13} /> Sent
              </span>
            )}
            {mentionsMe && last && <span className="font-semibold text-accent">mentioned you</span>}
          </span>
        )}
      </div>

      {!isMe && actions}
    </div>
  );
}
