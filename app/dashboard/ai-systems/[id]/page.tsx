// AI System Detail Page
// Shows all compliance statuses, scan history, and links to tools
// Route: /dashboard/ai-systems/[id]

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Scan result from API
 */
interface ScanResult {
  id: string;
  scanType: string;
  score: number;
  status: string;
  findings: string | null;
  createdAt: string;
}

/**
 * Compliance document from API
 */
interface ComplianceDocument {
  id: string;
  title: string;
  type: string;
  status: string;
  version: number;
  createdAt: string;
}

/**
 * FRIA assessment from API
 */
interface FRIAAssessment {
  id: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * QMS checklist from API
 */
interface QMSChecklist {
  id: string;
  completionRate: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * AI System detail from API
 */
interface AISystemDetail {
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
  deployedAt: string | null;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  scanResults: ScanResult[];
  documents: ComplianceDocument[];
  fria: FRIAAssessment | null;
  qms: QMSChecklist | null;
  _count: {
    scanResults: number;
    documents: number;
  };
}

const ARTICLES = [
  { key: "art6Compliant" as const, label: "Art.6", name: "Risk Classification", description: "Classification of AI system risk level", href: "/tools/risk-assessment" },
  { key: "art9Compliant" as const, label: "Art.9", name: "Risk Management", description: "Risk management system requirements", href: "/tools/lifecycle" },
  { key: "art10Compliant" as const, label: "Art.10", name: "Data Governance", description: "Data quality and governance obligations", href: "/tools/data-governance" },
  { key: "art12Compliant" as const, label: "Art.12", name: "Record Keeping", description: "Automatic logging and record keeping", href: "/tools/specialized-checks" },
  { key: "art13Compliant" as const, label: "Art.13", name: "Transparency", description: "Transparency and provision of information", href: "/tools/transparency" },
  { key: "art14Compliant" as const, label: "Art.14", name: "Human Oversight", description: "Human oversight measures", href: "/tools/specialized-checks" },
  { key: "art15Compliant" as const, label: "Art.15", name: "Accuracy", description: "Accuracy, robustness and cybersecurity", href: "/tools/specialized-checks" },
  { key: "art17Compliant" as const, label: "Art.17", name: "QMS", description: "Quality management system", href: "/tools/qms" },
  { key: "art27Compliant" as const, label: "Art.27", name: "FRIA", description: "Fundamental rights impact assessment", href: "/tools/fria" },
];

const TOOL_LINKS = [
  { title: "Risk Assessment", href: "/tools/risk-assessment", article: "Art.6", description: "Classify your AI system risk level" },
  { title: "Prohibited Practices", href: "/tools/prohibited-practices", article: "Art.5", description: "Check against banned practices" },
  { title: "Transparency Check", href: "/tools/transparency", article: "Art.50", description: "Verify transparency obligations" },
  { title: "URL Compliance Scan", href: "/tools/url-scan", article: "General", description: "Scan for AI compliance indicators" },
  { title: "QMS Checklist", href: "/tools/qms", article: "Art.17", description: "Quality management checklist" },
  { title: "FRIA Assessment", href: "/tools/fria", article: "Art.27", description: "Fundamental rights impact" },
];

export default function AISystemDetailPage() {
  const t = useTranslations();

  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const systemId = params.id as string;

  const [system, setSystem] = useState<AISystemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystem = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/ai-systems/${systemId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("AI system not found");
        }
        throw new Error("Failed to fetch AI system");
      }
      const result = await response.json();
      setSystem(result.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [systemId]);

  useEffect(() => {
    if (status === "authenticated" && systemId) {
      fetchSystem();
    }
  }, [status, systemId, fetchSystem]);

  const getComplianceCount = (s: AISystemDetail) => {
    return ARTICLES.filter((a) => s[a.key] === true).length;
  };

  const getCompliancePercentage = (s: AISystemDetail) => {
    return Math.round((getComplianceCount(s) / ARTICLES.length) * 100);
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

  const getScanStatusColor = (scanStatus: string) => {
    switch (scanStatus) {
      case "pass":
        return "text-emerald-600";
      case "fail":
        return "text-red-600";
      case "warning":
        return "text-amber-600";
      default:
        return "text-muted-foreground";
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
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

  if (error || !system) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/dashboard/ai-systems" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to AI Systems
        </Link>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error || "System not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Link href="/dashboard/ai-systems" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to AI Systems
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{system.name}</h1>
          {system.description && (
            <p className="mt-1 text-sm text-muted-foreground">{system.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSystemTypeColor(system.systemType)}`}>
              {system.systemType}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(system.status)}`}>
              {system.status}
            </span>
            {system.industry && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {system.industry}
              </span>
            )}
            {system.riskLevel && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {t("tools.riskLevel")} {system.riskLevel}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/ai-systems`}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-background p-5">
          <p className="text-sm text-muted-foreground">{t("tools.results")}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{getCompliancePercentage(system)}%</span>
            <span className="text-xs text-muted-foreground">{getComplianceCount(system)}/{ARTICLES.length} articles</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-accent transition-all"
              style={{ width: `${getCompliancePercentage(system)}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-5">
          <p className="text-sm text-muted-foreground">Scans</p>
          <p className="mt-2 text-3xl font-bold">{system._count.scanResults}</p>
          <p className="mt-1 text-xs text-muted-foreground">Total compliance scans</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-5">
          <p className="text-sm text-muted-foreground">Documents</p>
          <p className="mt-2 text-3xl font-bold">{system._count.documents}</p>
          <p className="mt-1 text-xs text-muted-foreground">Compliance documents</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-5">
          <p className="text-sm text-muted-foreground">Last Updated</p>
          <p className="mt-2 text-lg font-semibold">{formatDate(system.updatedAt)}</p>
          {system.nextReviewAt && (
            <p className="mt-1 text-xs text-muted-foreground">Next review: {formatDate(system.nextReviewAt)}</p>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left column: Compliance & Tools */}
        <div className="lg:col-span-2 space-y-8">
          {/* Compliance Articles */}
          <div className="rounded-lg border border-border bg-background">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">EU AI Act Compliance</h2>
              <p className="text-xs text-muted-foreground">Track compliance status for each article</p>
            </div>
            <div className="divide-y divide-border">
              {ARTICLES.map((article) => {
                const isCompliant = system[article.key];
                return (
                  <div key={article.key} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          isCompliant ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompliant ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{article.label}</span>
                          <span className="text-sm text-foreground">{article.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{article.description}</p>
                      </div>
                    </div>
                    <Link
                      href={article.href}
                      className="ml-4 inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      Open Tool
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scan History */}
          <div className="rounded-lg border border-border bg-background">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Scan History</h2>
              <p className="text-xs text-muted-foreground">Recent compliance scans for this system</p>
            </div>
            {system.scanResults.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground">No scans yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Run a compliance scan to see results here</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {system.scanResults.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getScanStatusColor(scan.status)} bg-muted`}>
                        {scan.status === "pass" ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : scan.status === "fail" ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{scan.scanType.replace(/-/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(scan.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold">{scan.score}/100</p>
                        <p className={`text-xs capitalize ${getScanStatusColor(scan.status)}`}>{scan.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="rounded-lg border border-border bg-background">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">{t("tools.results")}</h2>
              <p className="text-xs text-muted-foreground">Documents linked to this system</p>
            </div>
            {system.documents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground">No documents yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Create compliance documents for this system</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {system.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{doc.type} · v{doc.version} · {doc.status}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Tools & Info */}
        <div className="space-y-8">
          {/* System Info */}
          <div className="rounded-lg border border-border bg-background p-5">
            <h2 className="text-sm font-semibold">System Information</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(system.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDate(system.updatedAt)}</span>
              </div>
              {system.deployedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deployed</span>
                  <span>{formatDate(system.deployedAt)}</span>
                </div>
              )}
              {system.lastReviewedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Review</span>
                  <span>{formatDate(system.lastReviewedAt)}</span>
                </div>
              )}
              {system.nextReviewAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Review</span>
                  <span>{formatDate(system.nextReviewAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* FRIA */}
          {system.fria && (
            <div className="rounded-lg border border-border bg-background p-5">
              <h2 className="text-sm font-semibold">FRIA Assessment</h2>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                    {system.fria.status}
                  </span>
                </div>
                {system.fria.overallScore !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <span className="text-sm font-medium">{system.fria.overallScore}/100</span>
                  </div>
                )}
              </div>
              <Link
                href="/tools/fria"
                className="mt-4 block w-full rounded-md border border-border px-3 py-2 text-center text-xs font-medium transition-colors hover:bg-muted"
              >
                View FRIA
              </Link>
            </div>
          )}

          {/* QMS */}
          {system.qms && (
            <div className="rounded-lg border border-border bg-background p-5">
              <h2 className="text-sm font-semibold">QMS Checklist</h2>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Completion</span>
                  <span className="text-sm font-medium">{system.qms.completionRate}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-accent transition-all"
                    style={{ width: `${system.qms.completionRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                    {system.qms.status}
                  </span>
                </div>
              </div>
              <Link
                href="/tools/qms"
                className="mt-4 block w-full rounded-md border border-border px-3 py-2 text-center text-xs font-medium transition-colors hover:bg-muted"
              >
                View QMS
              </Link>
            </div>
          )}

          {/* Quick Tools */}
          <div className="rounded-lg border border-border bg-background p-5">
            <h2 className="text-sm font-semibold">Compliance Tools</h2>
            <p className="text-xs text-muted-foreground">Quick access to assessment tools</p>
            <div className="mt-4 space-y-2">
              {TOOL_LINKS.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                >
                  <div>
                    <p className="font-medium">{tool.title}</p>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
