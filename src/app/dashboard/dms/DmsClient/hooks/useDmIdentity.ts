"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { decodeJwtUnsafe, getToken } from "@/lib/auth";

interface ProfileResponse {
  playerId?: string;
  displayName?: string;
}

function subscribeToAuth(onChange: () => void): () => void {
  window.addEventListener("fps-auth-changed", onChange);
  return () => window.removeEventListener("fps-auth-changed", onChange);
}

function decodeToken() {
  const raw = getToken();
  return raw ? decodeJwtUnsafe(raw) : null;
}

function readTokenSub(): string {
  const sub = decodeToken()?.sub;
  return typeof sub === "string" ? sub : "";
}

function readTokenName(): string {
  const name = decodeToken()?.username;
  return typeof name === "string" ? name : "";
}

const readServerValue = (): string => "";

/**
 * Who "me" is for message alignment.
 * The login token's `sub` is not always the id the server stamps on messages, so prefer
 * the profile endpoint, then the id found on my friendship rows, and only then the token.
 */
export function useDmIdentity(friendSelfId: string): { playerId: string; name: string } {
  const tokenSub = useSyncExternalStore(subscribeToAuth, readTokenSub, readServerValue);
  const tokenName = useSyncExternalStore(subscribeToAuth, readTokenName, readServerValue);
  const [profile, setProfile] = useState({ playerId: "", name: "" });

  useEffect(() => {
    let cancelled = false;
    api<ProfileResponse>("/api/me/profile")
      .then((res) => {
        if (!cancelled) setProfile({ playerId: res.playerId ?? "", name: res.displayName ?? "" });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    playerId: profile.playerId || friendSelfId || tokenSub,
    name: profile.name || tokenName,
  };
}