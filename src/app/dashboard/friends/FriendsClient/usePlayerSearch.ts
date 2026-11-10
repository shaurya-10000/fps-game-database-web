"use client";

import { useEffect, useState } from "react";
import { searchPlayers, type SearchResult } from "@/lib/friends-api";

export type SearchState = "idle" | "loading" | "done" | "error";

interface Outcome {
  query: string;
  status: "done" | "error";
  results: SearchResult[];
}

const NO_RESULTS: SearchResult[] = [];

/** Debounced player search by name (2+ characters). */
export function usePlayerSearch(query: string) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const trimmed = query.trim();
  const active = trimmed.length >= 2;

  // Only an outcome for the current query counts; otherwise a request is still pending.
  const current = active && outcome?.query === trimmed ? outcome : null;
  const state: SearchState = !active ? "idle" : (current?.status ?? "loading");
  const results = active && outcome?.status === "done" ? outcome.results : NO_RESULTS;

  useEffect(() => {
    if (trimmed.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const list = await searchPlayers(trimmed);
        if (!cancelled) setOutcome({ query: trimmed, status: "done", results: list });
      } catch {
        if (!cancelled) setOutcome({ query: trimmed, status: "error", results: NO_RESULTS });
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  return { results, state, trimmed };
}