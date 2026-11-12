"use client";

import { LogOut, PanelLeftOpen, PanelLeftClose } from "lucide-react";

interface SidebarStripProps {
  onOpenMenu: () => void;
  onSignOut: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  isOpen?: boolean;
}

export default function SidebarStrip({ onOpenMenu, onSignOut, triggerRef, isOpen }: SidebarStripProps) {
  return (
    <aside className="relative z-40 flex w-16 shrink-0 flex-col items-center border-r border-border bg-background py-4 dark:border-white/[0.04] dark:bg-[#0a0a0a]">
      {/* Toggle menu (top) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={onOpenMenu}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="flex size-10 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        {isOpen ? <PanelLeftClose size={20} strokeWidth={1.5} /> : <PanelLeftOpen size={20} strokeWidth={1.5} />}
      </button>

      {/* Spacer to push sign-out to the bottom */}
      <div className="flex-1" />

      {/* Sign out (bottom) */}
      <button
        type="button"
        onClick={onSignOut}
        aria-label="Sign out"
        className="flex size-10 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
      >
        <LogOut size={20} />
      </button>
    </aside>
  );
}
