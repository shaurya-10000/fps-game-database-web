"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Stats = {
  weapons: number;
  characters: number;
  maps: number;
  modes: number;
  throwables: number;
  equipment: number;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function PreviewGrid({ stats }: { stats: Stats }) {
  const items = [
    {
      href: "/weapons",
      label: "Weapons",
      count: stats.weapons,
      blurb:
        "Full ballistics — damage, falloff, recoil, spread, penetration.",
    },
    {
      href: "/characters",
      label: "Characters",
      count: stats.characters,
      blurb: "Five roles, five characters each. Abilities and difficulty.",
    },
    {
      href: "/maps",
      label: "Maps",
      count: stats.maps,
      blurb: "Size, cover, and the game modes each map supports.",
    },
    {
      href: "/modes",
      label: "Game Modes",
      count: stats.modes,
      blurb:
        "Team sizes, rounds per match, and ranked / unranked buckets.",
    },
    {
      href: "/throwables",
      label: "Throwables",
      count: stats.throwables,
      blurb:
        "Frag, smoke, flash, incendiary, decoy, EMP, healing, stun.",
    },
    {
      href: "/equipment",
      label: "Equipment",
      count: stats.equipment,
      blurb: "Armor, helmets, ammo types, and consumables.",
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <motion.div
          key={item.href}
          custom={i}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <Link href={item.href}>
            <Card className="group relative overflow-hidden border-white/10 bg-slate-900/50 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.25)]">
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/5 blur-2xl transition-opacity group-hover:opacity-100 opacity-50" />
              <CardHeader className="flex flex-row items-baseline justify-between space-y-0">
                <CardTitle className="text-base font-semibold text-white">
                  {item.label}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-cyan-400/20 bg-cyan-400/5 font-mono text-cyan-300"
                >
                  {item.count}
                </Badge>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed text-slate-400">
                  {item.blurb}
                </CardDescription>
                <span className="mt-4 inline-flex items-center text-xs font-semibold text-slate-300 transition-colors group-hover:text-cyan-300">
                  Browse →
                </span>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
