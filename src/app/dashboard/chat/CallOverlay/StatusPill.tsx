import { SignalHigh, SignalLow, SignalMedium } from "lucide-react";
import type { CallState } from "@/lib/webrtc";
import { cn } from "@/lib/utils";
import CallTimer from "./CallTimer";
import { pillLabel } from "./copy";

const QUALITY = {
  good: { Icon: SignalHigh, className: "text-emerald-400", label: "Good connection" },
  fair: { Icon: SignalMedium, className: "text-amber-400", label: "Fair connection" },
  poor: { Icon: SignalLow, className: "text-rose-400", label: "Poor connection" },
} as const;

export default function StatusPill({ call }: { call: CallState }) {
  const reconnecting = call.status === "active" && call.connection === "reconnecting";
  const dot =
    reconnecting || call.status === "connecting" || call.status === "calling"
      ? "bg-amber-400 animate-pulse"
      : call.status === "ringing"
        ? "bg-cyan-400 animate-pulse"
        : call.status === "ended"
          ? "bg-zinc-500"
          : "bg-emerald-500";
  const quality = QUALITY[call.quality];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-5 z-30 flex justify-center">
      <div
        role="status"
        className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/90 shadow-lg backdrop-blur-xl"
      >
        <span className={cn("size-2.5 rounded-full", dot)} />
        <span className="font-medium">
          {call.status === "active" && !reconnecting ? <CallTimer since={call.connectedAt} /> : pillLabel(call)}
        </span>
        {call.status === "active" && !reconnecting && (
          <quality.Icon size={16} className={quality.className} aria-label={quality.label}>
            <title>{quality.label}</title>
          </quality.Icon>
        )}
      </div>
    </div>
  );
}