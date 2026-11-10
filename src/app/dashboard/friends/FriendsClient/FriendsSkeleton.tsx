export default function FriendsSkeleton() {
  return (
    <div role="status" aria-label="Loading friends" className="space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-40 animate-pulse rounded bg-foreground/10" />
        <div className="h-4 w-56 animate-pulse rounded bg-foreground/10" />
      </div>
      <div className="flex gap-2 border-b border-border pb-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-5 w-20 animate-pulse rounded bg-foreground/10" />
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
            <div className="size-11 animate-pulse rounded-full bg-foreground/10" />
            <div className="space-y-2">
              <div className="h-3.5 w-32 animate-pulse rounded bg-foreground/10" />
              <div className="h-3 w-20 animate-pulse rounded bg-foreground/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}