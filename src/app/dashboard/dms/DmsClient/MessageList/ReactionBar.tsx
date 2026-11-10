import { cn } from "@/lib/utils";

interface ReactionBarProps {
  reactions: Record<string, string[]>;
  myId: string;
  isMe: boolean;
  onToggle: (emoji: string) => void;
}

export default function ReactionBar({ reactions, myId, isMe, onToggle }: ReactionBarProps) {
  const entries = Object.entries(reactions).filter(([, ids]) => ids.length > 0);
  if (entries.length === 0) return null;

  return (
    <div className={cn("mt-1 flex flex-wrap gap-1", isMe ? "justify-end" : "justify-start")}>
      {entries.map(([emoji, ids]) => {
        const mine = ids.includes(myId);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(emoji)}
            aria-pressed={mine}
            aria-label={`${emoji} reaction, ${ids.length}${mine ? ", including you" : ""}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] transition-colors",
              mine ? "border-accent/60 bg-accent/15 text-foreground" : "border-border bg-surface text-muted hover:text-foreground",
            )}
          >
            <span>{emoji}</span>
            <span className="font-mono text-[11px] tabular-nums">{ids.length}</span>
          </button>
        );
      })}
    </div>
  );
}