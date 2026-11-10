import Link from "next/link";

const CURRENT_YEAR = 2026;

const COLUMNS = [
  {
    title: "Catalog",
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
      { href: "/rankings", label: "Rankings" },
      { href: "/rankings?bucket=ranked", label: "Ranked Leaderboard" },
      { href: "/modes?bucket=ranked", label: "Ranked Modes" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/catalog", label: "Full Catalog" },
      { href: "/about", label: "About" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
] as const;

function DiamondMark() {
  return (
    <span
      aria-hidden="true"
      className="relative flex size-7 items-center justify-center"
    >
      <span
        className="absolute inset-0 rounded-md blur-md"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--accent-glow),0.45) 0%, rgba(var(--accent-glow),0) 70%)",
        }}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-[18px] text-accent"
        style={{
          filter: "drop-shadow(0 0 5px rgba(var(--accent-glow),0.7))",
        }}
      >
        <path fill="currentColor" d="M12 2L22 12L12 22L2 12Z" />
      </svg>
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border bg-background">
      <div className="mx-auto max-w-[1600px] px-5 py-14 sm:px-8 lg:px-10 xl:px-16">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="inline-flex select-none items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              <DiamondMark />
              <span className="text-[15px] font-semibold tracking-[-0.03em] text-foreground sm:text-base">
                FPS Database
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-muted">
              A reference for competitive FPS games — full ballistics,
              characters, maps, modes, and live competitive rankings.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                {col.title}
              </h4>
              <ul className="space-y-2">
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

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-[12px] tracking-[-0.01em] text-muted sm:flex-row sm:items-center">
          <p>
            © {CURRENT_YEAR} FPS Game Database. All content is original IP.
          </p>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            />
            <span>Service online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
