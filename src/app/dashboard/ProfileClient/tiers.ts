export interface TierDef {
  name: string;
  /** Minimum rating for this tier. */
  min: number;
  from: string;
  to: string;
}

/** Mirrors the backend's tier thresholds. */
export const TIERS: TierDef[] = [
  { name: "Bronze", min: 0, from: "#b45309", to: "#f59e0b" },
  { name: "Silver", min: 1200, from: "#64748b", to: "#cbd5e1" },
  { name: "Gold", min: 1500, from: "#f59e0b", to: "#fde047" },
  { name: "Platinum", min: 1800, from: "#06b6d4", to: "#67e8f9" },
  { name: "Diamond", min: 2100, from: "#3b82f6", to: "#a5b4fc" },
  { name: "Master", min: 2400, from: "#a855f7", to: "#f0abfc" },
  { name: "Legendary", min: 2800, from: "#f43f5e", to: "#fb923c" },
];

const ROMAN = ["", "I", "II", "III"];

export function findTier(name: string | undefined): TierDef | undefined {
  return TIERS.find((t) => t.name === name);
}

export function tierLabel(tier: string, division: number): string {
  return tier === "Legendary" ? tier : `${tier} ${ROMAN[division] ?? ""}`.trim();
}

/** How far through the current tier the player is, and what is next. */
export function tierProgress(rating: number, tierName: string): { percent: number; remaining: number; next: TierDef | null } {
  const index = TIERS.findIndex((t) => t.name === tierName);
  const current = TIERS[index];
  const next = index >= 0 ? (TIERS[index + 1] ?? null) : null;
  if (!current || !next) return { percent: 100, remaining: 0, next: null };
  const span = next.min - current.min;
  const percent = Math.min(100, Math.max(0, ((rating - current.min) / span) * 100));
  return { percent, remaining: Math.max(0, next.min - rating), next };
}

export function tierGradient(tierName: string | undefined): string {
  const tier = findTier(tierName);
  return tier ? `linear-gradient(135deg, ${tier.from}, ${tier.to})` : "linear-gradient(135deg, var(--accent), var(--accent))";
}