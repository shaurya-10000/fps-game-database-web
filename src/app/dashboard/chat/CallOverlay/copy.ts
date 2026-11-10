import type { CallState } from "@/lib/webrtc";

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const seconds = String(s % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/[\s_.-]+/).filter(Boolean);
  const first = parts[0] ?? "";
  const second = parts[1] ?? "";
  if (!first) return "?";
  return (second ? first.charAt(0) + second.charAt(0) : first.slice(0, 2)).toUpperCase();
}

export function pillLabel(call: CallState): string {
  switch (call.status) {
    case "calling":
      return "Calling...";
    case "ringing":
      return `Incoming ${call.isVideo ? "video" : "voice"} call`;
    case "connecting":
      return "Connecting...";
    case "active":
      return call.connection === "reconnecting" ? "Reconnecting..." : "Connected";
    case "ended":
      return "Call ended";
    default:
      return "";
  }
}

export function stageCopy(call: CallState): { title: string; subtitle: string } {
  const name = call.targetName || "Unknown";
  switch (call.status) {
    case "calling":
      return { title: name, subtitle: call.isVideo ? "Starting video call..." : "Ringing..." };
    case "ringing":
      return { title: name, subtitle: call.isVideo ? "wants to video call you" : "is calling you" };
    case "connecting":
      return { title: name, subtitle: "Connecting..." };
    case "active":
      return {
        title: name,
        subtitle: call.connection === "reconnecting" ? "Connection unstable. Reconnecting..." : "Voice connected",
      };
    case "ended":
      return endedCopy(call);
    default:
      return { title: name, subtitle: "" };
  }
}

function endedCopy(call: CallState): { title: string; subtitle: string } {
  const name = call.targetName || "They";
  switch (call.endReason) {
    case "declined":
      return { title: "Call declined", subtitle: `${name} isn't available right now.` };
    case "missed":
      return { title: "Missed call", subtitle: `${name} stopped calling.` };
    case "no-answer":
      return { title: "No answer", subtitle: `${name} didn't pick up.` };
    case "failed":
      return { title: "Call failed", subtitle: call.error ?? "Something went wrong." };
    default:
      return {
        title: "Call ended",
        subtitle: call.durationSec > 0 ? `Duration ${formatDuration(call.durationSec)}` : "",
      };
  }
}