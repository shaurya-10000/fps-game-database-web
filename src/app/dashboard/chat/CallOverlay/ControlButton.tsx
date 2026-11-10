import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "active" | "danger" | "muted" | "success";

const TONES: Record<Tone, string> = {
  default: "bg-white/10 text-white hover:bg-white/20",
  active: "bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30",
  muted: "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30",
  danger: "bg-rose-500 text-white shadow-[0_0_24px_rgba(244,63,94,0.45)] hover:bg-rose-600",
  success: "bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.45)] hover:bg-emerald-600",
};

interface ControlButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: Tone;
  large?: boolean;
  pressed?: boolean;
  shortcut?: string;
  pulse?: boolean;
}

export default function ControlButton({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  large = false,
  pressed,
  shortcut,
  pulse = false,
}: ControlButtonProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={pressed}
        title={shortcut ? `${label} (${shortcut})` : label}
        className={cn(
          "flex items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95",
          large ? "size-16" : "size-12 sm:size-14",
          TONES[tone],
          pulse && "animate-pulse",
        )}
      >
        <Icon size={large ? 26 : 22} />
      </button>
      <span className="text-[11px] font-medium text-white/60">{label}</span>
    </div>
  );
}