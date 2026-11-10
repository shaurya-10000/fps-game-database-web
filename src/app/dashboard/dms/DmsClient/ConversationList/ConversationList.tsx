"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Bell, BellOff, ChevronDown, LoaderCircle, Menu, Pin, PinOff, Search, Settings, Users } from "lucide-react";
import { requestOpenSidebar } from "@/app/dashboard/DashboardShell/sidebar-events";
import { ChatAvatar } from "@/app/dashboard/chat/chat-shared";
import { cn } from "@/lib/utils";
import type { DmFriend, GroupSummary } from "../types";
import DropdownMenu from "../ui/DropdownMenu";
import EmptyState from "../ui/EmptyState";
import GroupAvatar from "../ui/GroupAvatar";

type Entry =
  | { key: string; kind: "dm"; friend: DmFriend }
  | { key: string; kind: "group"; group: GroupSummary };

interface ConversationListProps {
  friends: DmFriend[];
  groups: GroupSummary[];
  /** Player ids, most recently opened first. */
  recentIds: string[];
  pinnedKeys: string[];
  /** Unread message counts keyed like `dm:<playerId>` / `group:<roomId>`. */
  unread: Record<string, number>;
  onOpenSettings: () => void;
  /** Friends who are online right now. */
  onlineIds: ReadonlySet<string>;
  /** Optional content under the header (for example the notifications prompt). */
  banner?: React.ReactNode;
  mutedKeys: string[];
  archivedKeys: string[];
  onToggleMute: (key: string) => void;
  onToggleArchive: (key: string) => void;
  loading: boolean;
  error: string | null;
  activeKey: string | null;
  openingId: string | null;
  onSelectFriend: (friend: DmFriend) => void;
  onSelectGroup: (group: GroupSummary) => void;
  onCreateGroup: () => void;
  onTogglePin: (key: string) => void;
  onRetry: () => void;
  className?: string;
}

interface RowProps {
  entry: Entry;
  active: boolean;
  opening: boolean;
  pinned: boolean;
  unread: number;
  online: boolean;
  muted: boolean;
  archived: boolean;
  onSelect: (entry: Entry) => void;
  onTogglePin: (key: string) => void;
  onToggleMute: (key: string) => void;
  onToggleArchive: (key: string) => void;
}

function ChatRow({ entry, active, opening, pinned, unread, online, muted, archived, onSelect, onTogglePin, onToggleMute, onToggleArchive }: RowProps) {
  const name = entry.kind === "dm" ? entry.friend.name : entry.group.name;
  const subtitle = entry.kind === "group" ? `${entry.group.members.length} members` : null;

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={() => onSelect(entry)}
        disabled={opening}
        aria-current={active ? "true" : undefined}
        className={cn(
          "relative flex w-full items-center gap-3 rounded-xl py-2.5 pl-3 pr-11 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-70",
          active ? "bg-accent/10 text-foreground" : "text-foreground/80 hover:bg-foreground/[0.05] hover:text-foreground",
        )}
      >
        {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />}
        <span className="relative shrink-0">
          {entry.kind === "dm" ? <ChatAvatar name={name} size={40} /> : <GroupAvatar name={name} size={40} />}
          {online && (
            <span
              aria-label="Online"
              className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-emerald-500"
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[14px]", unread > 0 ? "font-semibold text-foreground" : "font-medium")}>{name}</span>
          {subtitle && <span className="block truncate text-[12px] text-muted">{subtitle}</span>}
        </span>
        {unread > 0 && (
          <span
            aria-label={`${unread} unread`}
            className={cn(
              "min-w-5 shrink-0 rounded-full px-1.5 text-center text-[11px] font-bold leading-5",
              muted ? "bg-foreground/20 text-foreground" : "bg-accent text-background",
            )}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
        {pinned && <Pin size={13} className="shrink-0 text-muted" aria-label="Pinned" />}
        {muted && <BellOff size={13} className="shrink-0 text-muted" aria-label="Muted" />}
        {opening && <LoaderCircle size={16} className="shrink-0 animate-spin text-muted" />}
      </button>
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
        <DropdownMenu
          label={`Options for ${name}`}
          items={[
            {
              id: "pin",
              label: pinned ? "Unpin chat" : "Pin chat",
              icon: pinned ? PinOff : Pin,
              onSelect: () => onTogglePin(entry.key),
            },
            {
              id: "mute",
              label: muted ? "Unmute notifications" : "Mute notifications",
              icon: muted ? Bell : BellOff,
              onSelect: () => onToggleMute(entry.key),
            },
            {
              id: "archive",
              label: archived ? "Unarchive chat" : "Archive chat",
              icon: archived ? ArchiveRestore : Archive,
              onSelect: () => onToggleArchive(entry.key),
            },
          ]}
        />
      </div>
    </li>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{children}</h3>
  );
}

export default function ConversationList({
  friends,
  groups,
  recentIds,
  pinnedKeys,
  unread,
  onOpenSettings,
  onlineIds,
  banner,
  mutedKeys,
  archivedKeys,
  onToggleMute,
  onToggleArchive,
  loading,
  error,
  activeKey,
  openingId,
  onSelectFriend,
  onSelectGroup,
  onCreateGroup,
  onTogglePin,
  onRetry,
  className,
}: ConversationListProps) {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl/Cmd+K jumps to search from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const searching = query.trim().length > 0;

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all: Entry[] = [
      ...groups.map((group): Entry => ({ key: `group:${group.roomId}`, kind: "group", group })),
      ...friends.map((friend): Entry => ({ key: `dm:${friend.playerId}`, kind: "dm", friend })),
    ].filter((entry) => {
      if (!q) return true;
      if (entry.kind === "dm") return entry.friend.name.toLowerCase().includes(q);
      return (
        entry.group.name.toLowerCase().includes(q) ||
        entry.group.members.some((m) => m.name.toLowerCase().includes(q))
      );
    });

    if (q) return { results: all, archived: [], pinned: [], groupsRest: [], recent: [], others: [] };

    const pinned = pinnedKeys
      .map((key) => all.find((e) => e.key === key))
      .filter((e): e is Entry => Boolean(e) && !archivedKeys.includes(e?.key ?? ""));
    const pinnedSet = new Set(pinned.map((e) => e.key));
    const rest = all.filter((e) => !pinnedSet.has(e.key) && !archivedKeys.includes(e.key));
    const rank = new Map(recentIds.map((id, i) => [id, i]));
    const dms = rest.filter((e): e is Extract<Entry, { kind: "dm" }> => e.kind === "dm");

    return {
      results: [],
      archived: all.filter((e) => archivedKeys.includes(e.key)),
      pinned,
      groupsRest: rest.filter((e) => e.kind === "group"),
      recent: dms
        .filter((e) => rank.has(e.friend.playerId))
        .sort((a, b) => (rank.get(a.friend.playerId) ?? 0) - (rank.get(b.friend.playerId) ?? 0)),
      others: dms.filter((e) => !rank.has(e.friend.playerId)),
    };
  }, [friends, groups, recentIds, pinnedKeys, archivedKeys, query]);

  const total =
    sections.results.length +
    sections.pinned.length +
    sections.groupsRest.length +
    sections.recent.length +
    sections.others.length +
    sections.archived.length;

  const select = (entry: Entry) => (entry.kind === "dm" ? onSelectFriend(entry.friend) : onSelectGroup(entry.group));

  const renderList = (entries: Entry[]) => (
    <ul className="space-y-0.5">
      {entries.map((entry) => (
        <ChatRow
          key={entry.key}
          entry={entry}
          active={entry.key === activeKey}
          opening={entry.kind === "dm" && entry.friend.playerId === openingId}
          pinned={pinnedKeys.includes(entry.key)}
          unread={unread[entry.key] ?? 0}
          online={entry.kind === "dm" && onlineIds.has(entry.friend.playerId)}
          muted={mutedKeys.includes(entry.key)}
          archived={archivedKeys.includes(entry.key)}
          onToggleMute={onToggleMute}
          onToggleArchive={onToggleArchive}
          onSelect={select}
          onTogglePin={onTogglePin}
        />
      ))}
    </ul>
  );

  const section = (label: string, entries: Entry[]) =>
    entries.length > 0 ? (
      <>
        <SectionLabel>{label}</SectionLabel>
        {renderList(entries)}
      </>
    ) : null;

  const nothing = friends.length === 0 && groups.length === 0;

  return (
    <aside className={cn("flex-col bg-surface/40", className)} aria-label="Conversations">
      <div className="space-y-3 border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestOpenSidebar}
              aria-label="Open navigation"
              className="-ml-1.5 flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/[0.07] hover:text-foreground lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Messages</h2>
          </div>
          <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Chat settings"
            title="Chat settings"
            className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/[0.07] hover:text-foreground"
          >
            <Settings size={16} />
          </button>
          <button
            type="button"
            onClick={onCreateGroup}
            disabled={friends.length === 0}
            title={friends.length === 0 ? "Add a friend first to start a group" : "Create a group chat"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1.5 text-[12px] font-semibold text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Users size={14} />
            New group
          </button>
          </div>
        </div>
        <label className="relative block">
          <span className="sr-only">Search chats</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Search chats"
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-12 text-base text-foreground sm:text-[13px] placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted md:block">
            Ctrl K
          </kbd>
        </label>
      </div>

      {banner}

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && (
          <ul className="space-y-1" aria-label="Loading conversations">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <div className="size-10 animate-pulse rounded-full bg-foreground/10" />
                <div className="h-3 w-28 animate-pulse rounded bg-foreground/10" />
              </li>
            ))}
          </ul>
        )}

        {!loading && error && (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px] text-muted">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-foreground/5"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && nothing && (
          <EmptyState
            icon={Users}
            title="No friends yet"
            description="Add players as friends to start messaging, calling and creating group chats."
            action={
              <Link
                href="/dashboard/friends"
                className="inline-flex rounded-lg bg-foreground px-3.5 py-2 text-[12px] font-semibold text-background transition-opacity hover:opacity-90"
              >
                Find players
              </Link>
            }
          />
        )}

        {!loading && !error && !nothing && total === 0 && (
          <p className="px-4 py-10 text-center text-[13px] text-muted">No chats match &quot;{query.trim()}&quot;.</p>
        )}

        {!loading && !error && total > 0 && (
          <>
            {searching ? (
              renderList(sections.results)
            ) : (
              <>
                {section("Pinned", sections.pinned)}
                {section("Groups", sections.groupsRest)}
                {section("Recent", sections.recent)}
                {section(sections.recent.length > 0 || sections.groupsRest.length > 0 || sections.pinned.length > 0 ? "All friends" : "Friends", sections.others)}
                {sections.archived.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowArchived((v) => !v)}
                      aria-expanded={showArchived}
                      className="mt-2 flex w-full items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted transition-colors hover:text-foreground"
                    >
                      <Archive size={13} />
                      Archived ({sections.archived.length})
                      <ChevronDown size={13} className={cn("ml-auto transition-transform", showArchived && "rotate-180")} />
                    </button>
                    {showArchived && renderList(sections.archived)}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}