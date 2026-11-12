"use client";

import { useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";

// This wraps the site so audio unlocks and local notifications update
export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Mounting this hook without a socket still sets up:
  //  - tab title
  //  - localStorage change listeners
  //  - audio unlock (via unlockAudio)
  useNotifications(null);

  // Re-broadcast socket events to notifications on ALL pages by listening to a global event
  useEffect(() => {
    const handler = () => {
      // Forces a re-render across all mounted useNotifications instances
      window.dispatchEvent(new Event("fps-notifications-changed"));
    };
    window.addEventListener("fps-notifications-changed", handler);
    return () => window.removeEventListener("fps-notifications-changed", handler);
  }, []);

  return <>{children}</>;
}
