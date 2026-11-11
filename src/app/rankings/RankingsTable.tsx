"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Globe, Users, MapPin, Crown, Shield, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/leaderboard-shared";

type Tab = "global" | "friends" | "region";

const TIER_COLORS: Record<string, { color: string, bg: string, border: string, glow: string, hex: string }> = {
  Bronze: { color: "text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/20", glow: "shadow-[0_0_15px_rgba(217,119,6,0.2)]", hex: "#d97706" },
  Silver: { color: "text-zinc-400", bg: "bg-zinc-400/10", border: "border-zinc-400/20", glow: "shadow-[0_0_15px_rgba(161,161,170,0.2)]", hex: "#a1a1aa" },
  Gold: { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", glow: "shadow-[0_0_15px_rgba(234,179,8,0.2)]", hex: "#eab308" },
  Platinum: { color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", glow: "shadow-[0_0_15px_rgba(34,211,238,0.2)]", hex: "#22d3ee" },
  Diamond: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]", hex: "#3b82f6" },
  Master: { color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20", glow: "shadow-[0_0_15px_rgba(217,70,239,0.2)]", hex: "#d946ef" },
  Legendary: { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "shadow-[0_0_15px_rgba(244,63,94,0.2)]", hex: "#f43f5e" },
};

interface RankingsTableProps {
  initialEntries: LeaderboardEntry[];
  total: number;
}

export default function RankingsTable({ initialEntries }: RankingsTableProps) {
  const [activeTab, setActiveTab] = useState<Tab>("global");
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState("NA");

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
      setError("Could not load this leaderboard.");
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

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-8">
      {/* Sticky Tab Bar */}
      <div className="sticky top-0 z-20 -mx-5 px-5 sm:mx-0 sm:px-0 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 pt-2">
          <div className="flex gap-1">
            <TabButton active={activeTab === "global"} onClick={() => loadData("global")} icon={<Globe size={15}/>}>Global</TabButton>
            <TabButton active={activeTab === "friends"} onClick={() => loadData("friends")} icon={<Users size={15}/>}>Friends</TabButton>
            <TabButton active={activeTab === "region"} onClick={() => loadData("region")} icon={<MapPin size={15}/>}>Regional</TabButton>
          </div>

          {activeTab === "region" && (
            <div className="relative mt-3 sm:mt-0">
              <select
                value={region}
                onChange={handleRegionChange}
                className="appearance-none rounded-lg border border-border bg-surface py-1.5 pl-3 pr-8 text-[12px] font-bold text-foreground focus:border-amber-500 focus:outline-none"
              >
                <option value="NA">North America</option>
                <option value="EU">Europe</option>
                <option value="APAC">Asia Pacific</option>
                <option value="SA">South America</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-center text-[13px] font-medium text-rose-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted">
            <Trophy className="size-8 animate-pulse text-amber-500" />
            <span className="font-mono text-[12px] uppercase tracking-widest">Fetching rankings...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && !error && (
            <div className="grid gap-4 sm:grid-cols-3 items-end pt-4 pb-12 max-w-4xl mx-auto">
              {top3[1] && <PodiumCard entry={top3[1]} place={2} />}
              {top3[0] && <PodiumCard entry={top3[0]} place={1} />}
              {top3[2] && <PodiumCard entry={top3[2]} place={3} />}
            </div>
          )}

          {/* The Rest of the Table */}
          {rest.length > 0 && (
            <div className="mx-auto max-w-4xl">
              <div className="mb-4 flex items-center justify-between px-2">
                <h2 className="text-[12px] font-bold uppercase tracking-[0.15em] text-muted">Challenger Ranks</h2>
                <span className="font-mono text-[11px] text-muted">{rest.length} players</span>
              </div>
              
              <div className="overflow-hidden rounded-2xl border border-border bg-surface/30 backdrop-blur-md shadow-2xl">
                <table className="w-full text-left">
                  <thead className="border-b border-border/50 bg-background/40">
                    <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
                      <th className="w-16 px-4 py-3 text-center">Rank</th>
                      <th className="px-4 py-3">Player</th>
                      <th className="hidden px-4 py-3 sm:table-cell">Tier Progress</th>
                      <th className="px-4 py-3 text-right">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <AnimatePresence>
                      {rest.map((p, i) => {
                        const tier = TIER_COLORS[p.tier] || TIER_COLORS.Bronze;
                        // Fake progress calculation for visual flair
                        const progress = Math.min(100, Math.max(0, (p.rating % 500) / 5));
                        
                        return (
                          <motion.tr
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            key={p._id}
                            className="group transition-colors hover:bg-foreground/[0.04]"
                          >
                            <td className="px-4 py-3 text-center font-mono text-[13px] font-bold text-muted group-hover:text-foreground transition-colors">
                              #{p.rank}
                            </td>
                            
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 border border-border/50 text-[11px] font-bold text-foreground">
                                  {p.displayName.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-semibold text-[14px] text-foreground">{p.displayName}</span>
                              </div>
                            </td>
                            
                            <td className="hidden px-4 py-3 sm:table-cell">
                              <div className="flex items-center gap-3 max-w-[160px]">
                                <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0", tier.color, tier.bg, tier.border)}>
                                  <Shield size={10} /> {p.tier}
                                </span>
                                <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: tier.hex }} />
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3 text-right font-mono text-[14px] font-bold text-foreground">
                              {p.rating}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {entries.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-24 text-center opacity-60">
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
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold transition-all ${
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
  const tier = TIER_COLORS[entry.tier] || TIER_COLORS.Bronze;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: place * 0.1, type: "spring" }}
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border p-6 text-center transition-all ${
        isFirst 
          ? "border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-surface sm:-translate-y-6 shadow-2xl shadow-amber-500/20 z-10" 
          : "border-border bg-surface/80 backdrop-blur-md mt-6"
      }`}
    >
      <div className={`absolute top-4 right-4 font-mono text-3xl font-black opacity-10 ${isFirst ? "text-amber-500" : "text-foreground"}`}>
        #{place}
      </div>

      <div className="relative mb-4">
        <div className={`flex items-center justify-center rounded-full shadow-inner ${
          isFirst ? "size-20 bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-[0_0_30px_rgba(245,158,11,0.4)]" :
          place === 2 ? "size-16 bg-gradient-to-br from-zinc-300 to-zinc-500 text-white" : 
          "size-16 bg-gradient-to-br from-amber-700 to-amber-900 text-white"
        }`}>
          <span className="text-2xl font-bold">{entry.displayName.slice(0, 2).toUpperCase()}</span>
        </div>
        {isFirst && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 size-8 text-amber-400 drop-shadow-md" fill="currentColor" />}
      </div>

      <h3 className={`font-black tracking-tight text-foreground ${isFirst ? "text-2xl" : "text-xl"}`}>{entry.displayName}</h3>
      
      <span className={cn("mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", tier.color, tier.bg, tier.border)}>
        <Shield size={10} /> {entry.tier}
      </span>

      <div className="mt-5 flex flex-col items-center">
        <span className={`font-mono font-black tracking-tighter ${isFirst ? "text-4xl text-amber-500" : "text-3xl text-foreground"}`}>{entry.rating}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mt-1">Rating</span>
      </div>
    </motion.div>
  );
}

