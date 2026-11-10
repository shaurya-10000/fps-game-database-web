"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { clearToken } from "@/lib/auth";
import { useChatSettings } from "@/lib/chat-settings";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Profile" },
  { href: "/dashboard/dms", label: "DMs" },
  { href: "/dashboard/friends", label: "Friends" },
  { href: "/dashboard/chat", label: "Global" },
] as const;

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

interface DashboardSidebarProps {
  open: boolean;
  animate: boolean;
  /** Hide the narrow icon rail on phones (full-screen pages open the sidebar from their own menu button). */
  hideRailOnMobile?: boolean;
  onToggle: () => void;
}

export default function DashboardSidebar({ open, animate, hideRailOnMobile = false, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { globalChat } = useChatSettings();

  function signOut() {
    clearToken();
    router.replace("/dashboard/login");
  }

  const asideClasses = [
    "flex shrink-0 flex-col overflow-hidden border-r border-border bg-background",
    animate ? "transition-[width] duration-200 ease-out" : "",
    open
      ? "w-60 max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:shadow-2xl"
      : hideRailOnMobile
        ? "w-12 max-lg:hidden"
        : "w-12",
  ].join(" ");

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          tabIndex={-1}
          onClick={onToggle}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      <aside id="dashboard-sidebar" aria-label="Dashboard navigation" className={asideClasses}>
        <div className={`flex h-12 shrink-0 items-center ${open ? "justify-between px-4" : "justify-center"}`}>
          {open && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Dashboard
            </span>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={open}
            aria-controls="dashboard-sidebar"
            title={open ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)"}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          >
            {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        {open && (
          <div className="flex min-h-0 w-60 flex-1 flex-col px-3 pb-4">
            <Link
              href="/"
              className="mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
            >
              <ArrowLeft size={16} />
              Back to site
            </Link>
            <div className="mb-2 h-px bg-border" />
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.filter((item) => globalChat || item.href !== "/dashboard/chat").map((item) => {
                const active = isActiveRoute(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-foreground text-background"
                        : "text-muted hover:bg-foreground/[0.04] hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={signOut}
              className="mt-auto w-full rounded-md border border-border px-3 py-2 text-left text-[12px] font-medium text-muted transition-colors hover:border-rose-500/40 hover:text-rose-400"
            >
              Sign out
            </button>
          </div>
        )}
        {!open && (
          <div className="flex justify-center">
            <Link
              href="/"
              aria-label="Back to site"
              title="Back to site"
              className="rounded-md p-1.5 text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <ArrowLeft size={18} />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}