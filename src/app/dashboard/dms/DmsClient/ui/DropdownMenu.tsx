"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  dividerBefore?: boolean;
}

interface DropdownMenuProps {
  label: string;
  items: MenuItem[];
  /** Optional content above the items. Receives a function that closes the menu. */
  header?: (close: () => void) => React.ReactNode;
  trigger?: React.ReactNode;
  triggerClassName?: string;
  align?: "start" | "end";
}

const MENU_WIDTH = 232;
const GAP = 6;
const EDGE = 8;
const PHONE_QUERY = "(max-width: 639px)";

const DEFAULT_TRIGGER =
  "flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

/**
 * Accessible dropdown: keyboard navigation, focus return, outside-click and scroll dismissal.
 * On desktop it is a popover next to the trigger; on phones it becomes a bottom sheet with bigger tap targets.
 */
export default function DropdownMenu({
  label,
  items,
  header,
  trigger,
  triggerClassName,
  align = "end",
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const visible = items.filter((item) => !item.hidden);

  // Dismissing never touches refs, so it is safe to hand to the `header` render prop.
  const dismiss = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);

  const close = useCallback(
    (restoreFocus: boolean) => {
      dismiss();
      if (restoreFocus) triggerRef.current?.focus();
    },
    [dismiss],
  );

  const openMenu = () => {
    setSheet(window.matchMedia(PHONE_QUERY).matches);
    setOpen(true);
  };

  // Popover mode: place the menu next to the trigger, flipping upward / clamping so it never leaves the screen.
  useLayoutEffect(() => {
    if (!open || sheet) return;
    const button = triggerRef.current;
    const menu = menuRef.current;
    if (!button || !menu) return;
    const rect = button.getBoundingClientRect();
    const height = menu.offsetHeight;
    const rawLeft = align === "end" ? rect.right - MENU_WIDTH : rect.left;
    const left = Math.min(Math.max(EDGE, rawLeft), window.innerWidth - MENU_WIDTH - EDGE);
    let top = rect.bottom + GAP;
    if (top + height > window.innerHeight - EDGE) top = Math.max(EDGE, rect.top - height - GAP);
    setPos({ top, left });
  }, [open, sheet, align]);

  useEffect(() => {
    if (!pos) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();
  }, [pos]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    };
    const onScroll = (event: Event) => {
      // Scrolling inside the menu itself must not dismiss it.
      if (menuRef.current && event.target instanceof Node && menuRef.current.contains(event.target)) return;
      close(false);
    };
    const onResize = () => {
      // The on-screen keyboard resizes the page on phones; a bottom sheet should stay put.
      if (!sheet) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, sheet, close]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const nodes = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
    const index = nodes.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => nodes[(i + nodes.length) % nodes.length]?.focus();

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(nodes.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
      default:
        break;
    }
  };

  const content = (
    <>
      {header?.(dismiss)}
      {visible.map((item) => (
        <div key={item.id}>
          {item.dividerBefore && <div role="separator" className="my-1 h-px bg-border" />}
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              close(false);
              item.onSelect();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 text-left font-medium transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
              sheet ? "py-3 text-[15px]" : "py-2 text-[13px]",
              item.danger
                ? "text-rose-500 hover:bg-rose-500/10 focus-visible:bg-rose-500/10"
                : "text-foreground hover:bg-foreground/[0.06] focus-visible:bg-foreground/[0.06]",
            )}
          >
            {item.icon ? <item.icon size={sheet ? 18 : 16} className="shrink-0 opacity-80" /> : <span className="size-4 shrink-0" />}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </button>
        </div>
      ))}
    </>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openMenu())}
        className={triggerClassName ?? DEFAULT_TRIGGER}
      >
        {trigger ?? <MoreVertical size={18} />}
      </button>

      {open &&
        createPortal(
          sheet ? (
            <>
              <div aria-hidden="true" onClick={() => close(false)} className="fixed inset-0 z-[69] bg-black/50" />
              <div
                ref={menuRef}
                id={menuId}
                role="menu"
                aria-label={label}
                onKeyDown={onKeyDown}
                className="fixed inset-x-0 bottom-0 z-[70] max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-background p-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
              >
                <div aria-hidden="true" className="mx-auto mb-2 mt-1 h-1 w-10 rounded-full bg-border" />
                {content}
              </div>
            </>
          ) : (
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={label}
              onKeyDown={onKeyDown}
              style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: MENU_WIDTH, visibility: pos ? "visible" : "hidden" }}
              className="fixed z-[70] overflow-hidden rounded-xl border border-border bg-background p-1 shadow-2xl"
            >
              {content}
            </div>
          ),
          document.body,
        )}
    </>
  );
}