"use client";

import { useMemo, useState } from "react";
import { Check, LoaderCircle, Search, X } from "lucide-react";
import { ChatAvatar } from "@/app/dashboard/chat/chat-shared";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { DmFriend } from "../types";
import Modal from "../ui/Modal";

const NAME_MAX = 50;

interface GroupPickerDialogProps {
  mode: "create" | "add";
  /** Friends that can be picked (already-added members are left out). */
  friends: DmFriend[];
  maxSelect: number;
  onSubmit: (input: { name: string; memberIds: string[] }) => Promise<void>;
  onClose: () => void;
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "NOT_FRIENDS") return "You can only add people who are your friends.";
    if (err.code === "GROUP_FULL") return "That would exceed the 50 member limit.";
    if (err.code === "INVALID_PAYLOAD") return "Check the name and members, then try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function GroupPickerDialog({ mode, friends, maxSelect, onSubmit, onClose }: GroupPickerDialogProps) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creating = mode === "create";
  const trimmedName = name.trim();
  const canSubmit = selected.length > 0 && (!creating || trimmedName.length > 0) && !busy;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? friends.filter((f) => f.name.toLowerCase().includes(q)) : friends;
  }, [friends, query]);

  const byId = useMemo(() => new Map(friends.map((f) => [f.playerId, f])), [friends]);

  const toggle = (playerId: string) => {
    setError(null);
    setSelected((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId);
      return prev.length >= maxSelect ? prev : [...prev, playerId];
    });
  };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ name: trimmedName, memberIds: selected });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={creating ? "New group chat" : "Add people"}
      description={creating ? "Name your group and pick friends to invite." : "Pick friends to add to this group."}
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <LoaderCircle size={14} className="animate-spin" />}
            {creating ? `Create group${selected.length > 0 ? ` (${selected.length})` : ""}` : `Add${selected.length > 0 ? ` (${selected.length})` : ""}`}
          </button>
        </>
      }
    >
      <div className="space-y-4 px-6 py-5">
        {creating && (
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-foreground">
              Group name
              <span className="font-mono text-[11px] font-normal text-muted">
                {trimmedName.length}/{NAME_MAX}
              </span>
            </span>
            <input
              autoFocus
              value={name}
              maxLength={NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Friday squad"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
          </label>
        )}

        {selected.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Selected people">
            {selected.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  aria-label={`Remove ${byId.get(id)?.name ?? "person"}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 py-1 pl-3 pr-2 text-[12px] font-medium text-accent transition-colors hover:bg-accent/25"
                >
                  {byId.get(id)?.name ?? "Unknown"}
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div>
          <label className="relative block">
            <span className="sr-only">Search friends</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              autoFocus={!creating}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search friends"
              className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
          </label>

          <ul className="mt-2 max-h-56 space-y-0.5 overflow-y-auto" role="group" aria-label="Friends">
            {visible.map((friend) => {
              const checked = selected.includes(friend.playerId);
              const full = !checked && selected.length >= maxSelect;
              return (
                <li key={friend.rowId}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    disabled={full}
                    onClick={() => toggle(friend.playerId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-foreground/[0.05] disabled:cursor-not-allowed disabled:opacity-40",
                      checked && "bg-accent/10",
                    )}
                  >
                    <ChatAvatar name={friend.name} size={34} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{friend.name}</span>
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-md border",
                        checked ? "border-accent bg-accent text-background" : "border-border",
                      )}
                    >
                      {checked && <Check size={13} />}
                    </span>
                  </button>
                </li>
              );
            })}
            {visible.length === 0 && (
              <li className="px-3 py-6 text-center text-[13px] text-muted">
                {friends.length === 0 ? "No friends available to add." : "No friends match your search."}
              </li>
            )}
          </ul>
          {selected.length >= maxSelect && (
            <p className="mt-2 text-[11px] text-muted">You&apos;ve reached the limit of {maxSelect} people.</p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-[12px] font-medium text-rose-500">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}