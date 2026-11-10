"use client";

import { useCallback, useSyncExternalStore } from "react";
import { notificationsSupported } from "@/lib/notifications";

export type NotificationPermissionState = NotificationPermission | "unsupported";

const listeners = new Set<() => void>();

function read(): NotificationPermissionState {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

const readServer = (): NotificationPermissionState => "unsupported";

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);

  let status: PermissionStatus | null = null;
  let disposed = false;
  if (typeof navigator !== "undefined" && "permissions" in navigator) {
    navigator.permissions
      .query({ name: "notifications" })
      .then((result) => {
        if (disposed) return;
        status = result;
        result.addEventListener("change", onChange);
      })
      .catch(() => undefined);
  }

  return () => {
    disposed = true;
    listeners.delete(onChange);
    status?.removeEventListener("change", onChange);
  };
}

/** Live desktop-notification permission, kept in sync with the browser's site settings. */
export function useNotificationPermission() {
  const permission = useSyncExternalStore(subscribe, read, readServer);

  const request = useCallback(async () => {
    if (!notificationsSupported()) return;
    await Notification.requestPermission();
    listeners.forEach((listener) => listener());
  }, []);

  return { permission, request };
}