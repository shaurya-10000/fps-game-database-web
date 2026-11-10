import { cn } from "@/lib/utils";

const PALETTE = [
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-rose-500",
  "from-violet-500 to-fuchsia-500",
  "from-cyan-500 to-blue-500",
  "from-lime-500 to-emerald-600",
] as const;

function pick(seed: string): string {
  const sum = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length] ?? PALETTE[0];
}

export default function GroupAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initial = (name.trim().charAt(0) || "#").toUpperCase();
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-bold text-white shadow-sm",
        pick(name),
      )}
    >
      {initial}
    </div>
  );
}