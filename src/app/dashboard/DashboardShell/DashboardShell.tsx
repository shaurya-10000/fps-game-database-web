"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AuthGate from "../AuthGate";
import DashboardSidebar from "../DashboardSidebar";
import { useSidebarState } from "./useSidebarState";

/** Routes that fill the whole area (no padding, no page scroll); they manage their own scrolling. */
const FULL_BLEED_ROUTES = ["/dashboard/chat", "/dashboard/dms"] as const;

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, ready, toggle, closeOnMobile } = useSidebarState();

  const fullBleed = FULL_BLEED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  // On phones the sidebar is an overlay, so close it after navigating.
  useEffect(() => {
    closeOnMobile();
  }, [pathname, closeOnMobile]);

  // Calls, presence and notifications live in the dashboard layout (DashboardCallLayer),
  // so they keep working while you move between pages.
  return (
    <AuthGate>
      <div className="flex h-dvh overflow-hidden bg-background">
        <DashboardSidebar open={open} animate={ready} hideRailOnMobile={fullBleed} onToggle={toggle} />
        {/* A div, not <main>: the root layout already provides the page's <main>. */}
        <div
          className={
            fullBleed
              ? "relative min-h-0 min-w-0 flex-1 overflow-hidden"
              : "min-h-0 min-w-0 flex-1 overflow-y-auto"
          }
        >
          {fullBleed ? (
            children
          ) : (
            <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12">{children}</div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}