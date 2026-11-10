"use client";

import { useState } from "react";

export interface DraftStore {
  get: (key: string) => string;
  set: (key: string, text: string) => void;
}

/** Unsent text per conversation. Lives for as long as the component using it, and never triggers a re-render. */
export function useDraftStore(): DraftStore {
  const [store] = useState<DraftStore>(() => {
    const drafts = new Map<string, string>();
    return {
      get: (key) => drafts.get(key) ?? "",
      set: (key, text) => {
        drafts.set(key, text);
      },
    };
  });
  return store;
}