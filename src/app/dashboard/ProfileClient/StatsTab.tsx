import { Clock, Crosshair, Flame, Medal, Shield, Skull, Swords, Target, Trophy, type LucideIcon } from "lucide-react";
import Card from "./Card";
import { formatNumber, formatPlayTime } from "./format";
import type { Overview } from "./types";

function Tile({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={14} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">{label}</span>
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-[12px] text-muted">{hint}</div>}
    </div>
  );
}

export default function StatsTab({ overview }: { overview: Overview | null }) {
  const career = overview?.career;

  if (!career || career.matches === 0) {
    return (
      <Card title="Career stats" icon={Swords}>
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-[13px] text-muted">
          No matches recorded yet. Play a match and your career stats will appear here.
        </p>
      </Card>
    );
  }

  const decided = career.wins + career.losses;
  const winRate = decided > 0 ? (career.wins / decided) * 100 : null;

  return (
    <div className="space-y-4">
      <Card title="Career stats" icon={Swords}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Tile icon={Swords} label="Matches" value={formatNumber(career.matches)} />
          <Tile icon={Crosshair} label="K/D ratio" value={career.kd.toFixed(2)} />
          <Tile icon={Target} label="Kills" value={formatNumber(career.kills)} />
          <Tile icon={Skull} label="Deaths" value={formatNumber(career.deaths)} />
          <Tile icon={Flame} label="Avg damage" value={formatNumber(career.damage / career.matches)} hint={`${formatNumber(career.damage)} total`} />
          <Tile icon={Medal} label="Avg score" value={formatNumber(career.score / career.matches)} hint={`Best ${formatNumber(career.bestScore)}`} />
          <Tile icon={Clock} label="Time played" value={formatPlayTime(career.survivalSeconds)} hint="Time alive in matches" />
          <Tile icon={Trophy} label="Ranked wins" value={formatNumber(career.wins)} />
          <Tile icon={Shield} label="Ranked losses" value={formatNumber(career.losses)} />
        </div>
      </Card>

      <Card title="Ranked record" icon={Trophy}>
        {winRate === null ? (
          <p className="text-[13px] text-muted">No ranked games yet.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">{Math.round(winRate)}%</span>
              <span className="text-[12px] text-muted">
                {career.wins} wins, {career.losses} losses
              </span>
            </div>
            <div
              role="img"
              aria-label={`${Math.round(winRate)} percent win rate`}
              className="flex h-3 overflow-hidden rounded-full bg-rose-500/30"
            >
              <div className="h-full bg-emerald-500" style={{ width: `${winRate}%` }} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}