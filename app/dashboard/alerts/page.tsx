// Compliance Alerts Inbox Page
// Client Component: displays user's compliance alerts with severity badges,
// mark-all-read button, and auto-check for new alerts on load.

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

/**
 * Compliance alert from API
 */
interface ComplianceAlert {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  articleRef: string | null;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

/**
 * Alerts API response
 */
interface AlertsResponse {
  alerts: ComplianceAlert[];
  total: number;
  unreadCount: number;
  limit: number;
  offset: number;
}

const SEVERITY_CONFIG: Record<
  "info" | "warning" | "critical",
  { label: string; badgeClass: string; iconClass: string }
> = {
  info: {
    label: "Info",
    badgeClass: "bg-blue-500/10 text-blue-600",
    iconClass: "text-blue-600",
  },
  warning: {
    label: "Warning",
    badgeClass: "bg-amber-500/10 text-amber-600",
    iconClass: "text-amber-600",
  },
  critical: {
    label: "Critical",
    badgeClass: "bg-red-500/10 text-red-600",
    iconClass: "text-red-600",
  },
};

export default function AlertsPage() {
  const t = useTranslations();

  const { status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<AlertsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const url =
        filter === "unread"
          ? "/api/alerts?unreadOnly=true"
          : "/api/alerts";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }
      const result: AlertsResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAlerts();
    }
  }, [status, fetchAlerts]);

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      const response = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const response = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      setDismissingId(id);
      const response = await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to dismiss alert");
      }
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setDismissingId(null);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const alerts = data?.alerts ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Compliance Alerts
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`
              : "All caught up! No unread alerts."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {markingAll ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                "Mark All Read"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setFilter("all")}
          className={`inline-flex h-9 items-center border-b-2 px-3 text-sm font-medium transition-colors ${
            filter === "all"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All
          {data?.total != null && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
              {data.total}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`inline-flex h-9 items-center border-b-2 px-3 text-sm font-medium transition-colors ${
            filter === "unread"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Alerts list */}
      <div className="mt-6 space-y-3">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <div className="rounded-full bg-muted p-4">
              <svg
                className="h-8 w-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-semibold">{t("tools.noResults")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {filter === "unread"
                ? "You have no unread alerts."
                : "Your compliance alert inbox is empty."}
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const severity =
              SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
            return (
              <div
                key={alert.id}
                className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between ${
                  alert.isRead
                    ? "border-border bg-background opacity-70"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Severity icon */}
                  <span
                    className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${severity.badgeClass}`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      {alert.severity === "critical" ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        />
                      ) : alert.severity === "warning" ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                        />
                      )}
                    </svg>
                  </span>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{alert.title}</h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${severity.badgeClass}`}
                      >
                        {severity.label}
                      </span>
                      {alert.articleRef && (
                        <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {alert.articleRef}
                        </span>
                      )}
                      {!alert.isRead && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {alert.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2 sm:ml-4">
                  {!alert.isRead && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    disabled={dismissingId === alert.id}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {dismissingId === alert.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      "Dismiss"
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
