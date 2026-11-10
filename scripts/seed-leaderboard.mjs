// Seeds 50 deterministic fake players into `competitiveRatings` AND the
// matching rows into `players` (so displayName joins resolve on the UI).
// Same database as the backend (`fps-game-database`). Idempotent.
//
// Usage:  node scripts/seed-leaderboard.mjs
//
// Requires MONGODB_URI in .env.local (same Atlas cluster as the backend).

import "dotenv/config";
import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";

// dotenv/config reads `.env` by default; Next.js uses `.env.local`.
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1] && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
  }
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set (checked env and .env.local)");
  process.exit(1);
}

// --- deterministic PRNG (mulberry32) ---------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261019);

// --- name pool -------------------------------------------------------------
const BASE = [
  "Viper", "Bulwark", "Umbra", "Talon", "Ash", "Cipher", "Ravager", "Sentinel",
  "Kestrel", "Hollow", "Wraith", "Sable", "Volt", "Echo", "Ronin", "Grim",
  "Nightfall", "Hornet", "Vandal", "Aegis", "Lattice", "Pyre", "Anchor", "Halo",
  "Drift", "Mirage", "Rift", "Onyx", "Bishop", "Fable", "Quill", "Kite",
  "Warden", "Thorn", "Glacier", "Ember", "Bastion", "Mako", "Orion", "Zephyr",
  "Falcon", "Specter", "Rook", "Tessellate", "Dune", "Cinder", "Vesper", "Lyric",
  "Copper", "Halcyon",
];

// --- tier derivation (mirrors backend + frontend) --------------------------
const TIERS = [
  { tier: "Bronze", minRating: 0 },
  { tier: "Silver", minRating: 1200 },
  { tier: "Gold", minRating: 1500 },
  { tier: "Platinum", minRating: 1800 },
  { tier: "Diamond", minRating: 2100 },
  { tier: "Master", minRating: 2400 },
  { tier: "Legendary", minRating: 2800, divisionless: true },
];
function deriveTier(rating) {
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

// --- rating distribution ---------------------------------------------------
const BUCKETS = [
  { count: 30, min: 1000, max: 1800 },
  { count: 12, min: 1800, max: 2400 },
  { count: 6, min: 2400, max: 2800 },
  { count: 2, min: 2800, max: 2950 },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("fps-game-database");
  const ratingsCol = db.collection("competitiveRatings");
  const playersCol = db.collection("players");

  const now = new Date();
  const ratingDocs = [];
  const playerDocs = [];
  const used = new Set();

  let index = 0;
  for (const bucket of BUCKETS) {
    for (let i = 0; i < bucket.count; i++) {
      index += 1;

      let name;
      if (index - 1 < BASE.length) {
        name = BASE[index - 1];
      } else {
        const base = BASE[(index - 1) % BASE.length];
        name = `${base}${Math.floor((index - 1) / BASE.length)}`;
      }
      let suffix = 1;
      const original = name;
      while (used.has(name)) {
        name = `${original}_${suffix++}`;
      }
      used.add(name);

      const playerId = `player_seed_${String(index).padStart(3, "0")}`;
      const rating = Math.floor(bucket.min + rand() * (bucket.max - bucket.min));

      ratingDocs.push({
        _id: playerId,
        rating,
        lastAppliedSequence: 1,
        updatedAt: now,
      });

      playerDocs.push({
        _id: playerId,
        displayName: name,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Upsert both collections
  const ratingOps = ratingDocs.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: doc },
      upsert: true,
    },
  }));
  const playerOps = playerDocs.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: doc },
      upsert: true,
    },
  }));

  const ratingResult = await ratingsCol.bulkWrite(ratingOps, { ordered: false });
  const playerResult = await playersCol.bulkWrite(playerOps, { ordered: false });

  const tierCounts = {};
  for (const d of ratingDocs) {
    const t = deriveTier(d.rating).tier;
    tierCounts[t] = (tierCounts[t] || 0) + 1;
  }

  console.log(
    `Seeded ${ratingDocs.length} players into fps-game-database.competitiveRatings`,
  );
  console.log(
    `  ratings  inserted: ${ratingResult.upsertedCount}, modified: ${ratingResult.modifiedCount}`,
  );
  console.log(
    `  players  inserted: ${playerResult.upsertedCount}, modified: ${playerResult.modifiedCount}`,
  );
  console.log("  tier distribution:");
  for (const [tier, count] of Object.entries(tierCounts)) {
    console.log(`    ${tier.padEnd(10)} ${count}`);
  }

  const top = await ratingsCol
    .find({})
    .sort({ rating: -1, _id: 1 })
    .limit(5)
    .toArray();
  console.log("  top 5:");
  for (const p of top) {
    const t = deriveTier(p.rating);
    const player = await playersCol.findOne({ _id: p._id });
    console.log(
      `    ${(player?.displayName ?? p._id).padEnd(14)} ${String(p.rating).padStart(4)}  ${t.tier} ${t.division}`,
    );
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});