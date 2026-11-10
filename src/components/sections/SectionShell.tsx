import Link from "next/link";

export function SectionHeader({
  kicker,
  title,
  href,
}: {
  kicker: string;
  title: string;
  href: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          {kicker}
        </div>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-muted transition-colors hover:border-foreground/20 hover:text-foreground"
      >
        View all →
      </Link>
    </div>
  );
}

export function PreviewCardShell({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20"
    >
      {children}
    </Link>
  );
}

export function PreviewGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

export function SectionBanner({
  kicker,
  title,
  description,
  count,
  countLabel,
  href,
  tags,
}: {
  kicker: string;
  title: string;
  description: string;
  count: number;
  countLabel: string;
  href: string;
  tags: string[];
}) {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-10 sm:px-8 lg:px-10 xl:px-16">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-foreground/20">
        <div className="grid items-center gap-8 p-8 sm:p-10 md:grid-cols-[1fr_auto] md:gap-12">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {kicker}
            </div>
            <h2 className="mt-1.5 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted">
              {description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-mono text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="text-right">
              <div className="font-mono text-5xl font-semibold tracking-[-0.04em] text-foreground">
                {count}
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                {countLabel}
              </div>
            </div>
            <Link
              href={href}
              className="rounded-md bg-foreground px-4 py-2 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
            >
              View all →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
