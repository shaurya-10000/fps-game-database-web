"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface ShowcaseItem {
  id: string;
  name: string;
  image: string;
  subtitle: string;
}

interface SectionShowcaseProps {
  kicker: string;
  title: string;
  description: string;
  href: string;
  items: ShowcaseItem[];
}

export function SectionShowcase({ kicker, title, description, href, items }: SectionShowcaseProps) {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 lg:px-10 xl:px-16 border-t border-border/50 first:border-t-0">
      <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-accent mb-2">
            {kicker}
          </div>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-[16px]">
            {description}
          </p>
        </div>
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-2 rounded-xl bg-surface border border-border px-5 py-2.5 text-[13px] font-bold text-foreground transition-all hover:bg-foreground hover:text-background"
        >
          View All
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, idx) => (
          <Link
            key={item.id}
            href={`${href}#${item.id}`}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-2xl hover:shadow-accent/5 ${
              idx === 0 ? "sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2" : ""
            }`}
          >
            {/* Image */}
            <div className={`relative w-full overflow-hidden bg-zinc-900 ${idx === 0 ? "aspect-square lg:aspect-auto lg:flex-1" : "aspect-[4/3]"}`}>
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Fallback logic based on the section
                  if (href.includes("weapons")) target.src = "/images/fallback-weapon.jpg";
                  else if (href.includes("characters")) target.src = "/images/fallback-character.jpg";
                  else if (href.includes("maps")) target.src = "/images/fallback-map.jpg";
                  else if (href.includes("modes")) target.src = "/images/fallback-mode.jpg";
                  else if (href.includes("throwables")) target.src = "/images/fallback-throwable.jpg";
                  else target.src = "/images/fallback-equipment.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                {item.subtitle}
              </div>
              <h3 className={`font-black tracking-tight text-white ${idx === 0 ? "text-3xl lg:text-4xl" : "text-xl"}`}>
                {item.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

