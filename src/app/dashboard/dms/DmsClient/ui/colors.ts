const NAME_COLORS = [
  "text-sky-500",
  "text-emerald-500",
  "text-amber-500",
  "text-violet-500",
  "text-rose-500",
  "text-cyan-500",
  "text-lime-600",
  "text-fuchsia-500",
] as const;

/** Stable colour per person so a group conversation is easy to scan. */
export function nameColor(seed: string): string {
  const sum = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return NAME_COLORS[sum % NAME_COLORS.length] ?? NAME_COLORS[0];
}