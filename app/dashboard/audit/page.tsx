// Audit Log Dashboard Page
// Displays user's activity history for compliance and security review
// GDPR-compliant: users can view all actions related to their account

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Audit log entry from API
 */
interface AuditLogEntry {
  id: string;
  action: string;
  resource: string | null;
  details: string | null;
  createdAt: string;
}

/**
 * Action label mapping for display
 */
const ACTION_LABELS: Record<string, string> = {
  user_login: "Signed in",
  user_logout: "Signed out",
  user_registered: "Account created",
  user_updated_profile: "Profile updated",
  user_exported_data: "Data exported",
  user_deleted_account: "Account deleted",
  subscription_created: "Subscription created",
  subscription_updated: "Subscription updated",
  subscription_cancelled: "Subscription cancelled",
  payment_succeeded: "Payment successful",
  payment_failed: "Payment failed",
  tool_risk_assessment: "Risk assessment run",
  tool_prohibited_practices: "Prohibited practices check",
  tool_transparency_check: "Transparency check",
  report_generated: "Report generated",
  report_downloaded: "Report downloaded",
  settings_updated: "Settings updated",
};

/**
 * Action color mapping
 */
const ACTION_COLORS: Record<string, string> = {
  user_login: "bg-green-100 text-green-800",
  user_logout: "bg-gray-100 text-gray-800",
  user_registered: "bg-blue-100 text-blue-800",
  user_updated_profile: "bg-yellow-100 text-yellow-800",
  user_exported_data: "bg-purple-100 text-purple-800",
  user_deleted_account: "bg-red-100 text-red-800",
  subscription_created: "bg-blue-100 text-blue-800",
  subscription_updated: "bg-yellow-100 text-yellow-800",
  subscription_cancelled: "bg-orange-100 text-orange-800",
  payment_succeeded: "bg-green-100 text-green-800",
  payment_failed: "bg-red-100 text-red-800",
  tool_risk_assessment: "bg-indigo-100 text-indigo-800",
  tool_prohibited_practices: "bg-indigo-100 text-indigo-800",
  tool_transparency_check: "bg-indigo-100 text-indigo-800",
  report_generated: "bg-teal-100 text-teal-800",
  report_downloaded: "bg-teal-100 text-teal-800",
  settings_updated: "bg-gray-100 text-gray-800",
};

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(dateString);
}

/**
 * Audit log dashboard page
 */
export default function AuditLogPage() {
  const t = useTranslations();

  const { status } = useSession();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    if (status !== "authenticated") return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/audit?limit=${limit}&offset=${offset}`);
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [status, offset]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (status === "loading") {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Authentication Required</h1>
        <p className="mt-2 text-muted-foreground">
          Please sign in to view your audit logs.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const hasMore = offset + limit < total;
  const hasPrev = offset > 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground">
          Review all actions related to your account for compliance and security
        </p>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Events</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-2xl font-bold">
            {logs.filter((l) => l.action.startsWith("tool_")).length}
          </p>
          <p className="text-xs text-muted-foreground">Tool Uses</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-2xl font-bold">
            {logs.filter((l) => l.action.startsWith("user_")).length}
          </p>
          <p className="text-xs text-muted-foreground">Account Events</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-2xl font-bold">
            {logs.filter((l) => l.action.startsWith("payment_")).length}
          </p>
          <p className="text-xs text-muted-foreground">Payments</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Log table */}
      <div className="mt-6 rounded-lg border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">Resource</th>
                <th className="px-4 py-3 text-left font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && logs.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3">
                      <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-28 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ACTION_COLORS[log.action] ??
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.resource ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span title={formatDate(log.createdAt)}>
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                disabled={!hasPrev || isLoading}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >{t("common.back")}              </button>
              <button
                type="button"
                onClick={() => setOffset((prev) => prev + limit)}
                disabled={!hasMore || isLoading}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >{t("common.next")}              </button>
            </div>
          </div>
        )}
      </div>

      {/* GDPR note */}
      <div className="mt-6 rounded-md border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Privacy Note:</strong> This activity log is maintained for
          security and compliance purposes under GDPR Article 5(1)(f). IP
          addresses are anonymized. You have the right to request deletion of
          your data under GDPR Article 17.
        </p>
      </div>
    </div>
  );
}
