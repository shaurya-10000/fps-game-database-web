import { MicOff, Monitor, Video } from "lucide-react";
import type { CallState } from "@/lib/webrtc";
import { StreamVideo } from "./StreamMedia";
import CallAvatar from "./CallAvatar";
import { stageCopy } from "./copy";
import { useAudioLevel } from "./useAudioLevel";

interface VoiceStageProps {
  call: CallState;
  /** Your own camera or shared screen, shown behind the avatar while ringing. */
  preview: MediaStream | null;
  remoteStream: MediaStream | null;
}

function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warn" }) {
  return (
    <span
      className={
        tone === "warn"
          ? "inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-[12px] font-medium text-rose-200"
          : "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white/80"
      }
    >
      {children}
    </span>
  );
}

export default function VoiceStage({ call, preview, remoteStream }: VoiceStageProps) {
  const { title, subtitle } = stageCopy(call);
  const pulsing = call.status === "calling" || call.status === "ringing";
  const sharing = call.isScreenSharing;
  const hasVideoTrack = preview !== null && preview.getVideoTracks().length > 0;
  const showPreview = hasVideoTrack && (sharing || (call.status === "calling" && call.isVideo && !call.isVideoOff));
  const lobby = call.status === "ringing";
  const speaking = useAudioLevel(remoteStream, call.status === "active" && !call.remote.muted);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6">
      {showPreview && (
        <>
          <div className="absolute inset-0">
            <StreamVideo stream={preview} mirror={!sharing} fit={sharing ? "contain" : "cover"} />
          </div>
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-8">
        <CallAvatar name={call.targetName || "?"} pulsing={pulsing} speaking={speaking} />
        <div className="text-center">
          <div className="text-3xl font-semibold tracking-tight text-white">{title}</div>
          {subtitle && <div className="mt-2 text-sm font-medium text-white/60">{subtitle}</div>}
          {call.status === "active" && call.remote.muted && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-rose-300">
              <MicOff size={13} /> {call.targetName || "They"} is muted
            </div>
          )}
        </div>

        {lobby && (
          <div className="flex flex-wrap items-center justify-center gap-2" aria-label="How you will join">
            {call.isMuted ? (
              <Chip tone="warn">
                <MicOff size={13} /> Joining muted
              </Chip>
            ) : (
              <Chip>Mic on</Chip>
            )}
            {!call.isVideoOff && (
              <Chip>
                <Video size={13} /> Camera on
              </Chip>
            )}
            {sharing && (
              <Chip>
                <Monitor size={13} /> Sharing screen
              </Chip>
            )}
          </div>
        )}

        {!lobby && sharing && (
          <Chip>
            <Monitor size={13} /> Sharing your screen
          </Chip>
        )}
      </div>
    </div>
  );
}