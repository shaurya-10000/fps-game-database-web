"use client";

import { useEffect, useRef } from "react";
import { callSounds } from "@/lib/call-sounds";
import { showNotification } from "@/lib/notifications";
import type { CallState, CallStatus } from "@/lib/webrtc";

const VIBRATION_PATTERN = [400, 200, 400];

/**
 * Ringtone / ringback loop until the call is answered, declined or ended.
 * Also plays connect/end sounds, vibrates on phones and flashes the tab title while ringing.
 */
export function useCallFeedback(call: CallState): void {
  const { status, targetName, isVideo } = call;
  const previous = useRef<CallStatus>("idle");

  useEffect(() => {
    callSounds.arm();
    return () => callSounds.stop();
  }, []);

  useEffect(() => {
    const before = previous.current;
    previous.current = status;

    if (status === "ringing") callSounds.startRingtone();
    else if (status === "calling") callSounds.startRingback();
    else callSounds.stop();

    if (status === "active" && before !== "active") callSounds.playConnected();
    if (status === "ended") callSounds.playEnded();
  }, [status]);

  useEffect(() => {
    if (status !== "ringing" || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    navigator.vibrate(VIBRATION_PATTERN);
    const id = setInterval(() => navigator.vibrate(VIBRATION_PATTERN), 2800);
    return () => {
      clearInterval(id);
      navigator.vibrate(0);
    };
  }, [status]);

  useEffect(() => {
    if (status !== "ringing") return;
    const notification = showNotification(`Incoming ${isVideo ? "video" : "voice"} call`, {
      body: targetName || "Unknown caller",
      tag: "incoming-call",
      requireInteraction: true,
      onlyWhenHidden: true,
    });
    return () => notification?.close();
  }, [status, targetName, isVideo]);

  useEffect(() => {
    if (status !== "ringing") return;
    const original = document.title;
    let flash = false;
    const id = setInterval(() => {
      flash = !flash;
      document.title = flash ? `Incoming call - ${targetName || "Unknown"}` : original;
    }, 1000);
    return () => {
      clearInterval(id);
      document.title = original;
    };
  }, [status, targetName]);
}