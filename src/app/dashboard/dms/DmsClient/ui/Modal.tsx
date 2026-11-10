"use client";

import { useEffect, useId, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  /** Blocks closing (Escape, backdrop, X) while something is saving. */
  busy?: boolean;
  size?: "sm" | "md";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ title, description, onClose, busy = false, size = "md", children, footer }: ModalProps) {
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [busy, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
        className={cn(
          "relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl focus:outline-none sm:rounded-3xl",
          size === "sm" ? "max-w-sm" : "max-w-md",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-foreground">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-[12px] text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-full p-2 text-muted transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex gap-3 border-t border-border px-6 py-4">{footer}</div>}
      </motion.div>
    </div>
  );
}