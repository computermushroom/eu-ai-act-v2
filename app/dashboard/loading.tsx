// Dashboard Loading Skeleton
// Displayed while dashboard data is being fetched
// Matches dashboard layout structure for smooth loading experience

export default function DashboardLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border p-5"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-8 w-12 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Tools grid skeleton */}
      <div className="mt-10">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border border-border bg-muted/50"
            />
          ))}
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="mt-10">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4 flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-36 animate-pulse rounded-md bg-muted"
            />
          ))}
        </div>
      </div>

      {/* Subscription skeleton */}
      <div className="mt-10 h-48 animate-pulse rounded-lg border border-border bg-muted/30" />
    </div>
  );
}
