"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, Crosshair, Backpack } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { playHoverSound } from "@/lib/sound";
import type { Equipment } from "@/lib/catalog";

export default function EquipmentSection({ equipment }: { equipment: Equipment[] }) {
  const showcase = equipment.slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);

  if (showcase.length === 0) return null;

  const activeItem = showcase[activeIndex];

  return (
    <section className="relative w-full overflow-hidden border-t border-border/50 py-24 bg-[#050505]">
      
      {/* Background Glow */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full bg-violet-600/10 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10 xl:px-16 mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-4">
            <Backpack size={14} /> Loadout
          </div>
          <h2 className="font-heading text-4xl font-bold uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Tactical <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Equipment</span>
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-400">
            Armor, helmets, ammo, and consumables. Build the perfect loadout before the match starts.
          </p>
        </div>
        <Link href="/equipment" className="group flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-bold text-black transition-all hover:scale-105">
          View All Equipment <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10 xl:px-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          
          {/* Left: Equipment Slot List */}
          <div className="flex flex-col gap-3">
            {showcase.map((e, i) => {
              const isActive = i === activeIndex;
              const Icon = e.category === "armor" || e.category === "helmet" ? Shield : e.category === "ammo" ? Crosshair : Backpack;
              const iconColor = e.category === "armor" || e.category === "helmet" ? "text-blue-500" : e.category === "ammo" ? "text-amber-500" : "text-emerald-500";

              return (
                <motion.div
                  key={e.id}
                  onMouseEnter={() => {
                    setActiveIndex(i);
                    playHoverSound("equipment");
                  }}
                  onClick={() => setActiveIndex(i)}
                  className={`group relative flex cursor-pointer items-center gap-5 rounded-2xl border p-4 transition-all duration-300 ${
                    isActive 
                      ? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_30px_rgba(139,92,246,0.15)]" 
                      : "border-white/5 bg-zinc-900/50 hover:border-white/20 hover:bg-zinc-900"
                  }`}
                >
                  {/* Active Indicator Line */}
                  {isActive && (
                    <motion.div layoutId="equip-indicator" className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-violet-500" />
                  )}

                  <div className={`relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black/50 border ${isActive ? "border-violet-500/50" : "border-white/10"}`}>
                    <Image
                      src={`/images/equipment/${e.id}.jpg`}
                      alt={e.name}
                      fill
                      className={`object-cover transition-all duration-500 ${isActive ? "scale-110 opacity-100" : "opacity-60"}`}
                      onError={(ev) => { (ev.target as HTMLImageElement).src = "/images/fallback-equipment.jpg"; }}
                    />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={14} className={iconColor} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{e.category}</span>
                    </div>
                    <h3 className={`font-heading text-xl font-bold uppercase tracking-wide transition-colors ${isActive ? "text-white" : "text-zinc-300"}`}>
                      {e.name}
                    </h3>
                  </div>

                  <div className={`font-mono text-lg font-black transition-colors ${isActive ? "text-violet-400" : "text-zinc-500"}`}>
                    ${e.price}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right: 3D Detail Showcase */}
          <div className="relative hidden lg:block h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotateY: -20 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] border border-violet-500/30 bg-zinc-900/80 p-8 shadow-[0_0_50px_rgba(139,92,246,0.15)] backdrop-blur-xl"
              >
                <div className="relative size-48 mb-6 drop-shadow-2xl">
                  <Image
                    src={`/images/equipment/${activeItem.id}.jpg`}
                    alt={activeItem.name}
                    fill
                    className="object-contain"
                    onError={(ev) => { (ev.target as HTMLImageElement).src = "/images/fallback-equipment.jpg"; }}
                  />
                </div>
                
                <div className="text-center w-full">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-1">{activeItem.category}</div>
                  <h4 className="font-heading text-3xl font-black uppercase text-white mb-2">{activeItem.name}</h4>
                  <p className="text-[13px] text-zinc-400 leading-relaxed mb-6">{activeItem.effect}</p>
                  
                  <div className="flex items-center justify-center gap-2">
                    <span className="rounded-full bg-white/5 px-4 py-1.5 text-[12px] font-bold text-white border border-white/10">
                      ${activeItem.price}
                    </span>
                    {activeItem.level && (
                      <span className="rounded-full bg-violet-500/20 px-4 py-1.5 text-[12px] font-bold text-violet-400 border border-violet-500/20">
                        Tier {activeItem.level}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}
