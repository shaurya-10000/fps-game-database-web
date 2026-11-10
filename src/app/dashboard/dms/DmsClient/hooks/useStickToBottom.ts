"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * Keeps a scroll container pinned to the bottom while the user is near it,
 * and tracks whether unseen content arrived while they were scrolled up.
 * `changeKey` must change when something is appended at the bottom (not when older items are prepended).
 */
export function useStickToBottom<T extends HTMLElement>(changeKey: string | number, resetKey: string, forceScroll: boolean) {
  const ref = useRef<T>(null);
  const stick = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const [hasNew, setHasNew] = useState(false);
  const [seenResetKey, setSeenResetKey] = useState(resetKey);
  const [seenChangeKey, setSeenChangeKey] = useState(changeKey);

  // "New content below" is derived while rendering, so no effect has to set state.
  if (seenResetKey !== resetKey) {
    setSeenResetKey(resetKey);
    setSeenChangeKey(changeKey);
    setHasNew(false);
  } else if (seenChangeKey !== changeKey) {
    setSeenChangeKey(changeKey);
    if (!atBottom && !forceScroll) setHasNew(true);
  }

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
    stick.current = near;
    setAtBottom(near);
    if (near) setHasNew(false);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useLayoutEffect(() => {
    stick.current = true;
  }, [resetKey]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (stick.current || forceScroll) {
      el.scrollTop = el.scrollHeight;
      stick.current = true;
    }
  }, [changeKey, forceScroll]);

  return { ref, atBottom, hasNew, onScroll, scrollToBottom };
}