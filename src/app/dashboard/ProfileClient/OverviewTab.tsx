import Link from "next/link";
import { ArrowUpRight, Crosshair, Sparkles, Swords, Trophy, Users, Zap } from "lucide-react";
import type { ProgressionSnapshot } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import Card from "./Card";
import RatingChart from "./RatingChart";
import RecentMatches from "./RecentMatches";
import { formatNumber } from "./format";
import { findTier, tierGradient, tierLabel, tierProgress } from "./tiers";
import type { Overview } from "./types";

interface OverviewTabProps {
  progression: ProgressionSnapshot | null;
  overview: Overview | null;
  friendsCount: number;
}

function Highlight({ icon: Icon, label, value, hint }: { icon: typeof Zap; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={14} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">{label}</span>
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-[12px] text-muted">{hint}</div>}
    </div>
  );
}

export default function OverviewTab({ progression, overview, friendsCount }: OverviewTabProps) {
  const career = overview?.career;
  const rating = overview?.rating ?? null;
  const tier = overview?.tier ?? null;
  const tierDef = findTier(tier?.tier);
  const progress = rating !== null && tier ? tierProgress(rating, tier.tier) : null;
  const decided = (career?.wins ?? 0) + (career?.losses ?? 0);
  const xpToNext = progression ? Math.max(0, progression.xpForNextLevel - progression.currentLevelXp) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Level progress" icon={Zap}>
          {progression ? (
            <div className="space-y-5">
              <div className="flex items-end justify-between gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-5xl font-semibold leading-none tabular-nums text-foreground">{progression.level}</span>
                  <span className="text-[13px] text-muted">Level</span>
                </div>
                <span className="rounded-full bg-accent/10 px-3 py-1 font-mono text-[12px] font-semibold tabular-nums text-accent">
                  {Math.round(progression.progressPercent)}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Progress to next level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progression.progressPercent)}
                className="h-3 overflow-hidden rounded-full bg-foreground/[0.07]"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-amber-400 transition-[width] duration-1000 ease-out motion-reduce:transition-none"
                  style={{ width: `${Math.min(100, Math.max(0, progression.progressPercent))}%` }}
                />
              </div>
              <p className="text-[13px] text-muted">
                <span className="font-mono font-semibold text-foreground">{formatNumber(xpToNext)} XP</span> to level {progression.level + 1}
                <span className="text-muted"> ({formatNumber(progression.currentLevelXp)} / {formatNumber(progression.xpForNextLevel)})</span>
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-muted">No progression yet. Play a match to start earning XP.</p>
          )}
        </Card>

        <Card title="Competitive rank" icon={Trophy}>
          {rating !== null && tier ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-5xl font-semibold leading-none tabular-nums text-foreground">{formatNumber(rating)}</div>
                  <div className="mt-1.5 text-[12px] text-muted">Rating</div>
                </div>
                <span className="rounded-full px-3.5 py-1.5 text-[13px] font-bold text-white shadow-sm" style={{ background: tierGradient(tier.tier) }}>
                  {tierLabel(tier.tier, tier.division)}
                </span>
              </div>
              {progress && (
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-foreground/[0.07]">
                    <div
                      className="h-full rounded-full transition-[width] duration-1000 ease-out motion-reduce:transition-none"
                      style={{ width: `${progress.percent}%`, background: tierGradient(tier.tier) }}
                    />
                  </div>
                  <p className="mt-1.5 text-[12px] text-muted">
                    {progress.next ? (
                      <>
                        <span className="font-mono font-semibold text-foreground">{formatNumber(progress.remaining)}</span> rating to {progress.next.name}
                      </>
                    ) : (
                      "You're in the top tier."
                    )}
                  </p>
                </div>
              )}
              <RatingChart points={overview?.ratingHistory ?? []} color={tierDef?.from ?? "var(--accent)"} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
              <Sparkles size={20} className="mx-auto mb-2 text-muted" />
              <p className="text-[13px] font-medium text-foreground">You&apos;re unranked</p>
              <p className="mt-1 text-[12px] text-muted">Finish a ranked match to get a rating and a tier.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Highlight icon={Swords} label="Matches" value={formatNumber(career?.matches ?? 0)} />
        <Highlight icon={Crosshair} label="K/D" value={career && career.matches > 0 ? career.kd.toFixed(2) : "-"} hint={career ? `${formatNumber(career.kills)} kills` : undefined} />
        <Highlight
          icon={Trophy}
          label="Win rate"
          value={decided > 0 ? `${Math.round(((career?.wins ?? 0) / decided) * 100)}%` : "-"}
          hint={decided > 0 ? `${career?.wins}W - ${career?.losses}L ranked` : "No ranked games"}
        />
        <Link
          href="/dashboard/friends"
          className={cn("group rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-foreground/[0.03]")}
        >
          <div className="flex items-center justify-between text-muted">
            <span className="flex items-center gap-2">
              <Users size={14} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">Friends</span>
            </span>
            <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">{formatNumber(friendsCount)}</div>
          <div className="mt-0.5 text-[12px] text-muted">Manage friends</div>
        </Link>
      </div>

      <RecentMatches matches={overview?.recentMatches ?? []} />
    </div>
  );
}
