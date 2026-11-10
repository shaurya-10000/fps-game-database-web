import "server-only";
import { getDb } from "./db";
import {
  deriveTier,
  type LeaderboardEntry,
  type LeaderboardFilters,
  type LeaderboardPage,
  type TierResult,
} from "./leaderboard-shared";

// Re-export the shared bits so server callers can keep importing from here.
export type {
  LeaderboardEntry,
  LeaderboardFilters,
  LeaderboardPage,
  TierName,
  TierResult,
} from "./leaderboard-shared";
export { TIER_BOUNDS, deriveTier } from "./leaderboard-shared";

interface RawRatingDoc {
  _id: string;
  rating: number;
  lastAppliedSequence?: number;
  updatedAt?: Date;
}

interface PlayerDoc {
  _id: string;
  displayName?: string;
}

function decodeCursor(
  cursor: string,
): { rating: number; playerId: string } | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64").toString("utf-8"),
    ) as { rating?: unknown; playerId?: unknown };
    if (
      typeof parsed.rating === "number" &&
      typeof parsed.playerId === "string"
    ) {
      return { rating: parsed.rating, playerId: parsed.playerId };
    }
  } catch {
    /* fall through */
  }
  return null;
}

function encodeCursor(rating: number, playerId: string): string {
  return Buffer.from(JSON.stringify({ rating, playerId })).toString("base64");
}

function buildRangeFilter(
  filters: LeaderboardFilters,
): Record<string, unknown> {
  const range: Record<string, number> = {};
  if (typeof filters.minRating === "number") range.$gte = filters.minRating;
  if (typeof filters.maxRating === "number") range.$lt = filters.maxRating;
  return Object.keys(range).length > 0 ? { rating: range } : {};
}

async function hydrateDisplayNames(
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const db = await getDb();
  const players = await db
    .collection<PlayerDoc>("players")
    .find({ _id: { $in: ids } }, { projection: { _id: 1, displayName: 1 } })
    .toArray();
  const map = new Map<string, string>();
  for (const p of players) {
    if (p.displayName) map.set(p._id, p.displayName);
  }
  return map;
}

export async function getLeaderboardUncached(
  limit = 25,
  cursor?: string,
  filters: LeaderboardFilters = {},
): Promise<LeaderboardPage> {
  const db = await getDb();
  const col = db.collection<RawRatingDoc>("competitiveRatings");

  const rangeFilter = buildRangeFilter(filters);
  let query: Record<string, unknown> = { ...rangeFilter };

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      const cursorClause = {
        $or: [
          { rating: { $lt: decoded.rating } },
          { rating: decoded.rating, _id: { $gt: decoded.playerId } },
        ],
      };
      query =
        Object.keys(rangeFilter).length > 0
          ? { $and: [rangeFilter, cursorClause] }
          : cursorClause;
    }
  }

  const [docs, total] = await Promise.all([
    col.find(query).sort({ rating: -1, _id: 1 }).limit(limit + 1).toArray(),
    col.countDocuments(rangeFilter),
  ]);

  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;

  let rankOffset = 1;
  if (cursor && pageDocs.length > 0) {
    const first = pageDocs[0]!;
    const firstQuery =
      Object.keys(rangeFilter).length > 0
        ? {
            $and: [
              rangeFilter,
              {
                $or: [
                  { rating: { $gt: first.rating } },
                  { rating: first.rating, _id: { $lt: first._id } },
                ],
              },
            ],
          }
        : {
            $or: [
              { rating: { $gt: first.rating } },
              { rating: first.rating, _id: { $lt: first._id } },
            ],
          };
    const higher = await col.countDocuments(firstQuery);
    rankOffset = higher + 1;
  }

  const names = await hydrateDisplayNames(pageDocs.map((d) => d._id));

  const entries: LeaderboardEntry[] = pageDocs.map((d, i) => {
    const t: TierResult = deriveTier(d.rating);
    return {
      _id: d._id,
      displayName: names.get(d._id) ?? d._id,
      rating: d.rating,
      tier: t.tier,
      division: t.division,
      rank: rankOffset + i,
    };
  });

  const last = pageDocs[pageDocs.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor(last.rating, last._id) : undefined;

  return { entries, total, nextCursor };
}

// Cached, server-only wrapper. Kept separate from the uncached variant so
// route handlers (which must always be fresh) can call the uncached one.
export async function getLeaderboard(
  limit = 25,
  cursor?: string,
  filters: LeaderboardFilters = {},
): Promise<LeaderboardPage> {
  "use cache";
  const { cacheLife, cacheTag } = await import("next/cache");
  cacheLife("minutes");
  cacheTag("leaderboard");
  return getLeaderboardUncached(limit, cursor, filters);
}