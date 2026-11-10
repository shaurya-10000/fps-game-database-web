"use client";

import { useEffect, useState } from "react";

/** True while the stream carries audible speech (a simple loudness threshold, checked a few times a second). */
export function useAudioLevel(stream: MediaStream | null, enabled = true): boolean {
  const [speaking, setSpeaking] = useState(false);
  const hasAudio = enabled && stream !== null && stream.getAudioTracks().length > 0;

  useEffect(() => {
    if (!stream || !hasAudio) return;
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    void ctx.resume().catch(() => undefined);
    const source = ctx.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    let lastLoud = 0;

    const timer = setInterval(() => {
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (let i = 0; i < samples.length; i++) {
        const v = ((samples[i] ?? 128) - 128) / 128;
        sum += v * v;
      }
      const now = Date.now();
      if (Math.sqrt(sum / samples.length) > 0.04) lastLoud = now;
      setSpeaking(now - lastLoud < 350);
    }, 120);

    return () => {
      clearInterval(timer);
      source.disconnect();
      void ctx.close().catch(() => undefined);
      setSpeaking(false);
    };
  }, [stream, hasAudio]);

  return hasAudio && speaking;
}