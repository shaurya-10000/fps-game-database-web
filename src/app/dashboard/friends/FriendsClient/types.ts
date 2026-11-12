export interface Friend {
  rowId: string;
  playerId: string;
  name: string;
  /** When you became friends. */
  since: string;
  avatarUrl?: string | null;
}

export interface RequestRow {
  rowId: string;
  playerId: string;
  name: string;
  at: string;
}

export interface BlockedPlayer {
  playerId: string;
  name: string;
  at: string;
}

export type TabId = "friends" | "requests" | "add" | "blocked";

export type Relation = "friend" | "incoming" | "outgoing" | "blocked" | "none";
