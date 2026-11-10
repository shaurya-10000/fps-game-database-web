// Shared constants and types — NO server imports here.
// Safe to import from Client Components.

export type TierName =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Master"
  | "Legendary";

export interface TierResult {
  tier: TierName;
  division: number;
}

export interface LeaderboardEntry {
  _id: string;
  displayName: string;
  rating: number;
  tier: TierName;
  division: number;
  rank: number;
}

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  nextCursor?: string;
  total: number;
}

export interface LeaderboardFilters {
  minRating?: number;
  maxRating?: number;
}

const TIERS: { tier: TierName; minRating: number; divisionless?: boolean }[] = [
  { tier: "Bronze", minRating: 0 },
  { tier: "Silver", minRating: 1200 },
  { tier: "Gold", minRating: 1500 },
  { tier: "Platinum", minRating: 1800 },
  { tier: "Diamond", minRating: 2100 },
  { tier: "Master", minRating: 2400 },
  { tier: "Legendary", minRating: 2800, divisionless: true },
];

export const TIER_BOUNDS: Record<TierName, { min: number; max: number }> = {
  Bronze: { min: 0, max: 1200 },
  Silver: { min: 1200, max: 1500 },
  Gold: { min: 1500, max: 1800 },
  Platinum: { min: 1800, max: 2100 },
  Diamond: { min: 2100, max: 2400 },
  Master: { min: 2400, max: 2800 },
  Legendary: { min: 2800, max: Number.MAX_SAFE_INTEGER },
};

export function deriveTier(rating: number): TierResult {
  const sorted = [...TIERS].sort((a, b) => b.minRating - a.minRating);
  for (const rule of sorted) {
    if (rating >= rule.minRating) {
      if (rule.divisionless) return { tier: rule.tier, division: 1 };
      const division =
        3 - Math.min(2, Math.floor((rating - rule.minRating) / 100));
      return { tier: rule.tier, division: Math.max(1, division) };
    }
  }
  return { tier: "Bronze", division: 3 };
}