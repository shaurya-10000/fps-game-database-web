"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_RECORDING_MS = 700;
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

interface Options {
  maxSeconds?: number;
  onComplete: (blob: Blob) => void | Promise<void>;
  onError: (message: string) => void;
}

export function useVoiceRecorder({ maxSeconds = 120, onComplete, onError }: Options) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sendRef = useRef(true);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handlersRef = useRef({ onComplete, onError });

  useEffect(() => {
    handlersRef.current = { onComplete, onError };
  });

  const release = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const finish = useCallback((send: boolean) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    sendRef.current = send;
    recorder.stop();
    setRecording(false);
  }, []);

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      handlersRef.current.onError("Voice messages aren't supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      sendRef.current = true;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const heldMs = Date.now() - startedAtRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        recorderRef.current = null;
        release();
        setElapsed(0);
        if (!sendRef.current) return;
        if (heldMs < MIN_RECORDING_MS || blob.size === 0) {
          handlersRef.current.onError("That was too short. Record a little longer.");
          return;
        }
        void handlersRef.current.onComplete(blob);
      };

      startedAtRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      recorder.start();
      timerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(seconds);
        if (seconds >= maxSeconds) finish(true);
      }, 250);
    } catch (err) {
      release();
      const denied = typeof err === "object" && err !== null && "name" in err && (err as { name: string }).name === "NotAllowedError";
      handlersRef.current.onError(
        denied ? "Microphone access is blocked. Allow it in your browser settings." : "Could not access the microphone.",
      );
    }
  }, [finish, maxSeconds, release]);

  useEffect(
    () => () => {
      sendRef.current = false;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      release();
    },
    [release],
  );

  return {
    recording,
    elapsed,
    start,
    send: () => finish(true),
    cancel: () => finish(false),
  };
}