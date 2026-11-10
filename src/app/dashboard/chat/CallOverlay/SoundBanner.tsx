"use client";

import { useSyncExternalStore } from "react";
import { Volume2 } from "lucide-react";
import { callSounds } from "@/lib/call-sounds";

/** Shown while a call is ringing if the browser is still blocking audio. One click fixes it. */
export default function SoundBanner({ show }: { show: boolean }) {
  const locked = useSyncExternalStore(callSounds.subscribe, callSounds.isLocked, () => false);
  if (!show || !locked) return null;

  return (
    <div className="absolute inset-x-0 top-28 z-30 flex justify-center px-4">
      <button
        type="button"
        onClick={() => callSounds.unlock()}
        className="flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-[13px] font-semibold text-zinc-950 shadow-lg transition-opacity hover:opacity-90"
      >
        <Volume2 size={16} />
        Your browser is blocking sound. Click to enable the ringtone.
      </button>
    </div>
  );
}