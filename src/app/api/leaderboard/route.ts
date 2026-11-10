import { NextResponse } from "next/server";
import { getLeaderboardUncached } from "@/lib/leaderboard";

function parseIntOrUndefined(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get("limit") ?? "25");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 100)
    : 25;
  const cursor = searchParams.get("cursor") ?? undefined;
  const minRating = parseIntOrUndefined(searchParams.get("minRating"));
  const maxRating = parseIntOrUndefined(searchParams.get("maxRating"));

  const page = await getLeaderboardUncached(limit, cursor, {
    ...(minRating !== undefined ? { minRating } : {}),
    ...(maxRating !== undefined ? { maxRating } : {}),
  });
  return NextResponse.json(page);
}