"use client";

import { useSyncExternalStore } from "react";

export type FontSize = "small" | "medium" | "large";

export interface ChatSettings {
  /** Show Global Chat in the sidebar and allow opening it. */
  globalChat: boolean;
  /** Play a short sound for messages in chats that are not open. */
  sounds: boolean;
  /** Enter sends the message (off: Ctrl+Enter sends and Enter adds a new line). */
  enterToSend: boolean;
  fontSize: FontSize;
  /** Epoch ms until which message notifications are snoozed (0 = not snoozed). */
  snoozeUntil: number;
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  globalChat: true,
  sounds: true,
  enterToSend: true,
  fontSize: "medium",
  snoozeUntil: 0,
};

const STORAGE_KEY = "fps.chat.settings";
const LEGACY_SOUND_KEY = "fps.chat.sound";
const CHANGE_EVENT = "fps-chat-settings";

let cache: ChatSettings | null = null;

function load(): ChatSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ChatSettings>) : {};
    const legacySoundOff = !raw && localStorage.getItem(LEGACY_SOUND_KEY) === "off";
    return {
      globalChat: parsed.globalChat !== false,
      sounds: legacySoundOff ? false : parsed.sounds !== false,
      enterToSend: parsed.enterToSend !== false,
      fontSize: parsed.fontSize === "small" || parsed.fontSize === "large" ? parsed.fontSize : "medium",
      snoozeUntil: typeof parsed.snoozeUntil === "number" ? parsed.snoozeUntil : 0,
    };
  } catch {
    return DEFAULT_CHAT_SETTINGS;
  }
}

export function getChatSettings(): ChatSettings {
  if (!cache) cache = load();
  return cache;
}

export function updateChatSettings(change: Partial<ChatSettings>): void {
  cache = { ...getChatSettings(), ...change };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage may be full or disabled; the change still applies for this session.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null; // another tab changed it
      listener();
    }
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Chat settings, shared across the whole dashboard and kept in this browser. */
export function useChatSettings(): ChatSettings {
  return useSyncExternalStore(subscribe, getChatSettings, () => DEFAULT_CHAT_SETTINGS);
}

export function isSnoozed(settings: ChatSettings): boolean {
  return Date.now() < settings.snoozeUntil;
}