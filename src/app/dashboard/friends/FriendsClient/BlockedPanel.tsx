import { ShieldOff } from "lucide-react";
import EmptyState from "@/app/dashboard/dms/DmsClient/ui/EmptyState";
import { timeAgo } from "./format";
import PersonRow, { SECONDARY_BUTTON } from "./PersonRow";
import type { BlockedPlayer } from "./types";

interface BlockedPanelProps {
  blocked: BlockedPlayer[];
  onUnblock: (player: BlockedPlayer) => void;
}

export default function BlockedPanel({ blocked, onUnblock }: BlockedPanelProps) {
  if (blocked.length === 0) {
    return (
      <EmptyState
        icon={ShieldOff}
        title="Nobody is blocked"
        description="Blocked players can't message or call you, or send friend requests. You can block someone from a friend's menu."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="px-1 text-[12px] text-muted">Blocked players can&apos;t message or call you, or send you friend requests.</p>
      <ul className="space-y-2">
        {blocked.map((player) => (
          <PersonRow key={player.playerId} name={player.name} subtitle={player.at ? `Blocked ${timeAgo(player.at)}` : "Blocked"}>
            <button type="button" onClick={() => onUnblock(player)} className={SECONDARY_BUTTON}>
              Unblock
            </button>
          </PersonRow>
        ))}
      </ul>
    </div>
  );
}