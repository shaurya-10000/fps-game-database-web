"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Swords, Target, Crosshair, Flame, ArrowUpRight } from "lucide-react";
import { playHoverSound } from "@/lib/sound";
import DetailModal from "@/components/ui/DetailModal";
import type { GameMode } from "@/lib/catalog";

const MODE_ICONS: Record<string, React.ReactNode> = {
  team_deathmatch: <Swords size={20} />,
  free_for_all: <Crosshair size={20} />,
  bomb_defusal: <Target size={20} />,
  battle_royale: <Flame size={20} />,
};

export default function ModesGrid({ modes }: { modes: GameMode[] }) {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  return (
    <div className="space-y-8">
      <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modes.map((m) => (
          <motion.div
            key={m.id}
            onClick={() => setSelectedMode(m)}
            onMouseEnter={() => playHoverSound("mode")}
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 transition-all hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]"
          >
            <div className="relative aspect-video w-full overflow-hidden">
              <Image
                src={`/images/modes/${m.id}.jpg`}
                alt={m.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => { (e.target as HTMLImageElement).src = "/images/fallback-mode.jpg"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              
              <div className="absolute left-3 top-3 flex gap-2">
                <span className="flex size-8 items-center justify-center rounded bg-black/60 backdrop-blur-md text-white">
                  {MODE_ICONS[m.id] || <Swords size={20} />}
                </span>
              </div>
              <div className="absolute right-3 top-3 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                <div className="flex size-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg">
                  <ArrowUpRight size={16} />
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-5">
              <h3 className="font-heading text-2xl font-bold uppercase tracking-wide text-white">{m.name}</h3>
              <div className="mt-2 flex gap-2 text-[11px] font-bold uppercase text-amber-500">
                <span>{m.teamSize === 1 ? "Solo" : `${m.teamSize}v${m.teamSize}`}</span>
                <span>•</span>
                <span>{m.roundsPerMatch} Rounds</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {selectedMode && (
        <DetailModal
          isOpen={!!selectedMode}
          onClose={() => setSelectedMode(null)}
          title={selectedMode.name}
          subtitle="Game Mode"
          image={`/images/modes/${selectedMode.id}.jpg`}
          description={selectedMode.description}
          stats={[
            { label: "Team Size", value: selectedMode.teamSize === 1 ? "Solo" : `${selectedMode.teamSize}v${selectedMode.teamSize}` },
            { label: "Rounds", value: selectedMode.roundsPerMatch },
            { label: "Buckets", value: selectedMode.buckets.join(", ") },
          ]}
          tags={selectedMode.buckets}
          type="mode"
        />
      )}
    </div>
  );
}
