"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Eraser, EyeOff, MessageSquare, Palette, Search, Settings, UserPlus, VolumeX, WifiOff } from "lucide-react";
import { updateChatSettings, useChatSettings } from "@/lib/chat-settings";
import ChatSettingsDialog from "@/app/dashboard/dms/DmsClient/dialogs/ChatSettingsDialog";
import { DEFAULT_THEME, chatContainerStyle, wallpaperStyle } from "@/app/dashboard/dms/DmsClient/themes";
import ThemeDialog from "@/app/dashboard/dms/DmsClient/ui/ThemeDialog";
import { GLOBAL_ROOM_ID } from "../chat-shared";
import { blockPlayer, sendFriendRequest } from "@/lib/friends-api";
import { uploadVoiceMessage } from "@/lib/chat-api";
import { ApiError } from "@/lib/api";
import Composer from "@/app/dashboard/dms/DmsClient/Composer";
import MessageList from "@/app/dashboard/dms/DmsClient/MessageList/MessageList";
import SearchPanel from "@/app/dashboard/dms/DmsClient/panels/SearchPanel";
import { useChatPrefs } from "@/app/dashboard/dms/DmsClient/hooks/useChatPrefs";
import { useDraftStore } from "@/app/dashboard/dms/DmsClient/hooks/useDraftStore";
import { useDmFriends } from "@/app/dashboard/dms/DmsClient/hooks/useDmFriends";
import { useDmIdentity } from "@/app/dashboard/dms/DmsClient/hooks/useDmIdentity";
import { useDmSocket } from "@/app/dashboard/dms/DmsClient/hooks/useDmSocket";
import { useRoomMessages } from "@/app/dashboard/dms/DmsClient/hooks/useRoomMessages";
import { useTransientMessage } from "@/app/dashboard/dms/DmsClient/hooks/useTransientMessage";
import { useTyping } from "@/app/dashboard/dms/DmsClient/hooks/useTyping";
import type { CallEvent, DmMessage, ReplyRef } from "@/app/dashboard/dms/DmsClient/types";
import ConfirmDialog from "@/app/dashboard/dms/DmsClient/ui/ConfirmDialog";
import DropdownMenu, { type MenuItem } from "@/app/dashboard/dms/DmsClient/ui/DropdownMenu";
import InlineNotice from "@/app/dashboard/dms/DmsClient/ui/InlineNotice";
import TypingIndicator from "@/app/dashboard/dms/DmsClient/ui/TypingIndicator";
import MutedPanel from "./MutedPanel";
import { useMutes } from "./useMutes";

type Panel = "search" | "muted";
type Dialog = { kind: "clear" } | { kind: "theme" } | { kind: "settings" } | { kind: "block"; playerId: string; name: string };

const NO_HIDDEN: string[] = [];
const NO_EVENTS: CallEvent[] = [];
const MAX_MENTION_NAMES = 50;

function previewOf(msg: DmMessage): string {
  return msg.audioUrl ? "Voice message" : msg.content.slice(0, 140);
}

export default function GlobalChatClient() {
  const router = useRouter();
  const { socket, connected } = useDmSocket();
  const { friends, selfId } = useDmFriends();
  const me = useDmIdentity(selfId);
  const { notice, show: showNotice, clear: clearNotice } = useTransientMessage();
  const prefs = useChatPrefs();
  const theme = prefs.themes[GLOBAL_ROOM_ID];
  const settings = useChatSettings();
  const mutes = useMutes(showNotice);

  const [panel, setPanel] = useState<Panel | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [replyTo, setReplyTo] = useState<DmMessage | null>(null);
  const [editing, setEditing] = useState<DmMessage | null>(null);
  const [jumpRequest, setJumpRequest] = useState<{ id: string; nonce: number } | null>(null);
  const drafts = useDraftStore();


  // Listen for header actions (Search / Mute / Menu)
  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent<string>).detail;
      if (action === "search" || action === "muted") {
        setPanel((prev) => (prev === action ? null : action));
      } else if (action === "menu") {
        setDialog({ kind: "settings" });
      }
    };
    window.addEventListener("fps-chat-action", handler);
    return () => window.removeEventListener("fps-chat-action", handler);
  }, []);

  const {
    messages,
    pending,
    loading,
    hasMore,
    loadingOlder,
    loadOlder,
    getMessages,
    send,
    retry,
    discard,
    react,
    edit,
    remove,
  } = useRoomMessages(socket, GLOBAL_ROOM_ID, me.playerId, showNotice);
  const { typingNames, notifyTyping, stopTyping } = useTyping(socket, GLOBAL_ROOM_ID, me.playerId);

  useEffect(() => {
    if (!socket) return;
    const onError = (message: unknown) => showNotice(typeof message === "string" ? message : "Something went wrong.");
    socket.on("error", onError);
    return () => {
      socket.off("error", onError);
    };
  }, [socket, showNotice]);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.playerId)), [friends]);
  const mutedSet = useMemo(() => new Set(mutes.muted), [mutes.muted]);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of messages) if (m.senderName && !m.system) map.set(m.senderId, m.senderName);
    return map;
  }, [messages]);

  const mentionCandidates = useMemo(() => {
    const unique = new Set<string>();
    for (let i = messages.length - 1; i >= 0 && unique.size < MAX_MENTION_NAMES; i--) {
      const m = messages[i];
      if (m && m.senderId !== me.playerId && m.senderName && !m.system && !mutedSet.has(m.senderId)) unique.add(m.senderName);
    }
    return [...unique];
  }, [messages, me.playerId, mutedSet]);

  const localHidden = prefs.hidden[GLOBAL_ROOM_ID] ?? NO_HIDDEN;
  const { hiddenIds, mutedHiddenCount } = useMemo(() => {
    const fromMutes = messages.filter((m) => mutedSet.has(m.senderId)).map((m) => m._id);
    return { hiddenIds: [...localHidden, ...fromMutes], mutedHiddenCount: fromMutes.length };
  }, [messages, mutedSet, localHidden]);

  const addFriend = useCallback(
    async (playerId: string, name: string) => {
      try {
        await sendFriendRequest(playerId);
        showNotice(`Friend request sent to ${name}.`, "info");
      } catch (err) {
        showNotice(err instanceof ApiError && err.code === "BLOCKED" ? "You can't add this player." : "Couldn't send the request.");
      }
    },
    [showNotice],
  );

  const senderMenu = useCallback(
    (msg: DmMessage): MenuItem[] => {
      if (msg.system || msg.senderId === me.playerId) return [];
      const name = msg.senderName ?? "this player";
      const isFriend = friendIds.has(msg.senderId);
      return [
        {
          id: "dm",
          label: `Message ${name}`,
          icon: MessageSquare,
          hidden: !isFriend,
          onSelect: () => router.push(`/dashboard/dms?dm=${encodeURIComponent(msg.senderId)}`),
        },
        { id: "friend", label: "Add friend", icon: UserPlus, hidden: isFriend, onSelect: () => void addFriend(msg.senderId, name) },
        {
          id: "mute",
          label: `Mute ${name}`,
          icon: VolumeX,
          dividerBefore: true,
          onSelect: () => void mutes.mute(msg.senderId),
        },
        {
          id: "block",
          label: `Block ${name}`,
          icon: Ban,
          danger: true,
          onSelect: () => setDialog({ kind: "block", playerId: msg.senderId, name }),
        },
      ];
    },
    [me.playerId, friendIds, router, addFriend, mutes],
  );

  const jumpTo = useCallback(
    async (messageId: string) => {
      if (!window.matchMedia("(min-width: 768px)").matches) setPanel(null);
      for (let attempt = 0; attempt < 10; attempt++) {
        if (getMessages().some((m) => m._id === messageId)) {
          setJumpRequest({ id: messageId, nonce: Date.now() });
          return;
        }
        if (!(await loadOlder())) break;
      }
      if (getMessages().some((m) => m._id === messageId)) setJumpRequest({ id: messageId, nonce: Date.now() });
      else showNotice("That message is too far back to jump to.");
    },
    [getMessages, loadOlder, showNotice],
  );

  const handleSend = useCallback(
    (text: string) => {
      const reference: ReplyRef | undefined = replyTo
        ? {
            messageId: replyTo._id,
            senderId: replyTo.senderId,
            senderName: replyTo.senderName ?? "Unknown",
            preview: previewOf(replyTo),
          }
        : undefined;
      stopTyping();
      send(text, reference);
      setReplyTo(null);
    },
    [replyTo, send, stopTyping],
  );

  const handleSaveEdit = useCallback(
    async (id: string, text: string) => {
      await edit(id, text);
      setEditing(null);
    },
    [edit],
  );

  const handleSendVoice = useCallback(
    async (blob: Blob) => {
      try {
        await uploadVoiceMessage(GLOBAL_ROOM_ID, blob);
      } catch {
        showNotice("Failed to send the voice message. Please try again.");
      }
    },
    [showNotice],
  );

  const closePanel = useCallback(() => setPanel(null), []);
  const closeDialog = useCallback(() => setDialog(null), []);

  const confirmBlock = async (playerId: string, name: string) => {
    try {
      await blockPlayer(playerId);
      showNotice(`Blocked ${name}.`, "info");
    } catch {
      showNotice("Couldn't block this player. Please try again.");
    }
    setDialog(null);
  };

  const headerItems = useMemo<MenuItem[]>(() => [
    { id: "search", label: "Search messages", icon: Search, onSelect: () => setPanel("search") },
    { id: "muted", label: "Muted players", icon: VolumeX, onSelect: () => setPanel("muted") },
    { id: "theme", label: "Chat theme", icon: Palette, dividerBefore: true, onSelect: () => setDialog({ kind: "theme" }) },
    { id: "settings", label: "Chat settings", icon: Settings, onSelect: () => setDialog({ kind: "settings" }) },
    { id: "clear", label: "Clear chat for me", icon: Eraser, onSelect: () => setDialog({ kind: "clear" }) },
    {
      id: "turn-off",
      label: "Turn off Global Chat",
      icon: EyeOff,
      danger: true,
      dividerBefore: true,
      onSelect: () => {
        updateChatSettings({ globalChat: false });
        router.push("/dashboard/dms");
      },
    },
  ], [router]);

  // Broadcast the menu items so DashboardShell can render them
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("fps-chat-menu-items", { detail: headerItems }));
  }, [headerItems]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background" style={chatContainerStyle(theme, settings.fontSize)}>
      
      {/* Hidden trigger that the top-bar three dots clicks */}
      <div className="hidden">
        <DropdownMenu
          label="Chat options"
          items={headerItems}
          trigger={<span data-chat-menu-trigger />}
        />
      </div>

      {/* Chat column (banners + messages + composer stacked vertically) */}
      <div className="flex min-w-0 flex-1 flex-col relative">

        {!connected && (
          <div
            role="status"
            className="flex w-full items-center justify-center gap-2 bg-amber-500/10 px-4 py-1.5 text-[12px] font-medium text-amber-600 dark:text-amber-400"
          >
            <WifiOff size={13} /> Reconnecting... messages can&apos;t be sent right now.
          </div>
        )}

        {mutedHiddenCount > 0 && (
          <div className="flex w-full items-center justify-center gap-2 bg-foreground/[0.04] px-4 py-1.5 text-[12px] text-muted">
            <VolumeX size={13} />
            {mutedHiddenCount} message{mutedHiddenCount === 1 ? "" : "s"} from muted players hidden.
            <button type="button" onClick={() => setPanel("muted")} className="font-semibold text-accent hover:underline">
              Manage
            </button>
          </div>
        )}
        <MessageList
          messages={messages}
          pending={pending}
          events={NO_EVENTS}
          loading={loading}
          hasMore={hasMore}
          loadingOlder={loadingOlder}
          myId={me.playerId}
          myName={me.name}
          peerName="Global Chat"
          wallpaper={wallpaperStyle(theme)}
          roomId={GLOBAL_ROOM_ID}
          isGroup
          canModerate={false}
          allowPin={false}
          emptyTitle="Welcome to Global Chat"
          emptyDescription="This is the start of the channel. Say hello, and use @ to mention someone."
          clearedAt={prefs.clearedAt[GLOBAL_ROOM_ID]}
          hidden={hiddenIds}
          jumpRequest={jumpRequest}
          senderMenu={senderMenu}
          onLoadOlder={() => void loadOlder()}
          onReply={(msg) => {
            setEditing(null);
            setReplyTo(msg);
          }}
          onReact={react}
          onTogglePin={() => undefined}
          onEdit={(msg) => {
            setReplyTo(null);
            setEditing(msg);
          }}
          onDeleteForMe={(msg) => prefs.hideMessage(GLOBAL_ROOM_ID, msg._id)}
          onDeleteForAll={(msg) => void remove(msg._id)}
          onJump={(id) => void jumpTo(id)}
          onRetry={retry}
          onDiscard={discard}
        />

        <div className="shrink-0 px-3 pb-6 pt-1 sm:px-6 sm:pb-6">
          <TypingIndicator names={typingNames} />
          <Composer
            placeholder="Message #global"
            enterToSend={settings.enterToSend}
            disabled={!connected}
            initialText={drafts.get(GLOBAL_ROOM_ID)}
            mentionCandidates={mentionCandidates}
            reply={
              replyTo
                ? { messageId: replyTo._id, senderName: replyTo.senderName ?? "Unknown", preview: previewOf(replyTo) }
                : null
            }
            editing={editing ? { id: editing._id, content: editing.content } : null}
            onTyping={notifyTyping}
            onDraftChange={(text) => drafts.set(GLOBAL_ROOM_ID, text)}
            onSend={handleSend}
            onSaveEdit={handleSaveEdit}
            onCancelReply={() => setReplyTo(null)}
            onCancelEdit={() => setEditing(null)}
            onSendVoice={handleSendVoice}
            onError={showNotice}
          />
        </div>
      </div>

      {panel === "search" && <SearchPanel roomId={GLOBAL_ROOM_ID} onJump={(id) => void jumpTo(id)} onClose={closePanel} />}
      {panel === "muted" && (
        <MutedPanel mutedIds={mutes.muted} names={names} onUnmute={(id) => void mutes.unmute(id)} onClose={closePanel} />
      )}

      {dialog?.kind === "settings" && <ChatSettingsDialog onClose={closeDialog} />}
      {dialog?.kind === "theme" && (
        <ThemeDialog
          value={theme ?? DEFAULT_THEME}
          onChange={(setting) => prefs.setTheme(GLOBAL_ROOM_ID, setting)}
          onReset={() => prefs.setTheme(GLOBAL_ROOM_ID, null)}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === "clear" && (
        <ConfirmDialog
          title="Clear chat for you?"
          message="This hides the current messages on this device only. Everyone else still sees them, and new messages appear as usual."
          confirmLabel="Clear chat"
          danger
          onConfirm={() => {
            prefs.clearChat(GLOBAL_ROOM_ID);
            setDialog(null);
          }}
          onCancel={closeDialog}
        />
      )}
      {dialog?.kind === "block" && (
        <ConfirmDialog
          title={`Block ${dialog.name}?`}
          message="You will no longer be able to message or call each other, and they will be removed from your friends."
          confirmLabel="Block"
          danger
          onConfirm={() => confirmBlock(dialog.playerId, dialog.name)}
          onCancel={closeDialog}
        />
      )}

      {notice && (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-20 flex justify-center px-4">
          <InlineNotice message={notice.text} tone={notice.tone} onDismiss={clearNotice} />
        </div>
      )}
    </div>
  );
}









