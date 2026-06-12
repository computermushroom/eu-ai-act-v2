// Scan Tasks Management Page
// Client Component: View and manage automated scan tasks

"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Scan task from API
 */
interface ScanTask {
  id: string;
  name: string;
  targetUrl: string | null;
  scanType: string;
  frequency: string;
  status: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

/**
 * Status badge styles
 */
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  running: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

const FREQUENCY_LABELS: Record<string, string> = {
  once: "Once",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const SCAN_TYPE_LABELS: Record<string, string> = {
  "shadow-ai": "Shadow AI Scan",
  "url-scan": "URL Compliance Scan",
  "compliance-check": "Compliance Check",
  "monthly-auto": "Monthly Auto Scan",
};

/**
 * Format date
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Scan Tasks management page
 */
export default function ScanTasksPage() {
  const t = useTranslations();

  const [tasks, setTasks] = useState<ScanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formTargetUrl, setFormTargetUrl] = useState("");
  const [formScanType, setFormScanType] = useState("shadow-ai");
  const [formFrequency, setFormFrequency] = useState("monthly");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/scan-tasks");
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to load");
        return;
      }
      setTasks(data.tasks ?? []);
    } catch {
      setError("Unable to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create task
  const handleCreate = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setCreateError(null);

      if (!formName.trim()) {
        setCreateError("Please enter a task name");
        return;
      }

      setIsCreating(true);
      try {
        const response = await fetch("/api/scan-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            targetUrl: formTargetUrl.trim() || undefined,
            scanType: formScanType,
            frequency: formFrequency,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setCreateError(data.error || "Create failed");
          return;
        }

        // Reset form and refresh
        setFormName("");
        setFormTargetUrl("");
        setFormScanType("shadow-ai");
        setFormFrequency("monthly");
        setShowForm(false);
        fetchTasks();
      } catch {
        setCreateError("Unable to connect to server");
      } finally {
        setIsCreating(false);
      }
    },
    [formName, formTargetUrl, formScanType, formFrequency, fetchTasks]
  );

  // Delete task
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this scan task?")) return;

      try {
        const response = await fetch(`/api/scan-tasks?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          alert(data.error || "Delete failed");
          return;
        }

        fetchTasks();
      } catch {
        alert("Unable to connect to server");
      }
    },
    [fetchTasks]
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:underline"
            >{t("nav.dashboard")}            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">Auto Scan Tasks</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Auto Scan Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage recurring compliance scan tasks.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {showForm ? "Cancel" : "New Task"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 rounded-lg border border-border bg-background p-4"
        >
          <h3 className="text-sm font-semibold">New Scan Task</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Task Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (createError) setCreateError(null);
                }}
                placeholder="e.g., Monthly Shadow AI Scan"
                className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Scan Target (Optional)
              </label>
              <input
                type="text"
                value={formTargetUrl}
                onChange={(e) => setFormTargetUrl(e.target.value)}
                placeholder="e.g., example.com or organization name"
                className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Scan Type
              </label>
              <select
                value={formScanType}
                onChange={(e) => setFormScanType(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="shadow-ai">{t("tools.results")}</option>
                <option value="url-scan">{t("tools.results")}</option>
                <option value="compliance-check">Compliance Check</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Frequency
              </label>
              <select
                value={formFrequency}
                onChange={(e) => setFormFrequency(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="once">Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
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
              {isCreating ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Tasks Table */}
      <div className="mt-6 rounded-lg border border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">
            Task List {tasks.length > 0 && `(${tasks.length})`}
          </h3>
        </div>

        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : tasks.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
              <svg
                className="h-6 w-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-medium">No scan tasks yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Click &quot;New Task&quot; in the top right to create your first automated scan task.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Task Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Frequency
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Last Run
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Next Run
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{task.name}</div>
                      {task.targetUrl && (
                        <div className="text-xs text-muted-foreground">
                          Target: {task.targetUrl}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {SCAN_TYPE_LABELS[task.scanType] ?? task.scanType}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {FREQUENCY_LABELS[task.frequency] ?? task.frequency}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[task.status] ??
                          "bg-gray-100 text-gray-800 border-gray-200"
                        }`}
                      >
                        {STATUS_LABELS[task.status] ?? task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(task.lastRunAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(task.nextRunAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
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

      {/* Info Card */}
      <div className="mt-6 rounded-md border border-border bg-muted/30 p-4">
        <h4 className="text-xs font-semibold text-foreground">About Auto Scans</h4>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
          <li>&quot;Once&quot; tasks do not repeat automatically; you can trigger them manually.</li>
          <li>&quot;Daily / Weekly / Monthly&quot; tasks run automatically at the set interval.</li>
          <li>All scan results are saved to your account and can be viewed in the dashboard.</li>
          <li>Deleting a task does not delete previously generated scan results.</li>
        </ul>
      </div>
    </div>
  );
}
