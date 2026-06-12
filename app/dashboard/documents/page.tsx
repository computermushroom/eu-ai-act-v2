// Documents Management Page
// Client Component: View and manage compliance documents with version control

"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * AI System option for dropdown
 */
interface AISystemOption {
  id: string;
  name: string;
}

/**
 * Document from API
 */
interface ComplianceDocument {
  id: string;
  title: string;
  type: string;
  content: string;
  version: number;
  status: string;
  systemId: string | null;
  createdAt: string;
  updatedAt: string;
  system: { id: string; name: string } | null;
}

const DOCUMENT_TYPES = [
  { value: "technical-doc", label: "Technical Documentation" },
  { value: "fria", label: "FRIA" },
  { value: "qms", label: "QMS" },
  { value: "report", label: "Report" },
  { value: "policy", label: "Policy" },
];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-500/10 text-amber-600",
  review: "bg-blue-500/10 text-blue-600",
  approved: "bg-emerald-500/10 text-emerald-600",
  archived: "bg-slate-500/10 text-slate-600",
};

const TYPE_STYLES: Record<string, string> = {
  "technical-doc": "bg-purple-500/10 text-purple-600",
  fria: "bg-pink-500/10 text-pink-600",
  qms: "bg-cyan-500/10 text-cyan-600",
  report: "bg-indigo-500/10 text-indigo-600",
  policy: "bg-teal-500/10 text-teal-600",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DocumentsPage() {
  const t = useTranslations();

  const { status } = useSession();
  const router = useRouter();

  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [systems, setSystems] = useState<AISystemOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ComplianceDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    type: "technical-doc",
    content: "",
    systemId: "",
    status: "draft",
  });

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/documents");
      if (!response.ok) throw new Error("Failed to fetch documents");
      const result = await response.json();
      setDocuments(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSystems = useCallback(async () => {
    try {
      const response = await fetch("/api/ai-systems");
      if (!response.ok) return;
      const result = await response.json();
      setSystems(
        (result.data ?? []).map((s: { id: string; name: string }) => ({
          id: s.id,
          name: s.name,
        }))
      );
    } catch {
      // Silently fail - systems are optional
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDocuments();
      fetchSystems();
    }
  }, [status, fetchDocuments, fetchSystems]);

  const openCreateModal = () => {
    setEditingDoc(null);
    setForm({ title: "", type: "technical-doc", content: "", systemId: "", status: "draft" });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (doc: ComplianceDocument) => {
    setEditingDoc(doc);
    setForm({
      title: doc.title,
      type: doc.type,
      content: doc.content,
      systemId: doc.systemId ?? "",
      status: doc.status,
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDoc(null);
    setFormError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) {
      setFormError("Title is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const url = editingDoc ? `/api/documents/${editingDoc.id}` : "/api/documents";
      const method = editingDoc ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          type: form.type,
          content: form.content,
          systemId: form.systemId || null,
          status: form.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      closeModal();
      await fetchDocuments();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (doc: ComplianceDocument) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      await fetchDocuments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleDownload = (doc: ComplianceDocument) => {
    const blob = new Blob(
      [
        `${doc.title}\n`,
        `Type: ${doc.type}\n`,
        `Version: ${doc.version}\n`,
        `Status: ${doc.status}\n`,
        `Created: ${formatDate(doc.createdAt)}\n`,
        `Updated: ${formatDate(doc.updatedAt)}\n`,
        doc.system ? `Linked System: ${doc.system.name}\n` : "",
        `\n---\n\n`,
        doc.content,
      ],
      { type: "text/plain" }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, "_")}_v${doc.version}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
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
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">{t("nav.dashboard")}            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">Documents</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Manage version-controlled compliance documentation
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Document
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && documents.length === 0 && (
        <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <div className="rounded-full bg-muted p-4">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold">No documents yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">Create your first compliance document to get started.</p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            New Document
          </button>
        </div>
      )}

      {/* Documents table */}
      {documents.length > 0 && (
        <div className="mt-8 rounded-lg border border-border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("tools.category")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Version</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Linked System</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{doc.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[doc.type] ?? "bg-muted text-muted-foreground"}`}>
                        {DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">v{doc.version}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.status] ?? "bg-muted text-muted-foreground"}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {doc.system ? doc.system.name : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(doc)}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Download"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold">
              {editingDoc ? "Edit Document" : "New Document"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {editingDoc ? "Update your compliance document." : "Create a new compliance document."}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Technical Documentation v1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium">
                    Type
                  </label>
                  <select
                    id="type"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium">
                    Status
                  </label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="systemId" className="block text-sm font-medium">
                  Linked AI System
                </label>
                <select
                  id="systemId"
                  value={form.systemId}
                  onChange={(e) => setForm((f) => ({ ...f, systemId: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">None</option>
                  {systems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium">
                  Content
                </label>
                <textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={8}
                  placeholder="Enter document content here..."
                />
              </div>

              {editingDoc && (
                <p className="text-xs text-muted-foreground">
                  Current version: v{editingDoc.version}. Saving content changes will auto-increment the version.
                </p>
              )}

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
                  ) : editingDoc ? (
                    "Save Changes"
                  ) : (
                    "Create Document"
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
