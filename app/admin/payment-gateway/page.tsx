// Admin Payment Gateway Settings Page
// Accessible only to users listed in ADMIN_EMAILS environment variable
// Provides runtime switching between Paddle (primary) and Creem (backup)
// No server restart required — changes take effect immediately via GlobalConfig table

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface GatewayConfig {
  activeGateway: string;
  availableGateways: string[];
  recentStats: Array<{ provider: string; count: number }>;
}

interface GatewayOption {
  value: string;
  label: string;
  description: string;
}

const GATEWAY_OPTIONS: GatewayOption[] = [
  {
    value: "paddle",
    label: "Paddle",
    description: "Main Primary Gateway",
  },
  {
    value: "creem",
    label: "Creem",
    description: "Backup Fallback Gateway",
  },
];

export default function AdminPaymentGatewayPage() {
  const router = useRouter();
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const [selectedGateway, setSelectedGateway] = useState("paddle");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/config/payment-gateway");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        setError("Admin access required. Your email is not in the ADMIN_EMAILS list.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to fetch config");
      }
      const data = await res.json();
      setConfig(data);
      setSelectedGateway(data.activeGateway);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/config/payment-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: selectedGateway }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update gateway");
      }

      const data = await res.json();
      setSuccess(data.message || `Payment gateway updated to ${selectedGateway}`);

      // Refresh config to show updated stats
      await fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Payment Gateway Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage the active payment gateway for new subscriptions.
          Changes take effect immediately — no server restart required.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Current Gateway Display */}
      <div className="mb-6 rounded-lg border p-6">
        <h2 className="text-sm font-medium text-muted-foreground">
          Current Active Gateway
        </h2>
        <p className="mt-1 text-2xl font-bold">
          {config?.activeGateway === "paddle" ? "Paddle" : "Creem"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {config?.activeGateway === "paddle"
            ? "All new checkouts will be processed through Paddle Billing"
            : "All new checkouts will be processed through Creem"}
        </p>
      </div>

      {/* Gateway Selector */}
      <div className="mb-6 rounded-lg border p-6">
        <h2 className="mb-4 text-sm font-medium">Switch Payment Gateway</h2>

        <div className="space-y-3">
          {GATEWAY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 transition-colors ${
                selectedGateway === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="gateway"
                value={option.value}
                checked={selectedGateway === option.value}
                onChange={(e) => setSelectedGateway(e.target.value)}
                className="h-4 w-4"
              />
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || selectedGateway === config?.activeGateway}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Recent Stats */}
      {config?.recentStats && config.recentStats.length > 0 && (
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-sm font-medium">
            Recent 7-Day Subscription Stats (by provider)
          </h2>
          <div className="space-y-2">
            {config.recentStats.map((stat) => (
              <div
                key={stat.provider}
                className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-2"
              >
                <span className="text-sm font-medium capitalize">
                  {stat.provider}
                </span>
                <span className="text-sm text-muted-foreground">
                  {stat.count} active subscriptions
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="mt-6 rounded-md bg-muted/50 p-4 text-xs text-muted-foreground">
        <p className="font-medium">Important Notes:</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Gateway changes only affect <strong>new subscriptions</strong>.
            Existing subscriptions remain on their original provider.
          </li>
          <li>
            Both webhook endpoints (/api/payment/webhook/paddle and
            /api/payment/webhook/creem) are always active, regardless of the
            active gateway setting.
          </li>
          <li>
            No automatic failover — all gateway changes must be performed
            manually by an admin.
          </li>
        </ul>
      </div>
    </div>
  );
}
