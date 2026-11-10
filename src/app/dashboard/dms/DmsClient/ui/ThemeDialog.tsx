"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES, findTheme, wallpaperStyle, type ChatThemeSetting } from "../themes";
import Modal from "./Modal";

interface ThemeDialogProps {
  value: ChatThemeSetting;
  onChange: (setting: ChatThemeSetting) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function ThemeDialog({ value, onChange, onReset, onClose }: ThemeDialogProps) {
  const current = findTheme(value.theme);
  const sentBubble = current.gradient || "var(--accent)";
  const sentText = current.accent ? "#ffffff" : "var(--background)";

  return (
    <Modal
      title="Chat theme"
      description="Only you see this theme, on this device."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground/5"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-accent py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
          >
            Done
          </button>
        </>
      }
    >
      <div className="space-y-6 px-6 py-5">
        {/* Live preview */}
        <div
          style={current.accent ? ({ "--accent": current.accent } as React.CSSProperties) : undefined}
          className="relative overflow-hidden rounded-2xl border border-border bg-background"
        >
          <div aria-hidden="true" className="absolute inset-0" style={wallpaperStyle(value)} />
          <div className="relative space-y-1.5 p-4">
            <div className="max-w-[70%] rounded-2xl rounded-bl-md border border-border bg-surface px-3.5 py-2 text-[13px] text-foreground">
              Ready for the next match?
            </div>
            <div
              className="ml-auto max-w-[70%] rounded-2xl rounded-br-md px-3.5 py-2 text-[13px]"
              style={{ background: sentBubble, color: sentText }}
            >
              Always. Squad up!
            </div>
            <div
              className="ml-auto w-fit rounded-2xl rounded-br-md px-3.5 py-2 text-[13px]"
              style={{ background: sentBubble, color: sentText }}
            >
              Queueing now
            </div>
            <div className="flex items-center gap-1.5 pl-1 pt-1">
              <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[12px]">
                {String.fromCodePoint(0x2764, 0xfe0f)} 2
              </span>
            </div>
          </div>
        </div>

        {/* Theme tiles */}
        <div role="radiogroup" aria-label="Chat theme" className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {THEMES.map((theme) => {
            const selected = theme.id === current.id;
            const bubble = theme.gradient || "var(--accent)";
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ ...value, theme: theme.id })}
                className="group flex flex-col items-center gap-1.5 focus-visible:outline-none"
              >
                <span
                  style={theme.accent ? ({ "--accent": theme.accent } as React.CSSProperties) : undefined}
                  className={cn(
                    "relative block aspect-[3/4] w-full overflow-hidden rounded-2xl border bg-background transition-transform group-hover:scale-[1.04] group-focus-visible:ring-2 group-focus-visible:ring-accent/60",
                    selected ? "border-foreground ring-2 ring-foreground/70" : "border-border",
                  )}
                >
                  <span aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: theme.wallpaper || undefined }} />
                  <span aria-hidden="true" className="absolute left-2 top-3 h-3 w-9 rounded-full border border-border bg-surface" />
                  <span aria-hidden="true" className="absolute right-2 top-8 h-3 w-11 rounded-full" style={{ background: bubble }} />
                  <span aria-hidden="true" className="absolute right-2 top-[3.25rem] h-3 w-7 rounded-full" style={{ background: bubble }} />
                  <span aria-hidden="true" className="absolute left-2 top-[4.5rem] h-3 w-10 rounded-full border border-border bg-surface" />
                  {selected && (
                    <span className="absolute bottom-2 right-2 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                      <Check size={12} />
                    </span>
                  )}
                </span>
                <span className="text-[12px] font-medium text-foreground">{theme.name}</span>
              </button>
            );
          })}
        </div>

        <fieldset>
          <legend className="mb-2 text-[12px] font-semibold text-foreground">Background</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
            {[
              { id: false, label: "Gradient" },
              { id: true, label: "Plain" },
            ].map((option) => {
              const active = Boolean(value.plain) === option.id;
              return (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ ...value, plain: option.id })}
                  className={cn(
                    "rounded-lg py-2 text-[13px] font-medium transition-colors",
                    active ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </Modal>
  );
}