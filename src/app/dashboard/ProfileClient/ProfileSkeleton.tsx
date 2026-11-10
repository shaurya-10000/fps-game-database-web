export default function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile" className="mx-auto max-w-5xl space-y-6">
      <div className="h-72 animate-pulse rounded-3xl border border-border bg-surface" />
      <div className="flex gap-2 border-b border-border pb-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-5 w-20 animate-pulse rounded bg-foreground/10" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-52 animate-pulse rounded-2xl border border-border bg-surface" />
        <div className="h-52 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}