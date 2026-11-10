"use client";

import { useCallback, useState } from "react";

export type ChatScope = "global" | "friends";

export function useChatScope(initial: ChatScope = "global") {
  const [scope, setScope] = useState<ChatScope>(initial);
  const toggle = useCallback(() => {
    setScope((s) => (s === "global" ? "friends" : "global"));
  }, []);
  return { scope, setScope, toggle };
}
