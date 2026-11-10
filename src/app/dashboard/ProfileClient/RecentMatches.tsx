import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "./Card";
import { formatNumber, modeName, timeAgo } from "./format";
import type { RecentMatch } from "./types";

export default function RecentMatches({ matches }: { matches: RecentMatch[] }) {
  return (
    <Card title="Recent matches" icon={History}>
      {matches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted">
          No matches yet. Your latest games will show up here.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {matches.map((match) => {
            const delta = match.ratingDelta;
            return (
              <li key={match.matchId} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-foreground">{modeName(match.gameModeId)}</p>
                  <p className="text-[12px] text-muted">{timeAgo(match.at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[14px] font-semibold tabular-nums text-foreground">
                    {match.kills} / {match.deaths}
                  </p>
                  <p className="text-[11px] text-muted">K / D</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-mono text-[14px] tabular-nums text-foreground">{formatNumber(match.score)}</p>
                  <p className="text-[11px] text-muted">Score</p>
                </div>
                <span
                  className={cn(
                    "w-14 shrink-0 rounded-full px-2 py-1 text-center font-mono text-[12px] font-semibold tabular-nums",
                    delta === null
                      ? "bg-foreground/[0.06] text-muted"
                      : delta >= 0
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-rose-500/10 text-rose-500",
                  )}
                  title={delta === null ? "Unranked match" : "Rating change"}
                >
                  {delta === null ? "-" : `${delta >= 0 ? "+" : ""}${Math.round(delta)}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}