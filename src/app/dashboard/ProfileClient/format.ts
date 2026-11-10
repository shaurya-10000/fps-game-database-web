const numberFormat = new Intl.NumberFormat();

export function formatNumber(value: number): string {
  return numberFormat.format(Math.round(value));
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/[\s_.-]+/).filter(Boolean);
  const first = parts[0] ?? "";
  const second = parts[1] ?? "";
  if (!first) return "??";
  return (second ? first.charAt(0) + second.charAt(0) : first.slice(0, 2)).toUpperCase();
}

export function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 10)}...` : id;
}

export function formatPlayTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return hours < 100 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : formatDate(iso);
}

/** "team-deathmatch" -> "Team Deathmatch". */
export function modeName(gameModeId: string | null): string {
  if (!gameModeId) return "Match";
  return gameModeId
    .replace(/^mode[_-]?/i, "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}