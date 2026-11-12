"use client";

import { useEffect, useRef, type RefObject } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { PanelLeftClose, LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps<T extends string> {
  id: string;
  drawerRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  items: readonly SidebarItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  onClose: () => void;
  brand?: React.ReactNode;
  sectionLabel?: string;
  ariaLabel: string;
  onSignOut?: () => void;
  isSigningOut?: boolean;
  signOutError?: string | null;
  badges?: Partial<Record<T, number>>;
}

export default function FloatingSidebar<T extends string>({
  id,
  drawerRef,
  isOpen,
  items,
  activeId,
  onSelect,
  onClose,
  brand,
  sectionLabel,
  ariaLabel,
  onSignOut,
  isSigningOut,
  signOutError,
  badges,
}: SidebarProps<T>) {
  const reduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap + scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const first = drawerRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;

      const firstEl = focusable[0]!;
      const lastEl = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, drawerRef]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduceMotion ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <aside
        ref={drawerRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-hidden={!isOpen}
        className={cn(
          "fixed bottom-3 left-3 top-3 z-[70] flex w-72 max-w-[calc(100vw-1.5rem)] flex-col rounded-[2rem] border p-5",
          "border-zinc-200 bg-zinc-50 shadow-2xl shadow-black/10",
          "dark:border-white/[0.04] dark:bg-[#0a0a0a] dark:shadow-black/80",
          "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]"
        )}
        tabIndex={isOpen ? undefined : -1}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between px-1">
          <div className="min-w-0 flex-1">{brand}</div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            tabIndex={isOpen ? 0 : -1}
            className={cn(
              "flex size-8 items-center justify-center rounded-xl text-zinc-500 transition-colors",
              "hover:bg-zinc-200/70 hover:text-zinc-900",
              "dark:hover:bg-white/[0.06] dark:hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            )}
          >
            <PanelLeftClose size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Section label */}
        {sectionLabel && (
          <div className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            {sectionLabel}
          </div>
        )}

        {/* Nav */}
        <nav aria-label={ariaLabel} className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-thin">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? "page" : undefined}
                tabIndex={isOpen ? 0 : -1}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500",
                  isActive
                    ? "bg-zinc-200/80 text-zinc-900 dark:bg-white/[0.04] dark:text-white"
                    : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 dark:hover:bg-white/[0.02] dark:hover:text-white"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-amber-500" />
                )}
                <Icon size={16} aria-hidden="true" className={isActive ? "text-amber-500" : ""} />
                {item.label}
                {badges?.[item.id] ? (
                  <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {badges[item.id]! > 99 ? "99+" : badges[item.id]}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {onSignOut && (
          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onSignOut}
              disabled={isSigningOut}
              tabIndex={isOpen ? 0 : -1}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-red-500 transition-colors",
                "hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500",
                "disabled:opacity-50"
              )}
            >
              <LogOut size={16} aria-hidden="true" />
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </button>
            {signOutError && (
              <p role="alert" className="mt-2 px-4 text-[11px] font-bold text-red-500">
                {signOutError}
              </p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}



