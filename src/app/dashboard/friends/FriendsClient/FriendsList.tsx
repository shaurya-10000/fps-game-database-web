"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import EmptyState from "@/app/dashboard/dms/DmsClient/ui/EmptyState";
import FriendRow from "./FriendRow";
import type { Friend } from "./types";

interface FriendsListProps {
  friends: Friend[];
  onlineIds: ReadonlySet<string>;
  favoriteIds: string[];
  mutedIds: string[];
  callBusy: boolean;
  onMessage: (friend: Friend) => void;
  onCall: (friend: Friend, video: boolean) => void;
  onToggleFavorite: (friend: Friend) => void;
  onToggleMute: (friend: Friend) => void;
  onCopyId: (friend: Friend) => void;
  onUnfriend: (friend: Friend) => void;
  onBlock: (friend: Friend) => void;
  onAddFriend: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="px-1 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted first:pt-0">{children}</h3>;
}

export default function FriendsList({
  friends,
  onlineIds,
  favoriteIds,
  mutedIds,
  callBusy,
  onMessage,
  onCall,
  onToggleFavorite,
  onToggleMute,
  onCopyId,
  onUnfriend,
  onBlock,
  onAddFriend,
}: FriendsListProps) {
  const [query, setQuery] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);

  const { favorites, online, offline, total } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = friends.filter((f) => (!q || f.name.toLowerCase().includes(q)) && (!onlineOnly || onlineIds.has(f.playerId)));
    const isFavorite = (f: Friend) => favoriteIds.includes(f.playerId);
    const favoriteList = matches.filter(isFavorite);
    const rest = matches.filter((f) => !isFavorite(f));
    return {
      favorites: favoriteList,
      online: rest.filter((f) => onlineIds.has(f.playerId)),
      offline: rest.filter((f) => !onlineIds.has(f.playerId)),
      total: matches.length,
    };
  }, [friends, query, onlineOnly, onlineIds, favoriteIds]);

  const onlineCount = friends.filter((f) => onlineIds.has(f.playerId)).length;

  const renderRow = (friend: Friend) => (
    <FriendRow
      key={friend.rowId}
      friend={friend}
      online={onlineIds.has(friend.playerId)}
      favorite={favoriteIds.includes(friend.playerId)}
      muted={mutedIds.includes(friend.playerId)}
      callBusy={callBusy}
      onMessage={() => onMessage(friend)}
      onCall={(video) => onCall(friend, video)}
      onToggleFavorite={() => onToggleFavorite(friend)}
      onToggleMute={() => onToggleMute(friend)}
      onCopyId={() => onCopyId(friend)}
      onUnfriend={() => onUnfriend(friend)}
      onBlock={() => onBlock(friend)}
    />
  );

  if (friends.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No friends yet"
        description="Add friends to message them, call them, and see when they're online."
        action={
          <button
            type="button"
            onClick={onAddFriend}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
          >
            <UserPlus size={15} /> Find friends
          </button>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <span className="sr-only">Search your friends</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your friends"
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-9 pr-4 text-base text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 sm:text-[14px]"
          />
        </label>
        <div role="group" aria-label="Filter friends" className="flex gap-1 rounded-full border border-border bg-surface p-1">
          {[
            { id: false, label: `All (${friends.length})` },
            { id: true, label: `Online (${onlineCount})` },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={onlineOnly === option.id}
              onClick={() => setOnlineOnly(option.id)}
              className={cn(
                "flex-1 rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors sm:flex-none",
                onlineOnly === option.id ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-[13px] text-muted">
          {onlineOnly && !query ? "None of your friends are online right now." : "No friends match your search."}
        </p>
      ) : (
        <div>
          {favorites.length > 0 && (
            <>
              <SectionLabel>Favorites</SectionLabel>
              <ul className="space-y-2">{favorites.map(renderRow)}</ul>
            </>
          )}
          {online.length > 0 && (
            <>
              <SectionLabel>Online - {online.length}</SectionLabel>
              <ul className="space-y-2">{online.map(renderRow)}</ul>
            </>
          )}
          {offline.length > 0 && (
            <>
              <SectionLabel>Offline - {offline.length}</SectionLabel>
              <ul className="space-y-2">{offline.map(renderRow)}</ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

