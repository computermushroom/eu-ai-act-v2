// Dashboard Settings Page
// Client Component: profile editing, subscription management, data export/deletion (GDPR)
// Fetches real user data from /api/profile

"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Profile form state
 */
interface ProfileForm {
  name: string;
  email: string;
}

/**
 * User profile from API
 */
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  subscription: {
    status: string;
    tier: string;
    currentPeriodEnd: string | null;
  } | null;
}

/**
 * Settings page with profile, subscription, and GDPR data management
 */
export default function SettingsPage() {
  const t = useTranslations();
  void t;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [form, setForm] = useState<ProfileForm>({ name: "", email: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data.user);
          setForm({
            name: data.user.name ?? "",
            email: data.user.email ?? "",
          });
        }
      } catch (error) {
        console.error("[SETTINGS] Failed to fetch profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    fetchProfile();
  }, []);

  const handleProfileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      if (saveMessage) setSaveMessage(null);
    },
    [saveMessage]
  );

  const handleSaveProfile = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      setSaveMessage(null);

      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name }),
        });

        if (!response.ok) {
          const data = await response.json();
          setSaveMessage(data.error || "Failed to update profile.");
          setIsSaving(false);
          return;
        }

        setSaveMessage("Profile updated successfully.");
      } catch {
        setSaveMessage("Failed to update profile. Please try again.");
      } finally {
        setIsSaving(false);
      }
    },
    [form]
  );

  const handleExportData = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/profile/export");
      if (!response.ok) {
        alert("Failed to export data. Please try again.");
        setIsExporting(false);
        return;
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gdpr-export-${profile?.id ?? "user"}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [profile?.id]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== "DELETE") {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/profile/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to delete account.");
        setIsDeleting(false);
        return;
      }

      // Account deleted - redirect to home
      window.location.href = "/?deleted=true";
    } catch {
      alert("Failed to delete account. Please contact support.");
      setIsDeleting(false);
    }
  }, [deleteConfirmText]);

  const tierLabel: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    professional: "Professional",
    business: "Business",
    enterprise: "Enterprise",
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account, subscription, and data preferences
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {/* Profile Section */}
        <section className="rounded-lg border border-border bg-background p-6">
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Update your personal information
          </p>

          {isLoadingProfile ? (
            <div className="mt-4 space-y-4">
              <div className="h-10 animate-pulse rounded-md bg-muted" />
              <div className="h-10 animate-pulse rounded-md bg-muted" />
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleProfileChange}
                  placeholder="Your name"
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  disabled
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {saveMessage && (
                <p
                  className={`text-sm ${
                    saveMessage.includes("success")
                      ? "text-green-600"
                      : "text-destructive"
                  }`}
                >
                  {saveMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}
        </section>

        {/* Subscription Section */}
        <section className="rounded-lg border border-border bg-background p-6">
          <h2 className="text-lg font-semibold">Subscription</h2>
          <p className="text-sm text-muted-foreground">
            Manage your plan and billing
          </p>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border p-4">
              <div>
                <p className="text-sm font-medium">Current Plan</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.subscription
                    ? tierLabel[profile.subscription.tier] ??
                      profile.subscription.tier
                    : "Free"}
                  {profile?.subscription?.currentPeriodEnd && (
                    <span className="ml-1">
                      (Renews{" "}
                      {new Date(
                        profile.subscription.currentPeriodEnd
                      ).toLocaleDateString()}
                      )
                    </span>
                  )}
                </p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Upgrade
              </Link>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-4">
              <div>
                <p className="text-sm font-medium">Billing History</p>
                <p className="text-sm text-muted-foreground">
                  View past invoices and receipts
                </p>
              </div>
              <Link
                href="/dashboard/audit"
                className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                View Invoices
              </Link>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-4">
              <div>
                <p className="text-sm font-medium">Payment Method</p>
                <p className="text-sm text-muted-foreground">
                  Manage your payment details via Lemon Squeezy
                </p>
              </div>
              <button
                type="button"
                disabled
                className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-sm font-medium opacity-50"
                title="Payment management is handled via Lemon Squeezy billing portal"
              >
                Update
              </button>
            </div>
          </div>
        </section>

        {/* GDPR Data Management Section */}
        <section className="rounded-lg border border-border bg-background p-6">
          <h2 className="text-lg font-semibold">Data & Privacy</h2>
          <p className="text-sm text-muted-foreground">
            Manage your personal data under GDPR/CCPA
          </p>

          <div className="mt-4 space-y-4">
            {/* Data Export - GDPR Art.20 */}
            <div className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Export My Data</p>
                <p className="text-sm text-muted-foreground">
                  Download a copy of all your personal data (GDPR Art.20)
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                {isExporting ? "Exporting..." : "Request Export"}
              </button>
            </div>

            {/* Cookie Preferences */}
            <div className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Cookie Preferences</p>
                <p className="text-sm text-muted-foreground">
                  Manage your cookie consent settings
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("cookie-consent");
                  window.location.reload();
                }}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                Reset Consent
              </button>
            </div>

            {/* Account Deletion - GDPR Art.17 */}
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Delete Account
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data (GDPR Art.17)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-destructive/50 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  Delete Account
                </button>
              </div>

              {/* Deletion confirmation dialog */}
              {showDeleteConfirm && (
                <div className="mt-4 space-y-3 border-t border-destructive/20 pt-4">
                  <p className="text-sm text-destructive">
                    Warning: This action cannot be undone. All your data,
                    assessments, and reports will be permanently deleted.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Type DELETE to confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="flex h-10 w-full rounded-md border border-destructive/30 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== "DELETE" || isDeleting}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Permanently Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText("");
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
