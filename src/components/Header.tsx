"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, LayoutDashboard, Bell, Crosshair, Users, Map as MapIcon, Swords, Bomb, Backpack, ChevronDown, Trophy } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SettingsMenu from "./SettingsMenu";
import NotificationsPanel from "./NotificationsPanel";
import { cn } from "@/lib/utils";

const DATABASE_LINKS = [
  { label: "Weapons", href: "/weapons", icon: Crosshair, desc: "Full ballistics and stats" },
  { label: "Characters", href: "/characters", icon: Users, desc: "Roles and abilities" },
  { label: "Maps", href: "/maps", icon: MapIcon, desc: "Arenas and layouts" },
  { label: "Modes", href: "/modes", icon: Swords, desc: "Game rules and queues" },
  { label: "Throwables", href: "/throwables", icon: Bomb, desc: "Utility and damage" },
  { label: "Equipment", href: "/equipment", icon: Backpack, desc: "Armor and gear" },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

function DiamondMark() {
  return (
    <span aria-hidden="true" className="relative flex size-7 shrink-0 items-center justify-center">
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="size-[24px] drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
        fill="none"
        variants={{ rest: { y: 0, scale: 1 }, hover: { y: -2, scale: 1.1 } }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <defs>
          <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <path d="M4 10 L12 15 L16 4 L20 15 L28 10 L24 26 L8 26 Z" fill="url(#gold)" />
        <path d="M4 10 L12 15 L16 4 L20 15 L28 10 L24 26 L8 26 Z" fill="none" stroke="#fef3c7" strokeWidth="0.5" className="opacity-40" />
      </motion.svg>
    </span>
  );
}

function Brand() {
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.05, ease: EASE }}>
      <Link href="/" aria-label="FPS Game Database home" className="group inline-flex select-none items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background">
        <motion.span className="inline-flex items-center gap-2.5" initial="rest" animate="rest" whileHover="hover">
          <DiamondMark />
          <span className="font-heading text-[15px] font-bold uppercase tracking-wider sm:text-[16px] transition-colors duration-300 group-hover:text-muted">
            FPS Database
          </span>
        </motion.span>
      </Link>
    </motion.div>
  );
}

function PillLink({ href, active, icon: Icon, children }: { href: string; active: boolean; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 font-heading rounded-md px-3.5 py-2 text-[15px] font-bold uppercase tracking-wider transition-colors",
        active ? "bg-foreground/[0.06] text-foreground" : "text-muted hover:text-foreground"
      )}
    >
      {Icon && <Icon size={18} />}
      <span className="hidden md:inline">{children}</span>
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      try {
        const stored = localStorage.getItem("fps.notifications");
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) setUnreadCount(list.filter((n: { read: boolean }) => !n.read).length);
        }
      } catch { /* ignore */ }
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("fps-notifications-changed", updateCount);
    const interval = setInterval(updateCount, 2000);
    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("fps-notifications-changed", updateCount);
      clearInterval(interval);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    const update = (): void => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const rankingsActive = pathname === "/rankings";
  const dashboardActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isDatabaseActive = DATABASE_LINKS.some((link) => pathname === link.href || pathname.startsWith(link.href + "/"));

  return (
    <>
      <header className={cn("sticky top-0 z-50 box-border h-[76px] w-full shrink-0 border-b backdrop-blur-xl transition-[background-color,border-color] duration-500", scrolled ? "border-border bg-background" : "border-border/60 bg-background")}>
        <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Brand />
            {/* Home button, always visible when not on the home page */}
            {pathname !== "/" && (
              <Link 
                href="/" 
                aria-label="Home"
                title="Home"
                className="flex size-9 items-center justify-center rounded-full border border-border bg-surface/50 text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <ArrowLeft size={18} />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* 1. Dashboard Icon */}
            <Link href="/dashboard" aria-label="Dashboard" title="Dashboard" className={cn("flex size-9 items-center justify-center rounded-md transition-colors", dashboardActive ? "bg-foreground/[0.06] text-foreground" : "text-muted hover:bg-foreground/5 hover:text-foreground")}>
              <LayoutDashboard size={18} />
            </Link>

            {/* 2. Notifications */}
            <button type="button" onClick={() => setNotificationsOpen(true)} aria-label="Notifications" title="Notifications" className="relative flex size-9 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-foreground/5 hover:text-foreground">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-background">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* 3. Database Dropdown */}
            <div className="group relative" ref={dropdownRef}>
              <button 
                type="button" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={cn("group relative inline-flex size-9 cursor-pointer items-center justify-center gap-1.5 rounded-md font-heading text-[15px] font-bold uppercase tracking-wider transition-colors duration-300 sm:text-[16px] md:w-auto md:px-3.5 md:py-2 md:justify-start", (isDatabaseActive || dropdownOpen) ? "bg-foreground/[0.06] text-foreground" : "text-muted hover:bg-foreground/5 hover:text-foreground")}
              >
                <Crosshair size={18} className="md:hidden" />
                <span className="hidden md:inline">Database</span>
                <ChevronDown size={16} className={cn("hidden md:block transition-transform duration-300 group-hover:rotate-180", dropdownOpen && "rotate-180")} />
              </button>
              
                            {/* Desktop Hover Dropdown (CSS only) */}
              <div className="absolute right-0 top-full z-50 hidden w-[400px] pt-4 group-hover:block md:right-auto md:left-1/2 md:-translate-x-1/2">
                <div className="overflow-hidden rounded-2xl border border-border bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
                  <div className="grid grid-cols-2 gap-1">
                    {DATABASE_LINKS.map((link) => {
                      const active = pathname === link.href || pathname.startsWith(link.href + "/");
                      return (
                        <Link key={link.href} href={link.href} className={cn("flex items-start gap-3 rounded-xl p-3 transition-colors", active ? "bg-accent/10" : "hover:bg-foreground/5")}>
                          <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", active ? "bg-accent/20 text-accent" : "bg-foreground/5 text-muted")}>
                            <link.icon size={16} />
                          </span>
                          <div>
                            <p className={cn("text-[13px] font-bold", active ? "text-accent" : "text-foreground")}>{link.label}</p>
                            <p className="text-[11px] text-muted">{link.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mobile Click Dropdown (AnimatePresence) */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-50 w-[280px] pt-4 md:hidden"
                  >
                    <div className="overflow-hidden rounded-2xl border border-border bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
                      <div className="grid grid-cols-1 gap-1">
                        {DATABASE_LINKS.map((link) => {
                          const active = pathname === link.href || pathname.startsWith(link.href + "/");
                          return (
                            <Link 
                              key={link.href} 
                              href={link.href} 
                              onClick={() => setDropdownOpen(false)}
                              className={cn("flex items-start gap-3 rounded-xl p-2.5 transition-colors", active ? "bg-accent/10" : "hover:bg-foreground/5")}
                            >
                              <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", active ? "bg-accent/20 text-accent" : "bg-foreground/5 text-muted")}>
                                <link.icon size={16} />
                              </span>
                              <div>
                                <p className={cn("text-[13px] font-bold", active ? "text-accent" : "text-foreground")}>{link.label}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4. Rankings */}
            <PillLink href="/rankings" active={rankingsActive} icon={Trophy}>
              Rankings
            </PillLink>

            {/* 5. Settings */}
            <SettingsMenu />

          </div>
        </div>
      </header>
      
      <NotificationsPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}






