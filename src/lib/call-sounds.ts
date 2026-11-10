"use client";

type Schedule = (ctx: AudioContext, out: AudioNode, t: number) => void;

function tone(
  ctx: AudioContext,
  out: AudioNode,
  freq: number,
  start: number,
  duration: number,
  peak: number,
  type: OscillatorType = "sine",
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const attack = 0.02;
  const release = Math.min(0.08, duration / 2);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.setValueAtTime(peak, start + Math.max(attack, duration - release));
  gain.gain.linearRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(out);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

const RINGTONE: Schedule = (ctx, out, t) => {
  [0, 0.9].forEach((offset) => {
    [880, 1175, 880, 1175].forEach((freq, i) => {
      tone(ctx, out, freq, t + offset + i * 0.17, 0.14, 0.2, "triangle");
    });
  });
};

const RINGBACK: Schedule = (ctx, out, t) => {
  tone(ctx, out, 440, t, 1.4, 0.08);
  tone(ctx, out, 480, t, 1.4, 0.08);
};

const CONNECTED: Schedule = (ctx, out, t) => {
  tone(ctx, out, 659.25, t, 0.12, 0.12);
  tone(ctx, out, 880, t + 0.11, 0.18, 0.12);
};

const ENDED: Schedule = (ctx, out, t) => {
  tone(ctx, out, 587.33, t, 0.14, 0.12);
  tone(ctx, out, 392, t + 0.14, 0.24, 0.12);
};

const MESSAGE: Schedule = (ctx, out, t) => {
  tone(ctx, out, 988, t, 0.09, 0.07, "triangle");
  tone(ctx, out, 1319, t + 0.08, 0.14, 0.07, "triangle");
};

/**
 * Synthesised call sounds (no audio assets needed).
 * Ringtone and ringback loop until stop() is called (call answered, declined or ended).
 * Browsers keep audio locked until the user interacts with the page; isLocked()/unlock()
 * let the UI offer a one-click fix instead of silently ringing without sound.
 */
class CallSounds {
  private ctx: AudioContext | null = null;
  private session: GainNode | null = null;
  private loop: ReturnType<typeof setInterval> | null = null;
  private tickNow: (() => void) | null = null;
  private armed = false;
  private readonly listeners = new Set<() => void>();

  /** useSyncExternalStore-compatible subscription to lock/unlock changes. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** True while the browser is still blocking audio playback. */
  isLocked = (): boolean => !this.ctx || this.ctx.state !== "running";

  /** Unlock audio on the first user gesture. Safe to call many times. */
  arm(): void {
    if (this.armed || typeof window === "undefined") return;
    this.armed = true;
    const unlock = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      this.unlock();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
  }

  /** Call from a click handler to unlock audio immediately. */
  unlock(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    void ctx
      .resume()
      .then(() => {
        this.tickNow?.();
        this.emit();
      })
      .catch(() => undefined);
  }

  startRingtone(): void {
    this.startLoop(2800, RINGTONE);
  }

  startRingback(): void {
    this.startLoop(4000, RINGBACK);
  }

  playConnected(): void {
    this.playOnce(CONNECTED);
  }

  playEnded(): void {
    this.playOnce(ENDED);
  }

  /** Soft chime for a new message in a chat that is not open. */
  playMessage(): void {
    this.playOnce(MESSAGE);
  }

  /** Stops any looping ringtone / ringback with a short fade. */
  stop(): void {
    if (this.loop) clearInterval(this.loop);
    this.loop = null;
    this.tickNow = null;
    const session = this.session;
    this.session = null;
    if (session && this.ctx) {
      session.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
      setTimeout(() => session.disconnect(), 200);
    }
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.ctx.addEventListener("statechange", () => this.emit());
      this.emit();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => undefined);
    return this.ctx;
  }

  private startLoop(periodMs: number, schedule: Schedule): void {
    this.stop();
    const ctx = this.ensureContext();
    if (!ctx) return;

    const session = ctx.createGain();
    session.gain.value = 1;
    session.connect(ctx.destination);
    this.session = session;

    const tick = () => {
      const c = this.ctx;
      if (!c || this.session !== session) return;
      if (c.state !== "running") {
        void c.resume().catch(() => undefined);
        return; // never queue tones against a frozen clock
      }
      schedule(c, session, c.currentTime + 0.02);
    };

    this.tickNow = tick;
    tick();
    this.loop = setInterval(tick, periodMs);
  }

  private playOnce(schedule: Schedule): void {
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== "running") return;
    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(ctx.destination);
    schedule(ctx, out, ctx.currentTime + 0.02);
    setTimeout(() => out.disconnect(), 1500);
  }
}

export const callSounds = new CallSounds();