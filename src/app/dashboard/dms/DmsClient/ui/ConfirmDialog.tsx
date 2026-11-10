"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Modal from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel, danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      size="sm"
      busy={busy}
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={busy}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60",
              danger ? "bg-rose-500" : "bg-accent text-background",
            )}
          >
            {busy && <LoaderCircle size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="px-6 py-5 text-[14px] leading-relaxed text-muted">{message}</p>
    </Modal>
  );
}