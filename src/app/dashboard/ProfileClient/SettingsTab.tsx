"use client";

import { useRouter } from "next/navigation";
import { AtSign, Bell, LogOut, MessageCircle, Pencil, UserRound } from "lucide-react";
import { clearToken } from "@/lib/auth";
import { updateChatSettings, useChatSettings } from "@/lib/chat-settings";
import { cn } from "@/lib/utils";
import Card from "./Card";
import type { ProfileIdentity } from "./types";

interface SettingsTabProps {
  identity: ProfileIdentity;
  onEdit: () => void;
  onChatSettings: () => void;
}

function Row({ icon: Icon, label, value, action }: { icon: typeof UserRound; label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.05] text-muted">
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-muted">{label}</p>
        <p className="truncate text-[14px] font-medium text-foreground">{value || "Not set"}</p>
      </div>
      {action}
    </div>
  );
}

export default function SettingsTab({ identity, onEdit, onChatSettings }: SettingsTabProps) {
  const router = useRouter();
  const settings = useChatSettings();

  const signOut = () => {
    clearToken();
    router.replace("/dashboard/login");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card
        title="Account"
        icon={UserRound}
        action={
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            <Pencil size={13} /> Edit
          </button>
        }
      >
        <div className="divide-y divide-border">
          <Row icon={UserRound} label="Display name" value={identity.displayName} />
          <Row icon={AtSign} label="Username" value={identity.username ? `@${identity.username}` : ""} />
        </div>
      </Card>

      <Card title="Chat" icon={MessageCircle}>
        <div className="divide-y divide-border">
          <div className="flex items-start gap-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-foreground">Show Global Chat</p>
              <p className="mt-0.5 text-[12px] leading-snug text-muted">Turn it off to hide Global Chat from the sidebar. Your DMs are not affected.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.globalChat}
              aria-label="Show Global Chat"
              onClick={() => updateChatSettings({ globalChat: !settings.globalChat })}
              className={cn(
                "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                settings.globalChat ? "bg-accent" : "bg-foreground/20",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-background shadow transition-transform",
                  settings.globalChat ? "translate-x-[1.375rem]" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
          <div className="flex items-center gap-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.05] text-muted">
                <Bell size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-foreground">Notifications and typing</p>
                <p className="text-[12px] text-muted">Sounds, snooze, desktop alerts, text size.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onChatSettings}
              className="shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-foreground/5"
            >
              Open
            </button>
          </div>
        </div>
      </Card>

      <Card title="Session" icon={LogOut} className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px] text-muted">Sign out of the dashboard on this device.</p>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-[13px] font-semibold text-rose-500 transition-colors hover:bg-rose-500/20"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </Card>
    </div>
  );
}