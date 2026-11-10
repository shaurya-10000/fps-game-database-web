/** Fixed-height line so the composer never jumps when someone starts or stops typing. */
export default function TypingIndicator({ names }: { names: string[] }) {
  let text = "";
  if (names.length === 1) text = `${names[0]} is typing`;
  else if (names.length === 2) text = `${names[0]} and ${names[1]} are typing`;
  else if (names.length > 2) text = "Several people are typing";

  return (
    <div className="h-5 px-1 text-[12px] text-muted" aria-live="polite">
      {text && (
        <span className="inline-flex items-center gap-1.5">
          <span className="flex items-end gap-0.5" aria-hidden="true">
            <span className="size-1 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
            <span className="size-1 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
            <span className="size-1 animate-bounce rounded-full bg-muted" />
          </span>
          {text}
        </span>
      )}
    </div>
  );
}