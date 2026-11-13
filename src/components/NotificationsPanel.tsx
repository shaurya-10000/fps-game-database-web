"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Bell, Shield, UserPlus, MessageCircle, Phone, Check, Inbox, 
  SlidersHorizontal, BellOff, Smartphone, SmartphoneNfc 
} from "lucide-react";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { notificationsSupported } from "@/lib/notifications";
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

const ALL_TYPES = [
  { id: "message", label: "Direct Messages", icon: MessageCircle },
  { id: "call", label: "Incoming Calls", icon: Phone },
  { id: "friend-request", label: "Friend Requests", icon: UserPlus },
  { id: "system", label: "System Updates", icon: Shield },
] as const;

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Small reusable header button
function HeaderIconButton({ 
  label, onClick, active, pressed, children 
}: { 
  label: string; onClick: () => void; active?: boolean; pressed?: boolean; children: React.ReactNode 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "flex size-10 items-center justify-center rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active 
          ? "bg-accent/10 text-accent" 
          : "text-muted hover:bg-foreground/5 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [showPrefs, setShowPrefs] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">(
    () => (typeof window !== "undefined" && notificationsSupported() ? Notification.permission : "unsupported")
  );

  // Initialize preferences directly from localStorage
  const [prefs, setPrefs] = useState(() => {
    if (typeof window === "undefined") return { mutedTypes: [], mutedAll: false };
    try {
      const stored = localStorage.getItem("fps.notification.prefs");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          mutedTypes: parsed.mutedTypes || [],
          mutedAll: parsed.mutedAll || false,
        };
      }
    } catch { /* ignore */ }
    return { mutedTypes: [], mutedAll: false };
  });

  const { mutedTypes, mutedAll } = prefs;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);



  const savePrefs = (nextPrefs: { mutedTypes: string[]; mutedAll: boolean }) => {
    setPrefs(nextPrefs);
    localStorage.setItem("fps.notification.prefs", JSON.stringify(nextPrefs));
  };

  const toggleType = (id: string) => {
    const nextTypes = mutedTypes.includes(id) ? mutedTypes.filter((t: string) => t !== id) : [...mutedTypes, id];
    savePrefs({ mutedTypes: nextTypes, mutedAll });
  };

  const toggleMuteAll = () => {
    savePrefs({ mutedTypes, mutedAll: !mutedAll });
  };

  const requestPushPermission = async () => {
    if (!notificationsSupported()) return;
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
  };

  const { notifications, markAllRead, clearAll, navigateTo } = useNotifications(null);

  // Filter notifications based on preferences
  const filteredNotifications = notifications.filter(n => 
    !mutedAll && !mutedTypes.includes(n.kind)
  );

  const pushSubscribed = pushPermission === "granted";
  const showPushToggle = pushPermission !== "unsupported";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            className="fixed right-0 top-0 z-[101] flex h-full w-full flex-col border-l border-border bg-background/95 shadow-2xl backdrop-blur-3xl sm:max-w-[400px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-6 sm:p-8">
              <div>
                <h2 className="font-heading text-xl font-black uppercase italic tracking-tighter text-foreground">
                  Notifications
                </h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Your latest alerts and updates
                </p>
              </div>
              <div className="flex items-center gap-1">
                {showPushToggle && (
                  <HeaderIconButton
                    label={pushSubscribed ? "Disable push notifications" : "Enable push notifications"}
                    onClick={() => void requestPushPermission()}
                    active={pushSubscribed}
                    pressed={pushSubscribed}
                  >
                    {pushSubscribed ? <SmartphoneNfc size={18} /> : <Smartphone size={18} />}
                  </HeaderIconButton>
                )}

                <HeaderIconButton
                  label={mutedAll ? "Unmute all notifications" : "Mute all notifications"}
                  onClick={toggleMuteAll}
                  active={mutedAll}
                  pressed={mutedAll}
                >
                  {mutedAll ? <BellOff size={18} /> : <Bell size={18} />}
                </HeaderIconButton>

                <HeaderIconButton
                  label="Notification preferences"
                  onClick={() => setShowPrefs(!showPrefs)}
                  active={showPrefs}
                  pressed={showPrefs}
                >
                  <SlidersHorizontal size={18} />
                </HeaderIconButton>

                <HeaderIconButton label="Close notifications" onClick={onClose}>
                  <X size={20} />
                </HeaderIconButton>
              </div>
            </div>

            {/* Preferences Panel */}
            <AnimatePresence>
              {showPrefs && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-border bg-surface/30"
                >
                  <div className="p-6">
                    <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted">
                      Notify me about
                    </p>
                    <div className="space-y-1">
                      {ALL_TYPES.map((type) => {
                        const isOn = !mutedAll && !mutedTypes.includes(type.id);
                        const isDisabled = mutedAll;
                        return (
                          <button
                            key={type.id}
                            onClick={() => toggleType(type.id)}
                            disabled={isDisabled}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-foreground/5",
                              isDisabled && "opacity-40 cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <type.icon size={16} className="text-muted" />
                              <span className="text-[13px] font-semibold text-foreground">
                                {type.label}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors",
                                isOn ? "border-accent bg-accent text-background" : "border-border"
                              )}
                            >
                              {isOn && <Check size={12} strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {mutedAll ? (
                 <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                  <BellOff size={40} strokeWidth={1} className="mb-4" />
                  <p className="text-[11px] font-black uppercase tracking-widest">Notifications Muted</p>
                  <p className="mt-2 text-[12px] text-muted max-w-[200px]">You won&apos;t receive any activity while mute is active.</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                  <Inbox size={40} strokeWidth={1} className="mb-4" />
                  <p className="text-[11px] font-black uppercase tracking-widest">No recent updates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((n: AppNotification) => {
                    const Icon = ICON_MAP[n.kind] ?? Bell;
                    return (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => {
                          navigateTo(n);
                          onClose();
                        }}
                        className={cn(
                          "group relative flex cursor-pointer items-start gap-4 overflow-hidden rounded-3xl border border-border bg-surface/50 p-5 transition-all hover:border-accent/30 hover:bg-surface",
                          !n.read && "border-accent/20 bg-accent/[0.02]"
                        )}
                      >
                        <div className={cn(
                          "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                          !n.read ? "bg-accent/10 text-accent" : "bg-foreground/5 text-muted group-hover:text-foreground"
                        )}>
                          <Icon size={18} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className={cn("truncate text-[13px] font-bold", !n.read ? "text-foreground" : "text-foreground/80")}>
                              {n.title}
                            </p>
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-[12px] leading-relaxed text-muted">
                            {n.description}
                          </p>
                        </div>

                        {!n.read && (
                          <span className="absolute right-4 top-1/2 size-2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent-glow),0.8)]" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && !mutedAll && (
              <div className="border-t border-border p-4 sm:p-6 bg-background">
                <div className="flex gap-2">
                  <button
                    onClick={markAllRead}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-[11px] font-black uppercase tracking-wider text-foreground transition-colors hover:bg-foreground/5"
                  >
                    <Check size={14} /> Mark read
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex-1 rounded-xl border border-rose-500/20 bg-rose-500/10 py-3 text-[11px] font-black uppercase tracking-wider text-rose-500 transition-colors hover:bg-rose-500/20"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}



