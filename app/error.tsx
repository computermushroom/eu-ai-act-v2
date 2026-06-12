// Global Error Boundary
// Catches unhandled errors in Server Components
// Must be a Client Component with "use client"
// https://nextjs.org/docs/app/api-reference/file-conventions/error

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Global error page
 * Props: error (the thrown error), reset (function to retry)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    // Log error to monitoring service (e.g., Sentry)
    console.error("[GLOBAL ERROR]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="space-y-6 text-center">
          {/* Error code */}
          <p className="text-8xl font-bold text-muted-foreground/30">500</p>

          {/* Message */}
          <h1 className="text-2xl font-bold tracking-tight">
            {t("error.title")}
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("error.message")}
          </p>

          {/* Error digest for debugging */}
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              {t("error.errorId")}: {error.digest}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("error.tryAgain")}
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              {t("error.goHome")}
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
