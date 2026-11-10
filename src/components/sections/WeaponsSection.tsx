"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { playHoverSound } from "@/lib/sound";
import type { Weapon } from "@/lib/catalog";

export default function WeaponsSection({ weapons }: { weapons: Weapon[] }) {
  if (!weapons || weapons.length === 0) return null;

  // Duplicate the weapons array so the marquee can loop seamlessly
  const duplicatedWeapons = [...weapons, ...weapons];

  return (
    <section className="relative w-full overflow-hidden border-t border-border/50 py-24">
      
      {/* Header */}
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10 xl:px-16 mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-accent mb-4">
            Arsenal
          </div>
          <h2 className="font-heading text-4xl font-bold uppercase tracking-wide text-foreground sm:text-5xl lg:text-6xl">
            All <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400">Weapons</span>
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            Browse the full arsenal. Hover to pause and inspect any weapon.
          </p>
        </div>
        <Link href="/weapons" className="group flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-bold text-black transition-all hover:scale-105">
          View Arsenal <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Marquee Container */}
      {/* We use a CSS group-hover pause so it stops when the user interacts */}
      <div className="relative flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        
        <motion.div 
          className="flex gap-6 w-max px-6"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            repeat: Infinity, 
            ease: "linear", 
            duration: 300 // Ultra slow, ambient cinematic speed
          }}
          style={{ willChange: "transform" }}
        >
          {duplicatedWeapons.map((w, i) => (
            <Link
              key={`${w.id}-${i}`}
              href="/weapons"
              onMouseEnter={() => playHoverSound("weapon")}
              // Increased height and width for bigger picture size
              className="group relative flex h-[450px] w-[340px] shrink-0 flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 transition-all duration-300 hover:border-accent/50"
            >
              <Image
                src={`/images/weapons/${w.id}.jpg`}
                alt={w.name}
                fill
                className="object-cover opacity-60 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100"
                onError={(e) => { (e.target as HTMLImageElement).src = "/images/fallback-weapon.jpg"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              <div className="relative z-10 p-6 translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-accent">{w.type.replace("_", " ")}</span>
                <h3 className="font-heading text-3xl font-bold uppercase tracking-wide text-white leading-tight mt-1">{w.name}</h3>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}


