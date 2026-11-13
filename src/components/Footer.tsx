"use client";

import Link from "next/link";
import { ArrowRight, Crown, Gamepad2, MessagesSquare, Video, Code } from "lucide-react";

const CURRENT_YEAR = 2026;

const COLUMNS = [
  {
    title: "Database",
    links: [
      { href: "/weapons", label: "Weapons" },
      { href: "/characters", label: "Characters" },
      { href: "/maps", label: "Maps" },
      { href: "/modes", label: "Modes" },
      { href: "/throwables", label: "Throwables" },
      { href: "/equipment", label: "Equipment" },
    ],
  },
  {
    title: "Competitive",
    links: [
      { href: "/rankings", label: "Global Rankings" },
      { href: "/rankings?bucket=ranked", label: "Ranked Leaderboard" },
      { href: "/modes?bucket=ranked", label: "Ranked Modes" },
    ],
  },



  {
    title: "Player Hub",
    links: [
      { href: "/dashboard", label: "My Profile" },
      { href: "/dashboard/friends", label: "Friends List" },
      { href: "/dashboard/dms", label: "Messages" },
      { href: "/dashboard/chat", label: "Global Chat" },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border bg-background">
      <div className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 lg:px-10 xl:px-16">
        
        <div className="grid gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
          
          {/* Brand & Newsletter */}
          <div className="flex flex-col gap-6">
            <Link
              href="/"
              className="inline-flex w-fit select-none items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              <Crown size={24} className="text-amber-500" fill="currentColor" />
              <span className="font-heading text-xl font-bold uppercase tracking-widest text-foreground">
                FPS Database
              </span>
            </Link>
            
            <p className="max-w-sm text-[14px] leading-relaxed text-muted">
              The definitive reference for competitive FPS games. Track your stats, 
              climb the leaderboard, and squad up with friends.
            </p>

            <div className="mt-2">
              <p className="mb-2 text-[13px] font-semibold text-foreground">Subscribe to patch notes</p>
              <form className="flex max-w-sm items-center gap-2" onSubmit={(e) => e.preventDefault()}>
                <input suppressHydrationWarning type="email"
                  placeholder="player@example.com"
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-[13px] text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button suppressHydrationWarning type="submit"
                  className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-foreground px-4 text-[13px] font-bold text-background transition-opacity hover:opacity-90"
                >
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <p className="text-[13px] font-semibold text-foreground">Follow the Meta</p>
              <div className="flex items-center gap-4">
                <Link href="#" aria-label="Discord" className="text-muted transition-colors hover:text-foreground">
                  <MessagesSquare size={20} />
                </Link>
                <Link href="#" aria-label="Twitch" className="text-muted transition-colors hover:text-foreground">
                  <Gamepad2 size={20} />
                </Link>
                <Link href="#" aria-label="YouTube" className="text-muted transition-colors hover:text-foreground">
                  <Video size={20} />
                </Link>
                <Link href="#" aria-label="Developer API" className="text-muted transition-colors hover:text-foreground">
                  <Code size={20} />
                </Link>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-[12px] font-bold uppercase tracking-[0.1em] text-foreground">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        className="text-[13px] tracking-[-0.01em] text-muted transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-[12px] tracking-[-0.01em] text-muted sm:flex-row">
          <p>
            © {CURRENT_YEAR} FPS Game Database. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}









