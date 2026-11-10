"use client";

import { Ban, Copy, MessageCircle, Phone, Star, StarOff, UserMinus, Video, Volume2, VolumeX } from "lucide-react";
import { ChatAvatar } from "@/app/dashboard/chat/chat-shared";
import { cn } from "@/lib/utils";
import DropdownMenu, { type MenuItem } from "@/app/dashboard/dms/DmsClient/ui/DropdownMenu";
import { sinceLabel } from "./format";
import type { Friend } from "./types";

interface FriendRowProps {
  friend: Friend;
  online: boolean;
  favorite: boolean;
  muted: boolean;
  callBusy: boolean;
  onMessage: () => void;
  onCall: (video: boolean) => void;
  onToggleFavorite: () => void;
  onToggleMute: () => void;
  onCopyId: () => void;
  onUnfriend: () => void;
  onBlock: () => void;
}

const ICON_BUTTON =
  "flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40";

export default function FriendRow({
  friend,
  online,
  favorite,
  muted,
  callBusy,
  onMessage,
  onCall,
  onToggleFavorite,
  onToggleMute,
  onCopyId,
  onUnfriend,
  onBlock,
}: FriendRowProps) {
  const since = friend.since ? sinceLabel(friend.since) : "";
  const busyHint = "You're already in a call";

  const items: MenuItem[] = [
    { id: "message", label: "Message", icon: MessageCircle, onSelect: onMessage },
    { id: "voice", label: "Voice call", icon: Phone, disabled: callBusy, onSelect: () => onCall(false) },
    { id: "video", label: "Video call", icon: Video, disabled: callBusy, onSelect: () => onCall(true) },
    { id: "fav", label: favorite ? "Remove from favorites" : "Add to favorites", icon: favorite ? StarOff : Star, dividerBefore: true, onSelect: onToggleFavorite },
    { id: "mute", label: muted ? "Unmute in Global Chat" : "Mute in Global Chat", icon: muted ? Volume2 : VolumeX, onSelect: onToggleMute },
    { id: "copy", label: "Copy player ID", icon: Copy, onSelect: onCopyId },
    { id: "unfriend", label: "Remove friend", icon: UserMinus, danger: true, dividerBefore: true, onSelect: onUnfriend },
    { id: "block", label: `Block ${friend.name}`, icon: Ban, danger: true, onSelect: onBlock },
  ];

  return (
    <li className="group flex items-center gap-1 rounded-2xl border border-border bg-surface pl-3 pr-1.5 transition-colors hover:border-foreground/20 sm:pl-4 sm:pr-2">
      <button
        type="button"
        onClick={onMessage}
        aria-label={`Message ${friend.name}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <span className="relative shrink-0">
          <ChatAvatar name={friend.name} size={44} />
          {online && (
            <span aria-label="Online" className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-surface bg-emerald-500" />
          )}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-[14px] font-semibold text-foreground">
            <span className="truncate">{friend.name}</span>
            {favorite && <Star size={12} className="shrink-0 text-amber-500" fill="currentColor" aria-label="Favorite" />}
            {muted && <VolumeX size={12} className="shrink-0 text-muted" aria-label="Muted in Global Chat" />}
          </span>
          <span className="block truncate text-[12px] text-muted">
            <span className={cn(online && "font-medium text-emerald-500")}>{online ? "Online" : "Offline"}</span>
            {since && <span className="max-sm:hidden"> - Friends since {since}</span>}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center">
        <button type="button" onClick={onMessage} aria-label={`Message ${friend.name}`} title="Message" className={ICON_BUTTON}>
          <MessageCircle size={18} />
        </button>
        <button
          type="button"
          onClick={() => onCall(false)}
          disabled={callBusy}
          aria-label={`Voice call ${friend.name}`}
          title={callBusy ? busyHint : "Voice call"}
          className={cn(ICON_BUTTON, "max-sm:hidden")}
        >
          <Phone size={17} />
        </button>
        <button
          type="button"
          onClick={() => onCall(true)}
          disabled={callBusy}
          aria-label={`Video call ${friend.name}`}
          title={callBusy ? busyHint : "Video call"}
          className={cn(ICON_BUTTON, "max-sm:hidden")}
        >
          <Video size={18} />
        </button>
        <DropdownMenu label={`Options for ${friend.name}`} items={items} triggerClassName={ICON_BUTTON} />
      </div>
    </li>
  );
}