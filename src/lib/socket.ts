"use client";

import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./backend";
import { getToken } from "./auth";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  const token = getToken();
  if (!token) throw new Error("No token available for socket connection");

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}