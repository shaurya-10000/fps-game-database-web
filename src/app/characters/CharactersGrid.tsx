"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import { playHoverSound } from "@/lib/sound";
import DetailModal from "@/components/ui/DetailModal";
import type { Character, CharacterRole } from "@/lib/catalog";

type Filter = "all" | CharacterRole;

const ROLES: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "assault", label: "Assault" },
  { id: "sniper", label: "Sniper" },
  { id: "controller", label: "Controller" },
  { id: "support", label: "Support" },
  { id: "tank", label: "Tank" },
];

const ROLE_COLOR: Record<string, string> = {
  assault: "text-rose-500",
  sniper: "text-cyan-500",
  controller: "text-violet-500",
  support: "text-emerald-500",
  tank: "text-amber-500",
};

export default function CharactersGrid({ characters }: { characters: Character[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  const visible = useMemo(() => {
    let result = characters;
    if (filter !== "all") result = result.filter((c) => c.role === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    return result;
  }, [characters, filter, search]);

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted transition-colors group-focus-within:text-accent" />
          <input
            type="text"
            placeholder="Search characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface/50 py-2.5 pl-10 pr-4 text-[13px] text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => {
            const active = filter === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setFilter(r.id)}
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all ${
                  active
                    ? "bg-foreground text-background shadow-md"
                    : "bg-surface text-muted border border-border hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <motion.div layout className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {visible.map((c) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={c.id}
              onClick={() => setSelectedChar(c)}
              onMouseEnter={() => playHoverSound("character")}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 transition-all hover:border-fuchsia-500/40 hover:shadow-[0_0_30px_rgba(217,70,239,0.15)]"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <Image
                  src={`/images/characters/${c.id}.jpg`}
                  alt={c.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/fallback-character.jpg"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className={`rounded bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_COLOR[c.role] || "text-white"}`}>
                    {c.role}
                  </span>
                </div>
                <div className="absolute right-3 top-3">
                  <span className="rounded bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {c.difficulty}
                  </span>
                </div>
                <div className="absolute right-3 bottom-3 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  <div className="flex size-8 items-center justify-center rounded-full bg-fuchsia-500 text-white shadow-lg">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <h3 className="font-heading text-2xl font-bold uppercase tracking-wide text-white">{c.name}</h3>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SlidersHorizontal size={32} className="text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-foreground">No characters found</h3>
        </div>
      )}

      {/* Detail Modal */}
      {selectedChar && (
        <DetailModal
          isOpen={!!selectedChar}
          onClose={() => setSelectedChar(null)}
          title={selectedChar.name}
          subtitle={selectedChar.role}
          image={`/images/characters/${selectedChar.id}.jpg`}
          description={selectedChar.description}
          stats={[
            { label: "Role", value: selectedChar.role },
            { label: "Difficulty", value: selectedChar.difficulty },
            { label: "Abilities", value: selectedChar.abilities.length },
            { label: "Class", value: "Operator" },
          ]}
          tags={selectedChar.abilities}
          type="character"
        />
      )}
    </div>
  );
}
