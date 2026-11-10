import {
  Maximize,
  Mic,
  MicOff,
  Minimize,
  MonitorOff,
  MonitorUp,
  Phone,
  PhoneOff,
  Settings,
  Video,
  VideoOff,
} from "lucide-react";
import type { CallState } from "@/lib/webrtc";
import { cn } from "@/lib/utils";
import ControlButton from "./ControlButton";

interface CallControlsProps {
  call: CallState;
  visible: boolean;
  fullscreen: boolean;
  settingsOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onMute: () => void;
  onVideo: () => void;
  onScreen: () => void;
  onSettings: () => void;
  onFullscreen: () => void;
}

export default function CallControls({
  call,
  visible,
  fullscreen,
  settingsOpen,
  onAccept,
  onReject,
  onEnd,
  onMute,
  onVideo,
  onScreen,
  onSettings,
  onFullscreen,
}: CallControlsProps) {
  if (call.status === "ended") return null;

  const mic = (
    <ControlButton
      icon={call.isMuted ? MicOff : Mic}
      label={call.isMuted ? "Unmute" : "Mute"}
      tone={call.isMuted ? "muted" : "default"}
      pressed={call.isMuted}
      shortcut="M"
      onClick={onMute}
    />
  );
  const camera = (
    <ControlButton
      icon={call.isVideoOff ? VideoOff : Video}
      label={call.isVideoOff ? "Start video" : "Stop video"}
      tone={call.isVideoOff ? "muted" : "default"}
      pressed={call.isVideoOff}
      shortcut="V"
      onClick={onVideo}
    />
  );
  const screen = call.canScreenShare ? (
    <ControlButton
      icon={call.isScreenSharing ? MonitorOff : MonitorUp}
      label={call.isScreenSharing ? "Stop share" : "Share screen"}
      tone={call.isScreenSharing ? "active" : "default"}
      pressed={call.isScreenSharing}
      shortcut="S"
      onClick={onScreen}
    />
  ) : null;
  const settings = (
    <ControlButton
      icon={Settings}
      label="Devices"
      tone={settingsOpen ? "active" : "default"}
      pressed={settingsOpen}
      onClick={onSettings}
    />
  );

  let content: React.ReactNode;
  if (call.status === "ringing") {
    content = (
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
            Set up before you answer
          </span>
          <div className="flex items-start gap-3 sm:gap-5">
            {mic}
            {camera}
            {screen}
            {settings}
          </div>
        </div>
        <div className="flex items-start gap-10">
          <ControlButton icon={PhoneOff} label="Decline" tone="danger" large onClick={onReject} />
          <ControlButton
            icon={call.isVideoOff ? Phone : Video}
            label="Accept"
            tone="success"
            large
            pulse
            shortcut="Enter"
            onClick={onAccept}
          />
        </div>
      </div>
    );
  } else if (call.status === "calling") {
    content = (
      <div className="flex items-start gap-3 sm:gap-5">
        {mic}
        {camera}
        {screen}
        {settings}
        <ControlButton icon={PhoneOff} label="Cancel" tone="danger" large onClick={onEnd} />
      </div>
    );
  } else {
    content = (
      <div className="flex items-start gap-3 sm:gap-5">
        {mic}
        {camera}
        {screen}
        {settings}
        <ControlButton
          icon={fullscreen ? Minimize : Maximize}
          label={fullscreen ? "Exit full" : "Fullscreen"}
          shortcut="F"
          onClick={onFullscreen}
        />
        <ControlButton icon={PhoneOff} label="End" tone="danger" onClick={onEnd} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-30 flex justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-6 pt-16 transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      {content}
    </div>
  );
}