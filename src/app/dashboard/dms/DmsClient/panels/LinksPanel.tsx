"use client";

import { useMemo } from "react";
import { ExternalLink, Link2 } from "lucide-react";
import type { DmMessage } from "../types";
import EmptyState from "../ui/EmptyState";
import SidePanel from "./SidePanel";

const URL_PATTERN = /https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]]/g;

interface LinksPanelProps {
  messages: DmMessage[];
  onJump: (messageId: string) => void;
  onClose: () => void;
}

/** Every link shared in the messages that are loaded, newest first. */
export default function LinksPanel({ messages, onJump, onClose }: LinksPanelProps) {
  const links = useMemo(() => {
    const found: { key: string; url: string; sender: string; at: string; messageId: string }[] = [];
    for (const m of messages) {
      if (m.deleted || m.system || m.audioUrl) continue;
      (m.content.match(URL_PATTERN) ?? []).forEach((url, i) =>
        found.push({ key: `${m._id}-${i}`, url, sender: m.senderName ?? "Unknown", at: m.createdAt, messageId: m._id }),
      );
    }
    return found.reverse();
  }, [messages]);

  return (
    <SidePanel title="Shared links" onClose={onClose}>
      {links.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No links yet"
          description="Links shared in this conversation show up here. Load earlier messages to find older ones."
        />
      ) : (
        <ul className="space-y-2 p-3">
          {links.map((link) => (
            <li key={link.key} className="rounded-2xl border border-border bg-surface p-3">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 break-all text-[13px] font-medium text-accent hover:underline"
              >
                <ExternalLink size={14} className="mt-0.5 shrink-0" />
                {link.url}
              </a>
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted">
                <span className="truncate">
                  {link.sender} - {new Date(link.at).toLocaleDateString()}
                </span>
                <button type="button" onClick={() => onJump(link.messageId)} className="shrink-0 font-semibold text-accent hover:underline">
                  Jump
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SidePanel>
  );
}