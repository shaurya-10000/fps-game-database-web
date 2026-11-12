// Shapes returned by the backend REST API that the dashboard consumes.

export interface Me {
  _id: string;
  displayName: string;
  status: "active" | "suspended" | "banned";
  createdAt: string;
  updatedAt: string;
}

export interface FriendshipRow {
  _id: string;
  fromPlayerId: string;
  toPlayerId: string;
  status: "pending" | "accepted";
  createdAt: string;
  acceptedAt?: string;
}

export interface FriendSummary {
  playerId: string;
  displayName: string;
  since?: string;
  avatarUrl?: string | null;
}

export interface ProgressionSnapshot {
  playerId: string;
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercent: number;
}
