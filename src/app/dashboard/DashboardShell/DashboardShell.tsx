"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { PanelLeftOpen, PanelLeftClose, Home, LayoutDashboard, Users, MessageSquare, Settings, Crown, Search, VolumeX, MoreVertical } from "lucide-react";
import AuthGate from "../AuthGate";
import FloatingSidebar, { type SidebarItem } from "@/components/DashboardSidebar/FloatingSidebar";
import { clearToken } from "@/lib/auth";
import DropdownMenu, { type MenuItem } from "@/app/dashboard/dms/DmsClient/ui/DropdownMenu";

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
  
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [chatMenuItems, setChatMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => setChatMenuItems((e as CustomEvent<MenuItem[]>).detail);
    window.addEventListener("fps-chat-menu-items", handler);
    return () => window.removeEventListener("fps-chat-menu-items", handler);
  }, []);

  useEffect(() => {
    const update = () => {
      try {
        const raw = localStorage.getItem("fps.notifications");
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const count = list.filter((n: { kind: string; read: boolean }) => n.kind === "message" && !n.read).length;
            setUnreadMessageCount(count);
          }
        }
      } catch { /* ignore */ }
    };
    update();
    window.addEventListener("fps-notifications-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("fps-notifications-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

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
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        
        {/* Top Navigation Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 dark:border-white/[0.04] sm:px-6">
          <div className="flex items-center gap-4">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              className="flex size-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {isOpen ? <PanelLeftClose size={20} strokeWidth={1.5} /> : <PanelLeftOpen size={20} strokeWidth={1.5} />}
            </button>
            <div className="flex items-center gap-2.5">
              {(() => {
                const ActiveIcon = NAV_ITEMS.find((item) => item.id === activeId)?.icon ?? LayoutDashboard;
                return <ActiveIcon size={20} className="text-amber-500" />;
              })()}
              <span className="font-heading text-[15px] font-bold uppercase tracking-widest text-foreground">
                {NAV_ITEMS.find((item) => item.id === activeId)?.label ?? "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {pathname === "/dashboard/chat" && (
              <>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("fps-chat-action", { detail: "search" }))}
                  aria-label="Search messages"
                  title="Search messages"
                  className="flex size-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Search size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("fps-chat-action", { detail: "muted" }))}
                  aria-label="Muted players"
                  title="Muted players"
                  className="flex size-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <VolumeX size={18} />
                </button>
                <DropdownMenu
                  label="More options"
                  items={chatMenuItems}
                  align="end"
                  trigger={<MoreVertical size={18} />}
                  triggerClassName="flex size-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                />
              </>
            )}
            <Link
              href="/"
              aria-label="Back to main page"
              className="flex size-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Home size={20} />
            </Link>
          </div>
        </header>

        {/* Floating Drawer (Full screen on mobile) */}
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
          badges={{ dms: unreadMessageCount }}
          brand={
            <Link href="/" className="flex items-center gap-2.5" tabIndex={isOpen ? 0 : -1}>
              <Crown size={18} className="text-amber-500" fill="currentColor" />
              <span className="font-heading text-[12px] font-bold uppercase tracking-widest text-foreground">
                FPS Database
              </span>
            </Link>
          }
        />

        {/* Main Content */}
        <main
          className={
            fullBleed
              ? "relative min-h-0 flex-1 overflow-hidden"
              : "min-h-0 flex-1 overflow-y-auto"
          }
        >
          {fullBleed ? (
            children
          ) : (
            <div className="w-full px-4 py-6 sm:px-8">
              {children}
            </div>
          )}
        </main>
      </div>
    </AuthGate>
  );
}












