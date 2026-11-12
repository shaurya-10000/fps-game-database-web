"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, UserPlus } from "lucide-react";
import { useCall } from "@/app/dashboard/chat/CallContext";
import { useTransientMessage } from "@/app/dashboard/dms/DmsClient/hooks/useTransientMessage";
import ConfirmDialog from "@/app/dashboard/dms/DmsClient/ui/ConfirmDialog";
import InlineNotice from "@/app/dashboard/dms/DmsClient/ui/InlineNotice";
import { api } from "@/lib/api";
import AddFriendPanel from "./AddFriendPanel";
import BlockedPanel from "./BlockedPanel";
import FriendsList from "./FriendsList";
import FriendsSkeleton from "./FriendsSkeleton";
import FriendsTabs from "./FriendsTabs";
import RequestsPanel from "./RequestsPanel";
import type { Friend, Relation, TabId } from "./types";
import { useFavorites } from "./useFavorites";
import { useFriendsData } from "./useFriendsData";
import { usePlayerSearch } from "./usePlayerSearch";

type Dialog = { kind: "unfriend"; friend: Friend } | { kind: "block"; friend: Friend };

export default function FriendsClient() {
  const router = useRouter();
  const { startCall, isBusy, onlineIds } = useCall();
  const { notice, show: showNotice, clear: clearNotice } = useTransientMessage();
  const data = useFriendsData(showNotice);
  const favorites = useFavorites();

  const [tab, setTab] = useState<TabId>("friends");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [query, setQuery] = useState("");
  const search = usePlayerSearch(tab === "add" ? query : "");
  const [username, setUsername] = useState("");

  useEffect(() => {
    api<{ username?: string }>("/api/me/profile")
      .then((res) => setUsername(res.username ?? ""))
      .catch(() => undefined);
  }, []);

  const friendIds = useMemo(() => new Set(data.friends.map((f) => f.playerId)), [data.friends]);
  const incomingIds = useMemo(() => new Set(data.incoming.map((r) => r.playerId)), [data.incoming]);
  const outgoingIds = useMemo(() => new Set(data.outgoing.map((r) => r.playerId)), [data.outgoing]);
  const blockedIds = useMemo(() => new Set(data.blocked.map((b) => b.playerId)), [data.blocked]);

  const relationOf = (playerId: string): Relation =>
    blockedIds.has(playerId)
      ? "blocked"
      : friendIds.has(playerId)
        ? "friend"
        : incomingIds.has(playerId)
          ? "incoming"
          : outgoingIds.has(playerId)
            ? "outgoing"
            : "none";

  const openDm = (playerId: string) => router.push(`/dashboard/dms?dm=${encodeURIComponent(playerId)}`);

  const copyId = async (friend: Friend) => {
    try {
      await navigator.clipboard.writeText(friend.playerId);
      showNotice("Player ID copied.", "info");
    } catch {
      showNotice("Couldn't copy to the clipboard.");
    }
  };

  if (data.loading) return <FriendsSkeleton />;

  const onlineCount = data.friends.filter((f) => onlineIds.has(f.playerId)).length;
  const subtitle =
    data.friends.length === 0
      ? "Find players and build your squad."
      : `${data.friends.length} friend${data.friends.length === 1 ? "" : "s"} - ${onlineCount} online`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Social</div>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">Friends</h1>
          <p className="mt-1 text-[14px] text-muted">{subtitle}</p>
        </div>
        {tab !== "add" && (
          <button
            type="button"
            onClick={() => setTab("add")}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
          >
            <UserPlus size={15} /> Add friend
          </button>
        )}
        </header>

      {data.error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-600 dark:text-amber-400"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            {data.error}
          </span>
          <button
            type="button"
            onClick={() => void data.reload()}
            className="rounded-lg border border-amber-500/40 px-3 py-1 text-[12px] font-semibold transition-colors hover:bg-amber-500/10"
          >
            Retry
          </button>
        </div>
      )}

      <FriendsTabs
        value={tab}
        onChange={setTab}
        friendsCount={data.friends.length}
        requestsCount={data.incoming.length}
        blockedCount={data.blocked.length}
      />

      <div role="tabpanel" id={`friends-panel-${tab}`} aria-labelledby={`friends-tab-${tab}`} className="min-h-[400px] w-full rounded-2xl border border-border bg-surface/30 p-6 sm:p-8">
        {tab === "friends" && (
          <FriendsList
            friends={data.friends}
            onlineIds={onlineIds}
            favoriteIds={favorites.ids}
            mutedIds={data.muted}
            callBusy={isBusy}
            onMessage={(friend) => openDm(friend.playerId)}
            onCall={(friend, video) => startCall(friend.playerId, video, friend.name)}
            onToggleFavorite={(friend) => favorites.toggle(friend.playerId)}
            onToggleMute={(friend) => void (data.muted.includes(friend.playerId) ? data.unmute(friend) : data.mute(friend))}
            onCopyId={(friend) => void copyId(friend)}
            onUnfriend={(friend) => setDialog({ kind: "unfriend", friend })}
            onBlock={(friend) => setDialog({ kind: "block", friend })}
            onAddFriend={() => setTab("add")}
          />
        )}

        {tab === "requests" && (
          <RequestsPanel
            incoming={data.incoming}
            outgoing={data.outgoing}
            onAccept={(request) => void data.accept(request)}
            onDecline={(request) => void data.decline(request)}
            onCancel={(request) => void data.cancel(request)}
          />
        )}

        {tab === "add" && (
          <AddFriendPanel
            username={username}
            query={query}
            trimmed={search.trimmed}
            results={search.results}
            state={search.state}
            relationOf={relationOf}
            onQueryChange={setQuery}
            onAdd={(playerId, name) => void data.addFriend(playerId, name)}
            onAcceptFrom={(playerId) => {
              const request = data.incoming.find((r) => r.playerId === playerId);
              if (request) void data.accept(request);
            }}
            onCancelTo={(playerId) => {
              const request = data.outgoing.find((r) => r.playerId === playerId);
              if (request) void data.cancel(request);
            }}
            onMessage={openDm}
            onUnblock={(playerId) => {
              const player = data.blocked.find((b) => b.playerId === playerId);
              if (player) void data.unblock(player);
            }}
          />
        )}

        {tab === "blocked" && <BlockedPanel blocked={data.blocked} onUnblock={(player) => void data.unblock(player)} />}
      </div>

      {dialog?.kind === "unfriend" && (
        <ConfirmDialog
          title={`Remove ${dialog.friend.name}?`}
          message="You'll no longer be friends. You can send a new request later, and your message history stays."
          confirmLabel="Remove friend"
          danger
          onConfirm={async () => {
            await data.removeFriend(dialog.friend);
            setDialog(null);
          }}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "block" && (
        <ConfirmDialog
          title={`Block ${dialog.friend.name}?`}
          message="They'll be removed from your friends and won't be able to message you, call you, or send requests. You can unblock them any time from the Blocked tab."
          confirmLabel="Block"
          danger
          onConfirm={async () => {
            await data.block(dialog.friend.playerId, dialog.friend.name);
            setDialog(null);
          }}
          onCancel={() => setDialog(null)}
        />
      )}

      {notice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <InlineNotice message={notice.text} tone={notice.tone} onDismiss={clearNotice} />
        </div>
      )}
    </div>
  );
}





