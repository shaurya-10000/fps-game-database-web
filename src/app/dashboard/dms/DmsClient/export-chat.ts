import type { DmMessage } from "./types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Downloads the loaded messages as a plain text file. */
export function exportChat(title: string, messages: DmMessage[]): number {
  const lines = messages
    .filter((m) => !m.deleted)
    .map((m) => {
      const t = new Date(m.createdAt);
      const stamp = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`;
      const who = m.system ? "*" : (m.senderName ?? "Unknown");
      const body = m.audioUrl ? "[voice message]" : m.content;
      return `[${stamp}] ${who}: ${body}`;
    });

  const text = `${title}\n${"=".repeat(title.length)}\n\n${lines.join("\n")}\n`;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "chat";
  anchor.href = url;
  anchor.download = `${slug}-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return lines.length;
}