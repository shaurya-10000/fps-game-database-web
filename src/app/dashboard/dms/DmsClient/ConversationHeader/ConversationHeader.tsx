import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Ban,
  Bell,
  BellOff,
  Download,
  Eraser,
  Info,
  Link2,
  LogOut,
  Palette,
  Phone,
  Pin,
  PinOff,
  Search,
  Star,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { ChatAvatar } from "@/app/dashboard/chat/chat-shared";
import { cn } from "@/lib/utils";
import { conversationKey, type Conversation, type PanelKind } from "../types";
import DropdownMenu, { type MenuItem } from "../ui/DropdownMenu";
import GroupAvatar from "../ui/GroupAvatar";

interface ConversationHeaderProps {
  conversation: Conversation;
  pinsCount: number;
  panel: PanelKind | null;
  chatPinned: boolean;
  chatMuted: boolean;
  chatArchived: boolean;
  callBusy: boolean;
  /** DM: is the other person online. */
  online: boolean;
  /** Group: how many other members are online. */
  onlineCount: number;
  onBack: () => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  onTogglePanel: (panel: PanelKind) => void;
  onTogglePinChat: () => void;
  onToggleMute: () => void;
  onToggleArchive: () => void;
  onOpenTheme: () => void;
  onExport: () => void;
  onClearChat: () => void;
  onDeleteChat: () => void;
  onBlock: () => void;
  onLeave: () => void;
}

const BASE =
  "relative flex size-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40";
const IDLE = "text-muted hover:bg-foreground/[0.07] hover:text-foreground";
const ACTIVE = "bg-accent/15 text-accent";

interface HeaderButtonProps {
  label: string;
  active?: boolean;
  /** Hide below the `sm` breakpoint; the same action is in the menu. */
  desktopOnly?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function HeaderButton({ label, active = false, desktopOnly = false, onClick, children }: HeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(BASE, active ? ACTIVE : IDLE, desktopOnly && "max-sm:hidden")}
    >
      {children}
    </button>
  );
}

export default function ConversationHeader({
  conversation,
  pinsCount,
  panel,
  chatPinned,
  chatMuted,
  chatArchived,
  callBusy,
  online,
  onlineCount,
  onBack,
  onVoiceCall,
  onVideoCall,
  onTogglePanel,
  onTogglePinChat,
  onToggleMute,
  onToggleArchive,
  onOpenTheme,
  onExport,
  onClearChat,
  onDeleteChat,
  onBlock,
  onLeave,
}: ConversationHeaderProps) {
  const isGroup = conversation.kind === "group";
  const busyHint = "You're already in a call";

  const items: MenuItem[] = [
    { id: "info", label: "Group info", icon: Info, hidden: !isGroup, onSelect: () => onTogglePanel("info") },
    { id: "search", label: "Search messages", icon: Search, onSelect: () => onTogglePanel("search") },
    { id: "pins", label: "Pinned messages", icon: Pin, onSelect: () => onTogglePanel("pins") },
    { id: "starred", label: "Starred messages", icon: Star, onSelect: () => onTogglePanel("starred") },
    { id: "links", label: "Shared links", icon: Link2, onSelect: () => onTogglePanel("links") },
    { id: "theme", label: "Chat theme", icon: Palette, dividerBefore: true, onSelect: onOpenTheme },
    {
      id: "mute",
      label: chatMuted ? "Unmute notifications" : "Mute notifications",
      icon: chatMuted ? Bell : BellOff,
      onSelect: onToggleMute,
    },
    {
      id: "pin-chat",
      label: chatPinned ? "Unpin chat" : "Pin chat",
      icon: chatPinned ? PinOff : Pin,
      onSelect: onTogglePinChat,
    },
    {
      id: "archive",
      label: chatArchived ? "Unarchive chat" : "Archive chat",
      icon: chatArchived ? ArchiveRestore : Archive,
      onSelect: onToggleArchive,
    },
    { id: "export", label: "Export chat", icon: Download, onSelect: onExport },
    { id: "clear", label: "Clear chat for me", icon: Eraser, dividerBefore: true, onSelect: onClearChat },
    { id: "delete", label: "Delete chat", icon: Trash2, danger: true, onSelect: onDeleteChat },
    { id: "block", label: `Block ${conversation.name}`, icon: Ban, danger: true, hidden: isGroup, onSelect: onBlock },
    { id: "leave", label: "Leave group", icon: LogOut, danger: true, hidden: !isGroup, onSelect: onLeave },
  ];

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-2 sm:gap-3 sm:px-5"
      data-key={conversationKey(conversation)}
    >
      <button type="button" onClick={onBack} aria-label="Back to conversations" className={cn(BASE, IDLE, "md:hidden")}>
        <ArrowLeft size={20} />
      </button>

      {conversation.kind === "dm" ? (
        <span className="relative shrink-0">
          <ChatAvatar name={conversation.name} size={38} />
          {online && (
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-emerald-500"
            />
          )}
        </span>
      ) : (
        <GroupAvatar name={conversation.name} size={38} />
      )}

      <div className="min-w-0 flex-1">
        <h2 className="flex items-center gap-1.5 truncate text-[15px] font-semibold text-foreground">
          <span className="truncate">{conversation.name}</span>
          {chatMuted && <BellOff size={13} className="shrink-0 text-muted" aria-label="Muted" />}
        </h2>
        <p className="flex items-center gap-1.5 truncate text-[12px] text-muted">
          {conversation.kind === "group" ? (
            <>
              <Users size={12} /> {conversation.group.members.length} members
              {onlineCount > 0 && <span className="text-emerald-500">- {onlineCount} online</span>}
            </>
          ) : online ? (
            <span className="text-emerald-500">Online</span>
          ) : (
            "Direct message"
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center">
        <HeaderButton label="Search messages" active={panel === "search"} desktopOnly onClick={() => onTogglePanel("search")}>
          <Search size={18} />
        </HeaderButton>

        <HeaderButton label="Pinned messages" active={panel === "pins"} desktopOnly onClick={() => onTogglePanel("pins")}>
          <Pin size={18} />
          {pinsCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-background">
              {pinsCount}
            </span>
          )}
        </HeaderButton>

        {conversation.kind === "dm" ? (
          <>
            <button
              type="button"
              onClick={onVoiceCall}
              disabled={callBusy}
              aria-label="Start voice call"
              title={callBusy ? busyHint : "Voice call"}
              className={cn(BASE, IDLE)}
            >
              <Phone size={18} />
            </button>
            <button
              type="button"
              onClick={onVideoCall}
              disabled={callBusy}
              aria-label="Start video call"
              title={callBusy ? busyHint : "Video call"}
              className={cn(BASE, IDLE)}
            >
              <Video size={19} />
            </button>
          </>
        ) : (
          <HeaderButton label="Group info" active={panel === "info"} desktopOnly onClick={() => onTogglePanel("info")}>
            <Info size={18} />
          </HeaderButton>
        )}

        <DropdownMenu label="Conversation options" items={items} triggerClassName={cn(BASE, IDLE)} />
      </div>
    </header>
  );
}