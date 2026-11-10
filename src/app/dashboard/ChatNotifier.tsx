"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getChatSettings, isSnoozed } from "@/lib/chat-settings";
import { showNotification } from "@/lib/notifications";
import { useCall } from "./chat/CallContext";
import type { ChatActivity } from "./dms/DmsClient/types";

function isMuted(key: string): boolean {
  try {
    const raw = localStorage.getItem("fps.dms.prefs");
    const muted = raw ? (JSON.parse(raw) as { mutedChats?: unknown }).mutedChats : [];
    return Array.isArray(muted) && muted.includes(key);
  } catch {
    return false;
  }
}

/** Desktop notifications for new messages while this tab is in the background (needs permission). */
export default function ChatNotifier() {
  const { socket } = useCall();
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;
    const onActivity = (activity: ChatActivity) => {
      if (isSnoozed(getChatSettings())) return;
      if (isMuted(activity.kind === "dm" ? `dm:${activity.senderId}` : `group:${activity.roomId}`)) return;
      showNotification(activity.senderName || "New message", {
        body: activity.preview || "New message",
        tag: activity.roomId,
        onlyWhenHidden: true,
        onClick: () =>
          router.push(activity.kind === "dm" ? `/dashboard/dms?dm=${encodeURIComponent(activity.senderId)}` : "/dashboard/dms"),
      });
    };
    socket.on("chat_activity", onActivity);
    return () => {
      socket.off("chat_activity", onActivity);
    };
  }, [socket, router]);

  return null;
}