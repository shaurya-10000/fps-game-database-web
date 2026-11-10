import { Volume2, VolumeX } from "lucide-react";
import SidePanel from "@/app/dashboard/dms/DmsClient/panels/SidePanel";
import EmptyState from "@/app/dashboard/dms/DmsClient/ui/EmptyState";

interface MutedPanelProps {
  mutedIds: string[];
  /** Names we have seen in this room, keyed by player id. */
  names: Map<string, string>;
  onUnmute: (playerId: string) => void;
  onClose: () => void;
}

export default function MutedPanel({ mutedIds, names, onUnmute, onClose }: MutedPanelProps) {
  return (
    <SidePanel title="Muted players" onClose={onClose}>
      {mutedIds.length === 0 ? (
        <EmptyState
          icon={VolumeX}
          title="Nobody is muted"
          description="Mute someone from the menu on their avatar or name and their messages are hidden for you."
        />
      ) : (
        <ul className="space-y-1 p-3">
          {mutedIds.map((id) => (
            <li key={id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                {names.get(id) ?? `Player ${id.slice(0, 6)}`}
              </span>
              <button
                type="button"
                onClick={() => onUnmute(id)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                <Volume2 size={14} /> Unmute
              </button>
            </li>
          ))}
        </ul>
      )}
    </SidePanel>
  );
}