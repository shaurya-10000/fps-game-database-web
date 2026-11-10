"use client";

import { CallProvider } from "./chat/CallContext";
import CallOverlay from "./chat/CallOverlay";
import ChatNotifier from "./ChatNotifier";

/**
 * Lives in the dashboard layout, so calls, presence and notifications keep working while you move
 * between pages. An incoming call rings anywhere in the dashboard, and an active call can be minimized.
 */
export default function DashboardCallLayer({ children }: { children: React.ReactNode }) {
  return (
    <CallProvider>
      {children}
      <CallOverlay />
      <ChatNotifier />
    </CallProvider>
  );
}