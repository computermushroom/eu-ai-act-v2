// URL Compliance Scan Tool Page
// Client Component: URL input, scan results display
// Analyzes any URL for EU AI Act compliance indicators

"use client";

import { useState, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Compliance check from scan result
 */
interface ComplianceCheck {
  category: string;
  indicator: string;
  status: "pass" | "fail" | "warning" | "info";
  description: string;
  evidence?: string;
}

/**
 * Scan result from API
 */
interface ScanResult {
  url: string;
  scannedAt: string;
  overallScore: number;
  checks: ComplianceCheck[];
  summary: string;
}

/**
 * Status badge colors
 */
const STATUS_STYLES: Record<string, string> = {
  pass: "bg-green-100 text-green-800 border-green-200",
  fail: "bg-red-100 text-red-800 border-red-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
};

const STATUS_LABELS: Record<string, string> = {
  pass: "Pass",
  fail: "Fail",
  warning: "Warning",
  info: "Info",
};

/**
 * Score color based on value
 */
function getScoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

function getScoreRingColor(score: number): string {
  if (score >= 75) return "stroke-green-500";
  if (score >= 50) return "stroke-yellow-500";
  return "stroke-red-500";
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * URL Scan tool page
 */
export default function UrlScanPage() {
  const t = useTranslations();

  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setResult(null);

      if (!url.trim()) {
        setError(t("tools.searchPlaceholder"));
        return;
      }

      try {
        new URL(url);
      } catch {
        setError(t("tools.searchPlaceholder"));
        return;
      }

      setIsScanning(true);

      try {
        const response = await fetch("/api/tools/url-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || t("tools.errorSaving"));
          setIsScanning(false);
          return;
        }

        setResult(data.result);
      } catch {
        setError(t("tools.errorSaving"));
      } finally {
        setIsScanning(false);
      }
    },
    [url]
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:underline"
          >{t("nav.dashboard")}          </Link>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">{t("nav.tools")}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">URL Compliance Scan</h1>
        <p className="text-sm text-muted-foreground">
          Scan any website URL for EU AI Act compliance indicators including AI
          technology usage, transparency disclosures, GDPR compliance, and
          high-risk practice detection.
        </p>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleScan} className="mt-6 flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          placeholder="https://example.com"
          className="flex h-10 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isScanning}
        />
        <button
          type="submit"
          disabled={isScanning}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isScanning ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Scanning...
            </span>
          ) : (
            "Scan URL"
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Score Overview */}
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-background p-6 sm:flex-row">
            {/* Score Ring */}
            <div className="relative h-24 w-24 flex-shrink-0">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/30"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(result.overallScore / 100) * 264} 264`}
                  className={getScoreRingColor(result.overallScore)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={`text-2xl font-bold ${getScoreColor(result.overallScore)}`}
                >
                  {result.overallScore}
                </span>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-lg font-semibold">{t("tools.results")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.summary}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Scanned: {result.url} at {formatDate(result.scannedAt)}
              </p>
            </div>
          </div>

          {/* Checks Table */}
          <div className="rounded-lg border border-border bg-background">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">{t("tools.results")}</h3>
            </div>
            <div className="divide-y divide-border">
              {result.checks.map((check, index) => (
                <div key={index} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {check.category}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium">
                        {check.indicator}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {check.description}
                      </p>
                      {check.evidence && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Evidence: {check.evidence}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[check.status]
                      }`}
                    >
                      {STATUS_LABELS[check.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-md border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              <strong>{t("tools.description")}:</strong> This scan checks for publicly visible
              compliance indicators on the target page. It does not constitute
              legal advice and should not be used as the sole basis for
              compliance decisions. For comprehensive compliance assessment, use
              our dedicated tools and consult with legal experts.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools/risk-assessment"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >{t("tools.results")}            </Link>
            <Link
              href="/tools/prohibited-practices"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >{t("tools.results")}            </Link>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !error && !isScanning && (
        <div className="mt-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted/50" />
          <h3 className="mt-4 text-lg font-medium">{t("tools.results")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("tools.searchPlaceholder")}
          </p>
        </div>
      )}
    </div>
  );
}
