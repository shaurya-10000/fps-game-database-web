"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Settings, Sun, Moon, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "next-themes";
import { getSoundEnabled, toggleSound } from "@/lib/sound";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const [soundEnabled, setSoundEnabled] = useState(() => getSoundEnabled());
  const { theme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onSoundChange = () => setSoundEnabled(getSoundEnabled());
    window.addEventListener("fps-sound-changed", onSoundChange);

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("fps-sound-changed", onSoundChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!mounted) {
    return <button className="rounded-md border border-border p-1.5 text-muted" disabled><span className="block size-4" /></button>;
  }

  const isDark = theme === "dark";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-md border p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
          isOpen ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"
        }`}
        aria-label="Settings"
      >
        <Settings size={16} strokeWidth={1.8} className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-b border-border px-4 py-3 bg-background/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Preferences</span>
          </div>
          
          <div className="p-2 space-y-1">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground/5"
            >
              <div className="flex items-center gap-2.5">
                {isDark ? <Moon size={16} className="text-accent" /> : <Sun size={16} className="text-amber-500" />}
                <span>Dark Mode</span>
              </div>
              
              <div className={`relative inline-flex h-5 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${isDark ? "bg-accent" : "bg-zinc-300 dark:bg-zinc-700"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${isDark ? "translate-x-2" : "-translate-x-2"}`} />
              </div>
            </button>

            <button
              onClick={() => toggleSound(!soundEnabled)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground/5"
            >
              <div className="flex items-center gap-2.5">
                {soundEnabled ? <Volume2 size={16} className="text-accent" /> : <VolumeX size={16} className="text-muted" />}
                <span>UI Sounds</span>
              </div>
              
              <div className={`relative inline-flex h-5 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${soundEnabled ? "bg-accent" : "bg-zinc-300 dark:bg-zinc-700"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${soundEnabled ? "translate-x-2" : "-translate-x-2"}`} />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
