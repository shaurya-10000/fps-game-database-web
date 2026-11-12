"use client";

import { useCallback, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, MessageSquare, Settings, Crown } from "lucide-react";
import AuthGate from "../AuthGate";
import FloatingSidebar, { type SidebarItem } from "@/components/DashboardSidebar/FloatingSidebar";
import { clearToken } from "@/lib/auth";

type NavId = "profile" | "dms" | "friends" | "chat";

const NAV_ITEMS: readonly SidebarItem<NavId>[] = [
  { id: "profile", label: "Profile", icon: LayoutDashboard },
  { id: "dms", label: "Messages", icon: MessageSquare },
  { id: "friends", label: "Friends", icon: Users },
  { id: "chat", label: "Global Chat", icon: Settings },
] as const;

const ROUTE_MAP: Record<NavId, string> = {
  profile: "/dashboard",
  dms: "/dashboard/dms",
  friends: "/dashboard/friends",
  chat: "/dashboard/chat",
};

const FULL_BLEED_ROUTES = ["/dashboard/chat", "/dashboard/dms"] as const;

function currentNavId(pathname: string): NavId {
  if (pathname === "/dashboard" || pathname === "/dashboard/") return "profile";
  if (pathname.startsWith("/dashboard/dms")) return "dms";
  if (pathname.startsWith("/dashboard/friends")) return "friends";
  if (pathname.startsWith("/dashboard/chat")) return "chat";
  return "profile";
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const drawerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const fullBleed = FULL_BLEED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const activeId = currentNavId(pathname);

  const close = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const select = useCallback(
    (id: NavId) => {
      router.push(ROUTE_MAP[id]);
      close();
    },
    [router, close]
  );

  const signOut = useCallback(() => {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      clearToken();
      router.replace("/dashboard/login");
    } catch {
      setSignOutError("Failed to sign out. Try again.");
      setIsSigningOut(false);
    }
  }, [router]);



  return (
    <AuthGate>
      <div className="flex h-dvh overflow-hidden bg-background">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          aria-expanded={isOpen}
          aria-controls="dashboard-sidebar"
          className="fixed left-3 top-3 z-50 flex size-10 items-center justify-center rounded-xl border border-border bg-background/80 text-foreground shadow-md backdrop-blur-md transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <FloatingSidebar<NavId>
          id="dashboard-sidebar"
          drawerRef={drawerRef}
          isOpen={isOpen}
          items={NAV_ITEMS}
          activeId={activeId}
          onSelect={select}
          onClose={close}
          ariaLabel="Dashboard navigation"
          sectionLabel="Menu"
          onSignOut={signOut}
          isSigningOut={isSigningOut}
          signOutError={signOutError}
          brand={
            <Link href="/" className="flex items-center gap-2.5" tabIndex={isOpen ? 0 : -1}>
              <Crown size={18} className="text-amber-500" fill="currentColor" />
              <span className="font-heading text-[12px] font-bold uppercase tracking-widest text-foreground">
                FPS Database
              </span>
            </Link>
          }
        />

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
            <div className="w-full px-5 py-8 sm:px-8 lg:px-12">
              {children}
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}




