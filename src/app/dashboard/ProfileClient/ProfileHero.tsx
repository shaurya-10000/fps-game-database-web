"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Crown, Pencil, Settings, Trophy } from "lucide-react";
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
  onSettings: () => void;
}

const GRID =
  "[background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]";

export default function ProfileHero({ identity, progression, overview, onEdit, onSettings }: ProfileHeroProps) {
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
  const bannerColor = tierDef ? `linear-gradient(120deg, ${tierDef.from}55, ${tierDef.to}22 60%, transparent)` : "linear-gradient(120deg, color-mix(in srgb, var(--accent) 35%, transparent), transparent 70%)";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-surface">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-36 sm:h-44" style={{ backgroundImage: bannerColor }} />
      <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-36 opacity-40 sm:h-44 ${GRID}`} />

      <div className="relative flex flex-col gap-6 px-5 pb-6 pt-16 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pt-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="relative w-fit">
            <LevelRing size={124} percent={progression?.progressPercent ?? 0}>
              <div
                aria-hidden="true"
                className="flex size-[104px] items-center justify-center rounded-full bg-background text-4xl font-bold tracking-tight text-accent shadow-xl"
              >
                {getInitials(identity.displayName)}
              </div>
            </LevelRing>
            {progression && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 font-mono text-[11px] font-bold text-background shadow-md ring-2 ring-surface">
                LVL {progression.level}
              </span>
            )}
          </div>

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
          <button
            type="button"
            onClick={onSettings}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground/5"
          >
            <Settings size={14} /> Chat settings
          </button>
        </div>
      </div>
    </section>
  );
}