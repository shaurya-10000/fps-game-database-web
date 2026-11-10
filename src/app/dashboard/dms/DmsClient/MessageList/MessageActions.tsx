"use client";

import { Copy, CornerUpLeft, EyeOff, Forward, Pencil, Pin, PinOff, Star, StarOff, Trash2 } from "lucide-react";
import type { DmMessage } from "../types";
import DropdownMenu, { type MenuItem } from "../ui/DropdownMenu";
import { QUICK_REACTIONS, REACTION_EMOJIS } from "../ui/emoji";

interface MessageActionsProps {
  msg: DmMessage;
  isMe: boolean;
  canModerate: boolean;
  allowPin?: boolean;
  starred?: boolean;
  onToggleStar?: (msg: DmMessage) => void;
  onForward?: (msg: DmMessage) => void;
  onReply: (msg: DmMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onTogglePin: (msg: DmMessage) => void;
  onEdit: (msg: DmMessage) => void;
  onDeleteForMe: (msg: DmMessage) => void;
  onDeleteForAll: (msg: DmMessage) => void;
}

const ICON_BUTTON =
  "flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

/** Hover toolbar (quick reactions, reply) plus the three-dot menu with every message action. */
export default function MessageActions({
  msg,
  isMe,
  canModerate,
  allowPin = true,
  starred = false,
  onToggleStar,
  onForward,
  onReply,
  onReact,
  onTogglePin,
  onEdit,
  onDeleteForMe,
  onDeleteForAll,
}: MessageActionsProps) {
  const deleted = Boolean(msg.deleted);
  const isText = !msg.audioUrl && msg.content.length > 0;
  const pinned = Boolean(msg.pinned);

  const copy = () => {
    void navigator.clipboard.writeText(msg.content).catch(() => undefined);
  };

  const items: MenuItem[] = [
    { id: "reply", label: "Reply", icon: CornerUpLeft, hidden: deleted, onSelect: () => onReply(msg) },
    { id: "copy", label: "Copy text", icon: Copy, hidden: deleted || !isText, onSelect: copy },
    {
      id: "pin",
      label: pinned ? "Unpin message" : "Pin message",
      icon: pinned ? PinOff : Pin,
      hidden: deleted || !allowPin,
      onSelect: () => onTogglePin(msg),
    },
    {
      id: "star",
      label: starred ? "Unstar message" : "Star message",
      icon: starred ? StarOff : Star,
      hidden: deleted || !onToggleStar,
      onSelect: () => onToggleStar?.(msg),
    },
    { id: "forward", label: "Forward", icon: Forward, hidden: deleted || !isText || !onForward, onSelect: () => onForward?.(msg) },
    { id: "edit", label: "Edit message", icon: Pencil, hidden: deleted || !isMe || !isText, onSelect: () => onEdit(msg) },
    { id: "delete-me", label: "Delete for me", icon: EyeOff, dividerBefore: true, onSelect: () => onDeleteForMe(msg) },
    {
      id: "delete-all",
      label: "Delete for everyone",
      icon: Trash2,
      danger: true,
      hidden: deleted || !(isMe || canModerate),
      onSelect: () => onDeleteForAll(msg),
    },
  ];

  return (
    <div className="mb-1 flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-background px-1 py-0.5 shadow-sm transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
      {!deleted && (
        <div className="hidden items-center md:flex">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(msg._id, emoji)}
              aria-label={`React with ${emoji}`}
              className={`${ICON_BUTTON} text-[15px]`}
            >
              {emoji}
            </button>
          ))}
          <button type="button" onClick={() => onReply(msg)} aria-label="Reply" title="Reply" className={ICON_BUTTON}>
            <CornerUpLeft size={15} />
          </button>
        </div>
      )}
      <DropdownMenu
        label="More message actions"
        items={items}
        triggerClassName={ICON_BUTTON}
        header={
          deleted
            ? undefined
            : (close) => (
                <div className="mb-1 flex flex-wrap gap-0.5 border-b border-border px-1 pb-1.5 pt-0.5">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        close();
                        onReact(msg._id, emoji);
                      }}
                      aria-label={`React with ${emoji}`}
                      className="flex size-[26px] items-center justify-center rounded-md text-[15px] transition-colors hover:bg-foreground/10"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )
        }
      />
    </div>
  );
}