"use client";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

interface ShowOptions extends NotificationOptions {
  /** Skip the notification while the tab is visible (the app itself already shows it). */
  onlyWhenHidden?: boolean;
  onClick?: () => void;
}

/** Shows a desktop notification if the user allowed them. Returns it so callers can close it. */
export function showNotification(title: string, options: ShowOptions = {}): Notification | null {
  if (!notificationsSupported() || Notification.permission !== "granted") return null;
  const { onlyWhenHidden, onClick, ...rest } = options;
  if (onlyWhenHidden && document.visibilityState === "visible") return null;
  try {
    const notification = new Notification(title, rest);
    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };
    return notification;
  } catch {
    return null;
  }
}