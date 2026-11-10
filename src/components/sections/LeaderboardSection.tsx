import Link from "next/link";
import { getLeaderboard } from "@/lib/leaderboard";

const TIER_COLOR: Record<string, string> = {
  Bronze: "text-amber-700 border-amber-700/30 bg-amber-700/5",
  Silver: "text-zinc-500 border-zinc-500/30 bg-zinc-500/5",
  Gold: "text-yellow-600 border-yellow-600/30 bg-yellow-600/5",
  Platinum: "text-cyan-600 border-cyan-600/30 bg-cyan-600/5",
  Diamond: "text-blue-500 border-blue-500/30 bg-blue-500/5",
  Master: "text-fuchsia-500 border-fuchsia-500/30 bg-fuchsia-500/5",
  Legendary: "text-rose-500 border-rose-500/30 bg-rose-500/5",
};

export default async function LeaderboardSection() {
  const { entries, total } = await getLeaderboard(10);

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 lg:px-10 xl:px-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Competitive
          </div>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
            Leaderboard
          </h2>
        </div>
        <Link
          href="/rankings"
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-muted transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          View all ({total}) →
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border bg-background/50">
            <tr className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
              <th className="w-14 px-4 py-3 text-right">#</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3 text-right">Rating</th>
              <th className="px-4 py-3 text-right">Tier</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((p) => (
              <tr
                key={p._id}
                className="border-b border-border/60 last:border-b-0 transition-colors hover:bg-foreground/[0.02]"
              >
                <td className="px-4 py-3 text-right font-mono text-[12px] text-muted">
                  {p.rank}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium tracking-[-0.01em] text-foreground">
                    {p.displayName}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[12px] text-foreground/90">
                  {p.rating}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
                      TIER_COLOR[p.tier] ?? "border-border text-muted"
                    }`}
                  >
                    {p.tier === "Legendary" ? p.tier : `${p.tier} ${p.division}`}
                  </span>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-[13px] text-muted"
                >
                  No players yet. Run{" "}
                  <code className="rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-foreground/80">
                    node scripts/seed-leaderboard.mjs
                  </code>{" "}
                  to seed fake players.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}