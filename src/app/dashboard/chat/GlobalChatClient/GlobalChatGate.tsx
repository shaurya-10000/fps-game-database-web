"use client";

import Link from "next/link";
import { EyeOff, Menu } from "lucide-react";
import { requestOpenSidebar } from "@/app/dashboard/DashboardShell/sidebar-events";
import { updateChatSettings, useChatSettings } from "@/lib/chat-settings";
import GlobalChatClient from "./GlobalChatClient";

/** Global Chat is optional: when someone turns it off, nothing connects to the global room. */
export default function GlobalChatGate() {
  const settings = useChatSettings();
  if (settings.globalChat) return <GlobalChatClient />;

  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      <div className="flex h-16 shrink-0 items-center px-4 lg:hidden">
        <button
          type="button"
          onClick={requestOpenSidebar}
          aria-label="Open navigation"
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/[0.07] hover:text-foreground"
        >
          <Menu size={20} />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <EyeOff size={26} />
        </div>
        <h2 className="text-[17px] font-semibold text-foreground">Global Chat is turned off</h2>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
          You won&apos;t see global messages or get notifications from it. Your DMs and group chats are not affected.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => updateChatSettings({ globalChat: true })}
            className="rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
          >
            Turn on Global Chat
          </button>
          <Link
            href="/dashboard/dms"
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground/5"
          >
            Go to messages
          </Link>
        </div>
      </div>
    </div>
  );
}