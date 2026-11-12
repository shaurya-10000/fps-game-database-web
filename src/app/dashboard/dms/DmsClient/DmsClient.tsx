"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, WifiOff } from "lucide-react";
import { useCall } from "@/app/dashboard/chat/CallContext";
import { uploadVoiceMessage } from "@/lib/chat-api";
import { callSounds } from "@/lib/call-sounds";
import { isSnoozed, useChatSettings } from "@/lib/chat-settings";
import { cn } from "@/lib/utils";
import {
  addGroupMembers,
  blockPlayer,
  createGroup,
  removeGroupMember,
  renameGroup,
} from "./api";
import Composer from "./Composer";
import ConversationHeader from "./ConversationHeader";
import ConversationList from "./ConversationList";
import GroupPickerDialog from "./dialogs/GroupPickerDialog";
import MessageList from "./MessageList";
import PinnedBar from "./PinnedBar";
import GroupInfoPanel from "./panels/GroupInfoPanel";
import PinsPanel from "./panels/PinsPanel";
import SearchPanel from "./panels/SearchPanel";
import { useChatPrefs } from "./hooks/useChatPrefs";
import { useConversation } from "./hooks/useConversation";
import { useDmFriends } from "./hooks/useDmFriends";
import { useDmIdentity } from "./hooks/useDmIdentity";
import { useDmSocket } from "./hooks/useDmSocket";
import { useDraftStore } from "./hooks/useDraftStore";
import { useGroups } from "./hooks/useGroups";
import { useRecentChats } from "./hooks/useRecentChats";
import { useReadReceipts } from "./hooks/useReadReceipts";
import { useRoomMessages } from "./hooks/useRoomMessages";
import { useTransientMessage } from "./hooks/useTransientMessage";
import { useTyping } from "./hooks/useTyping";
import { useUnread } from "./hooks/useUnread";
import {
  conversationKey,
  dmRoomId,
  type CallEvent,
  type ChatActivity,
  type Conversation,
  type DmFriend,
  type DmMessage,
  type GroupMember,
  type GroupSummary,
  type PanelKind,
  type ReplyRef,
  type StarredMessage,
} from "./types";
import ConfirmDialog from "./ui/ConfirmDialog";
import ThemeDialog from "./ui/ThemeDialog";
import ForwardDialog, { type ForwardTarget } from "./dialogs/ForwardDialog";
import LinksPanel from "./panels/LinksPanel";
import StarredPanel from "./panels/StarredPanel";
import { exportChat } from "./export-chat";
import ChatSettingsDialog from "./dialogs/ChatSettingsDialog";
import { DEFAULT_THEME, chatContainerStyle, wallpaperStyle } from "./themes";
import EmptyState from "./ui/EmptyState";
import InlineNotice from "./ui/InlineNotice";
import NotificationPrompt from "./ui/NotificationPrompt";
import TypingIndicator from "./ui/TypingIndicator";

const NO_EVENTS: CallEvent[] = [];
const NO_HIDDEN: string[] = [];
const NO_NAMES: string[] = [];
const NO_STARRED: StarredMessage[] = [];
const MAX_GROUP_MEMBERS = 50;

type Dialog =
  | { kind: "create-group" }
  | { kind: "add-members" }
  | { kind: "clear" }
  | { kind: "block" }
  | { kind: "leave" }
  | { kind: "remove-member"; member: GroupMember }
  | { kind: "delete-message"; message: DmMessage }
  | { kind: "delete-chat" }
  | { kind: "theme" }
  | { kind: "settings" }
  | { kind: "forward"; message: DmMessage };

function previewOf(msg: DmMessage): string {
  return msg.audioUrl ? "Voice message" : msg.content.slice(0, 140);
}

export default function DmsClient() {
  const { startCall, isBusy, onlineIds } = useCall();
  const { socket, connected } = useDmSocket();
  const { friends, selfId, loading: loadingFriends, error: friendsError, reload: reloadFriends } = useDmFriends();
  const me = useDmIdentity(selfId);
  const { notice, show: showNotice, clear: clearNotice } = useTransientMessage();
  const { selection, openingId, openDm, openGroup, close } = useConversation(showNotice);
  const { groups, loading: loadingGroups, reload: reloadGroups, upsert } = useGroups(socket);
  const recent = useRecentChats();
  const prefs = useChatPrefs();
  const settings = useChatSettings();

  const [panel, setPanel] = useState<PanelKind | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [replyTo, setReplyTo] = useState<DmMessage | null>(null);
  const [editing, setEditing] = useState<DmMessage | null>(null);
  const [jumpRequest, setJumpRequest] = useState<{ id: string; nonce: number } | null>(null);

  // Unsent text per conversation, so switching chats never loses a half-written message.
  const drafts = useDraftStore();

  const conversation = useMemo<Conversation | null>(() => {
    if (!selection) return null;
    if (selection.kind === "dm") {
      const friend = friends.find((f) => f.playerId === selection.playerId);
      return { kind: "dm", roomId: selection.roomId, playerId: selection.playerId, name: friend?.name ?? selection.name };
    }
    const group = groups.find((g) => g.roomId === selection.roomId);
    return group ? { kind: "group", roomId: group.roomId, name: group.name, group } : null;
  }, [selection, friends, groups]);

  const roomId = conversation?.roomId ?? null;
  const isGroup = conversation?.kind === "group";
  const groupInfo = conversation?.kind === "group" ? conversation.group : null;
  const isAdmin = Boolean(groupInfo?.members.some((m) => m.playerId === me.playerId && m.isAdmin));

  // Leave the screen if the open group was deleted or we were removed from it.
  useEffect(() => {
    if (selection?.kind === "group" && !loadingGroups && !groups.some((g) => g.roomId === selection.roomId)) close();
  }, [selection, groups, loadingGroups, close]);

  // Panels, replies and edits belong to one conversation.
  const [panelRoomId, setPanelRoomId] = useState(roomId);
  if (panelRoomId !== roomId) {
    setPanelRoomId(roomId);
    setPanel(null);
    setReplyTo(null);
    setEditing(null);
    setJumpRequest(null);
  }

  const {
    messages,
    pins,
    pending,
    loading: loadingMessages,
    hasMore,
    loadingOlder,
    loadOlder,
    getMessages,
    send,
    retry,
    discard,
    react,
    setPinned,
    edit,
    remove,
  } = useRoomMessages(socket, roomId, me.playerId, showNotice);

  const { typingNames, notifyTyping, stopTyping } = useTyping(socket, roomId, me.playerId);

  // New messages in chats that are not open: bump them up the list, chime, and count them as unread.
  const handleActivity = useCallback(
    (activity: ChatActivity) => {
      if (activity.kind === "dm") recent.touch(activity.senderId);
      const watching = activity.roomId === roomId && document.visibilityState === "visible";
      const chatKey = activity.kind === "dm" ? `dm:${activity.senderId}` : `group:${activity.roomId}`;
      if (!watching && settings.sounds && !isSnoozed(settings) && !prefs.mutedChats.includes(chatKey)) callSounds.playMessage();
    },
    [recent, roomId, settings, prefs.mutedChats],
  );
  const unread = useUnread(socket, roomId, me.playerId, handleActivity);

  const unreadByKey = useMemo(() => {
    const byKey: Record<string, number> = {};
    for (const friend of friends) {
      const count = unread.counts[dmRoomId(me.playerId, friend.playerId)];
      if (count) byKey[`dm:${friend.playerId}`] = count;
    }
    for (const group of groups) {
      const count = unread.counts[group.roomId];
      if (count) byKey[`group:${group.roomId}`] = count;
    }
    return byKey;
  }, [friends, groups, unread.counts, me.playerId]);

  // "Seen": tell the room when we read it, and learn when the other person did.
  const reads = useReadReceipts(socket, roomId, messages[messages.length - 1]?._id ?? "");
  const peerId = conversation?.kind === "dm" ? conversation.playerId : null;
  const peerReadAt = peerId ? (reads[peerId] ?? null) : undefined;

  useEffect(() => {
    if (!socket) return;
    const onError = (message: unknown) => showNotice(typeof message === "string" ? message : "Something went wrong.");
    socket.on("error", onError);
    return () => {
      socket.off("error", onError);
    };
  }, [socket, showNotice]);


  // ------------------------------------------------------------------ actions

  const togglePanel = useCallback((kind: PanelKind) => setPanel((current) => (current === kind ? null : kind)), []);
  const closePanel = useCallback(() => setPanel(null), []);

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

  const handleSelectFriend = useCallback(
    (friend: DmFriend) => {
      recent.touch(friend.playerId);
      void openDm(friend.playerId, friend.name);
    },
    [openDm, recent],
  );

  const handleSelectGroup = useCallback((group: GroupSummary) => openGroup(group.roomId), [openGroup]);

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
      if (!roomId) return;
      try {
        await uploadVoiceMessage(roomId, blob);
      } catch {
        showNotice("Failed to send the voice message. Please try again.");
      }
    },
    [roomId, showNotice],
  );

  const handleDraftChange = useCallback(
    (text: string) => {
      if (roomId) drafts.set(roomId, text);
    },
    [roomId, drafts],
  );

  const startReply = useCallback((msg: DmMessage) => {
    setEditing(null);
    setReplyTo(msg);
  }, []);

  const startEdit = useCallback((msg: DmMessage) => {
    setReplyTo(null);
    setEditing(msg);
  }, []);

  const togglePin = useCallback((msg: DmMessage) => setPinned(msg._id, !msg.pinned), [setPinned]);

  const starredList = roomId ? (prefs.starred[roomId] ?? NO_STARRED) : NO_STARRED;
  const starredIds = useMemo(() => new Set(starredList.map((s) => s.id)), [starredList]);
  const toggleStar = useCallback(
    (msg: DmMessage) => {
      if (!roomId) return;
      prefs.toggleStar(roomId, { id: msg._id, senderName: msg.senderName ?? "Unknown", content: previewOf(msg), at: msg.createdAt });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomId, prefs.toggleStar],
  );

  // ------------------------------------------------------------------- dialogs

  const closeDialog = useCallback(() => setDialog(null), []);

  const submitCreateGroup = async ({ name, memberIds }: { name: string; memberIds: string[] }) => {
    const group = await createGroup(name, memberIds);
    upsert(group);
    openGroup(group.roomId);
    setDialog(null);
  };

  const submitAddMembers = async ({ memberIds }: { memberIds: string[] }) => {
    if (!roomId) return;
    await addGroupMembers(roomId, memberIds);
    await reloadGroups();
    setDialog(null);
  };

  const confirmLeave = async () => {
    if (!roomId) return;
    try {
      await removeGroupMember(roomId, me.playerId);
      close();
      await reloadGroups();
    } catch {
      showNotice("Couldn't leave the group. Please try again.");
    }
    setDialog(null);
  };

  const confirmRemoveMember = async (member: GroupMember) => {
    if (!roomId) return;
    try {
      await removeGroupMember(roomId, member.playerId);
      await reloadGroups();
      showNotice(`${member.name} was removed from the group.`, "info");
    } catch {
      showNotice("Couldn't remove that member.");
    }
    setDialog(null);
  };

  const confirmBlock = async () => {
    if (conversation?.kind !== "dm") return;
    try {
      await blockPlayer(conversation.playerId);
      close();
      await reloadFriends();
      showNotice(`Blocked ${conversation.name}.`, "info");
    } catch {
      showNotice("Couldn't block this player. Please try again.");
    }
    setDialog(null);
  };

  const renameCurrentGroup = async (name: string) => {
    if (!roomId) return;
    try {
      await renameGroup(roomId, name);
      await reloadGroups();
    } catch {
      showNotice("Couldn't rename the group.");
    }
  };

  const forwardMessage = (target: ForwardTarget) => {
    if (dialog?.kind !== "forward" || !socket) return;
    const targetRoom = target.kind === "dm" ? dmRoomId(me.playerId, target.friend.playerId) : target.group.roomId;
    const targetName = target.kind === "dm" ? target.friend.name : target.group.name;
    socket.emit("send_message", { roomId: targetRoom, content: `Forwarded:\n${dialog.message.content}`.slice(0, 2000) });
    showNotice(`Forwarded to ${targetName}.`, "info");
    setDialog(null);
  };

  const exportCurrent = () => {
    if (!conversation) return;
    const count = exportChat(conversation.name, messages);
    showNotice(`Exported ${count} message${count === 1 ? "" : "s"}. Load earlier messages first to include older ones.`, "info");
  };

  // ------------------------------------------------------------------- render

  const eventsForRoom = NO_EVENTS;
  const addCandidates = groupInfo ? friends.filter((f) => !groupInfo.members.some((m) => m.playerId === f.playerId)) : [];
  const key = conversation ? conversationKey(conversation) : null;
  const themeSetting = roomId ? prefs.themes[roomId] : undefined;
  const mentionNames = useMemo(
    () => (groupInfo ? groupInfo.members.filter((m) => m.playerId !== me.playerId).map((m) => m.name) : NO_NAMES),
    [groupInfo, me.playerId],
  );

  return (
    <div className="absolute inset-0 flex overflow-hidden bg-background">
      <ConversationList
        friends={friends}
        groups={groups}
        recentIds={recent.ids}
        pinnedKeys={prefs.pinnedChats}
        unread={unreadByKey}
        onlineIds={onlineIds}
        banner={<NotificationPrompt />}
        onOpenSettings={() => setDialog({ kind: "settings" })}
        mutedKeys={prefs.mutedChats}
        archivedKeys={prefs.archivedChats}
        onToggleMute={prefs.toggleMute}
        onToggleArchive={prefs.toggleArchive}
        loading={loadingFriends || loadingGroups}
        error={friendsError}
        activeKey={key}
        openingId={openingId}
        onSelectFriend={handleSelectFriend}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={() => setDialog({ kind: "create-group" })}
        onTogglePin={prefs.togglePinChat}
        onRetry={reloadFriends}
        className={cn("w-full shrink-0 border-r border-border md:w-80 lg:w-[22rem]", conversation ? "hidden md:flex" : "flex")}
      />

      <section className={cn("relative min-w-0 flex-1 flex flex-col", conversation ? "flex" : "hidden md:flex")}>
        {conversation && roomId ? (
          <>
            <div className="flex min-w-0 flex-1 flex-col" style={chatContainerStyle(themeSetting, settings.fontSize)}>
              <ConversationHeader
                conversation={conversation}
                pinsCount={pins.length}
                panel={panel}
                chatPinned={prefs.pinnedChats.includes(conversationKey(conversation))}
                chatMuted={prefs.mutedChats.includes(conversationKey(conversation))}
                chatArchived={prefs.archivedChats.includes(conversationKey(conversation))}
                callBusy={isBusy}
                online={conversation.kind === "dm" && onlineIds.has(conversation.playerId)}
                onlineCount={
                  conversation.kind === "group"
                    ? conversation.group.members.filter((m) => onlineIds.has(m.playerId)).length
                    : 0
                }
                onBack={close}
                onVoiceCall={() => conversation.kind === "dm" && startCall(conversation.playerId, false, conversation.name)}
                onVideoCall={() => conversation.kind === "dm" && startCall(conversation.playerId, true, conversation.name)}
                onTogglePanel={togglePanel}
                onTogglePinChat={() => prefs.togglePinChat(conversationKey(conversation))}
                onToggleMute={() => prefs.toggleMute(conversationKey(conversation))}
                onToggleArchive={() => prefs.toggleArchive(conversationKey(conversation))}
                onOpenTheme={() => setDialog({ kind: "theme" })}
                onExport={exportCurrent}
                onClearChat={() => setDialog({ kind: "clear" })}
                onDeleteChat={() => setDialog({ kind: "delete-chat" })}
                onBlock={() => setDialog({ kind: "block" })}
                onLeave={() => setDialog({ kind: "leave" })}
              />

              {!connected && (
                <div
                  role="status"
                  className="flex items-center justify-center gap-2 bg-amber-500/10 px-4 py-1.5 text-[12px] font-medium text-amber-600 dark:text-amber-400"
                >
                  <WifiOff size={13} /> Reconnecting... messages can&apos;t be sent right now.
                </div>
              )}

              <PinnedBar pins={pins} onJump={(id) => void jumpTo(id)} onOpenAll={() => setPanel("pins")} />

              <MessageList
                messages={messages}
                pending={pending}
                events={eventsForRoom}
                loading={loadingMessages}
                hasMore={hasMore}
                loadingOlder={loadingOlder}
                myId={me.playerId}
                myName={me.name}
                peerReadAt={peerReadAt}
                wallpaper={wallpaperStyle(themeSetting)}
                starredIds={starredIds}
                onToggleStar={toggleStar}
                onForward={(msg) => setDialog({ kind: "forward", message: msg })}
                peerName={conversation.name}
                roomId={roomId}
                isGroup={isGroup}
                canModerate={isAdmin}
                clearedAt={prefs.clearedAt[roomId]}
                hidden={prefs.hidden[roomId] ?? NO_HIDDEN}
                jumpRequest={jumpRequest}
                onLoadOlder={() => void loadOlder()}
                onReply={startReply}
                onReact={react}
                onTogglePin={togglePin}
                onEdit={startEdit}
                onDeleteForMe={(msg) => prefs.hideMessage(roomId, msg._id)}
                onDeleteForAll={(msg) => setDialog({ kind: "delete-message", message: msg })}
                onJump={(id) => void jumpTo(id)}
                onRetry={retry}
                onDiscard={discard}
              />

              <div className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 sm:px-6 sm:pb-4">
                <div className="mx-auto w-full max-w-3xl">
                  <TypingIndicator names={typingNames} />
                  <Composer
                    key={roomId}
                    placeholder={conversation.kind === "group" ? `Message ${conversation.name}` : `Message ${conversation.name}`}
                    disabled={!connected}
                    mentionCandidates={mentionNames}
                    onTyping={notifyTyping}
                    enterToSend={settings.enterToSend}
                    initialText={drafts.get(roomId)}
                    reply={
                      replyTo
                        ? { messageId: replyTo._id, senderName: replyTo.senderName ?? "Unknown", preview: previewOf(replyTo) }
                        : null
                    }
                    editing={editing ? { id: editing._id, content: editing.content } : null}
                    onDraftChange={handleDraftChange}
                    onSend={handleSend}
                    onSaveEdit={handleSaveEdit}
                    onCancelReply={() => setReplyTo(null)}
                    onCancelEdit={() => setEditing(null)}
                    onSendVoice={handleSendVoice}
                    onError={showNotice}
                  />
                </div>
              </div>
            </div>

            {panel === "search" && <SearchPanel roomId={roomId} onJump={(id) => void jumpTo(id)} onClose={closePanel} />}
            {panel === "pins" && (
              <PinsPanel
                pins={pins}
                onJump={(id) => void jumpTo(id)}
                onUnpin={(id) => setPinned(id, false)}
                onClose={closePanel}
              />
            )}
            {panel === "links" && <LinksPanel messages={messages} onJump={(id) => void jumpTo(id)} onClose={closePanel} />}
            {panel === "starred" && (
              <StarredPanel
                starred={starredList}
                onJump={(id) => void jumpTo(id)}
                onUnstar={(id) => {
                  const item = starredList.find((s) => s.id === id);
                  if (item && roomId) prefs.toggleStar(roomId, item);
                }}
                onClose={closePanel}
              />
            )}
            {panel === "info" && groupInfo && (
              <GroupInfoPanel
                group={groupInfo}
                myId={me.playerId}
                onRename={renameCurrentGroup}
                onRequestAdd={() => setDialog({ kind: "add-members" })}
                onRequestRemove={(member) => setDialog({ kind: "remove-member", member })}
                onRequestLeave={() => setDialog({ kind: "leave" })}
                onClose={closePanel}
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-1 items-center justify-center">
            <EmptyState
              icon={MessageCircle}
              title="Select a conversation"
              description="Pick a friend or group from the list, start a new group, or press Ctrl K to search."
            />
          </div>
        )}
      </section>

      {dialog?.kind === "create-group" && (
        <GroupPickerDialog
          mode="create"
          friends={friends}
          maxSelect={MAX_GROUP_MEMBERS - 1}
          onSubmit={submitCreateGroup}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === "add-members" && groupInfo && (
        <GroupPickerDialog
          mode="add"
          friends={addCandidates}
          maxSelect={Math.max(0, MAX_GROUP_MEMBERS - groupInfo.members.length)}
          onSubmit={submitAddMembers}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === "clear" && conversation && (
        <ConfirmDialog
          title="Clear chat for you?"
          message="This hides the current messages on this device only. Other people still see them, and new messages will appear as usual."
          confirmLabel="Clear chat"
          danger
          onConfirm={() => {
            prefs.clearChat(conversation.roomId);
            setDialog(null);
          }}
          onCancel={closeDialog}
        />
      )}
      {dialog?.kind === "block" && conversation?.kind === "dm" && (
        <ConfirmDialog
          title={`Block ${conversation.name}?`}
          message="You will no longer be able to message or call each other, and they will be removed from your friends."
          confirmLabel="Block"
          danger
          onConfirm={confirmBlock}
          onCancel={closeDialog}
        />
      )}
      {dialog?.kind === "leave" && groupInfo && (
        <ConfirmDialog
          title={`Leave ${groupInfo.name}?`}
          message="You will stop receiving messages from this group. Someone will need to add you back to rejoin."
          confirmLabel="Leave group"
          danger
          onConfirm={confirmLeave}
          onCancel={closeDialog}
        />
      )}
      {dialog?.kind === "remove-member" && groupInfo && (
        <ConfirmDialog
          title={`Remove ${dialog.member.name}?`}
          message="They will no longer see new messages in this group."
          confirmLabel="Remove"
          danger
          onConfirm={() => confirmRemoveMember(dialog.member)}
          onCancel={closeDialog}
        />
      )}
      {dialog?.kind === "delete-message" && (
        <ConfirmDialog
          title="Delete for everyone?"
          message="This message will be removed for everyone in the conversation. This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await remove(dialog.message._id);
            setDialog(null);
          }}
          onCancel={closeDialog}
        />
      )}

      {dialog?.kind === "settings" && <ChatSettingsDialog onClose={closeDialog} />}
      {dialog?.kind === "theme" && conversation && (
        <ThemeDialog
          value={themeSetting ?? DEFAULT_THEME}
          onChange={(setting) => prefs.setTheme(conversation.roomId, setting)}
          onReset={() => prefs.setTheme(conversation.roomId, null)}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === "forward" && (
        <ForwardDialog
          preview={previewOf(dialog.message)}
          friends={friends}
          groups={groups}
          onForward={forwardMessage}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === "delete-chat" && conversation && (
        <ConfirmDialog
          title="Delete this chat?"
          message={
            conversation.kind === "dm"
              ? `This clears the messages on this device and removes the chat from your pinned and archived lists. ${conversation.name} stays your friend and can message you again.`
              : "This clears the messages on this device and removes the chat from your pinned and archived lists. You stay in the group; use Leave group to exit it."
          }
          confirmLabel="Delete chat"
          danger
          onConfirm={() => {
            prefs.deleteChat(conversation.roomId, conversationKey(conversation));
            if (conversation.kind === "dm") recent.forget(conversation.playerId);
            setDialog(null);
            close();
          }}
          onCancel={closeDialog}
        />
      )}

      {notice && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-4">
          <InlineNotice message={notice.text} tone={notice.tone} onDismiss={clearNotice} />
        </div>
      )}
    </div>
  );
}
