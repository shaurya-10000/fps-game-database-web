"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crosshair, Shield, MapPin, Target } from "lucide-react";

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  image: string;
  description?: string;
  stats: { label: string; value: string | number }[];
  tags?: string[];
  type: "weapon" | "character" | "map" | "mode";
}

export default function DetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  image,
  description,
  stats,
  tags,
  type,
}: DetailModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const TypeIcon = type === "weapon" ? <Crosshair size={18} /> 
                 : type === "character" ? <Shield size={18} />
                 : type === "map" ? <MapPin size={18} />
                 : <Target size={18} />;

  const typeColor = type === "weapon" ? "text-accent bg-accent/10 border-accent/20"
                  : type === "character" ? "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20"
                  : type === "map" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                  : "text-amber-500 bg-amber-500/10 border-amber-500/20";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl md:flex-row"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-full bg-black/50 p-2 text-white/70 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>

            {/* Left: Image Panel */}
            <div className="relative h-64 w-full shrink-0 md:h-auto md:w-1/2">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/images/fallback-weapon.jpg"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent md:bg-gradient-to-r md:from-transparent md:to-zinc-950" />
            </div>

            {/* Right: Details Panel */}
            <div className="flex flex-1 flex-col justify-center p-6 md:p-10">
              
              <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-4 ${typeColor}`}>
                {TypeIcon} {subtitle}
              </div>

              <h2 className="font-heading text-4xl font-black uppercase tracking-wide text-white sm:text-5xl">
                {title}
              </h2>

              {description && (
                <p className="mt-4 text-[14px] leading-relaxed text-zinc-400">
                  {description}
                </p>
              )}

              {/* Stats Grid */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                {stats.map((stat, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{stat.label}</div>
                    <div className="text-xl font-black text-white">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
