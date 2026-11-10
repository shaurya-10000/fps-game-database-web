"use client";

import { useState } from "react";
import { Check, LoaderCircle, LogOut, Pencil, UserMinus, UserPlus, X } from "lucide-react";
import { ChatAvatar } from "@/app/dashboard/chat/chat-shared";
import type { GroupMember, GroupSummary } from "../types";
import DropdownMenu from "../ui/DropdownMenu";
import GroupAvatar from "../ui/GroupAvatar";
import SidePanel from "./SidePanel";

const MAX_NAME = 50;

interface GroupInfoPanelProps {
  group: GroupSummary;
  myId: string;
  onRename: (name: string) => Promise<void>;
  onRequestAdd: () => void;
  onRequestRemove: (member: GroupMember) => void;
  onRequestLeave: () => void;
  onClose: () => void;
}

export default function GroupInfoPanel({
  group,
  myId,
  onRename,
  onRequestAdd,
  onRequestRemove,
  onRequestLeave,
  onClose,
}: GroupInfoPanelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(group.name);
  const [saving, setSaving] = useState(false);

  const me = group.members.find((m) => m.playerId === myId);
  const isAdmin = Boolean(me?.isAdmin);
  const trimmed = draft.trim();
  const canSave = trimmed.length > 0 && trimmed !== group.name && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onRename(trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidePanel title="Group info" onClose={onClose}>
      <div className="flex flex-col items-center gap-3 border-b border-border px-6 py-6">
        <GroupAvatar name={group.name} size={72} />

        {editing ? (
          <div className="flex w-full items-center gap-1.5">
            <input
              autoFocus
              value={draft}
              maxLength={MAX_NAME}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void save();
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setEditing(false);
                  setDraft(group.name);
                }
              }}
              aria-label="Group name"
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-[14px] text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
            <button
              type="button"
              onClick={() => void save()}
              disabled={!canSave}
              aria-label="Save group name"
              className="flex size-9 items-center justify-center rounded-full bg-accent text-background disabled:opacity-40"
            >
              {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={16} />}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(group.name);
              }}
              aria-label="Cancel rename"
              className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-foreground/10"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex max-w-full items-center gap-2">
            <h4 className="truncate text-lg font-bold text-foreground">{group.name}</h4>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Rename group"
                className="rounded-full p-1.5 text-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        )}
        <p className="text-[12px] text-muted">Group - {group.members.length} members</p>
      </div>

      <div className="p-3">
        <div className="mb-1 flex items-center justify-between px-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Members</h4>
          <button
            type="button"
            onClick={onRequestAdd}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            <UserPlus size={14} /> Add
          </button>
        </div>

        <ul className="space-y-0.5">
          {group.members.map((member) => {
            const isMe = member.playerId === myId;
            return (
              <li key={member.playerId} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <ChatAvatar name={member.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {member.name}
                    {isMe && <span className="ml-1.5 text-[11px] font-normal text-muted">(you)</span>}
                  </p>
                </div>
                {member.isAdmin && (
                  <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                    Admin
                  </span>
                )}
                {isAdmin && !isMe && (
                  <DropdownMenu
                    label={`Options for ${member.name}`}
                    items={[
                      {
                        id: "remove",
                        label: "Remove from group",
                        icon: UserMinus,
                        danger: true,
                        onSelect: () => onRequestRemove(member),
                      },
                    ]}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={onRequestLeave}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-[13px] font-semibold text-rose-500 transition-colors hover:bg-rose-500/20"
        >
          <LogOut size={15} /> Leave group
        </button>
      </div>
    </SidePanel>
  );
}