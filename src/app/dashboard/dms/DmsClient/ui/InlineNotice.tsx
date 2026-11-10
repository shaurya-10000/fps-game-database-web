import { AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineNoticeProps {
  message: string;
  tone?: "error" | "info";
  onDismiss: () => void;
}

export default function InlineNotice({ message, tone = "error", onDismiss }: InlineNoticeProps) {
  const Icon = tone === "error" ? AlertCircle : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border bg-background px-4 py-2.5 text-[13px] shadow-xl",
        tone === "error" ? "border-rose-500/30 text-rose-500" : "border-border text-foreground",
      )}
    >
      <Icon size={16} className="shrink-0" />
      <span className="min-w-0 flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 transition-colors hover:bg-foreground/10"
      >
        <X size={14} />
      </button>
    </div>
  );
}