"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { CallState } from "@/lib/webrtc";
import type { DeviceLists } from "./useMediaDevices";

interface DeviceSelectProps {
  label: string;
  fallback: string;
  value: string;
  options: MediaDeviceInfo[];
  disabled?: boolean;
  hint?: string;
  onChange: (deviceId: string) => void;
}

function DeviceSelect({ label, fallback, value, options, disabled, hint, onChange }: DeviceSelectProps) {
  const selected = options.some((o) => o.deviceId === value) ? value : "";
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-white/80">{label}</span>
      <select
        value={selected}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value);
        }}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50 [&>option]:bg-zinc-900"
      >
        <option value="">System default</option>
        {options.map((device, i) => (
          <option key={device.deviceId || i} value={device.deviceId}>
            {device.label || `${fallback} ${i + 1}`}
          </option>
        ))}
      </select>
      {hint ? <span className="mt-1 block text-[11px] text-white/45">{hint}</span> : null}
    </label>
  );
}

interface DeviceMenuProps {
  call: CallState;
  devices: DeviceLists;
  speakerId: string;
  speakerSupported: boolean;
  onMic: (deviceId: string) => void;
  onCamera: (deviceId: string) => void;
  onSpeaker: (deviceId: string) => void;
  onClose: () => void;
}

export default function DeviceMenu({
  call,
  devices,
  speakerId,
  speakerSupported,
  onMic,
  onCamera,
  onSpeaker,
  onClose,
}: DeviceMenuProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return (
    <>
      <div className="absolute inset-0 z-30" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label="Audio and video devices"
        className="absolute inset-x-0 bottom-36 z-40 mx-auto w-[min(92vw,24rem)] rounded-2xl border border-white/10 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-xl sm:bottom-32"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-white">Devices</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close devices"
            className="rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <DeviceSelect
            label="Microphone"
            fallback="Microphone"
            value={call.micId ?? ""}
            options={devices.mics}
            onChange={onMic}
          />
          <DeviceSelect
            label="Camera"
            fallback="Camera"
            value={call.cameraId ?? ""}
            options={devices.cameras}
            onChange={onCamera}
          />
          <DeviceSelect
            label="Speaker"
            fallback="Speaker"
            value={speakerId}
            options={devices.speakers}
            disabled={!speakerSupported}
            hint={speakerSupported ? undefined : "Your browser doesn't support choosing a speaker."}
            onChange={onSpeaker}
          />
        </div>
      </div>
    </>
  );
}