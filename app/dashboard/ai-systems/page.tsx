// AI Systems List Page
// Client Component: lists all user's AI systems with create/edit/delete functionality
// Route: /dashboard/ai-systems

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Scan result from API
 */
interface ScanResult {
  id: string;
  scanType: string;
  score: number;
  status: string;
  createdAt: string;
}

/**
 * AI System with counts from API
 */
interface AISystem {
  id: string;
  name: string;
  description: string | null;
  systemType: string;
  status: string;
  riskLevel: string | null;
  industry: string | null;
  art6Compliant: boolean;
  art9Compliant: boolean;
  art10Compliant: boolean;
  art12Compliant: boolean;
  art13Compliant: boolean;
  art14Compliant: boolean;
  art15Compliant: boolean;
  art17Compliant: boolean;
  art27Compliant: boolean;
  createdAt: string;
  updatedAt: string;
  scanResults: ScanResult[];
  _count: {
    scanResults: number;
    documents: number;
  };
}

/**
 * Form state for creating/editing AI system
 */
interface SystemForm {
  name: string;
  description: string;
  systemType: string;
  industry: string;
}

const SYSTEM_TYPES = [
  { value: "high-risk", label: "High Risk" },
  { value: "limited-risk", label: "Limited Risk" },
  { value: "minimal-risk", label: "Minimal Risk" },
  { value: "prohibited", label: "Prohibited" },
];

const INDUSTRIES = [
  { value: "", label: "Select Industry" },
  { value: "marketing", label: "Marketing" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "customer-service", label: "Customer Service" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "legal", label: "Legal" },
  { value: "hr", label: "Human Resources" },
  { value: "transportation", label: "Transportation" },
  { value: "other", label: "Other" },
];

const ARTICLES = [
  { key: "art6Compliant", label: "Art.6", name: "Risk Classification" },
  { key: "art9Compliant", label: "Art.9", name: "Risk Management" },
  { key: "art10Compliant", label: "Art.10", name: "Data Governance" },
  { key: "art12Compliant", label: "Art.12", name: "Record Keeping" },
  { key: "art13Compliant", label: "Art.13", name: "Transparency" },
  { key: "art14Compliant", label: "Art.14", name: "Human Oversight" },
  { key: "art15Compliant", label: "Art.15", name: "Accuracy" },
  { key: "art17Compliant", label: "Art.17", name: "QMS" },
  { key: "art27Compliant", label: "Art.27", name: "FRIA" },
] as const;

export default function AISystemsPage() {
  const t = useTranslations();

  const { status } = useSession();
  const router = useRouter();

  const [systems, setSystems] = useState<AISystem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSystem, setEditingSystem] = useState<AISystem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState<SystemForm>({
    name: "",
    description: "",
    systemType: "high-risk",
    industry: "",
  });

  const fetchSystems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/ai-systems");
      if (!response.ok) {
        throw new Error("Failed to fetch AI systems");
      }
      const result = await response.json();
      setSystems(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSystems();
    }
  }, [status, fetchSystems]);

  const openCreateModal = () => {
    setEditingSystem(null);
    setForm({ name: "", description: "", systemType: "high-risk", industry: "" });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (system: AISystem) => {
    setEditingSystem(system);
    setForm({
      name: system.name,
      description: system.description ?? "",
      systemType: system.systemType,
      industry: system.industry ?? "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSystem(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const url = editingSystem ? `/api/ai-systems/${editingSystem.id}` : "/api/ai-systems";
      const method = editingSystem ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          systemType: form.systemType,
          industry: form.industry || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      closeModal();
      await fetchSystems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (system: AISystem) => {
    if (!confirm(`Are you sure you want to delete "${system.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ai-systems/${system.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      await fetchSystems();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const getComplianceCount = (system: AISystem) => {
    return ARTICLES.filter((a) => system[a.key as keyof AISystem] === true).length;
  };

  const getSystemTypeColor = (type: string) => {
    switch (type) {
      case "high-risk":
        return "bg-orange-500/10 text-orange-600";
      case "limited-risk":
        return "bg-blue-500/10 text-blue-600";
      case "minimal-risk":
        return "bg-emerald-500/10 text-emerald-600";
      case "prohibited":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "active":
        return "bg-emerald-500/10 text-emerald-600";
      case "draft":
        return "bg-amber-500/10 text-amber-600";
      case "deprecated":
        return "bg-slate-500/10 text-slate-600";
      case "removed":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Systems</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your AI systems for EU AI Act compliance
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add AI System
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && systems.length === 0 && (
        <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <div className="rounded-full bg-muted p-4">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold">No AI systems yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">Get started by adding your first AI system.</p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Add AI System
          </button>
        </div>
      )}

      {/* Systems list */}
      {systems.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {systems.map((system) => (
            <div
              key={system.id}
              className="flex flex-col rounded-lg border border-border bg-background p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/ai-systems/${system.id}`}
                    className="text-sm font-semibold hover:text-primary truncate block"
                  >
                    {system.name}
                  </Link>
                  {system.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{system.description}</p>
                  )}
                </div>
                <div className="ml-3 flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(system)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(system)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getSystemTypeColor(system.systemType)}`}>
                  {system.systemType}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(system.status)}`}>
                  {system.status}
                </span>
                {system.industry && (
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {system.industry}
                  </span>
                )}
              </div>

              {/* Compliance badges */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Compliance</span>
                  <span className="text-xs font-medium">
                    {getComplianceCount(system)}/{ARTICLES.length}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {ARTICLES.map((article) => {
                    const isCompliant = system[article.key as keyof AISystem] === true;
                    return (
                      <span
                        key={article.key}
                        title={`${article.name} (${article.label})`}
                        className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-medium ${
                          isCompliant
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {article.label.replace("Art.", "")}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Meta */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>{system._count.scanResults} scans</span>
                <span>{system._count.documents} docs</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold">
              {editingSystem ? "Edit AI System" : "Add AI System"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {editingSystem ? "Update your AI system details." : "Register a new AI system for compliance tracking."}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Customer Support Chatbot"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium">{t("tools.description")}                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                  placeholder="Brief description of the AI system..."
                />
              </div>

              <div>
                <label htmlFor="systemType" className="block text-sm font-medium">
                  System Type
                </label>
                <select
                  id="systemType"
                  value={form.systemType}
                  onChange={(e) => setForm((f) => ({ ...f, systemType: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {SYSTEM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium">
                  Industry
                </label>
                <select
                  id="industry"
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {INDUSTRIES.map((i) => (
                    <option key={i.value} value={i.value}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">{formError}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : editingSystem ? (
                    "Save Changes"
                  ) : (
                    "Create System"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
