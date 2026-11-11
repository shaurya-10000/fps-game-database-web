"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Map as MapIcon, MapPin } from "lucide-react";
import { motion, PanInfo } from "framer-motion";
import { useState, useEffect } from "react";
import { playHoverSound } from "@/lib/sound";
import type { MapDefinition } from "@/lib/catalog";

export default function MapsSection({ maps }: { maps: MapDefinition[] }) {
  // Use ALL maps now instead of slicing
  const allMaps = maps;
  const totalMaps = allMaps.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size to adjust carousel spacing
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (totalMaps === 0) return null;

  // Handle swipe gestures
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      // Swiped left -> next map
      setActiveIndex((prev) => (prev + 1) % totalMaps);
      playHoverSound("map");
    } else if (info.offset.x > swipeThreshold) {
      // Swiped right -> previous map
      setActiveIndex((prev) => (prev - 1 + totalMaps) % totalMaps);
      playHoverSound("map");
    }
  };

  return (
    <section className="relative w-full overflow-hidden border-t border-border/50 py-32 bg-[#050505]">
      
      {/* Holographic Radar Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full border border-emerald-500/10 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_60%)]" />
        <div className="absolute w-[600px] h-[600px] rounded-full border border-emerald-500/20" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-emerald-500/30" />
        <div className="absolute w-[200px] h-[200px] rounded-full border border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.2)]" />
      </div>

      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10 xl:px-16 mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-4">
            <MapIcon size={14} /> Tactical Arenas
          </div>
          <h2 className="font-heading text-4xl font-bold uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Battleground</span>
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-400">
            Study the layout, know the cover, and control the map.
          </p>
        </div>
        <Link href="/maps" className="group flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-bold text-black transition-all hover:scale-105">
          View All Maps <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* 3D Holographic Carousel */}
      <div className="relative z-10 flex h-[400px] md:h-[500px] w-full items-center justify-center [perspective:1200px]">
        {allMaps.map((m, i) => {
          // Calculate relative position in the carousel
          let offset = i - activeIndex;
          
          // Wrap the offset so it loops infinitely (e.g., if active is 0, the last item is at -1)
          if (offset < -Math.floor(totalMaps / 2)) offset += totalMaps;
          if (offset > Math.floor(totalMaps / 2)) offset -= totalMaps;

          const isActive = offset === 0;
          const isLeft = offset < 0;
          const isRight = offset > 0;

          // Adjust 3D spacing on mobile vs desktop
          const xOffset = isMobile ? 200 : 350; 
          const zOffset = isMobile ? 100 : 200;

          const xPos = offset * xOffset;
          const zPos = Math.abs(offset) * -zOffset; // Push side cards backwards
          const scale = isActive ? 1 : Math.max(0.6, 0.85 - Math.abs(offset) * 0.05);
          const rotateY = isLeft ? 15 : isRight ? -15 : 0;
          const zIndex = 10 - Math.abs(offset);
          const opacity = isActive ? 1 : Math.max(0.2, 0.6 - Math.abs(offset) * 0.1);

          return (
            <motion.div
              key={m.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              onClick={() => {
                if (!isActive) {
                  setActiveIndex(i);
                  playHoverSound("map");
                }
              }}
              onMouseEnter={() => {
                if (!isMobile && !isActive) {
                  setActiveIndex(i);
                  playHoverSound("map");
                }
              }}
              animate={{
                x: xPos,
                z: zPos,
                scale,
                rotateY,
                zIndex,
                opacity,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className={`absolute group cursor-grab active:cursor-grabbing overflow-hidden rounded-[2rem] border bg-zinc-950 transition-colors duration-500 
                ${isActive ? "border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]" : "border-white/10"}`}
              style={{ 
                width: isMobile ? "300px" : "600px", 
                height: isMobile ? "380px" : "400px",
                transformStyle: "preserve-3d"
              }}
            >
              <Image
                src={`/images/maps/${m.id}.jpg`}
                alt={m.name}
                fill
                draggable={false} 
                className={`object-cover transition-all duration-700 ${isActive ? "opacity-100 group-hover:scale-105" : "opacity-40 grayscale group-hover:grayscale-0"}`}
                onError={(e) => { (e.target as HTMLImageElement).src = "/images/fallback-map.jpg"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
              
              {/* Hologram Scanline Effect */}
              {isActive && (
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none mix-blend-overlay" />
              )}

              <div className="absolute top-4 left-4 md:top-6 md:left-6 flex gap-2 pointer-events-none">
                <span className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 md:px-4 md:py-1.5 text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                  <MapPin size={12} /> {m.size}
                </span>
              </div>

              <div className={`absolute bottom-0 w-full p-6 md:p-8 transition-transform duration-500 pointer-events-none ${isActive ? "translate-y-0" : "translate-y-4"}`}>
                <h3 className="font-heading text-3xl md:text-5xl font-black uppercase tracking-wide text-white drop-shadow-lg">
                  {m.name}
                </h3>
                <div className={`mt-3 md:mt-4 flex flex-wrap gap-2 transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0"}`}>
                  {m.gameModes.map((g) => (
                    <span key={g} className="rounded-md bg-white/10 backdrop-blur-md px-2 py-1 md:px-3 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-white border border-white/5">
                      {g.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Navigation Dots */}
      <div className="mt-12 flex flex-wrap justify-center gap-3 relative z-10 px-4 max-w-4xl mx-auto">
        {allMaps.map((_, i) => (
          <button
            key={i}
            onClick={() => { setActiveIndex(i); playHoverSound("map"); }}
            className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex ? "w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "w-2 bg-white/20 hover:bg-white/40"}`}
            aria-label={`Go to map ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
