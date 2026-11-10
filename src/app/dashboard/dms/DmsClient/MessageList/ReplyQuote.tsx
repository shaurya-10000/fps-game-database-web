import { cn } from "@/lib/utils";
import type { ReplyRef } from "../types";

interface ReplyQuoteProps {
  reply: ReplyRef;
  isMe: boolean;
  onJump: () => void;
}

/** The quoted message shown above a reply. Click to jump to the original. */
export default function ReplyQuote({ reply, isMe, onJump }: ReplyQuoteProps) {
  return (
    <button
      type="button"
      onClick={onJump}
      className={cn(
        "mb-1.5 block w-full rounded-lg border-l-2 px-2.5 py-1 text-left text-[12px] transition-opacity hover:opacity-80",
        isMe
          ? "border-[color:var(--chat-sent-fg,var(--background))]/70 bg-[color:var(--chat-sent-fg,var(--background))]/15 text-[color:var(--chat-sent-fg,var(--background))]/90"
           : "border-accent bg-foreground/[0.05] text-foreground/80",
      )}
    >
      <span className={cn("block font-semibold", isMe ? "text-[color:var(--chat-sent-fg,var(--background))]" : "text-accent")}>{reply.senderName}</span>
      <span className="line-clamp-2 block break-words">{reply.preview}</span>
    </button>
  );
}