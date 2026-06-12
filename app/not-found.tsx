// Global Not Found Page (404)
// Displayed when a user navigates to a non-existent route
// Server Component with helpful navigation links

import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="space-y-6">
        {/* Error code */}
        <p className="text-8xl font-bold text-muted-foreground/30">404</p>

        {/* Message */}
        <h1 className="text-2xl font-bold tracking-tight">{t("notFound.title")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("notFound.description")}
        </p>

        {/* Navigation links */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("notFound.goHome")}
          </Link>
          <Link
            href="/tools/risk-assessment"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t("notFound.riskTool")}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t("notFound.viewPricing")}
          </Link>
        </div>

        {/* Suggestion */}
        <p className="text-xs text-muted-foreground">
          {t("notFound.contactSupport")}
        </p>
      </div>
    </div>
  );
}
