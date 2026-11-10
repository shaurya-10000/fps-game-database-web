import { Phone, PhoneMissed, PhoneOff, Video } from "lucide-react";
import { formatDuration } from "@/app/dashboard/chat/CallOverlay/copy";
import { cn } from "@/lib/utils";
import type { CallEvent } from "../types";

function describe(event: CallEvent): string {
  const label = event.kind === "video" ? "Video call" : "Voice call";
  switch (event.outcome) {
    case "completed":
      return event.durationSec > 0 ? `${label} - ${formatDuration(event.durationSec)}` : label;
    case "declined":
      return event.mine ? "Call declined" : "You declined a call";
    case "no-answer":
      return event.mine ? "No answer" : `Missed ${label.toLowerCase()}`;
    case "cancelled":
      return event.mine ? "Call canceled" : `Missed ${label.toLowerCase()}`;
  }
}

export default function CallEventRow({ event }: { event: CallEvent }) {
  const missed = !event.mine && (event.outcome === "no-answer" || event.outcome === "cancelled");
  const Icon =
    event.outcome === "completed" ? (event.kind === "video" ? Video : Phone) : missed ? PhoneMissed : PhoneOff;
  const time = new Date(event.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="my-3 flex justify-center">
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-medium",
          missed ? "border-rose-500/30 bg-rose-500/10 text-rose-500" : "border-border bg-surface text-muted",
        )}
      >
        <Icon size={13} />
        {describe(event)}
        <span className="font-mono text-[11px] opacity-70">{time}</span>
      </span>
    </div>
  );
}