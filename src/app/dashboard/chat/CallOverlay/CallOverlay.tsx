"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info, Minimize2, PictureInPicture2, WifiOff } from "lucide-react";
import { useCall } from "../CallContext";
import CallControls from "./CallControls";
import DeviceMenu from "./DeviceMenu";
import MiniCall from "./MiniCall";
import SoundBanner from "./SoundBanner";
import StatusPill from "./StatusPill";
import { StreamAudio, supportsSpeakerSelection } from "./StreamMedia";
import VideoStage from "./VideoStage";
import VoiceStage from "./VoiceStage";
import { useIdleControls } from "./useIdleControls";
import { useMediaDevices } from "./useMediaDevices";

const CORNER_BUTTON =
  "flex size-10 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur transition-colors hover:bg-black/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

export default function CallOverlay() {
  const {
    callState: call,
    localStream,
    remoteStream,
    minimized,
    setMinimized,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    setMicrophone,
    setCamera,
  } = useCall();

  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speakerId, setSpeakerId] = useState("");

  const visible = call.status !== "idle";

  // Ending the call also closes the device menu, so the next call starts clean.
  const [wasVisible, setWasVisible] = useState(visible);
  if (wasVisible !== visible) {
    setWasVisible(visible);
    if (!visible) setSettingsOpen(false);
  }
  const live = call.status === "connecting" || call.status === "active";
  const interactive = visible && call.status !== "ended";
  const canMinimize = call.status === "calling" || live;
  const showFull = visible && !minimized;

  // Video layout is shown whenever either side has video or is sharing, even in a "voice" call.
  const localVideoOn = call.isScreenSharing || (call.hasCamera && !call.isVideoOff);
  const remoteVideoOn = call.remote.screenSharing || !call.remote.videoOff;
  const videoStage = live && (call.isVideo || localVideoOn || remoteVideoOn);
  const canPip = videoStage && typeof document !== "undefined" && document.pictureInPictureEnabled;

  const controlsVisible = useIdleControls(rootRef, showFull && videoStage && !settingsOpen);
  const devices = useMediaDevices(settingsOpen);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void rootRef.current?.requestFullscreen().catch(() => undefined);
    }
  }, []);

  const togglePip = useCallback(async () => {
    const video = document.querySelector<HTMLVideoElement>("[data-call-remote-video]");
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      // Picture-in-picture is not available for this video right now.
    }
  }, []);

  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const toggleSettings = useCallback(() => setSettingsOpen((open) => !open), []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (visible) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => undefined);
  }, [visible]);

  useEffect(() => {
    if (!interactive) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key.toLowerCase()) {
        case "m":
          toggleMute();
          break;
        case "v":
          toggleVideo();
          break;
        case "s":
          toggleScreenShare();
          break;
        case "f":
          if (!live || minimized) return;
          toggleFullscreen();
          break;
        case "enter":
          // A focused button already handles Enter itself.
          if (call.status !== "ringing" || tag === "BUTTON") return;
          acceptCall();
          break;
        default:
          return;
      }
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [interactive, live, minimized, call.status, acceptCall, toggleMute, toggleVideo, toggleScreenShare, toggleFullscreen]);

  const reconnecting = call.status === "active" && call.connection === "reconnecting";
  const ringing = call.status === "ringing" || call.status === "calling";

  return (
    <>
      {/* Remote audio plays for every call type, and keeps playing when the call is minimized. */}
      {visible && <StreamAudio stream={remoteStream} sinkId={speakerId} />}

      {visible && minimized && (
        <MiniCall
          call={call}
          remoteStream={remoteStream}
          onExpand={() => setMinimized(false)}
          onMute={toggleMute}
          onEnd={endCall}
        />
      )}

      <AnimatePresence>
        {showFull && (
          <motion.div
            ref={rootRef}
            role="dialog"
            aria-modal="true"
            aria-label={call.status === "ringing" ? "Incoming call" : "Call"}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl md:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
          >
            <div className="relative flex h-full w-full max-w-[1200px] flex-col overflow-hidden bg-zinc-950 text-white md:h-[88vh] md:rounded-3xl md:border md:border-white/10 md:shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.12),transparent_60%)]" />

              {videoStage ? (
                <VideoStage call={call} localStream={localStream} remoteStream={remoteStream} />
              ) : (
                <VoiceStage call={call} preview={localStream} remoteStream={remoteStream} />
              )}

              <StatusPill call={call} />
              <SoundBanner show={ringing} />

              {(canMinimize || canPip) && (
                <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
                  {canPip && (
                    <button type="button" onClick={() => void togglePip()} aria-label="Picture in picture" title="Picture in picture" className={CORNER_BUTTON}>
                      <PictureInPicture2 size={18} />
                    </button>
                  )}
                  {canMinimize && (
                    <button type="button" onClick={() => setMinimized(true)} aria-label="Minimize call" title="Minimize call" className={CORNER_BUTTON}>
                      <Minimize2 size={18} />
                    </button>
                  )}
                </div>
              )}

              {reconnecting && (
                <div className="absolute inset-x-0 top-16 z-30 flex justify-center">
                  <div className="flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-200 backdrop-blur">
                    <WifiOff size={14} /> Connection unstable. Trying to reconnect...
                  </div>
                </div>
              )}

              {call.notice && (
                <div role="status" className="absolute inset-x-0 top-16 z-30 flex justify-center px-4">
                  <div className="flex items-center gap-2 rounded-xl bg-black/70 px-4 py-2 text-sm text-white shadow-lg backdrop-blur">
                    <Info size={16} className="shrink-0 text-cyan-300" />
                    {call.notice}
                  </div>
                </div>
              )}

              {settingsOpen && interactive && (
                <DeviceMenu
                  call={call}
                  devices={devices}
                  speakerId={speakerId}
                  speakerSupported={supportsSpeakerSelection()}
                  onMic={setMicrophone}
                  onCamera={setCamera}
                  onSpeaker={setSpeakerId}
                  onClose={closeSettings}
                />
              )}

              <CallControls
                call={call}
                visible={controlsVisible}
                fullscreen={fullscreen}
                settingsOpen={settingsOpen}
                onAccept={acceptCall}
                onReject={rejectCall}
                onEnd={endCall}
                onMute={toggleMute}
                onVideo={toggleVideo}
                onScreen={toggleScreenShare}
                onSettings={toggleSettings}
                onFullscreen={toggleFullscreen}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}