import { getDb } from "./db";

export type WeaponType =
  | "assault_rifle"
  | "smg"
  | "sniper"
  | "lmg"
  | "pistol"
  | "shotgun"
  | "melee";

export type CharacterRole =
  | "assault"
  | "sniper"
  | "controller"
  | "support"
  | "tank";

export type GameModeId =
  | "team_deathmatch"
  | "free_for_all"
  | "bomb_defusal"
  | "battle_royale";

export type ThrowableType =
  | "frag"
  | "smoke"
  | "flash"
  | "incendiary"
  | "decoy"
  | "emp"
  | "healing"
  | "stun";

export interface WeaponStats {
  damage: number;
  fireRate: number;
  magazineSize: number;
  reloadTimeMs: number;
  headshotMultiplier: number;
  rangeMeters: number;
  falloffStartMeters: number;
  falloffEndMeters: number;
  minDamage: number;
  recoilVertical: number;
  recoilHorizontal: number;
  spread: number;
  penetration: number;
  isAutomatic: boolean;
}

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  price: number;
  stats: WeaponStats;
}

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  difficulty: "easy" | "medium" | "hard";
  abilities: string[];
  description: string;
}

export interface MapDefinition {
  id: string;
  name: string;
  description: string;
  gameModes: GameModeId[];
  size: "small" | "medium" | "large";
  hasCover: boolean;
}

export interface GameMode {
  id: GameModeId;
  name: string;
  description: string;
  buckets: ("ranked" | "unranked")[];
  teamSize: number;
  roundsPerMatch: number;
  battleRoyaleTeamSizes?: number[];
}

export interface Throwable {
  id: string;
  name: string;
  type: ThrowableType;
  damage: number;
  radiusMeters: number;
  durationMs: number;
  price: number;
  description: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: "armor" | "helmet" | "ammo" | "consumable";
  level?: number;
  ammoFor?: WeaponType;
  effect: string;
  price: number;
}

export type CatalogSummary = {
  weapons: number;
  characters: number;
  maps: number;
  modes: number;
  throwables: number;
  equipment: number;
};

type ContentVersionDoc = {
  _id: string;
  maps?: MapDefinition[];
  weapons?: Weapon[];
  throwables?: Throwable[];
  characters?: Character[];
  gameModes?: GameMode[];
  equipment?: Equipment[];
};

async function getCatalogDoc(version = "v1"): Promise<ContentVersionDoc | null> {
  const db = await getDb();
  return db
    .collection<ContentVersionDoc>("contentVersions")
    .findOne({ _id: version });
}

export async function getCatalogSummary(
  version = "v1",
): Promise<CatalogSummary> {
  "use cache";
  const { cacheLife, cacheTag } = await import("next/cache");
  cacheLife("hours");
  cacheTag("catalog", `catalog:${version}`);
  const doc = await getCatalogDoc(version);
  return {
    weapons: doc?.weapons?.length ?? 0,
    characters: doc?.characters?.length ?? 0,
    maps: doc?.maps?.length ?? 0,
    modes: doc?.gameModes?.length ?? 0,
    throwables: doc?.throwables?.length ?? 0,
    equipment: doc?.equipment?.length ?? 0,
  };
}

export async function getWeapons(version = "v1"): Promise<Weapon[]> {
  "use cache";
  const { cacheLife, cacheTag } = await import("next/cache");
  cacheLife("hours");
  cacheTag("catalog", `catalog:${version}`, `catalog:${version}:weapons`);
  const doc = await getCatalogDoc(version);
  return doc?.weapons ?? [];
}

export async function getCharacters(version = "v1"): Promise<Character[]> {
  "use cache";
  const { cacheLife, cacheTag } = await import("next/cache");
  cacheLife("hours");
  cacheTag("catalog", `catalog:${version}`, `catalog:${version}:characters`);
  const doc = await getCatalogDoc(version);
  return doc?.characters ?? [];
}

export async function getMaps(version = "v1"): Promise<MapDefinition[]> {
  "use cache";
  const { cacheLife, cacheTag } = await import("next/cache");
  cacheLife("hours");
  cacheTag("catalog", `catalog:${version}`, `catalog:${version}:maps`);
  const doc = await getCatalogDoc(version);
  return doc?.maps ?? [];
}

export async function getModes(version = "v1"): Promise<GameMode[]> {
  "use cache";
  const { cacheLife, cacheTag } = await import("next/cache");
  cacheLife("hours");
  cacheTag("catalog", `catalog:${version}`, `catalog:${version}:modes`);
  const doc = await getCatalogDoc(version);
  return doc?.gameModes ?? [];
}

export async function getThrowables(version = "v1"): Promise<Throwable[]> {
  "use cache";
  const { cacheLife, cacheTag } = await import("next/cache");
  cacheLife("hours");
  cacheTag("catalog", `catalog:${version}`, `catalog:${version}:throwables`);
  const doc = await getCatalogDoc(version);
  return doc?.throwables ?? [];
}

export async function getEquipment(version = "v1"): Promise<Equipment[]> {
  "use cache";
  const { cacheLife, cacheTag } = await import("next/cache");
  cacheLife("hours");
  cacheTag("catalog", `catalog:${version}`, `catalog:${version}:equipment`);
  const doc = await getCatalogDoc(version);
  return doc?.equipment ?? [];
}