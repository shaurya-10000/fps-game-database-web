import type { Socket } from "socket.io-client";

export type CallStatus = "idle" | "calling" | "ringing" | "connecting" | "active" | "ended";
export type EndReason = "hangup" | "declined" | "missed" | "no-answer" | "failed";

export interface RemoteMediaState {
  muted: boolean;
  videoOff: boolean;
  screenSharing: boolean;
}

export interface CallState {
  status: CallStatus;
  isVideo: boolean;
  targetPlayerId: string | null;
  targetName: string;
  /** Non-fatal info shown briefly (e.g. "Camera unavailable"). */
  notice: string | null;
  /** Fatal error text shown on the call-ended screen. */
  error: string | null;
  endReason: EndReason | null;
  durationSec: number;
  /** While ringing these are the "join with" preferences; once connected they mirror the live tracks. */
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  hasCamera: boolean;
  canScreenShare: boolean;
  micId: string | null;
  cameraId: string | null;
  connection: "connected" | "reconnecting";
  /** Rough network quality while connected (round trip time and packet loss). */
  quality: "good" | "fair" | "poor";
  connectedAt: number | null;
  remote: RemoteMediaState;
}

export interface CallSummary {
  id: number;
  peerId: string;
  peerName: string;
  kind: "voice" | "video";
  direction: "incoming" | "outgoing";
  outcome: "completed" | "declined" | "missed" | "no-answer" | "cancelled" | "failed";
  durationSec: number;
  at: string;
}

export const IDLE_CALL_STATE: CallState = {
  status: "idle",
  isVideo: false,
  targetPlayerId: null,
  targetName: "",
  notice: null,
  error: null,
  endReason: null,
  durationSec: 0,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  hasCamera: false,
  canScreenShare: false,
  micId: null,
  cameraId: null,
  connection: "connected",
  quality: "good",
  connectedAt: null,
  remote: { muted: false, videoOff: false, screenSharing: false },
};

interface OfferMeta {
  isVideo?: boolean;
  fromName?: string;
}

type OfferPayload = RTCSessionDescriptionInit & { meta?: OfferMeta };

interface ManagerOptions {
  resolveName?: (playerId: string) => Promise<string>;
  selfName?: string;
}

const RING_TIMEOUT_MS = 60_000;
const INCOMING_STALE_MS = 75_000;
const ENDED_VISIBLE_MS = 2_500;
const NOTICE_VISIBLE_MS = 5_000;

class CallError extends Error {}

function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ];
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  if (turnUrl) {
    const urls = turnUrl.split(",").map((u) => u.trim()).filter(Boolean);
    if (urls.length > 0) {
      servers.push({
        urls,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
      });
    }
  }
  return servers;
}

function errorName(err: unknown): string {
  return typeof err === "object" && err !== null && "name" in err ? String((err as { name: unknown }).name) : "";
}

function isDeviceError(err: unknown): boolean {
  return ["NotAllowedError", "NotFoundError", "NotReadableError", "OverconstrainedError"].includes(errorName(err));
}

function describeMediaError(err: unknown): string {
  switch (errorName(err)) {
    case "NotAllowedError":
      return "Microphone or camera permission was denied. Allow access in your browser settings and try again.";
    case "NotFoundError":
      return "No microphone or camera was found on this device.";
    case "NotReadableError":
      return "Your microphone or camera is being used by another app.";
    default:
      return "Could not access your microphone or camera.";
  }
}

function supportsDisplayCapture(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getDisplayMedia === "function";
}

function trackDeviceId(track: MediaStreamTrack | undefined): string | null {
  return track?.getSettings().deviceId ?? null;
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function shortName(playerId: string): string {
  return `Player ${playerId.slice(0, 6)}`;
}

export class WebRTCManager {
  public onStateChange: (state: CallState) => void = () => {};
  public onLocalStream: (stream: MediaStream | null) => void = () => {};
  public onRemoteStream: (stream: MediaStream | null) => void = () => {};
  public onCallSummary: (summary: CallSummary) => void = () => {};

  private readonly socket: Socket;
  private readonly options: ManagerOptions;

  private state: CallState = { ...IDLE_CALL_STATE };
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private remoteTracks: MediaStreamTrack[] = [];
  private audioSender: RTCRtpSender | null = null;
  private videoSender: RTCRtpSender | null = null;
  private pendingOffer: OfferPayload | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private peerId: string | null = null;
  private direction: "incoming" | "outgoing" | null = null;
  private preferredMic: string | null = null;
  private preferredCamera: string | null = null;
  private summaryId = 0;
  private session = 0;
  private ringTimer: ReturnType<typeof setTimeout> | null = null;
  private endedTimer: ReturnType<typeof setTimeout> | null = null;
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;
  private statsTimer: ReturnType<typeof setInterval> | null = null;
  private everConnectedAt: number | null = null;

  constructor(socket: Socket, options: ManagerOptions = {}) {
    this.socket = socket;
    this.options = options;
    socket.on("incoming_call", this.handleIncoming);
    socket.on("call_answered", this.handleAnswered);
    socket.on("ice_candidate", this.handleIce);
    socket.on("call_ended", this.handleEnded);
  }

  // ---------------------------------------------------------------- public API

  public getState(): CallState {
    return this.state;
  }

  public async startCall(targetPlayerId: string, isVideo: boolean, name?: string): Promise<void> {
    if (this.isBusy()) return;
    this.clearEndedTimer();
    this.teardown();

    const session = this.session;
    this.peerId = targetPlayerId;
    this.direction = "outgoing";
    this.setState({
      ...IDLE_CALL_STATE,
      status: "calling",
      isVideo,
      targetPlayerId,
      targetName: name || shortName(targetPlayerId),
      isVideoOff: !isVideo,
      canScreenShare: supportsDisplayCapture(),
      remote: { muted: false, videoOff: !isVideo, screenSharing: false },
    });
    if (!name) void this.resolvePeerName(targetPlayerId, session);

    try {
      const stream = await this.acquireMedia(isVideo);
      if (session !== this.session) {
        stopStream(stream);
        return;
      }
      this.attachLocalStream(stream);

      const pc = this.createPeer();
      this.attachDataChannel(pc.createDataChannel("meta"));
      this.addLocalTracks(pc, stream, "offerer");

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (session !== this.session) return;

      const meta: OfferMeta = { isVideo, fromName: this.options.selfName };
      this.socket.emit("call_user", {
        targetPlayerId,
        offer: { type: offer.type, sdp: offer.sdp, meta },
        isVideo,
      });

      this.ringTimer = setTimeout(() => {
        if (session === this.session && this.state.status === "calling") {
          this.finish("no-answer", { notifyPeer: true });
        }
      }, RING_TIMEOUT_MS);
    } catch (err) {
      if (session !== this.session) return;
      this.finish("failed", {
        notifyPeer: false,
        error: err instanceof CallError ? err.message : "Could not start the call.",
      });
    }
  }

  public async acceptCall(): Promise<void> {
    const offer = this.pendingOffer;
    const peer = this.peerId;
    if (this.state.status !== "ringing" || !offer || !peer) return;

    const session = this.session;
    this.clearRingTimer();
    this.setState({ status: "connecting" });

    try {
      // Honour the "join with" choices made while the phone was ringing.
      const stream = await this.acquireMedia(!this.state.isVideoOff);
      if (session !== this.session) {
        stopStream(stream);
        return;
      }
      this.attachLocalStream(stream);

      const pc = this.createPeer();
      await pc.setRemoteDescription({ type: offer.type, sdp: offer.sdp });
      await this.flushCandidates();
      this.addLocalTracks(pc, stream, "answerer");

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (session !== this.session) return;

      this.pendingOffer = null;
      this.socket.emit("answer_call", {
        targetPlayerId: peer,
        answer: { type: answer.type, sdp: answer.sdp },
      });
    } catch (err) {
      if (session !== this.session) return;
      this.finish("failed", {
        notifyPeer: true,
        error: err instanceof CallError ? err.message : "Could not connect the call.",
      });
    }
  }

  public rejectCall(): void {
    this.finish("declined", { notifyPeer: true, silent: true });
  }

  public endCall(): void {
    const { status } = this.state;
    const quiet = status === "calling" || status === "ringing";
    this.finish("hangup", { notifyPeer: true, silent: quiet });
  }

  /** Works before answering too: it then sets whether you join muted. */
  public toggleMute(): void {
    if (!this.isBusy()) return;
    const next = !this.state.isMuted;
    const track = this.localStream?.getAudioTracks()[0];
    if (track) track.enabled = !next;
    this.setState({ isMuted: next });
    this.broadcastLocalState();
  }

  /** Before answering this only records whether you join with video. Afterwards it turns the camera on/off (opening it if needed). */
  public async toggleVideo(): Promise<void> {
    if (!this.isBusy()) return;

    const existing = this.localStream?.getVideoTracks()[0];
    if (existing) {
      existing.enabled = !existing.enabled;
      this.setState({ isVideoOff: !existing.enabled });
      this.broadcastLocalState();
      return;
    }

    if (this.state.status === "ringing") {
      this.setState({ isVideoOff: !this.state.isVideoOff });
      return;
    }

    const stream = this.localStream;
    if (!stream) return;
    const session = this.session;
    try {
      const camera = await navigator.mediaDevices.getUserMedia({ video: this.videoConstraints() });
      const fresh = camera.getVideoTracks()[0];
      if (!fresh) return;
      if (session !== this.session) {
        fresh.stop();
        return;
      }
      stream.addTrack(fresh);
      if (this.videoSender && !this.screenStream) await this.videoSender.replaceTrack(fresh);
      this.setState({ hasCamera: true, isVideoOff: false, cameraId: trackDeviceId(fresh) });
      if (!this.screenStream) this.onLocalStream(new MediaStream(stream.getTracks()));
      this.broadcastLocalState();
    } catch (err) {
      this.notify(describeMediaError(err));
    }
  }

  public async toggleScreenShare(): Promise<void> {
    if (this.state.isScreenSharing) {
      await this.stopScreenShare();
    } else {
      await this.startScreenShare();
    }
  }

  public async setMicrophone(deviceId: string): Promise<void> {
    this.preferredMic = deviceId;
    const stream = this.localStream;
    const old = stream?.getAudioTracks()[0];
    if (!stream || !old || !this.audioSender) {
      this.setState({ micId: deviceId });
      return;
    }
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({ audio: this.audioConstraints(deviceId) });
      const track = fresh.getAudioTracks()[0];
      if (!track) return;
      track.enabled = !this.state.isMuted;
      await this.audioSender.replaceTrack(track);
      stream.removeTrack(old);
      old.stop();
      stream.addTrack(track);
      this.setState({ micId: trackDeviceId(track) ?? deviceId });
    } catch {
      this.notify("Could not switch microphone.");
    }
  }

  public async setCamera(deviceId: string): Promise<void> {
    this.preferredCamera = deviceId;
    const stream = this.localStream;
    const old = stream?.getVideoTracks()[0];
    if (!stream || !old) {
      this.setState({ cameraId: deviceId });
      return;
    }
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({ video: this.videoConstraints(deviceId) });
      const track = fresh.getVideoTracks()[0];
      if (!track) return;
      track.enabled = !this.state.isVideoOff;
      if (this.videoSender && !this.screenStream) await this.videoSender.replaceTrack(track);
      stream.removeTrack(old);
      old.stop();
      stream.addTrack(track);
      this.setState({ cameraId: trackDeviceId(track) ?? deviceId });
      if (!this.screenStream) this.onLocalStream(new MediaStream(stream.getTracks()));
    } catch {
      this.notify("Could not switch camera.");
    }
  }

  public dispose(): void {
    this.socket.off("incoming_call", this.handleIncoming);
    this.socket.off("call_answered", this.handleAnswered);
    this.socket.off("ice_candidate", this.handleIce);
    this.socket.off("call_ended", this.handleEnded);
    if (this.peerId && this.isBusy()) {
      this.socket.emit("end_call", { targetPlayerId: this.peerId });
    }
    this.onStateChange = () => {};
    this.onLocalStream = () => {};
    this.onRemoteStream = () => {};
    this.onCallSummary = () => {};
    this.clearEndedTimer();
    this.clearNoticeTimer();
    this.teardown();
  }

  // ------------------------------------------------------------ socket events

  private handleIncoming = (payload: { fromPlayerId: string; offer: OfferPayload; isVideo?: boolean }): void => {
    const { fromPlayerId, offer } = payload;
    if (!fromPlayerId || !offer) return;

    if (this.isBusy()) {
      // Already in a call: politely decline the second one.
      this.socket.emit("end_call", { targetPlayerId: fromPlayerId });
      return;
    }

    this.clearEndedTimer();
    this.teardown();

    const session = this.session;
    const isVideo = offer.meta?.isVideo ?? payload.isVideo ?? /m=video/.test(offer.sdp ?? "");
    this.peerId = fromPlayerId;
    this.direction = "incoming";
    this.pendingOffer = offer;
    this.setState({
      ...IDLE_CALL_STATE,
      status: "ringing",
      isVideo,
      targetPlayerId: fromPlayerId,
      targetName: offer.meta?.fromName || shortName(fromPlayerId),
      isVideoOff: !isVideo,
      canScreenShare: supportsDisplayCapture(),
      remote: { muted: false, videoOff: !isVideo, screenSharing: false },
    });
    void this.resolvePeerName(fromPlayerId, session);

    // The server never tells us if the caller vanished, so stop ringing eventually.
    this.ringTimer = setTimeout(() => {
      if (session === this.session && this.state.status === "ringing") {
        this.finish("missed", { notifyPeer: true });
      }
    }, INCOMING_STALE_MS);
  };

  private handleAnswered = async (payload: { fromPlayerId?: string; answer: RTCSessionDescriptionInit }): Promise<void> => {
    const pc = this.pc;
    if (!pc || this.state.status !== "calling") return;
    if (payload.fromPlayerId && payload.fromPlayerId !== this.peerId) return;

    const session = this.session;
    this.clearRingTimer();
    try {
      await pc.setRemoteDescription({ type: payload.answer.type, sdp: payload.answer.sdp });
      if (session !== this.session) return;
      await this.flushCandidates();
      this.setState({ status: "connecting" });
    } catch {
      if (session !== this.session) return;
      this.finish("failed", { notifyPeer: true, error: "Could not establish the call connection." });
    }
  };

  private handleIce = async (payload: { fromPlayerId?: string; candidate: RTCIceCandidateInit | null }): Promise<void> => {
    const { candidate, fromPlayerId } = payload;
    if (!candidate) return;
    if (fromPlayerId && this.peerId && fromPlayerId !== this.peerId) return;
    if (this.state.status === "idle" || this.state.status === "ended") return;

    // Candidates can arrive before the callee has answered or before the
    // remote description is set. Queue them instead of dropping them.
    if (this.pc?.remoteDescription) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn("addIceCandidate failed", err);
      }
    } else {
      this.pendingCandidates.push(candidate);
    }
  };

  private handleEnded = (payload: { fromPlayerId?: string }): void => {
    if (payload?.fromPlayerId && this.peerId && payload.fromPlayerId !== this.peerId) return;
    const { status } = this.state;
    if (status === "idle" || status === "ended") return;
    const reason: EndReason = status === "calling" ? "declined" : status === "ringing" ? "missed" : "hangup";
    this.finish(reason, { notifyPeer: false });
  };

  // ------------------------------------------------------------ peer plumbing

  private createPeer(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: buildIceServers() });

    pc.onicecandidate = (event) => {
      if (event.candidate && this.peerId) {
        this.socket.emit("ice_candidate", {
          targetPlayerId: this.peerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      if (this.pc !== pc) return;
      if (!this.remoteTracks.includes(event.track)) this.remoteTracks.push(event.track);
      // Hand out a fresh MediaStream each time so React re-attaches the element.
      this.onRemoteStream(new MediaStream(this.remoteTracks));
    };

    pc.onconnectionstatechange = () => this.handleConnectionState(pc);
    pc.ondatachannel = (event) => this.attachDataChannel(event.channel);

    this.pc = pc;
    return pc;
  }

  private handleConnectionState(pc: RTCPeerConnection): void {
    if (pc !== this.pc) return;
    switch (pc.connectionState) {
      case "connected":
        if (this.state.status === "connecting" || this.state.status === "active") {
          const now = this.state.connectedAt ?? Date.now();
          this.everConnectedAt = now;
          this.setState({
            status: "active",
            connection: "connected",
            connectedAt: now,
          });
          this.startStats(pc);
        }
        break;
      case "disconnected":
        if (this.state.status === "active") this.setState({ connection: "reconnecting" });
        break;
      case "failed":
        this.finish("failed", {
          notifyPeer: true,
          error: "Connection lost. Check your network and try again.",
        });
        break;
      default:
        break;
    }
  }

  private addLocalTracks(pc: RTCPeerConnection, stream: MediaStream, role: "offerer" | "answerer"): void {
    stream.getTracks().forEach((track) => {
      const sender = pc.addTrack(track, stream);
      if (track.kind === "video") this.videoSender = sender;
      else this.audioSender = sender;
    });

    if (!this.videoSender) {
      // Reserve a video line so the camera or a screen share can start later without renegotiation.
      if (role === "offerer") {
        this.videoSender = pc.addTransceiver("video", { direction: "sendrecv" }).sender;
      } else {
        const existing = pc
          .getTransceivers()
          .find((t) => t.receiver.track.kind === "video" && t.currentDirection !== "stopped");
        if (existing) {
          existing.direction = "sendrecv";
          this.videoSender = existing.sender;
        }
      }
    }

    // A screen picked while the phone was still ringing goes out as soon as we connect.
    const screenTrack = this.screenStream?.getVideoTracks()[0];
    if (screenTrack && this.videoSender) {
      void this.videoSender.replaceTrack(screenTrack).catch(() => undefined);
    }

    this.setState({ canScreenShare: this.videoSender !== null && supportsDisplayCapture() });
  }

  private async flushCandidates(): Promise<void> {
    const pc = this.pc;
    if (!pc?.remoteDescription) return;
    const queued = this.pendingCandidates;
    this.pendingCandidates = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn("queued addIceCandidate failed", err);
      }
    }
  }

  // ------------------------------------------------- in-call state (data channel)

  private attachDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;
    channel.onopen = () => this.broadcastLocalState();
    channel.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as {
          t?: string;
          muted?: boolean;
          videoOff?: boolean;
          screen?: boolean;
        };
        if (msg.t === "state") {
          this.setState({
            remote: {
              muted: Boolean(msg.muted),
              videoOff: Boolean(msg.videoOff),
              screenSharing: Boolean(msg.screen),
            },
          });
        }
      } catch {
        // Ignore malformed messages from the peer.
      }
    };
    if (channel.readyState === "open") this.broadcastLocalState();
  }

  private broadcastLocalState(): void {
    const channel = this.dataChannel;
    if (!channel || channel.readyState !== "open") return;
    channel.send(
      JSON.stringify({
        t: "state",
        muted: this.state.isMuted,
        videoOff: this.state.isVideoOff,
        screen: this.state.isScreenSharing,
      }),
    );
  }

  // ------------------------------------------------------------------- media

  private audioConstraints(exact?: string): MediaTrackConstraints {
    const deviceId = exact ? { exact } : this.preferredMic ? { ideal: this.preferredMic } : undefined;
    return { echoCancellation: true, noiseSuppression: true, autoGainControl: true, deviceId };
  }

  private videoConstraints(exact?: string): MediaTrackConstraints {
    const deviceId = exact ? { exact } : this.preferredCamera ? { ideal: this.preferredCamera } : undefined;
    return {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
      facingMode: "user",
      deviceId,
    };
  }

  private async acquireMedia(wantVideo: boolean): Promise<MediaStream> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new CallError("Calls need a secure (HTTPS) connection and a supported browser.");
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: this.audioConstraints(),
        video: wantVideo ? this.videoConstraints() : false,
      });
    } catch (err) {
      if (wantVideo && isDeviceError(err)) {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: this.audioConstraints(), video: false });
          this.notify("Camera unavailable. Continuing with audio only.");
          return audioOnly;
        } catch (inner) {
          throw new CallError(describeMediaError(inner));
        }
      }
      throw new CallError(describeMediaError(err));
    }
  }

  private attachLocalStream(stream: MediaStream): void {
    this.localStream = stream;
    const audio = stream.getAudioTracks()[0];
    const video = stream.getVideoTracks()[0];
    // Apply the mute / camera choices made before the media existed.
    if (audio) audio.enabled = !this.state.isMuted;
    if (video) video.enabled = !this.state.isVideoOff;
    this.setState({
      hasCamera: Boolean(video),
      isVideoOff: video ? this.state.isVideoOff : true,
      micId: trackDeviceId(audio),
      cameraId: trackDeviceId(video),
    });
    this.onLocalStream(this.screenStream ?? stream);
  }

  private async startScreenShare(): Promise<void> {
    if (!this.isBusy()) return;
    if (!supportsDisplayCapture()) {
      this.notify("Screen sharing isn't supported on this device.");
      return;
    }
    const lobby = this.state.status === "ringing";
    if (!lobby && !this.videoSender) {
      this.notify("Screen sharing isn't available in this call.");
      return;
    }

    const session = this.session;
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = display.getVideoTracks()[0];
      if (!track || session !== this.session) {
        stopStream(display);
        return;
      }
      if (this.videoSender) await this.videoSender.replaceTrack(track);
      track.onended = () => void this.stopScreenShare();
      this.screenStream = display;
      this.setState({ isScreenSharing: true });
      this.onLocalStream(display);
      this.broadcastLocalState();
    } catch (err) {
      const name = errorName(err);
      if (name !== "NotAllowedError" && name !== "AbortError") this.notify("Could not start screen sharing.");
    }
  }

  private async stopScreenShare(): Promise<void> {
    if (!this.screenStream) return;
    stopStream(this.screenStream);
    this.screenStream = null;
    const camera = this.localStream?.getVideoTracks()[0] ?? null;
    if (this.videoSender) {
      try {
        await this.videoSender.replaceTrack(camera);
      } catch (err) {
        console.warn("Could not restore camera track", err);
      }
    }
    this.setState({ isScreenSharing: false });
    this.onLocalStream(this.localStream ? new MediaStream(this.localStream.getTracks()) : null);
    this.broadcastLocalState();
  }

  // ------------------------------------------------------------------ lifecycle

  private isBusy(): boolean {
    const { status } = this.state;
    return status === "calling" || status === "ringing" || status === "connecting" || status === "active";
  }

  private finish(
    reason: EndReason,
    opts: { notifyPeer: boolean; error?: string; silent?: boolean },
  ): void {
    if (!this.isBusy()) return;

    if (opts.notifyPeer && this.peerId) {
      this.socket.emit("end_call", { targetPlayerId: this.peerId });
    }

    const { connectedAt, targetPlayerId, targetName, isVideo } = this.state;
    const durationSec = connectedAt ? Math.round((Date.now() - connectedAt) / 1000) : 0;
    this.emitSummary(reason, connectedAt !== null, durationSec);
    this.teardown();
    this.clearNoticeTimer();

    if (opts.silent) {
      this.setState({ ...IDLE_CALL_STATE });
      return;
    }

    this.setState({
      ...IDLE_CALL_STATE,
      status: "ended",
      isVideo,
      targetPlayerId,
      targetName,
      endReason: reason,
      error: opts.error ?? null,
      durationSec,
    });
    const visibleFor = reason === "failed" ? ENDED_VISIBLE_MS + 2_000 : ENDED_VISIBLE_MS;
    this.endedTimer = setTimeout(() => this.setState({ ...IDLE_CALL_STATE }), visibleFor);
  }

  private emitSummary(reason: EndReason, connected: boolean, durationSec: number): void {
    const peerId = this.state.targetPlayerId;
    const direction = this.direction;
    if (!peerId || !direction) return;

    let outcome: CallSummary["outcome"];
    if (connected) outcome = "completed";
    else if (reason === "declined") outcome = "declined";
    else if (reason === "missed") outcome = "missed";
    else if (reason === "no-answer") outcome = "no-answer";
    else if (reason === "failed") outcome = "failed";
    else outcome = "cancelled";

    this.summaryId += 1;
    this.onCallSummary({
      id: this.summaryId,
      peerId,
      peerName: this.state.targetName,
      kind: this.state.isVideo ? "video" : "voice",
      direction,
      outcome,
      durationSec,
      at: new Date().toISOString(),
    });
  }

  /** Releases every device/connection resource and invalidates in-flight async work. */
  private teardown(): void {
    this.session += 1;
    this.everConnectedAt = null;
    this.clearRingTimer();
    this.stopStats();

    if (this.dataChannel) {
      this.dataChannel.onopen = null;
      this.dataChannel.onmessage = null;
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.ontrack = null;
      this.pc.onconnectionstatechange = null;
      this.pc.ondatachannel = null;
      this.pc.close();
      this.pc = null;
    }
    stopStream(this.localStream);
    stopStream(this.screenStream);
    this.localStream = null;
    this.screenStream = null;
    this.remoteTracks = [];
    this.audioSender = null;
    this.videoSender = null;
    this.pendingOffer = null;
    this.pendingCandidates = [];
    this.peerId = null;
    this.direction = null;
    this.onLocalStream(null);
    this.onRemoteStream(null);
  }

  /** Samples round trip time and packet loss every few seconds to grade the connection. */
  private startStats(pc: RTCPeerConnection): void {
    if (this.statsTimer) return;
    let previousReceived = 0;
    let previousLost = 0;

    this.statsTimer = setInterval(async () => {
      if (this.pc !== pc || this.state.status !== "active") return;
      try {
        const report = await pc.getStats();
        const sample = { rttMs: null as number | null, received: 0, lost: 0 };
        report.forEach((stat) => {
          if (stat.type === "candidate-pair" && stat.state === "succeeded" && stat.nominated && typeof stat.currentRoundTripTime === "number") {
            sample.rttMs = stat.currentRoundTripTime * 1000;
          }
          if (stat.type === "inbound-rtp" && !stat.isRemote) {
            sample.received += stat.packetsReceived ?? 0;
            sample.lost += stat.packetsLost ?? 0;
          }
        });

        const deltaReceived = sample.received - previousReceived;
        const deltaLost = sample.lost - previousLost;
        previousReceived = sample.received;
        previousLost = sample.lost;
        const total = deltaReceived + deltaLost;
        const lossRate = total > 0 ? deltaLost / total : 0;
        const rtt = sample.rttMs ?? 0;

        const quality: CallState["quality"] = rtt > 400 || lossRate > 0.1 ? "poor" : rtt > 200 || lossRate > 0.03 ? "fair" : "good";
        if (quality !== this.state.quality) this.setState({ quality });
      } catch {
        // Stats are best effort.
      }
    }, 3000);
  }

  private stopStats(): void {
    if (this.statsTimer) clearInterval(this.statsTimer);
    this.statsTimer = null;
  }

  private async resolvePeerName(playerId: string, session: number): Promise<void> {
    const resolve = this.options.resolveName;
    if (!resolve) return;
    try {
      const name = await resolve(playerId);
      if (name && session === this.session && this.state.targetPlayerId === playerId) {
        this.setState({ targetName: name });
      }
    } catch {
      // Keep the fallback name.
    }
  }

  private notify(message: string): void {
    this.clearNoticeTimer();
    this.setState({ notice: message });
    this.noticeTimer = setTimeout(() => this.setState({ notice: null }), NOTICE_VISIBLE_MS);
  }

  private setState(partial: Partial<CallState>): void {
    this.state = { ...this.state, ...partial };
    this.onStateChange(this.state);
  }

  private clearRingTimer(): void {
    if (this.ringTimer) clearTimeout(this.ringTimer);
    this.ringTimer = null;
  }

  private clearEndedTimer(): void {
    if (this.endedTimer) clearTimeout(this.endedTimer);
    this.endedTimer = null;
  }

  private clearNoticeTimer(): void {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.noticeTimer = null;
  }
}


