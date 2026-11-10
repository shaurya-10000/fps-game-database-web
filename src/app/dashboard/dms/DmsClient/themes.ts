import type { CSSProperties } from "react";
import type { FontSize } from "@/lib/chat-settings";

export interface ChatTheme {
  id: string;
  name: string;
  /** Solid colour for buttons, links and highlights ("" keeps the app's own accent). */
  accent: string;
  /** Background of the messages you send. Spans the whole screen, so bubbles shade as you scroll. */
  gradient: string;
  /** Soft colour blobs behind the messages. */
  wallpaper: string;
}

/** Three translucent colour blobs that sit over the normal background in both light and dark mode. */
function blobs(a: string, b: string, c: string, strength = 1): string {
  const o = (v: number) => (v * strength).toFixed(2);
  return [
    `radial-gradient(60% 50% at 12% 8%, rgba(${a}, ${o(0.32)}), transparent 70%)`,
    `radial-gradient(55% 45% at 92% 28%, rgba(${b}, ${o(0.28)}), transparent 70%)`,
    `radial-gradient(75% 55% at 45% 100%, rgba(${c}, ${o(0.26)}), transparent 70%)`,
  ].join(", ");
}

const CLASSIC: ChatTheme = { id: "classic", name: "Classic", accent: "", gradient: "", wallpaper: "" };

export const THEMES: ChatTheme[] = [
  CLASSIC,
  {
    id: "aurora",
    name: "Aurora",
    accent: "#14b8a6",
    gradient: "linear-gradient(135deg, #14b8a6 0%, #6366f1 55%, #a855f7 100%)",
    wallpaper: blobs("20, 184, 166", "168, 85, 247", "99, 102, 241"),
  },
  {
    id: "sunset",
    name: "Sunset",
    accent: "#f97316",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #f43f5e 55%, #a855f7 100%)",
    wallpaper: blobs("249, 115, 22", "244, 63, 94", "168, 85, 247"),
  },
  {
    id: "neon",
    name: "Neon",
    accent: "#22d3ee",
    gradient: "linear-gradient(135deg, #22d3ee 0%, #6366f1 50%, #d946ef 100%)",
    wallpaper: blobs("34, 211, 238", "217, 70, 239", "99, 102, 241"),
  },
  {
    id: "candy",
    name: "Candy",
    accent: "#ec4899",
    gradient: "linear-gradient(135deg, #f472b6 0%, #ec4899 50%, #fb923c 100%)",
    wallpaper: blobs("244, 114, 182", "251, 146, 60", "236, 72, 153"),
  },
  {
    id: "ocean",
    name: "Ocean",
    accent: "#0ea5e9",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 55%, #6366f1 100%)",
    wallpaper: blobs("6, 182, 212", "59, 130, 246", "99, 102, 241"),
  },
  {
    id: "forest",
    name: "Forest",
    accent: "#22c55e",
    gradient: "linear-gradient(135deg, #84cc16 0%, #22c55e 50%, #0d9488 100%)",
    wallpaper: blobs("132, 204, 22", "13, 148, 136", "34, 197, 94"),
  },
  {
    id: "lava",
    name: "Lava",
    accent: "#ef4444",
    gradient: "linear-gradient(135deg, #f97316 0%, #ef4444 55%, #be123c 100%)",
    wallpaper: blobs("249, 115, 22", "190, 18, 60", "239, 68, 68"),
  },
  {
    id: "midnight",
    name: "Midnight",
    accent: "#818cf8",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #2563eb 100%)",
    wallpaper: blobs("79, 70, 229", "124, 58, 237", "37, 99, 235", 1.15),
  },
  {
    id: "mono",
    name: "Mono",
    accent: "#a1a1aa",
    gradient: "linear-gradient(135deg, #71717a 0%, #52525b 55%, #3f3f46 100%)",
    wallpaper: blobs("161, 161, 170", "113, 113, 122", "82, 82, 91", 0.7),
  },
];

export interface ChatThemeSetting {
  theme: string;
  /** Turn the background off but keep the colours. */
  plain?: boolean;
}

export const DEFAULT_THEME: ChatThemeSetting = { theme: "classic" };

export function findTheme(id: string | undefined): ChatTheme {
  return THEMES.find((t) => t.id === id) ?? CLASSIC;
}

const LEGACY_IDS: Record<string, string> = { default: "classic", violet: "midnight", rose: "candy", slate: "mono" };

/** Reads a saved theme, including the older { accent, pattern } format. */
export function normalizeTheme(raw: unknown): ChatThemeSetting | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r["theme"] === "string" ? r["theme"] : typeof r["accent"] === "string" ? r["accent"] : "classic";
  const mapped = LEGACY_IDS[id] ?? id;
  const plain = typeof r["plain"] === "boolean" ? r["plain"] : r["pattern"] === "none";
  return { theme: THEMES.some((t) => t.id === mapped) ? mapped : "classic", plain };
}

const FONT_PX: Record<FontSize, string> = { small: "13px", medium: "14px", large: "16px" };

/**
 * Variables for everything inside a chat: accent colour, your bubble gradient, and the text size.
 * Bubbles read `--chat-sent-bg`, falling back to the plain accent colour.
 */
export function chatContainerStyle(setting: ChatThemeSetting | undefined, fontSize: FontSize): CSSProperties {
  const theme = findTheme(setting?.theme);
  const vars: Record<string, string> = { "--chat-font-size": FONT_PX[fontSize] };
  if (theme.accent) {
    vars["--accent"] = theme.accent;
    vars["--chat-sent-bg"] = theme.gradient;
    vars["--chat-sent-fg"] = "#ffffff";
  }
  return vars as CSSProperties;
}

export function wallpaperStyle(setting: ChatThemeSetting | undefined): CSSProperties | undefined {
  const theme = findTheme(setting?.theme);
  if (!theme.wallpaper || setting?.plain) return undefined;
  return { backgroundImage: theme.wallpaper };
}