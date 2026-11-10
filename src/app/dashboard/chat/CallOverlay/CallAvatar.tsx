import { cn } from "@/lib/utils";
import { initialsOf } from "./copy";

const PALETTE = [
  "from-rose-500 to-orange-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-red-500",
  "from-violet-500 to-fuchsia-500",
  "from-cyan-500 to-blue-500",
] as const;

function pick(name: string): string {
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length] ?? PALETTE[0];
}

interface CallAvatarProps {
  name: string;
  size?: "sm" | "lg";
  pulsing?: boolean;
  /** Draws a green ring while this person is talking. */
  speaking?: boolean;
}

export default function CallAvatar({ name, size = "lg", pulsing = false, speaking = false }: CallAvatarProps) {
  const big = size === "lg";
  return (
    <div className="relative flex items-center justify-center">
      {pulsing && (
        <>
          <span className={cn("absolute rounded-full bg-white/10 animate-ping", big ? "size-44" : "size-24")} />
          <span
            className={cn("absolute rounded-full bg-white/5 animate-pulse", big ? "size-56" : "size-32")}
            style={{ animationDuration: "2s" }}
          />
        </>
      )}
      <div
        aria-hidden="true"
        className={cn(
          "relative flex items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-2xl ring-4 transition-all duration-150",
          speaking ? "ring-emerald-400 shadow-emerald-500/40" : "ring-white/10",
          pick(name),
          big ? "size-36 text-5xl sm:size-40" : "size-16 text-xl",
        )}
      >
        {initialsOf(name)}
      </div>
    </div>
  );
}