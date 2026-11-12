"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Shield, UserPlus, MessageCircle, Phone, Check } from "lucide-react";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP = {
  message: MessageCircle,
  call: Phone,
  "friend-request": UserPlus,
  system: Shield,
} as const;

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  // Socket is intentionally not passed here to avoid requiring CallProvider in the global header.
  const socket = null;
  const { notifications, markAllRead, markRead, clearAll } = useNotifications(socket);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-[90] flex w-80 max-w-[calc(100vw-2rem)] flex-col border-l border-border bg-background shadow-2xl sm:w-96"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-foreground" />
                <h2 className="text-[15px] font-semibold text-foreground">Notifications</h2>
              </div>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-foreground/5 hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted p-8 text-center">
                  <Bell size={32} className="mb-4 opacity-20" />
                  <p className="text-[14px] font-medium text-foreground">You&apos;re all caught up</p>
                  <p className="text-[12px]">No new notifications.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {notifications.map((n: AppNotification) => {
                    const Icon = ICON_MAP[n.kind] ?? Bell;
                    return (
                      <li
                        key={n.id}
                        onClick={() => {
                          markRead(n.id);
                          if (n.kind === "message" && n.meta?.senderId) {
                            onClose();
                            router.push(`/dashboard/dms?dm=${n.meta.senderId}`);
                          } else if (n.kind === "friend-request") {
                            onClose();
                            router.push("/dashboard/friends");
                          }
                        }}
                        className={cn(
                          "flex items-start gap-4 p-5 transition-colors hover:bg-foreground/[0.02] cursor-pointer",
                          !n.read && "bg-foreground/[0.03]"
                        )}
                      >
                        <div className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          !n.read ? "bg-amber-500/20 text-amber-500" : "bg-foreground/10 text-muted"
                        )}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[13px]", !n.read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                            {n.title}
                          </p>
                          <p className="mt-1 text-[12px] leading-snug text-muted">{n.description}</p>
                          <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-muted">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && (
                          <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-border p-4 flex gap-2">
                <button
                  onClick={markAllRead}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-[13px] font-semibold text-foreground hover:bg-foreground/5"
                >
                  <Check size={14} /> Mark read
                </button>
                <button
                  onClick={clearAll}
                  className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-[13px] font-semibold text-rose-500 hover:bg-rose-500/10"
                >
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}



