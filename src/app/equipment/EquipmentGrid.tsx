"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, Crosshair, Backpack, ArrowUpRight } from "lucide-react";
import { playHoverSound } from "@/lib/sound";
import DetailModal from "@/components/ui/DetailModal";
import type { Equipment } from "@/lib/catalog";

type Filter = "all" | Equipment["category"];

const CATEGORIES: { id: Filter; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <Backpack size={14} /> },
  { id: "armor", label: "Armor", icon: <Shield size={14} /> },
  { id: "helmet", label: "Helmet", icon: <Shield size={14} /> },
  { id: "ammo", label: "Ammo", icon: <Crosshair size={14} /> },
  { id: "consumable", label: "Consumable", icon: <Backpack size={14} /> },
];

export default function EquipmentGrid({ equipment }: { equipment: Equipment[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);

  const visible = useMemo(() => {
    let result = equipment;
    if (filter !== "all") result = result.filter((e) => e.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }
    return result;
  }, [equipment, filter, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted transition-colors group-focus-within:text-accent" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface/50 py-2.5 pl-10 pr-4 text-[13px] text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = filter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all ${
                  active ? "bg-foreground text-background shadow-md" : "bg-surface text-muted border border-border hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {c.icon} {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((e) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={e.id}
              onClick={() => setSelectedItem(e)}
              onMouseEnter={() => playHoverSound("equipment")}
              className="group relative flex cursor-pointer items-center gap-5 overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 p-5 transition-all hover:border-violet-500/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]"
            >
              <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-black/50">
                <Image
                  src={`/images/equipment/${e.id}.jpg`}
                  alt={e.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(ev) => { (ev.target as HTMLImageElement).src = "/images/fallback-equipment.jpg"; }}
                />
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2 mb-1">
                  {e.category === "armor" || e.category === "helmet" ? <Shield size={12} className="text-blue-500" /> : e.category === "ammo" ? <Crosshair size={12} className="text-amber-500" /> : <Backpack size={12} className="text-emerald-500" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{e.category}</span>
                </div>
                <h3 className="font-heading text-xl font-bold uppercase tracking-wide text-white">{e.name}</h3>
              </div>
              <div className="font-mono text-lg font-black text-white">${e.price}</div>
              
              <div className="absolute right-4 top-4 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                <ArrowUpRight size={16} className="text-violet-500" />
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
          subtitle={selectedItem.category}
          image={`/images/equipment/${selectedItem.id}.jpg`}
          description={selectedItem.effect}
          stats={[
            { label: "Category", value: selectedItem.category },
            { label: "Price", value: `$${selectedItem.price}` },
            { label: "Level", value: selectedItem.level || "N/A" },
          ]}
          tags={[selectedItem.category, selectedItem.level ? `Tier ${selectedItem.level}` : "Standard"]}
          type="weapon"
        />
      )}
    </div>
  );
}
