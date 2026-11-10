"use client";

import { useEffect, useState } from "react";

export interface DeviceLists {
  mics: MediaDeviceInfo[];
  cameras: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
}

const EMPTY: DeviceLists = { mics: [], cameras: [], speakers: [] };

/** Lists microphones, cameras and speakers while `enabled`, and refreshes when devices are plugged in or out. */
export function useMediaDevices(enabled: boolean): DeviceLists {
  const [lists, setLists] = useState<DeviceLists>(EMPTY);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    let cancelled = false;

    const refresh = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        setLists({
          mics: devices.filter((d) => d.kind === "audioinput"),
          cameras: devices.filter((d) => d.kind === "videoinput"),
          speakers: devices.filter((d) => d.kind === "audiooutput"),
        });
      } catch {
        // Leave the previous lists in place.
      }
    };

    void refresh();
    navigator.mediaDevices.addEventListener("devicechange", refresh);
    return () => {
      cancelled = true;
      navigator.mediaDevices.removeEventListener("devicechange", refresh);
    };
  }, [enabled]);

  return lists;
}