"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type NoticeTone = "error" | "info";

export function useTransientMessage(durationMs = 5000) {
  const [notice, setNotice] = useState<{ text: string; tone: NoticeTone } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setNotice(null);
  }, []);

  const show = useCallback(
    (text: string, tone: NoticeTone = "error") => {
      if (timer.current) clearTimeout(timer.current);
      setNotice({ text, tone });
      timer.current = setTimeout(() => {
        timer.current = null;
        setNotice(null);
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { notice, show, clear };
}