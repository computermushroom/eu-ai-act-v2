// White-Label Client Portal Management Page
// Client Component: Configure portal branding, feature toggles, and manage clients (Enterprise tier)

"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Portal configuration from API
 */
interface ClientPortal {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  welcomeTitle: string | null;
  welcomeMessage: string | null;
  footerText: string | null;
  contactEmail: string | null;
  showPricing: boolean;
  showTraining: boolean;
  showDocuments: boolean;
  showTeam: boolean;
  showAlerts: boolean;
  showReports: boolean;
  isPublic: boolean;
  status: string;
  createdAt: string;
}

/**
 * Client record from API
 */
interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  industry: string | null;
  status: string;
  createdAt: string;
}

/**
 * Default portal values for new portal creation
 */
const DEFAULT_PORTAL = {
  name: "",
  slug: "",
  logoUrl: "",
  primaryColor: "#2563eb",
  accentColor: "#16a34a",
  welcomeTitle: "Welcome to Your Compliance Dashboard",
  welcomeMessage: "",
  footerText: "Powered by EU AI Act Compliance Tool",
  contactEmail: "",
  showPricing: false,
  showTraining: true,
  showDocuments: true,
  showTeam: true,
  showAlerts: true,
  showReports: true,
  isPublic: false,
};

/**
 * Feature toggle definitions
 */
const FEATURE_TOGGLES = [
  { key: "showPricing", label: "Pricing Page", description: "Show pricing information to clients" },
  { key: "showTraining", label: "Training Modules", description: "Allow access to compliance training" },
  { key: "showDocuments", label: "Document Library", description: "Show compliance document repository" },
  { key: "showTeam", label: "Team Management", description: "Enable team collaboration features" },
  { key: "showAlerts", label: "Compliance Alerts", description: "Show compliance alerts and notifications" },
  { key: "showReports", label: "Reports & Analytics", description: "Allow access to compliance reports" },
] as const;

/**
 * Status badge styles
 */
const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  inactive: "bg-slate-500/10 text-slate-600",
  suspended: "bg-red-500/10 text-red-600",
};

/**
 * Generate URL-safe slug from a name string
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PortalPage() {
  const t = useTranslations();

  const { status } = useSession();
  const router = useRouter();

  // Portal state
  const [portal, setPortal] = useState<ClientPortal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [form, setForm] = useState(DEFAULT_PORTAL);
  const [slugEdited, setSlugEdited] = useState(false);

  // Client state
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  // Add client modal state
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", email: "", company: "", industry: "" });
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Fetch portal configuration
   */
  const fetchPortal = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/portal");
      if (!response.ok) throw new Error("Failed to fetch portal configuration");
      const result = await response.json();
      const data = result.data as ClientPortal | null;

      if (data) {
        setPortal(data);
        setForm({
          name: data.name,
          slug: data.slug,
          logoUrl: data.logoUrl ?? "",
          primaryColor: data.primaryColor ?? "#2563eb",
          accentColor: data.accentColor ?? "#16a34a",
          welcomeTitle: data.welcomeTitle ?? "",
          welcomeMessage: data.welcomeMessage ?? "",
          footerText: data.footerText ?? "",
          contactEmail: data.contactEmail ?? "",
          showPricing: data.showPricing,
          showTraining: data.showTraining,
          showDocuments: data.showDocuments,
          showTeam: data.showTeam,
          showAlerts: data.showAlerts,
          showReports: data.showReports,
          isPublic: data.isPublic,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch clients for the portal
   */
  const fetchClients = useCallback(async (portalId: string) => {
    try {
      setClientsLoading(true);
      const response = await fetch(`/api/portal/clients?portalId=${encodeURIComponent(portalId)}`);
      if (!response.ok) throw new Error("Failed to fetch clients");
      const result = await response.json();
      setClients(result.data ?? []);
    } catch {
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPortal();
    }
  }, [status, fetchPortal]);

  // Fetch clients once portal is loaded
  useEffect(() => {
    if (portal?.id) {
      fetchClients(portal.id);
    }
  }, [portal?.id, fetchClients]);

  /**
   * Handle name change and auto-generate slug
   */
  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name }));
    if (!slugEdited) {
      setForm((prev) => ({ ...prev, slug: generateSlug(name) }));
    }
  };

  /**
   * Save portal configuration
   */
  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Portal name is required");
      return;
    }
    if (!form.slug.trim()) {
      setError("Portal slug is required");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to save portal configuration");
        return;
      }

      setPortal(data.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setError("Failed to save portal configuration");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Delete portal
   */
  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/portal", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to delete portal");
        return;
      }

      setPortal(null);
      setClients([]);
      setForm(DEFAULT_PORTAL);
      setSlugEdited(false);
      setShowDeleteConfirm(false);
    } catch {
      setError("Failed to delete portal");
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Add a new client
   */
  const handleAddClient = async (e: FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (!clientForm.name.trim()) {
      setClientError("Client name is required");
      return;
    }
    if (!clientForm.email.trim()) {
      setClientError("Client email is required");
      return;
    }
    if (!portal?.id) {
      setClientError("Portal must be saved before adding clients");
      return;
    }

    setIsAddingClient(true);
    try {
      const response = await fetch("/api/portal/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalId: portal.id,
          name: clientForm.name.trim(),
          email: clientForm.email.trim(),
          company: clientForm.company.trim() || null,
          industry: clientForm.industry.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setClientError(data.error || "Failed to add client");
        return;
      }

      setClientForm({ name: "", email: "", company: "", industry: "" });
      setShowAddClient(false);
      fetchClients(portal.id);
    } catch {
      setClientError("Failed to add client");
    } finally {
      setIsAddingClient(false);
    }
  };

  /**
   * Remove a client
   */
  const handleRemoveClient = async (client: Client) => {
    if (!confirm(`Remove ${client.name} from the portal? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/portal/clients?id=${encodeURIComponent(client.id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to remove client");
        return;
      }

      if (portal?.id) {
        fetchClients(portal.id);
      }
    } catch {
      alert("Failed to remove client");
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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">{t("nav.dashboard")}            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">Client Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Client Portal</h1>
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">{t("tools.results")}            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure your white-label client portal for branded compliance services
          </p>
        </div>
        <div className="flex items-center gap-2">
          {portal && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Delete Portal
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {portal ? "Update Portal" : "Create Portal"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success message */}
      {saveSuccess && (
        <div className="mt-4 rounded-md border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-600">
          Portal configuration saved successfully.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <h3 className="text-sm font-semibold text-destructive">Delete Portal Configuration</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This will permanently delete your portal configuration and remove all associated clients. This action cannot be undone.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Portal"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Portal Setup Form */}
      <div className="mt-6 rounded-lg border border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Portal Configuration</h3>
          <p className="text-xs text-muted-foreground">
            Customize branding, content, and visibility settings for your client portal
          </p>
        </div>

        <div className="space-y-6 p-4">
          {/* Name and Slug */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Portal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Compliance Portal"
                className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex items-center rounded-md border border-border bg-background">
                <span className="shrink-0 border-r border-border px-3 py-1 text-xs text-muted-foreground">
                  /portal/
                </span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }));
                  }}
                  placeholder="acme-compliance"
                  className="flex h-9 w-full bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-medium text-foreground">Logo URL</label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="https://your-domain.com/logo.png"
              className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Enter a URL for your custom logo image (recommended: 200x50px, PNG or SVG)
            </p>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">Primary Color</label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  className="h-9 w-12 cursor-pointer rounded-md border border-border bg-background"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">Accent Color</label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, accentColor: e.target.value }))}
                  className="h-9 w-12 cursor-pointer rounded-md border border-border bg-background"
                />
                <input
                  type="text"
                  value={form.accentColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, accentColor: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Welcome Title and Message */}
          <div>
            <label className="block text-xs font-medium text-foreground">Welcome Title</label>
            <input
              type="text"
              value={form.welcomeTitle}
              onChange={(e) => setForm((prev) => ({ ...prev, welcomeTitle: e.target.value }))}
              placeholder="Welcome to Your Compliance Dashboard"
              className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">Welcome Message</label>
            <textarea
              value={form.welcomeMessage}
              onChange={(e) => setForm((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
              placeholder="A brief welcome message for your clients..."
              rows={3}
              className="mt-1 flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Footer and Contact */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">Footer Text</label>
              <input
                type="text"
                value={form.footerText}
                onChange={(e) => setForm((prev) => ({ ...prev, footerText: e.target.value }))}
                placeholder="Powered by EU AI Act Compliance Tool"
                className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">Contact Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="support@your-company.com"
                className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="mt-6 rounded-lg border border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Feature Visibility</h3>
          <p className="text-xs text-muted-foreground">
            Control which features are visible to your portal clients
          </p>
        </div>
        <div className="divide-y divide-border">
          {FEATURE_TOGGLES.map((feature) => (
            <div key={feature.key} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{feature.label}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form[feature.key]}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    [feature.key]: !prev[feature.key],
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  form[feature.key] ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                    form[feature.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
          {/* Public toggle */}
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Public Access</p>
              <p className="text-xs text-muted-foreground">
                Allow unauthenticated users to view the portal landing page
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isPublic}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  isPublic: !prev.isPublic,
                }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                form.isPublic ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                  form.isPublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Portal Header Preview */}
      <div className="mt-6 rounded-lg border border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Portal Header Preview</h3>
          <p className="text-xs text-muted-foreground">
            Preview how your portal header will appear to clients
          </p>
        </div>
        <div className="p-4">
          <div
            className="overflow-hidden rounded-lg border border-border"
            style={{
              backgroundColor: form.primaryColor,
            }}
          >
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Portal Logo"
                    className="h-8 w-auto rounded object-contain"
                    style={{ filter: "brightness(0) invert(1)" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold text-white"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  >
                    {form.name ? form.name.charAt(0).toUpperCase() : "P"}
                  </div>
                )}
                <span className="text-lg font-semibold text-white">
                  {form.name || "Portal Name"}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-white/80">{t("nav.dashboard")}</span>
                <span className="text-sm text-white/80">Documents</span>
                <span className="text-sm text-white/80">Reports</span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: form.accentColor }}
                >
                  Client Portal
                </span>
              </div>
            </div>
          </div>

          {/* Welcome section preview */}
          <div className="mt-3 rounded-lg border border-border bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground">
              {form.welcomeTitle || "Welcome to Your Compliance Dashboard"}
            </h4>
            {form.welcomeMessage && (
              <p className="mt-1 text-xs text-muted-foreground">{form.welcomeMessage}</p>
            )}
            {!form.welcomeMessage && (
              <p className="mt-1 text-xs text-muted-foreground italic">
                No welcome message configured
              </p>
            )}
            {form.contactEmail && (
              <p className="mt-2 text-xs text-muted-foreground">
                Contact:{" "}
                <span className="font-medium" style={{ color: form.primaryColor }}>
                  {form.contactEmail}
                </span>
              </p>
            )}
          </div>

          {/* Footer preview */}
          <div className="mt-3 rounded-lg border border-border bg-muted/10 px-4 py-2">
            <p className="text-xs text-muted-foreground">
              {form.footerText || "Powered by EU AI Act Compliance Tool"}
            </p>
          </div>
        </div>
      </div>

      {/* Client Management */}
      <div className="mt-6 rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">
              Portal Clients {clients.length > 0 && `(${clients.length})`}
            </h3>
            <p className="text-xs text-muted-foreground">
              Manage clients who have access to your portal
            </p>
          </div>
          <button
            onClick={() => setShowAddClient((s) => !s)}
            disabled={!portal}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            title={!portal ? "Save the portal configuration first" : undefined}
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {showAddClient ? "Cancel" : "Add Client"}
          </button>
        </div>

        {/* Add Client Form */}
        {showAddClient && (
          <form
            onSubmit={handleAddClient}
            className="border-b border-border bg-muted/10 p-4"
          >
            <h4 className="text-sm font-semibold">Add New Client</h4>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-foreground">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={(e) => {
                    setClientForm((prev) => ({ ...prev, name: e.target.value }));
                    if (clientError) setClientError(null);
                  }}
                  placeholder="Client name"
                  className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => {
                    setClientForm((prev) => ({ ...prev, email: e.target.value }));
                    if (clientError) setClientError(null);
                  }}
                  placeholder="client@company.com"
                  className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground">Company</label>
                <input
                  type="text"
                  value={clientForm.company}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Company name"
                  className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground">Industry</label>
                <input
                  type="text"
                  value={clientForm.industry}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g. Healthcare, Finance"
                  className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
            {clientError && (
              <p className="mt-3 text-xs text-destructive">{clientError}</p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isAddingClient}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isAddingClient ? "Adding..." : "Add Client"}
              </button>
            </div>
          </form>
        )}

        {/* Clients Table */}
        {!portal ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-medium">Save your portal first</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Create and save your portal configuration to start adding clients.
            </p>
          </div>
        ) : clientsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : clients.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-medium">No clients yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add clients to grant them access to your branded compliance portal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Industry</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Added</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{client.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{client.company ?? "\u2014"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{client.industry ?? "\u2014"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          STATUS_STYLES[client.status] ?? STATUS_STYLES.active
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(client.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveClient(client)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
