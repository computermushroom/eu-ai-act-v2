// Webhook Management Page
// Client Component: View and manage webhook configurations (Enterprise tier)

"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Webhook config from API
 */
interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const EVENT_OPTIONS = [
  { value: "compliance.alert", label: "compliance.alert" },
  { value: "scan.completed", label: "scan.completed" },
  { value: "document.updated", label: "document.updated" },
  { value: "report.generated", label: "report.generated" },
];

const EVENT_STYLES: Record<string, string> = {
  "compliance.alert": "bg-red-500/10 text-red-600",
  "scan.completed": "bg-blue-500/10 text-blue-600",
  "document.updated": "bg-amber-500/10 text-amber-600",
  "report.generated": "bg-emerald-500/10 text-emerald-600",
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateUrl(url: string, maxLen = 40): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen) + "...";
}

export default function WebhooksPage() {
  const t = useTranslations();

  const { status } = useSession();
  const router = useRouter();

  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/webhooks");
      if (!response.ok) throw new Error("Failed to fetch webhooks");
      const result = await response.json();
      setWebhooks(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchWebhooks();
    }
  }, [status, fetchWebhooks]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!formName.trim()) {
      setCreateError("Name is required");
      return;
    }

    if (!formUrl.trim()) {
      setCreateError("URL is required");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          url: formUrl.trim(),
          events: formEvents,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setCreateError(data.error || "Failed to create webhook");
        return;
      }

      setFormName("");
      setFormUrl("");
      setFormEvents([]);
      setShowForm(false);
      fetchWebhooks();
    } catch {
      setCreateError("Failed to create webhook");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (webhook: WebhookConfig) => {
    try {
      const response = await fetch("/api/webhooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: webhook.id, isActive: !webhook.isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to update webhook");
        return;
      }

      fetchWebhooks();
    } catch {
      alert("Failed to update webhook");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const response = await fetch(`/api/webhooks?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to delete");
        return;
      }

      fetchWebhooks();
    } catch {
      alert("Failed to delete webhook");
    }
  };

  const toggleEvent = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const exampleCurl = (webhook: WebhookConfig) => {
    const payload = JSON.stringify({
      event: webhook.events[0] ?? "compliance.alert",
      timestamp: new Date().toISOString(),
      data: { message: "Test webhook payload" },
    });
    return `curl -X POST ${webhook.url} \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: <signature>" \\
  -d '${payload}'`;
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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">{t("nav.dashboard")}            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">Webhooks</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Webhook Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Manage external API endpoints for enterprise integrations
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {showForm ? "Cancel" : "New Webhook"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 rounded-lg border border-border bg-background p-4"
        >
          <h3 className="text-sm font-semibold">New Webhook</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (createError) setCreateError(null);
                }}
                placeholder="e.g. Slack Notifications"
                className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://hooks.example.com/webhook"
                className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-foreground">Events</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {EVENT_OPTIONS.map((event) => (
                <label
                  key={event.value}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={formEvents.includes(event.value)}
                    onChange={() => toggleEvent(event.value)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs">{event.label}</span>
                </label>
              ))}
            </div>
          </div>

          {createError && (
            <p className="mt-3 text-xs text-destructive">{createError}</p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Webhook"}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Webhooks Table */}
      <div className="mt-6 rounded-lg border border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">
            Webhooks {webhooks.length > 0 && `(${webhooks.length})`}
          </h3>
        </div>

        {webhooks.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-medium">No webhooks configured</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a webhook to receive real-time compliance events.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">URL</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Events</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Active</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Last Triggered</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {webhooks.map((webhook) => (
                  <tr key={webhook.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{webhook.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground" title={webhook.url}>
                        {truncateUrl(webhook.url)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${EVENT_STYLES[event] ?? "bg-muted text-muted-foreground"}`}
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(webhook)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${webhook.isActive ? "bg-primary" : "bg-muted"}`}
                        title={webhook.isActive ? "Disable" : "Enable"}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${webhook.isActive ? "translate-x-5" : "translate-x-1"}`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(webhook.lastTriggeredAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(webhook.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Example curl commands */}
      {webhooks.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold">Test Webhooks</h3>
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">{webhook.name}</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${webhook.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-600"}`}>
                  {webhook.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <pre className="mt-2 overflow-x-auto rounded-md bg-background p-3 text-xs text-muted-foreground">
                <code>{exampleCurl(webhook)}</code>
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
