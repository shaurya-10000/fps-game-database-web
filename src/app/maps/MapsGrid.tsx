"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, MapPin, ArrowUpRight } from "lucide-react";
import { playHoverSound } from "@/lib/sound";
import DetailModal from "@/components/ui/DetailModal";
import type { GameModeId, MapDefinition } from "@/lib/catalog";

type Filter = "all" | GameModeId;

const MODES: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "team_deathmatch", label: "Team Deathmatch" },
  { id: "free_for_all", label: "Free-for-All" },
  { id: "bomb_defusal", label: "Bomb Defusal" },
  { id: "battle_royale", label: "Battle Royale" },
];

export default function MapsGrid({ maps }: { maps: MapDefinition[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedMap, setSelectedMap] = useState<MapDefinition | null>(null);

  const visible = useMemo(() => {
    let result = maps;
    if (filter !== "all") result = result.filter((m) => m.gameModes.includes(filter));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }
    return result;
  }, [maps, filter, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted transition-colors group-focus-within:text-accent" />
          <input
            type="text"
            placeholder="Search maps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface/50 py-2.5 pl-10 pr-4 text-[13px] text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const active = filter === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setFilter(m.id)}
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all ${
                  active ? "bg-foreground text-background shadow-md" : "bg-surface text-muted border border-border hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <motion.div layout className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((m) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={m.id}
              onClick={() => setSelectedMap(m)}
              onMouseEnter={() => playHoverSound("map")}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 transition-all hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            >
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={`/images/maps/${m.id}.jpg`}
                  alt={m.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/fallback-map.jpg"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className="flex items-center gap-1 rounded bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    <MapPin size={10} /> {m.size}
                  </span>
                </div>
                <div className="absolute right-3 top-3 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <h3 className="font-heading text-2xl font-bold uppercase tracking-wide text-white">{m.name}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.gameModes.map((g) => (
                    <span key={g} className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                      {g.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SlidersHorizontal size={32} className="text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-foreground">No maps found</h3>
        </div>
      )}

      {selectedMap && (
        <DetailModal
          isOpen={!!selectedMap}
          onClose={() => setSelectedMap(null)}
          title={selectedMap.name}
          subtitle={`${selectedMap.size} Map`}
          image={`/images/maps/${selectedMap.id}.jpg`}
          description={selectedMap.description}
          stats={[
            { label: "Size", value: selectedMap.size },
            { label: "Cover", value: selectedMap.hasCover ? "Tactical" : "Open" },
            { label: "Modes", value: selectedMap.gameModes.length },
          ]}
          tags={selectedMap.gameModes.map(g => g.replace("_", " "))}
          type="map"
        />
      )}
    </div>
  );
}
