"use client";

import { LogOut, Menu } from "lucide-react";
import Link from "next/link";

interface SidebarStripProps {
  onOpenMenu: () => void;
  onSignOut: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export default function SidebarStrip({ onOpenMenu, onSignOut, triggerRef }: SidebarStripProps) {
  return (
    <aside className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-background py-4 z-40 relative">
      {/* Hamburger (top) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="flex size-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <Menu size={20} />
      </button>

      {/* Spacer to push sign-out to the bottom */}
      <div className="flex-1" />

      {/* Sign out (bottom) */}
      <button
        type="button"
        onClick={onSignOut}
        aria-label="Sign out"
        className="flex size-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
      >
        <LogOut size={20} />
      </button>
    </aside>
  );
}
