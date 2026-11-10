import { getLeaderboard } from "@/lib/leaderboard";
import RankingsTable from "./RankingsTable";

export default async function RankingsPage() {
  const { entries, total } = await getLeaderboard(50);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:px-10">
      <div className="text-center mb-12">
        <div className="text-[12px] font-bold uppercase tracking-[0.15em] text-accent mb-2">Competitive</div>
        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl flex items-center justify-center gap-3">
          <TrophyIcon /> Leaderboards
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-[16px] max-w-2xl mx-auto">
          The definitive ranking of the world&apos;s best players. Elo-based ratings, tiers derived from rating thresholds.
        </p>
      </div>
      
      <RankingsTable initialEntries={entries} total={total} />
    </div>
  );
}

// Inline icon to avoid client boundary error in Server Component
function TrophyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  );
}
