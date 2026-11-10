import { cn } from "@/lib/utils";

interface MentionMenuProps {
  names: string[];
  activeIndex: number;
  onPick: (name: string) => void;
}

/** Suggestions shown above the composer while typing "@". Keyboard handling lives in the composer. */
export default function MentionMenu({ names, activeIndex, onPick }: MentionMenuProps) {
  return (
    <ul
      role="listbox"
      aria-label="Mention someone"
      className="absolute bottom-full left-0 z-20 mb-2 w-64 overflow-hidden rounded-xl border border-border bg-background p-1 shadow-2xl"
    >
      {names.map((name, i) => (
        <li key={name} role="option" aria-selected={i === activeIndex}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // keep focus in the text box
              onPick(name);
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
              i === activeIndex ? "bg-accent/15 text-foreground" : "text-foreground/80 hover:bg-foreground/[0.06]",
            )}
          >
            <span className="text-muted">@</span>
            <span className="truncate font-medium">{name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}