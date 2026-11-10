"use client";

import { BellRing } from "lucide-react";
import { useNotificationPermission } from "../hooks/useNotificationPermission";

/** One-time banner asking to turn on desktop notifications. Hidden once the choice is made. */
export default function NotificationPrompt() {
  const { permission, request } = useNotificationPermission();

  if (permission !== "default") return null;

  return (
    <div className="mx-2 mt-2 flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
      <BellRing size={16} className="shrink-0 text-accent" />
      <p className="min-w-0 flex-1 text-[12px] leading-snug text-muted">
        Get notified about calls and messages while this tab is in the background.
      </p>
      <button
        type="button"
        onClick={() => void request()}
        className="shrink-0 rounded-lg bg-accent px-2.5 py-1.5 text-[12px] font-semibold text-background transition-opacity hover:opacity-90"
      >
        Enable
      </button>
    </div>
  );
}