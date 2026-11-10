"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Crosshair, ArrowUpRight } from "lucide-react";
import { playHoverSound } from "@/lib/sound";
import DetailModal from "@/components/ui/DetailModal";
import type { Weapon, WeaponType } from "@/lib/catalog";

type Filter = "all" | WeaponType;

const TYPES: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "assault_rifle", label: "Assault Rifle" },
  { id: "smg", label: "SMG" },
  { id: "sniper", label: "Sniper" },
  { id: "lmg", label: "LMG" },
  { id: "pistol", label: "Pistol" },
  { id: "shotgun", label: "Shotgun" },
  { id: "melee", label: "Melee" },
];

export default function WeaponsGrid({ weapons }: { weapons: Weapon[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);

  const visible = useMemo(() => {
    let result = weapons;
    if (filter !== "all") result = result.filter((w) => w.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((w) => w.name.toLowerCase().includes(q));
    }
    return result;
  }, [weapons, filter, search]);

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted transition-colors group-focus-within:text-accent" />
          <input
            type="text"
            placeholder="Search weapons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface/50 py-2.5 pl-10 pr-4 text-[13px] text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => {
            const active = filter === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all ${
                  active
                    ? "bg-foreground text-background shadow-md"
                    : "bg-surface text-muted border border-border hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <motion.div layout className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {visible.map((w) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={w.id}
              onClick={() => setSelectedWeapon(w)}
              onMouseEnter={() => playHoverSound("weapon")}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 transition-all hover:border-accent/40 hover:shadow-[0_0_30px_rgba(var(--accent-glow),0.15)]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={`/images/weapons/${w.id}.jpg`}
                  alt={w.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/fallback-weapon.jpg"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className="rounded bg-black/50 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {TYPES.find((t) => t.id === w.type)?.label ?? w.type}
                  </span>
                </div>
                <div className="absolute right-3 top-3 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  <div className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h3 className="font-heading text-2xl font-bold uppercase tracking-wide text-white">{w.name}</h3>
                  <div className="mt-1 flex items-center gap-2 text-[12px] text-zinc-400">
                    <Crosshair size={14} />
                    <span>{w.stats.rangeMeters}m Range</span>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <span>Damage</span>
                    <span className="text-white">{w.stats.damage}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/50">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min((w.stats.damage / 100) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SlidersHorizontal size={32} className="text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-foreground">No weapons found</h3>
        </div>
      )}

      {/* Detail Modal */}
      {selectedWeapon && (
        <DetailModal
          isOpen={!!selectedWeapon}
          onClose={() => setSelectedWeapon(null)}
          title={selectedWeapon.name}
          subtitle={TYPES.find((t) => t.id === selectedWeapon.type)?.label ?? selectedWeapon.type}
          image={`/images/weapons/${selectedWeapon.id}.jpg`}
          description="A lethal choice in the right hands. Balanced for mid-to-long range engagements with a distinct recoil pattern."
          stats={[
            { label: "Damage", value: selectedWeapon.stats.damage },
            { label: "Fire Rate", value: `${selectedWeapon.stats.fireRate} RPM` },
            { label: "Magazine", value: selectedWeapon.stats.magazineSize },
            { label: "Reload", value: `${(selectedWeapon.stats.reloadTimeMs / 1000).toFixed(1)}s` },
            { label: "Range", value: `${selectedWeapon.stats.rangeMeters}m` },
            { label: "Penetration", value: selectedWeapon.stats.penetration },
          ]}
          tags={[selectedWeapon.stats.isAutomatic ? "Automatic" : "Semi-Auto"]}
          type="weapon"
        />
      )}
    </div>
  );
}
