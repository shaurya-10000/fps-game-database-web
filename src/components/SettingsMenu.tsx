"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Settings, Sun, Moon, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "next-themes";
import { getSoundEnabled, toggleSound } from "@/lib/sound";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
        enabled ? "bg-foreground" : "bg-foreground/20"
      }`}
    >
      <span
        className={`inline-block size-4 rounded-full bg-background shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  children,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05] focus-visible:outline-none"
    >
      <Icon size={15} className="shrink-0 text-muted" strokeWidth={1.8} />
      <span className="min-w-0 flex-1 text-[13px] font-medium text-foreground">{label}</span>
      {children}
    </button>
  );
}

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
    return <button className="flex size-9 items-center justify-center rounded-md text-muted" disabled><span className="block size-4" /></button>;
  }

  const isDark = theme === "dark";

  return (
    <div className="relative" ref={menuRef}>
      <button
        suppressHydrationWarning
        onClick={() => setIsOpen(!isOpen)}
        className={`flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
          isOpen ? "bg-foreground/[0.06] text-foreground" : "text-muted hover:bg-foreground/5 hover:text-foreground"
        }`}
        aria-label="Settings"
        aria-expanded={isOpen}
      >
        <Settings size={18} strokeWidth={1.8} className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-1.5">
            <MenuRow
              icon={isDark ? Moon : Sun}
              label="Dark mode"
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              <ToggleSwitch enabled={isDark} />
            </MenuRow>
            <MenuRow
              icon={soundEnabled ? Volume2 : VolumeX}
              label="UI sounds"
              onClick={() => toggleSound(!soundEnabled)}
            >
              <ToggleSwitch enabled={soundEnabled} />
            </MenuRow>
          </div>
        </div>
      )}
    </div>
  );
}



