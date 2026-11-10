import { CornerUpLeft, Pencil, X } from "lucide-react";

interface ReplyBarProps {
  kind: "reply" | "edit";
  /** Who is being replied to (reply only). */
  name?: string;
  preview: string;
  onCancel: () => void;
}

export default function ReplyBar({ kind, name, preview, onCancel }: ReplyBarProps) {
  const Icon = kind === "reply" ? CornerUpLeft : Pencil;
  return (
    <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
      <Icon size={15} className="shrink-0 text-accent" />
      <div className="min-w-0 flex-1 border-l-2 border-accent pl-2.5">
        <p className="text-[12px] font-semibold text-accent">{kind === "reply" ? `Replying to ${name ?? "message"}` : "Editing message"}</p>
        <p className="truncate text-[12px] text-muted">{preview}</p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        aria-label={kind === "reply" ? "Cancel reply" : "Cancel edit"}
        className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <X size={15} />
      </button>
    </div>
  );
}