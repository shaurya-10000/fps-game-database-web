"use client";

import { useEffect, useState, type RefObject } from "react";

/** Returns false after `timeoutMs` without pointer/touch/key activity (only while `enabled`). */
export function useIdleControls(target: RefObject<HTMLElement | null>, enabled: boolean, timeoutMs = 3500): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const el = target.current;
    if (!enabled || !el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const wake = () => {
      setIdle(false);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), timeoutMs);
    };

    wake();
    const events = ["pointermove", "pointerdown", "keydown", "touchstart"] as const;
    events.forEach((name) => el.addEventListener(name, wake));
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((name) => el.removeEventListener(name, wake));
      setIdle(false);
    };
  }, [target, enabled, timeoutMs]);

  return enabled ? !idle : true;
}