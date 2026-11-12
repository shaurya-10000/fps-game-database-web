"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { decodeJwtUnsafe, getToken, isTokenValid } from "@/lib/auth";
import { getFriends } from "@/lib/friends-api";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { IDLE_CALL_STATE, WebRTCManager, type CallState, type CallSummary } from "@/lib/webrtc";
import { useCallFeedback } from "./useCallFeedback";

interface CallContextType {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  /** The most recent finished call. */
  lastCall: CallSummary | null;
  /** The shared realtime socket (null while signed out). */
  socket: Socket | null;
  /** Friends who currently have the dashboard open. */
  onlineIds: ReadonlySet<string>;
  /** True while the call is shown as a small window instead of full screen. */
  minimized: boolean;
  setMinimized: (minimized: boolean) => void;
  /** True while any call is ringing, connecting or active. */
  isBusy: boolean;
  startCall: (targetPlayerId: string, isVideo: boolean, name?: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  setMicrophone: (deviceId: string) => void;
  setCamera: (deviceId: string) => void;
}

const CallContext = createContext<CallContextType | null>(null);

interface NamedFriendRow {
  toPlayerId: string;
  toPlayerName?: string;
}

async function loadFriendNames(): Promise<Map<string, string>> {
  const rows = (await getFriends()) as NamedFriendRow[];
  const names = new Map<string, string>();
  for (const row of rows) {
    if (row.toPlayerName) names.set(row.toPlayerId, row.toPlayerName);
  }
  return names;
}

function readSelfName(): string {
  const token = getToken();
  const decoded = token ? decodeJwtUnsafe(token) : null;
  return decoded && typeof decoded.username === "string" ? decoded.username : "";
}

/** Saves a finished outgoing call into the DM so both people keep the history. */
function logCall(summary: CallSummary): void {
  if (summary.direction !== "outgoing") return;
  if (summary.outcome === "failed" || summary.outcome === "missed") return;
  void api("/api/chat/calls", {
    method: "POST",
    body: {
      peerId: summary.peerId,
      kind: summary.kind,
      outcome: summary.outcome,
      durationSec: summary.durationSec,
    },
  }).catch(() => undefined);
}

const NO_ONLINE: ReadonlySet<string> = new Set();

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<CallState>(IDLE_CALL_STATE);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [lastCall, setLastCall] = useState<CallSummary | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineIds, setOnlineIds] = useState<ReadonlySet<string>>(NO_ONLINE);
  const [minimized, setMinimized] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

  const managerRef = useRef<WebRTCManager | null>(null);
  const friendNamesRef = useRef<Map<string, string> | null>(null);

  const resolveName = useCallback(async (playerId: string): Promise<string> => {
    try {
      if (!friendNamesRef.current) friendNamesRef.current = await loadFriendNames();
      const cached = friendNamesRef.current.get(playerId);
      if (cached) return cached;
      // Unknown id: the friend list may have changed since we cached it.
      friendNamesRef.current = await loadFriendNames();
      return friendNamesRef.current.get(playerId) ?? "";
    } catch {
      return "";
    }
  }, []);

  // Signing in or out rebuilds the connection, so the provider can live above the login page.
  useEffect(() => {
    const onAuthChange = () => {
      friendNamesRef.current = null;
      setAuthVersion((v) => v + 1);
    };
    window.addEventListener("fps-auth-changed", onAuthChange);
    return () => window.removeEventListener("fps-auth-changed", onAuthChange);
  }, []);

  useEffect(() => {
    if (!isTokenValid(getToken())) return;

    let live: Socket;
    try {
      live = getSocket();
    } catch {
      return; // not signed in yet
    }

    const manager = new WebRTCManager(live, { resolveName, selfName: readSelfName() });
    manager.onStateChange = setCallState;
    manager.onLocalStream = setLocalStream;
    manager.onRemoteStream = setRemoteStream;
    manager.onCallSummary = (summary) => {
      setLastCall(summary);
      logCall(summary);
    };
    managerRef.current = manager;
    // This effect owns the socket's lifecycle and mirrors it into state for context consumers.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(live);

    const onSnapshot = (event: { online: string[] }) => setOnlineIds(new Set(event.online));
    const onPresence = (event: { playerId: string; online: boolean }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (event.online) next.add(event.playerId);
        else next.delete(event.playerId);
        return next;
      });
    const onDisconnect = () => setOnlineIds(NO_ONLINE);
    live.on("presence_snapshot", onSnapshot);
    live.on("presence", onPresence);
    live.on("disconnect", onDisconnect);

    // ── Write real notifications to localStorage ──────────────────────────
    const pushToStorage = (entry: {
      kind: "message" | "call" | "friend-request" | "system";
      title: string;
      description: string;
      meta?: Record<string, string>;
    }) => {
      try {
        const STORAGE_KEY = "fps.notifications";
        const raw = localStorage.getItem(STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const arr = Array.isArray(list) ? list : [];
        const next = [
          {
            id: `n_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            ...entry,
            createdAt: Date.now(),
            read: false,
          },
          ...arr,
        ].slice(0, 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        // Notify same-tab listeners
        window.dispatchEvent(new Event("fps-notifications-changed"));
      } catch { /* ignore storage errors */ }
    };

    const onChatActivity = (activity: { senderName: string; preview: string; kind: "dm" | "group" }) => {
      pushToStorage({
        kind: "message",
        title: activity.senderName || "New message",
        description: activity.preview || "Sent you a message",
      });
    };

    const onIncomingCall = (payload: { fromPlayerId: string; offer?: { meta?: { fromName?: string } } }) => {
      pushToStorage({
        kind: "call",
        title: "Incoming call",
        description: `${payload.offer?.meta?.fromName ?? "Someone"} is calling you.`,
      });
    };

    live.on("chat_activity", onChatActivity);
    live.on("incoming_call", onIncomingCall);

    return () => {
      live.off("presence_snapshot", onSnapshot);
      live.off("presence", onPresence);
      live.off("disconnect", onDisconnect);

      manager.dispose();
      managerRef.current = null;
      setSocket(null);
      setOnlineIds(NO_ONLINE);
      // This provider owns the shared socket; a stale socket would keep the previous user's auth.
      disconnectSocket();
    };
  }, [resolveName, authVersion]);

  useCallFeedback(callState);

  // A ringing or finished call always takes over the screen again.
  const { status } = callState;
  const [previousStatus, setPreviousStatus] = useState(status);
  if (previousStatus !== status) {
    setPreviousStatus(status);
    if (status === "idle" || status === "ringing") setMinimized(false);
  }

  const startCall = useCallback((targetPlayerId: string, isVideo: boolean, name?: string) => {
    void managerRef.current?.startCall(targetPlayerId, isVideo, name);
  }, []);
  const acceptCall = useCallback(() => void managerRef.current?.acceptCall(), []);
  const rejectCall = useCallback(() => managerRef.current?.rejectCall(), []);
  const endCall = useCallback(() => managerRef.current?.endCall(), []);
  const toggleMute = useCallback(() => managerRef.current?.toggleMute(), []);
  const toggleVideo = useCallback(() => void managerRef.current?.toggleVideo(), []);
  const toggleScreenShare = useCallback(() => void managerRef.current?.toggleScreenShare(), []);
  const setMicrophone = useCallback((deviceId: string) => void managerRef.current?.setMicrophone(deviceId), []);
  const setCamera = useCallback((deviceId: string) => void managerRef.current?.setCamera(deviceId), []);

  const isBusy = callState.status !== "idle" && callState.status !== "ended";

  const value = useMemo<CallContextType>(
    () => ({
      callState,
      localStream,
      remoteStream,
      lastCall,
      socket,
      onlineIds,
      minimized,
      setMinimized,
      isBusy,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMute,
      toggleVideo,
      toggleScreenShare,
      setMicrophone,
      setCamera,
    }),
    [
      callState,
      localStream,
      remoteStream,
      lastCall,
      socket,
      onlineIds,
      minimized,
      isBusy,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMute,
      toggleVideo,
      toggleScreenShare,
      setMicrophone,
      setCamera,
    ],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall(): CallContextType {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}

