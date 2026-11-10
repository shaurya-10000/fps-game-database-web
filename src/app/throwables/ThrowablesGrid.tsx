"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowUpRight } from "lucide-react";
import { playHoverSound } from "@/lib/sound";
import DetailModal from "@/components/ui/DetailModal";
import type { Throwable, ThrowableType } from "@/lib/catalog";

type Filter = "all" | ThrowableType;

const TYPES: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "frag", label: "Frag" },
  { id: "smoke", label: "Smoke" },
  { id: "flash", label: "Flash" },
  { id: "incendiary", label: "Incendiary" },
  { id: "decoy", label: "Decoy" },
  { id: "emp", label: "EMP" },
  { id: "healing", label: "Healing" },
  { id: "stun", label: "Stun" },
];

export default function ThrowablesGrid({ throwables }: { throwables: Throwable[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Throwable | null>(null);

  const visible = useMemo(() => {
    let result = throwables;
    if (filter !== "all") result = result.filter((t) => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }
    return result;
  }, [throwables, filter, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted transition-colors group-focus-within:text-accent" />
          <input
            type="text"
            placeholder="Search throwables..."
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
                  active ? "bg-foreground text-background shadow-md" : "bg-surface text-muted border border-border hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <motion.div layout className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {visible.map((t) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={t.id}
              onClick={() => setSelectedItem(t)}
              onMouseEnter={() => playHoverSound("throwable")}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 transition-all hover:border-rose-500/40 hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]"
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <Image
                  src={`/images/throwables/${t.id}.jpg`}
                  alt={t.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/fallback-throwable.jpg"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className="rounded bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {t.type}
                  </span>
                </div>
                <div className="absolute right-3 top-3 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  <div className="flex size-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <h3 className="font-heading text-xl font-bold uppercase tracking-wide text-white">{t.name}</h3>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {selectedItem && (
        <DetailModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.name}
          subtitle={selectedItem.type}
          image={`/images/throwables/${selectedItem.id}.jpg`}
          description={selectedItem.description}
          stats={[
            { label: "Price", value: `$${selectedItem.price}` },
            { label: "Radius", value: `${selectedItem.radiusMeters}m` },
            { label: "Duration", value: selectedItem.durationMs === 0 ? "Instant" : `${selectedItem.durationMs / 1000}s` },
          ]}
          tags={[selectedItem.type, "Utility"]}
          type="weapon"
        />
      )}
    </div>
  );
}
