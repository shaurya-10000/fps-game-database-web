import { Star } from "lucide-react";
import type { StarredMessage } from "../types";
import EmptyState from "../ui/EmptyState";
import SidePanel from "./SidePanel";

interface StarredPanelProps {
  starred: StarredMessage[];
  onJump: (messageId: string) => void;
  onUnstar: (messageId: string) => void;
  onClose: () => void;
}

export default function StarredPanel({ starred, onJump, onUnstar, onClose }: StarredPanelProps) {
  return (
    <SidePanel title="Starred messages" onClose={onClose}>
      {starred.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No starred messages"
          description="Open a message's menu and choose Star to keep it handy. Stars are private to you on this device."
        />
      ) : (
        <ul className="space-y-2 p-3">
          {starred.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border bg-surface p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12px] font-semibold text-foreground">{item.senderName}</span>
                <span className="shrink-0 text-[11px] text-muted">{new Date(item.at).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 line-clamp-3 break-words text-[13px] text-foreground/85">{item.content}</p>
              <div className="mt-2.5 flex items-center justify-end gap-3 text-[12px] font-semibold">
                <button type="button" onClick={() => onJump(item.id)} className="text-accent hover:underline">
                  Jump
                </button>
                <button type="button" onClick={() => onUnstar(item.id)} className="text-muted hover:text-foreground hover:underline">
                  Unstar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SidePanel>
  );
}