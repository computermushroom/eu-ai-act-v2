// Shadow AI Scan Tool Page
// Client Component: Organization input, scan results display
// Detects unauthorized "shadow AI" tools in an organization

"use client";

import { useState, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Detected tool from scan result
 */
interface DetectedTool {
  name: string;
  category: string;
  confidence: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  indicators: string[];
  recommendation: string;
}

/**
 * Scan result from API
 */
interface ScanResult {
  organization: string;
  domain: string;
  scannedAt: string;
  riskScore: number;
  detectedTools: DetectedTool[];
  summary: string;
  remediationSteps: string[];
}

/**
 * Risk level badge styles
 */
const RISK_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-green-100 text-green-800 border-green-300",
};

const RISK_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

/**
 * Score color based on value
 */
function getScoreColor(score: number): string {
  if (score >= 75) return "text-red-600";
  if (score >= 50) return "text-orange-600";
  if (score >= 25) return "text-yellow-600";
  return "text-green-600";
}

function getScoreRingColor(score: number): string {
  if (score >= 75) return "stroke-red-500";
  if (score >= 50) return "stroke-orange-500";
  if (score >= 25) return "stroke-yellow-500";
  return "stroke-green-500";
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
 * Shadow AI Scan tool page
 */
export default function ShadowAIPage() {
  const t = useTranslations();

  const [organization, setOrganization] = useState("");
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setResult(null);

      if (!organization.trim()) {
        setError("Please enter an organization name.");
        return;
      }

      setIsScanning(true);

      try {
        const response = await fetch("/api/tools/shadow-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organization: organization.trim(),
            domain: domain.trim() || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || t("tools.errorSaving"));
          setIsScanning(false);
          return;
        }

        setResult(data.result);
      } catch {
        setError("Unable to connect to scan service. Please try again later.");
      } finally {
        setIsScanning(false);
      }
    },
    [organization, domain]
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
        <h1 className="text-2xl font-bold tracking-tight">Shadow AI Scan</h1>
        <p className="text-sm text-muted-foreground">
          Detect unauthorized AI tools (shadow AI) in your organization, assess EU AI Act compliance risk, and get remediation recommendations.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleScan} className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={organization}
            onChange={(e) => {
              setOrganization(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Organization name (e.g., Acme Corp)"
            className="flex h-10 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isScanning}
          />
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Domain (optional, e.g., acme.com)"
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
              "Start Scan"
            )}
          </button>
        </div>
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
                  strokeDasharray={`${(result.riskScore / 100) * 264} 264`}
                  className={getScoreRingColor(result.riskScore)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-2xl font-bold ${getScoreColor(result.riskScore)}`}
                >
                  {result.riskScore}
                </span>
                <span className="text-[10px] text-muted-foreground">Risk Score</span>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-lg font-semibold">
                {result.organization} Scan Results
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.summary}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Domain: {result.domain} · Scanned: {formatDate(result.scannedAt)}
              </p>
            </div>
          </div>

          {/* Detected Tools Table */}
          {result.detectedTools.length > 0 && (
            <div className="rounded-lg border border-border bg-background">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold">
                  Detected AI Tools ({result.detectedTools.length})
                </h3>
              </div>
              <div className="divide-y divide-border">
                {result.detectedTools.map((tool, index) => (
                  <div key={index} className="px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{tool.name}</p>
                          <span className="text-xs text-muted-foreground">
                            {tool.category}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${RISK_STYLES[tool.riskLevel]}`}
                          >
                            {RISK_LABELS[tool.riskLevel]} Risk
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Confidence:</span>{" "}
                          {tool.confidence}% ·{" "}
                          <span className="font-medium text-foreground">Indicators:</span>{" "}
                          {tool.indicators.join(", ")}
                        </p>
                        <div className="mt-2 rounded-md bg-muted/40 p-3">
                          <p className="text-xs font-medium text-foreground">
                            Recommendation
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {tool.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No tools detected */}
          {result.detectedTools.length === 0 && (
            <div className="rounded-lg border border-border bg-background p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-3 text-sm font-semibold">No common shadow AI tools detected</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                This is a positive sign, but regular scans are recommended for comprehensive coverage.
              </p>
            </div>
          )}

          {/* Remediation Steps */}
          <div className="rounded-lg border border-border bg-background">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Remediation Steps</h3>
            </div>
            <div className="divide-y divide-border">
              {result.remediationSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {index + 1}
                  </span>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-md border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              <strong>{t("tools.description")}:</strong> This scan uses heuristic simulation to assess organizational shadow AI risk. It does not perform actual network penetration or traffic monitoring. Results are for reference only and do not constitute legal advice. For a comprehensive compliance assessment, please consult a legal expert.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools/risk-assessment"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >{t("tools.results")}            </Link>
            <Link
              href="/dashboard/scan-tasks"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Set Up Auto Scan
            </Link>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !error && !isScanning && (
        <div className="mt-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
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
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium">Ready to Scan</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your organization name to detect unauthorized AI tool usage.
          </p>
          <div className="mx-auto mt-6 max-w-md space-y-2 text-left text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Supported detection targets:</p>
            <div className="grid grid-cols-2 gap-1">
              <span>ChatGPT / OpenAI</span>
              <span>Microsoft Copilot</span>
              <span>Google Gemini</span>
              <span>Claude (Anthropic)</span>
              <span>Midjourney / DALL-E</span>
              <span>GitHub Copilot</span>
              <span>Grammarly</span>
              <span>Notion AI</span>
              <span>Otter.ai</span>
              <span>Perplexity AI</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
