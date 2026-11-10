import { Pin } from "lucide-react";
import type { DmMessage } from "../types";
import EmptyState from "../ui/EmptyState";
import SidePanel from "./SidePanel";

interface PinsPanelProps {
  pins: DmMessage[];
  onJump: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
  onClose: () => void;
}

export default function PinsPanel({ pins, onJump, onUnpin, onClose }: PinsPanelProps) {
  return (
    <SidePanel title="Pinned messages" onClose={onClose}>
      {pins.length === 0 ? (
        <EmptyState
          icon={Pin}
          title="Nothing pinned yet"
          description="Open a message's menu and choose Pin to keep important things easy to find."
        />
      ) : (
        <ul className="space-y-2 p-3">
          {pins.map((m) => (
            <li key={m._id} className="rounded-2xl border border-border bg-surface p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12px] font-semibold text-foreground">{m.senderName ?? "Unknown"}</span>
                <span className="shrink-0 text-[11px] text-muted">{new Date(m.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 line-clamp-3 break-words text-[13px] text-foreground/85">
                {m.audioUrl ? "Voice message" : m.content}
              </p>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="truncate text-[11px] text-muted">
                  {m.pinned?.byName ? `Pinned by ${m.pinned.byName}` : "Pinned"}
                </span>
                <span className="flex shrink-0 items-center gap-3 text-[12px] font-semibold">
                  <button type="button" onClick={() => onJump(m._id)} className="text-accent hover:underline">
                    Jump
                  </button>
                  <button type="button" onClick={() => onUnpin(m._id)} className="text-muted hover:text-foreground hover:underline">
                    Unpin
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SidePanel>
  );
}