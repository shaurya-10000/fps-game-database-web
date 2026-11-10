import { SendHorizontal, Trash2 } from "lucide-react";

interface RecordingBarProps {
  elapsed: number;
  onCancel: () => void;
  onSend: () => void;
}

export default function RecordingBar({ elapsed, onCancel, onSend }: RecordingBarProps) {
  const minutes = Math.floor(elapsed / 60);
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div role="status" aria-label="Recording voice message" className="flex w-full items-center gap-3 py-0.5">
      <button
        type="button"
        onClick={onCancel}
        aria-label="Discard recording"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-500"
      >
        <Trash2 size={18} />
      </button>
      <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-rose-500" />
      <span className="font-mono text-[14px] tabular-nums text-foreground">
        {minutes}:{seconds}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] text-muted">Recording... tap send when you&apos;re done</span>
      <button
        type="button"
        onClick={onSend}
        aria-label="Send voice message"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-background transition-opacity hover:opacity-90"
      >
        <SendHorizontal size={16} />
      </button>
    </div>
  );
}