"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Globe, Users, MapPin, Crown, Medal, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import type { LeaderboardEntry } from "@/lib/leaderboard-shared";

type Tab = "global" | "friends" | "region";

const TIER_STYLES: Record<string, string> = {
  Bronze: "bg-[#cd7f32]/10 text-[#cd7f32] border-[#cd7f32]/20",
  Silver: "bg-zinc-400/10 text-zinc-400 border-zinc-400/20",
  Gold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  Platinum: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
  Diamond: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Master: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20",
  Legendary: "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
};

interface RankingsTableProps {
  initialEntries: LeaderboardEntry[];
  initialCursor?: string;
  total: number;
}

export default function RankingsTable({ initialEntries }: RankingsTableProps) {
  const [activeTab, setActiveTab] = useState<Tab>("global");
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState("NA");

  // Fetch data when tabs change
  async function loadData(tab: Tab, selectedRegion = "NA") {
    setActiveTab(tab);
    setLoading(true);
    setError(null);
    try {
      let endpoint = "";
      if (tab === "global") endpoint = "/api/leaderboards/global";
      if (tab === "friends") endpoint = "/api/leaderboards/friends";
      if (tab === "region") endpoint = `/api/leaderboards/region/${selectedRegion}`;

      const data = await api<LeaderboardEntry[]>(endpoint);
      setEntries(data);
    } catch {
      // Fallback for demo/empty state if endpoint fails
      setError("Could not load this leaderboard. Ensure you are logged in and have friends added.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  function handleRegionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRegion = e.target.value;
    setRegion(newRegion);
    void loadData("region", newRegion);
  }

  // Extract Top 3 for the Podium
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-8">
      {/* Tabs & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex gap-2">
          <TabButton active={activeTab === "global"} onClick={() => loadData("global")} icon={<Globe size={16}/>}>
            Global
          </TabButton>
          <TabButton active={activeTab === "friends"} onClick={() => loadData("friends")} icon={<Users size={16}/>}>
            Friends
          </TabButton>
          <TabButton active={activeTab === "region"} onClick={() => loadData("region")} icon={<MapPin size={16}/>}>
            Regional
          </TabButton>
        </div>

        {activeTab === "region" && (
          <div className="relative">
            <select
              value={region}
              onChange={handleRegionChange}
              className="appearance-none rounded-lg border border-border bg-surface py-2 pl-4 pr-10 text-[13px] font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="NA">North America</option>
              <option value="EU">Europe</option>
              <option value="APAC">Asia Pacific</option>
              <option value="SA">South America</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-center text-[13px] font-medium text-rose-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-[13px] text-muted animate-pulse">
          Loading leaderboard...
        </div>
      ) : (
        <>
          {/* TOP 3 PODIUM */}
          {top3.length > 0 && !error && (
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              {/* 2nd Place */}
              {top3[1] && <PodiumCard entry={top3[1]} place={2} />}
              {/* 1st Place */}
              {top3[0] && <PodiumCard entry={top3[0]} place={1} />}
              {/* 3rd Place */}
              {top3[2] && <PodiumCard entry={top3[2]} place={3} />}
            </div>
          )}

          {/* REST OF THE TABLE */}
          {rest.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-border bg-background/50">
                  <tr className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                    <th className="w-16 px-6 py-4 text-center">Rank</th>
                    <th className="px-6 py-4">Player</th>
                    <th className="hidden px-6 py-4 sm:table-cell">Tier</th>
                    <th className="px-6 py-4 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {rest.map((p, i) => (
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        key={p._id}
                        className="border-b border-border/50 last:border-b-0 transition-colors hover:bg-foreground/[0.02]"
                      >
                        <td className="px-6 py-4 text-center font-mono text-[13px] font-bold text-muted">
                          #{p.rank}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-[14px] text-foreground">{p.displayName}</span>
                        </td>
                        <td className="hidden px-6 py-4 sm:table-cell">
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_STYLES[p.tier] ?? "border-border text-muted"}`}>
                            {p.tier} {p.tier !== "Legendary" && p.division}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-[14px] font-black text-foreground">
                          {p.rating}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {entries.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
              <Trophy size={48} className="text-muted mb-4" />
              <h3 className="text-lg font-bold text-foreground">No players found</h3>
              <p className="text-[13px] text-muted">There are no rankings for this filter yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean, onClick: () => void, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-bold transition-all ${
        active
          ? "bg-foreground text-background shadow-md"
          : "text-muted hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function PodiumCard({ entry, place }: { entry: LeaderboardEntry, place: number }) {
  const isFirst = place === 1;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: place * 0.1 }}
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border p-6 text-center ${
        isFirst 
          ? "border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-surface sm:-translate-y-4 sm:scale-105 sm:shadow-2xl sm:shadow-yellow-500/10 z-10" 
          : "border-border bg-surface"
      }`}
    >
      <div className={`mb-4 flex size-16 items-center justify-center rounded-full shadow-inner ${
        isFirst ? "bg-yellow-500/20 text-yellow-500" : place === 2 ? "bg-zinc-400/20 text-zinc-400" : "bg-[#cd7f32]/20 text-[#cd7f32]"
      }`}>
        {isFirst ? <Crown size={32} /> : <Medal size={32} />}
      </div>
      
      <div className="absolute top-4 right-4 font-mono text-2xl font-black opacity-20">
        #{place}
      </div>

      <h3 className="text-lg font-black tracking-tight text-foreground">{entry.displayName}</h3>
      <span className={`mt-1 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_STYLES[entry.tier] ?? "border-border"}`}>
        {entry.tier} {entry.tier !== "Legendary" && entry.division}
      </span>
      <div className="mt-4 font-mono text-2xl font-black text-foreground">{entry.rating} <span className="text-[11px] text-muted uppercase tracking-wider">RP</span></div>
    </motion.div>
  );
}
