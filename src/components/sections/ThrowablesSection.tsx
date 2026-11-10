"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bomb, Flame, Cloud, Zap, Crosshair, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { playHoverSound } from "@/lib/sound";
import type { Throwable } from "@/lib/catalog";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  frag: <Bomb size={24} />,
  smoke: <Cloud size={24} />,
  flash: <Zap size={24} />,
  incendiary: <Flame size={24} />,
  decoy: <Crosshair size={24} />,
  emp: <ShieldAlert size={24} />,
  healing: <ShieldAlert size={24} />,
  stun: <Zap size={24} />,
};

const TYPE_COLORS: Record<string, { text: string, bg: string, border: string, glow: string }> = {
  frag: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "group-hover:shadow-[0_0_40px_rgba(244,63,94,0.15)]" },
  smoke: { text: "text-zinc-300", bg: "bg-zinc-500/10", border: "border-zinc-500/20", glow: "group-hover:shadow-[0_0_40px_rgba(161,161,170,0.15)]" },
  flash: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "group-hover:shadow-[0_0_40px_rgba(251,191,36,0.15)]" },
  incendiary: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", glow: "group-hover:shadow-[0_0_40px_rgba(249,115,22,0.15)]" },
  decoy: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "group-hover:shadow-[0_0_40px_rgba(96,165,250,0.15)]" },
  emp: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", glow: "group-hover:shadow-[0_0_40px_rgba(192,132,252,0.15)]" },
  healing: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "group-hover:shadow-[0_0_40px_rgba(52,211,153,0.15)]" },
  stun: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", glow: "group-hover:shadow-[0_0_40px_rgba(250,204,21,0.15)]" },
};

export default function ThrowablesSection({ throwables }: { throwables: Throwable[] }) {
  const showcase = throwables.slice(0, 4);

  return (
    <section className="relative w-full overflow-hidden border-t border-border/50 py-24 bg-[#050505]">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10 xl:px-16 mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-rose-400 mb-4">
            <Bomb size={14} /> Utility
          </div>
          <h2 className="font-heading text-4xl font-bold uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Tactical <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Throwables</span>
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-400">
            Damage, radius, duration, and price. The utility layer that decides rounds.
          </p>
        </div>
        <Link href="/throwables" className="group flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-bold text-black transition-all hover:scale-105">
          View All Throwables <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Throwables Rack */}
      <div className="relative z-10 mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10 xl:px-16 grid gap-6 md:grid-cols-2">
        {showcase.map((t, i) => {
          const style = TYPE_COLORS[t.type] || TYPE_COLORS.frag;
          const Icon = TYPE_ICONS[t.type] || <Bomb size={24} />;

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              onMouseEnter={() => playHoverSound("throwable")}
            >
              <Link
                href="/throwables"
                className={`group relative flex h-[220px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-white/20 ${style.glow}`}
              >
                {/* Type Specific Background Glow */}
                <div className={`absolute -right-20 -top-20 size-64 rounded-full blur-[80px] transition-opacity duration-500 opacity-20 group-hover:opacity-50 ${style.bg}`} />

                {/* Top Row: Icon & Price */}
                <div className="relative z-10 flex items-start justify-between">
                  <div className={`flex size-14 items-center justify-center rounded-2xl border ${style.bg} ${style.border} ${style.text} shadow-lg`}>
                    {Icon}
                  </div>
                  <div className="font-mono text-2xl font-black text-white">
                    ${t.price}
                  </div>
                </div>

                {/* Bottom Row: Name, Type, Stats */}
                <div className="relative z-10 flex items-end justify-between">
                  <div>
                    <div className={`text-[11px] font-bold uppercase tracking-widest ${style.text} mb-1`}>
                      {t.type}
                    </div>
                    <h3 className="font-heading text-4xl font-black uppercase tracking-wide text-white">
                      {t.name}
                    </h3>
                  </div>

                  {/* Stats Pills */}
                  <div className="flex gap-2">
                    <div className="flex flex-col items-center rounded-xl bg-black/50 px-4 py-2 border border-white/5 backdrop-blur-md">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Radius</span>
                      <span className="text-[15px] font-black text-white">{t.radiusMeters}m</span>
                    </div>
                    <div className="flex flex-col items-center rounded-xl bg-black/50 px-4 py-2 border border-white/5 backdrop-blur-md">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Time</span>
                      <span className="text-[15px] font-black text-white">{t.durationMs === 0 ? "Inst" : `${t.durationMs / 1000}s`}</span>
                    </div>
                  </div>
                </div>

                {/* Floating Background Watermark Image */}
                <div className="absolute -right-6 -bottom-10 h-[180px] w-[180px] opacity-10 transition-all duration-700 group-hover:opacity-30 group-hover:scale-110 group-hover:-rotate-12">
                  <Image
                    src={`/images/throwables/${t.id}.jpg`}
                    alt={t.name}
                    fill
                    className="object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/fallback-throwable.jpg"; }}
                  />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
