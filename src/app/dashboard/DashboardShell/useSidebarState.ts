import { useCallback, useEffect, useState } from "react";
import { OPEN_SIDEBAR_EVENT } from "./sidebar-events";

const STORAGE_KEY = "dashboard:sidebar-open";
const DESKTOP_QUERY = "(min-width: 1024px)";

const isDesktop = (): boolean => window.matchMedia(DESKTOP_QUERY).matches;

function readStoredOpen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

function writeStoredOpen(open: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    // Storage unavailable (private mode, quota): the preference just won't persist.
  }
}

export function useSidebarState() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return isDesktop() ? readStoredOpen() : false;
  });
  const [ready, setReady] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const update = useCallback((next: boolean) => {
    setOpen(next);
    if (isDesktop()) writeStoredOpen(next);
  }, []);

  const toggle = useCallback(() => update(!open), [open, update]);

  const closeOnMobile = useCallback(() => {
    if (!isDesktop()) setOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape") {
        closeOnMobile();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle, closeOnMobile]);

  useEffect(() => {
    const onOpen = () => update(true);
    window.addEventListener(OPEN_SIDEBAR_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SIDEBAR_EVENT, onOpen);
  }, [update]);

  return { open, ready, toggle, closeOnMobile };
}
