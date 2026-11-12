export interface ProfileIdentity {
  playerId: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
}

export interface TierInfo {
  tier: string;
  division: number;
}

export interface Career {
  matches: number;
  kills: number;
  deaths: number;
  damage: number;
  score: number;
  bestScore: number;
  survivalSeconds: number;
  kd: number;
  wins: number;
  losses: number;
}

export interface RecentMatch {
  matchId: string;
  gameModeId: string | null;
  kills: number;
  deaths: number;
  score: number;
  damage: number;
  ratingDelta: number | null;
  at: string;
}

export interface Overview {
  memberSince: string | null;
  rating: number | null;
  tier: TierInfo | null;
  rank: number | null;
  ratedPlayers: number;
  career: Career;
  ratingHistory: { rating: number; at: string }[];
  recentMatches: RecentMatch[];
}
