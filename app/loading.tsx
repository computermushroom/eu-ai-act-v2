// Global Loading State
// Displayed during route transitions (Next.js streaming)
// Lightweight skeleton for initial page load

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-6">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-4/6 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Card skeleton */}
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border border-border bg-muted/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
