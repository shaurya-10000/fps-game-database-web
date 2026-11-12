"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Copy, Crown, Pencil, Trophy, Image as ImageIcon } from "lucide-react";
import type { ProgressionSnapshot } from "@/lib/api-types";
import LevelRing from "./LevelRing";
import { formatDate, formatNumber, getInitials, shortId } from "./format";
import { findTier, tierGradient, tierLabel } from "./tiers";
import type { Overview, ProfileIdentity } from "./types";

interface ProfileHeroProps {
  identity: ProfileIdentity;
  progression: ProgressionSnapshot | null;
  overview: Overview | null;
  onEdit: () => void;
  onAvatarClick?: () => void;
  onBannerClick?: () => void;
}

export default function ProfileHero({ identity, progression, overview, onEdit, onAvatarClick, onBannerClick }: ProfileHeroProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(identity.playerId);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable.
    }
  };

  const tier = overview?.tier ?? null;
  const tierDef = findTier(tier?.tier);
  const fallbackGradient = tierDef 
    ? `linear-gradient(120deg, ${tierDef.from}55, ${tierDef.to}22 60%, transparent)` 
    : "linear-gradient(120deg, color-mix(in srgb, var(--accent) 35%, transparent), transparent 70%)";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border">
      {/* Full Background (Image or Gradient) */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-300 group/banner"
        style={{ backgroundImage: identity.bannerUrl ? `url(${identity.bannerUrl})` : fallbackGradient }}
      >
        {/* Gradient Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        
        {/* Edit Banner Button (Hover on desktop, always visible on mobile) */}
        {onBannerClick && (
          <button
            type="button"
            onClick={onBannerClick}
            className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-md transition-all hover:bg-black/60 md:opacity-0 md:group-hover/banner:opacity-100"
            aria-label="Change banner"
          >
            <ImageIcon size={14} />
            Edit Banner
          </button>
        )}
      </div>

      <div className="relative flex flex-col gap-6 px-5 pb-6 pt-32 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pt-40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <button
            type="button"
            onClick={onAvatarClick}
            aria-label="Change profile picture"
            className="group relative w-fit cursor-pointer"
          >
            <LevelRing size={124} percent={progression?.progressPercent ?? 0}>
              {identity.avatarUrl ? (
                <img
                  src={identity.avatarUrl}
                  alt={identity.displayName}
                  className="size-[104px] rounded-full object-cover shadow-xl"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex size-[104px] items-center justify-center rounded-full bg-background text-4xl font-bold tracking-tight text-accent shadow-xl"
                >
                  {getInitials(identity.displayName)}
                </div>
              )}
            </LevelRing>
            {onAvatarClick && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={24} className="text-white" />
              </span>
            )}
            {progression && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 font-mono text-[11px] font-bold text-background shadow-md ring-2 ring-surface">
                LVL {progression.level}
              </span>
            )}
          </button>

          <div className="min-w-0 pb-1">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{identity.displayName || "Player"}</h1>
            <p className="mt-0.5 text-[14px] text-muted">@{identity.username}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {tier ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold text-white shadow-sm"
                  style={{ background: tierGradient(tier.tier) }}
                >
                  <Crown size={13} /> {tierLabel(tier.tier, tier.division)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[12px] font-medium text-muted">
                  <Crown size={13} /> Unranked
                </span>
              )}
              {overview?.rank != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[12px] font-medium text-foreground">
                  <Trophy size={13} className="text-amber-500" /> #{formatNumber(overview.rank)}
                  <span className="text-muted">of {formatNumber(overview.ratedPlayers)}</span>
                </span>
              )}
              {overview?.memberSince && (
                <span className="rounded-full border border-border bg-background px-3 py-1 text-[12px] text-muted">
                  Member since {formatDate(overview.memberSince)}
                </span>
              )}
              {identity.playerId && (
                <button
                  type="button"
                  onClick={copyId}
                  aria-label="Copy player ID"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 font-mono text-[11px] text-muted transition-colors hover:text-foreground"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {copied ? "Copied" : shortId(identity.playerId)}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 sm:flex-col sm:items-stretch">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background shadow-sm transition-opacity hover:opacity-90"
          >
            <Pencil size={14} /> Edit profile
          </button>
        </div>
      </div>
    </section>
  );
}


