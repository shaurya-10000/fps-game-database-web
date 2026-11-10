"use client";

import { BACKEND_URL } from "./backend";

const TOKEN_KEY = "fps.dashboard.jwt";

export interface DecodedJwt {
  sub: string;
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  [key: string]: unknown;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token.trim());
  window.dispatchEvent(new Event("fps-auth-changed"));
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("fps-auth-changed"));
}

export function decodeJwtUnsafe(token: string): DecodedJwt | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json) as DecodedJwt;
    if (typeof parsed.sub !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const decoded = decodeJwtUnsafe(token);
  if (!decoded) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return decoded.exp > nowSec;
}

// NEW: API Handlers
export async function login(email: string, password: string) {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "LOGIN_FAILED");
  setToken(data.token);
  return data;
}

export async function register(email: string, username: string, password: string) {
  const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "REGISTER_FAILED");
  setToken(data.token);
  return data;
}