"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { searchMessages } from "../api";
import type { DmMessage } from "../types";
import SidePanel from "./SidePanel";

interface SearchPanelProps {
  roomId: string;
  onJump: (messageId: string) => void;
  onClose: () => void;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="rounded bg-accent/30 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

interface Outcome {
  roomId: string;
  query: string;
  status: "done" | "error";
  results: DmMessage[];
}

const NO_RESULTS: DmMessage[] = [];

export default function SearchPanel({ roomId, onJump, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const trimmed = query.trim();

  // Only an outcome for the current query counts; otherwise a request is still pending.
  const current = trimmed.length >= 2 && outcome?.roomId === roomId && outcome.query === trimmed ? outcome : null;
  const state: "idle" | "loading" | "done" | "error" = trimmed.length < 2 ? "idle" : (current?.status ?? "loading");
  const results = current?.status === "done" ? current.results : NO_RESULTS;

  useEffect(() => {
    if (trimmed.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const list = await searchMessages(roomId, trimmed);
        if (!cancelled) setOutcome({ roomId, query: trimmed, status: "done", results: list });
      } catch {
        if (!cancelled) setOutcome({ roomId, query: trimmed, status: "error", results: NO_RESULTS });
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, roomId]);

  return (
    <SidePanel title="Search messages" onClose={onClose}>
      <div className="p-4">
        <label className="relative block">
          <span className="sr-only">Search in this conversation</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this conversation"
            className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </label>
      </div>

      <div className="px-2 pb-4">
        {state === "idle" && <p className="px-3 py-8 text-center text-[13px] text-muted">Type at least 2 characters to search.</p>}
        {state === "loading" && <p className="px-3 py-8 text-center text-[13px] text-muted">Searching...</p>}
        {state === "error" && <p className="px-3 py-8 text-center text-[13px] text-rose-500">Search failed. Try again.</p>}
        {state === "done" && results.length === 0 && (
          <p className="px-3 py-8 text-center text-[13px] text-muted">No messages match &quot;{trimmed}&quot;.</p>
        )}
        {state === "done" && (
          <ul className="space-y-0.5">
            {results.map((m) => (
              <li key={m._id}>
                <button
                  type="button"
                  onClick={() => onJump(m._id)}
                  className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.05]"
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[12px] font-semibold text-foreground">{m.senderName ?? "Unknown"}</span>
                    <span className="shrink-0 text-[11px] text-muted">{new Date(m.createdAt).toLocaleDateString()}</span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[13px] text-foreground/80">
                    <Highlight text={m.content} query={trimmed} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SidePanel>
  );
}