"use client";

export type ChatScope = "global" | "friends";

interface ChatScopeToggleProps {
  scope: ChatScope;
  onChange: (scope: ChatScope) => void;
}

const OPTIONS: { id: ChatScope; label: string; hint: string }[] = [
  { id: "global", label: "Global", hint: "Everyone in the database" },
  { id: "friends", label: "Friends", hint: "Only your friend list" },
];

export default function ChatScopeToggle({ scope, onChange }: ChatScopeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Chat scope"
      className="inline-flex rounded-lg border border-border bg-surface p-1"
    >
      {OPTIONS.map((opt) => {
        const active = scope === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            type="button"
            aria-selected={active}
            aria-label={opt.hint}
            title={opt.hint}
            onClick={() => onChange(opt.id)}
            className={`rounded-md px-4 py-1.5 text-[12px] font-semibold transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
