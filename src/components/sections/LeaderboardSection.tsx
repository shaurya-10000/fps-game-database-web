import Link from "next/link";
import { getLeaderboard } from "@/lib/leaderboard";
import { Crown, Shield, Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const TIER_COLORS: Record<string, { color: string, bg: string, border: string, glow: string }> = {
  Bronze: { color: "text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/20", glow: "shadow-[0_0_15px_rgba(217,119,6,0.2)]" },
  Silver: { color: "text-zinc-400", bg: "bg-zinc-400/10", border: "border-zinc-400/20", glow: "shadow-[0_0_15px_rgba(161,161,170,0.2)]" },
  Gold: { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", glow: "shadow-[0_0_15px_rgba(234,179,8,0.2)]" },
  Platinum: { color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", glow: "shadow-[0_0_15px_rgba(34,211,238,0.2)]" },
  Diamond: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]" },
  Master: { color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20", glow: "shadow-[0_0_15px_rgba(217,70,239,0.2)]" },
  Legendary: { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "shadow-[0_0_15px_rgba(244,63,94,0.2)]" },
};

export default async function LeaderboardSection() {
  const { entries } = await getLeaderboard(10);

  return (
    <section className="relative mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:px-10 xl:px-16 overflow-hidden">
      
      {/* Ambient Background Glow */}
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse,rgba(245,158,11,0.08)_0%,transparent_70%)] blur-3xl" />

      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-500 mb-4">
            <Trophy size={14} /> Hall of Fame
          </div>
          <h2 className="font-heading text-4xl font-bold uppercase tracking-wide text-foreground sm:text-5xl lg:text-6xl">
            Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Leaderboard</span>
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            The best of the best. Check out the top-ranked players climbing the ladder.
          </p>
        </div>
        <Link href="/rankings" className="group flex shrink-0 items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[13px] font-bold text-background transition-all hover:scale-105">
          View Full Rankings <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid gap-3 w-full relative z-10">
        {entries.map((p, index) => {
          const tier = TIER_COLORS[p.tier] || TIER_COLORS.Bronze;
          const isTop3 = index < 3;
          
          return (
            <div
              key={p._id}
              className={cn(
                "group relative flex w-full items-center gap-4 rounded-2xl border bg-surface/50 p-4 backdrop-blur-md transition-all duration-300 hover:bg-foreground/[0.02] sm:gap-8 sm:px-8 sm:py-5",
                isTop3 ? "border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.05)]" : "border-border hover:border-foreground/20"
              )}
            >
              {/* Rank Number */}
              <div className="flex w-12 shrink-0 flex-col items-center justify-center sm:w-16">
                {index === 0 ? (
                  <Crown className="mb-1 size-6 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" fill="currentColor" />
                ) : (
                  <span className={cn(
                    "font-mono text-2xl font-black italic tracking-tighter sm:text-3xl",
                    index === 1 ? "text-zinc-300" : index === 2 ? "text-amber-700" : "text-muted/50"
                  )}>
                    #{index + 1}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={cn(
                  "flex size-12 items-center justify-center rounded-full text-lg font-bold text-foreground ring-2 sm:size-14 sm:text-xl",
                  isTop3 ? "bg-foreground text-background ring-amber-500/50" : "bg-foreground/5 ring-border"
                )}>
                  {p.displayName.slice(0, 2).toUpperCase()}
                </div>
                {isTop3 && (
                  <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background ring-1 ring-border">
                    <Shield size={10} className={tier.color} fill="currentColor" />
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-bold text-foreground sm:text-xl">
                  {p.displayName}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", tier.color, tier.bg, tier.border)}>
                    <Shield size={10} /> {p.tier === "Legendary" ? p.tier : `${p.tier} ${p.division}`}
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="shrink-0 text-right">
                <div className={cn(
                  "font-mono text-2xl font-black tracking-tighter sm:text-3xl",
                  index === 0 ? "text-amber-400" : "text-foreground"
                )}>
                  {p.rating}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Rating</div>
              </div>
              
              {/* Highlight Line for top 3 */}
              {isTop3 && (
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-amber-400 to-orange-500" />
              )}
            </div>
          );
        })}
        
        {entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted">
            No players yet. Run the seed script to populate fake players.
          </div>
        )}
      </div>
    </section>
  );
}


