"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getSoundEnabled, toggleSound } from "@/lib/sound";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(() => getSoundEnabled());
  const [mounted] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    const onSoundChange = () => setEnabled(getSoundEnabled());
    window.addEventListener("fps-sound-changed", onSoundChange);
    return () => window.removeEventListener("fps-sound-changed", onSoundChange);
  }, []);

  if (!mounted) {
    return <div className="hidden h-8 w-[84px] md:block" />;
  }

  return (
    <button
      type="button"
      onClick={() => toggleSound(!enabled)}
      aria-label={enabled ? "Mute UI sounds" : "Enable UI sounds"}
      title={enabled ? "Mute UI sounds" : "Enable UI sounds"}
      className={`hidden md:flex group relative h-8 items-center gap-1.5 rounded-md border px-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
        enabled 
          ? "border-border bg-surface text-foreground hover:bg-foreground/5" 
          : "border-border bg-transparent text-muted hover:text-foreground"
      }`}
    >
      {enabled ? (
        <Volume2 size={14} className="text-accent transition-colors group-hover:text-accent" />
      ) : (
        <VolumeX size={14} className="transition-colors group-hover:text-foreground" />
      )}
      
      <span className="text-[11px] font-semibold uppercase tracking-wider">
        {enabled ? "Sound On" : "Muted"}
      </span>
    </button>
  );
}
