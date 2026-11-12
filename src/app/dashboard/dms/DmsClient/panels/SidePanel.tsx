import { X } from "lucide-react";

interface SidePanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Right-hand panel on desktop; covers the conversation on phones. */
export default function SidePanel({ title, onClose, children }: SidePanelProps) {
  return (
    <aside
      aria-label={title}
      className="absolute inset-0 z-30 flex flex-col bg-background md:static md:z-auto md:w-80 md:shrink-0 md:border-l md:border-border lg:w-96"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title.toLowerCase()}`}
          className="rounded-full p-2 text-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <X size={18} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
}
