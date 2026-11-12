"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import type { ProgressionSnapshot } from "@/lib/api-types";
import { decodeJwtUnsafe, getToken } from "@/lib/auth";
import type { Overview, ProfileIdentity } from "./types";

interface ProfileResponse {
  playerId?: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
}

export interface ProfileState {
  loading: boolean;
  /** True when every request failed (offline or backend down). */
  failed: boolean;
  identity: ProfileIdentity;
  progression: ProgressionSnapshot | null;
  overview: Overview | null;
  friendsCount: number;
  reload: () => void;
  applyIdentity: (next: { displayName: string; username: string; avatarUrl?: string | null; bannerUrl?: string | null }) => void;
}

function subscribeToAuth(onChange: () => void): () => void {
  window.addEventListener("fps-auth-changed", onChange);
  return () => window.removeEventListener("fps-auth-changed", onChange);
}

function readTokenName(): string {
  const raw = getToken();
  const decoded = raw ? decodeJwtUnsafe(raw) : null;
  return decoded && typeof decoded.username === "string" ? decoded.username : "";
}

const readServerTokenName = (): string => "";

const EMPTY_IDENTITY: ProfileIdentity = { playerId: "", displayName: "", username: "", avatarUrl: null };

export function useProfile(): ProfileState {
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [remoteIdentity, setRemoteIdentity] = useState<ProfileIdentity>(EMPTY_IDENTITY);
  const [progression, setProgression] = useState<ProgressionSnapshot | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [friendsCount, setFriendsCount] = useState(0);

  // The username is known from the sign-in token before the profile request returns.
  const tokenName = useSyncExternalStore(subscribeToAuth, readTokenName, readServerTokenName);

  const identity = useMemo<ProfileIdentity>(
    () => ({
      playerId: remoteIdentity.playerId,
      displayName: remoteIdentity.displayName || tokenName,
      username: remoteIdentity.username || tokenName,
      avatarUrl: remoteIdentity.avatarUrl ?? null,
      bannerUrl: remoteIdentity.bannerUrl ?? null,
    }),
    [remoteIdentity, tokenName],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [profile, level, stats, friends] = await Promise.all([
        api<ProfileResponse>("/api/me/profile").catch(() => null),
        api<ProgressionSnapshot>("/api/me/progression").catch(() => null),
        api<Overview>("/api/me/overview").catch(() => null),
        api<{ friends: unknown[] }>("/api/me/friends").catch(() => null),
      ]);
      if (cancelled) return;

      if (profile) {
        setRemoteIdentity((prev) => ({
          playerId: profile.playerId ?? prev.playerId,
          displayName: profile.displayName || prev.displayName,
          username: profile.username || prev.username,
          avatarUrl: profile.avatarUrl ?? prev.avatarUrl ?? null,
          bannerUrl: profile.bannerUrl ?? prev.bannerUrl ?? null,
        }));
      }
      setProgression(level);
      setOverview(stats);
      setFriendsCount(friends?.friends?.length ?? 0);
      setFailed(!profile && !level && !stats && !friends);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const applyIdentity = useCallback((next: { displayName: string; username: string; avatarUrl?: string | null; bannerUrl?: string | null }) => {
    setRemoteIdentity((prev) => ({ ...prev, ...next }));
  }, []);

  return { loading, failed, identity, progression, overview, friendsCount, reload, applyIdentity };
}


