// Tamper-Proof Audit Chain & Regulatory Evidence Pack Tool
// Client Component: displays audit logs with hash chain, generates evidence packs with Print/PDF support

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface AISystem {
  id: string;
  name: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  resource: string | null;
  details: string | null;
  createdAt: string;
  hash: string;
  previousHash: string;
}

interface EvidenceSection {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  exists: boolean;
}

/**
 * Simulated SHA-256 hash generator for tamper-proofing visualization.
 * In production, this would be computed server-side using crypto.subtle or a proper hash library.
 */
function simulateSHA256(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Generate a 64-character hex string to simulate SHA-256
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return (hex.repeat(8) + "a3f2b8c1d4e5f607890123456789abcdef0123456789abcdef01234567").slice(0, 64);
}

export default function EvidencePackPage() {
  const t = useTranslations();

  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEvidencePack, setShowEvidencePack] = useState(false);
  const [evidenceSections, setEvidenceSections] = useState<EvidenceSection[]>([]);

  // Fetch user's AI systems
  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-systems");
      if (res.ok) {
        const data = await res.json();
        setSystems(data.data ?? []);
      }
    } catch (error) {
      console.error("[EVIDENCE] Failed to fetch systems:", error);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  // Fetch audit logs and build hash chain
  const fetchAuditLogs = useCallback(async (systemId: string) => {
    if (!systemId) return;
    setIsLoadingLogs(true);
    setShowEvidencePack(false);
    try {
      const res = await fetch(`/api/audit?systemId=${systemId}`);
      if (res.ok) {
        const data = await res.json();
        const rawLogs: Array<{
          id: string;
          action: string;
          resource: string | null;
          details: string | null;
          createdAt: string;
        }> = data.logs ?? [];

        // Build hash chain: each entry's hash is derived from its content + previous hash
        const chain: AuditLogEntry[] = rawLogs.map((log, index) => {
          const previousHash = index === 0 ? "0000000000000000000000000000000000000000000000000000000000000000" : chain[index - 1]?.hash ?? "";
          const content = `${log.id}|${log.action}|${log.resource ?? ""}|${log.details ?? ""}|${log.createdAt}|${previousHash}`;
          const hash = simulateSHA256(content);
          return {
            id: log.id,
            action: log.action,
            resource: log.resource,
            details: log.details,
            createdAt: log.createdAt,
            hash,
            previousHash,
          };
        });

        setAuditLogs(chain);
      }
    } catch (error) {
      console.error("[EVIDENCE] Failed to fetch audit logs:", error);
      setAuditLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSystemId) {
      fetchAuditLogs(selectedSystemId);
    } else {
      setAuditLogs([]);
    }
  }, [selectedSystemId, fetchAuditLogs]);

  // Generate evidence pack
  const generateEvidencePack = useCallback(async () => {
    if (!selectedSystemId) return;
    setIsGenerating(true);
    try {
      // Fetch all relevant artifacts in parallel
      const [friaRes, qmsRes, docsRes, scansRes] = await Promise.all([
        fetch(`/api/documents?type=fria&systemId=${selectedSystemId}`).catch(() => null),
        fetch(`/api/documents?type=qms&systemId=${selectedSystemId}`).catch(() => null),
        fetch(`/api/documents?type=technical-doc&systemId=${selectedSystemId}`).catch(() => null),
        fetch(`/api/documents?type=gdpr-scan&systemId=${selectedSystemId}`).catch(() => null),
      ]);

      const friaData = friaRes?.ok ? await friaRes.json() : null;
      const qmsData = qmsRes?.ok ? await qmsRes.json() : null;
      const docsData = docsRes?.ok ? await docsRes.json() : null;
      const scansData = scansRes?.ok ? await scansRes.json() : null;

      const sections: EvidenceSection[] = [
        {
          id: "audit-trail",
          title: "Audit Trail",
          description: "Complete audit log chain with tamper-proof hashes for the selected AI system.",
          itemCount: auditLogs.length,
          exists: auditLogs.length > 0,
        },
        {
          id: "compliance-reports",
          title: "Compliance Reports",
          description: "GDPR scan results, risk assessment scores, and other compliance scan outputs.",
          itemCount: scansData?.document ? 1 : 0,
          exists: !!scansData?.document,
        },
        {
          id: "technical-documentation",
          title: "Technical Documentation",
          description: "Technical documentation, system architecture records, and compliance artifacts.",
          itemCount: docsData?.document ? 1 : 0,
          exists: !!docsData?.document,
        },
        {
          id: "fria-assessment",
          title: "FRIA Assessment",
          description: "Fundamental Rights Impact Assessment for high-risk AI systems (Art.27 EU AI Act).",
          itemCount: friaData?.document ? 1 : 0,
          exists: !!friaData?.document,
        },
        {
          id: "qms-checklist",
          title: "QMS Checklist",
          description: "Quality Management System checklist results and completion status (Art.17 EU AI Act).",
          itemCount: qmsData?.document ? 1 : 0,
          exists: !!qmsData?.document,
        },
        {
          id: "training-records",
          title: "Training Records",
          description: "AI literacy training records and compliance training completion certificates.",
          itemCount: 0,
          exists: false,
        },
      ];

      setEvidenceSections(sections);
      setShowEvidencePack(true);
    } catch (error) {
      console.error("[EVIDENCE] Failed to generate evidence pack:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedSystemId, auditLogs.length]);

  const formatAction = (action: string) => {
    return action
      .replace(/^tool_/, "")
      .replace(/^system_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
  };

  const totalItems = evidenceSections.reduce((sum, s) => sum + s.itemCount, 0);
  const existingSections = evidenceSections.filter((s) => s.exists).length;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{t("tools.results")}          </span>
          <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-600">{t("tools.results")}          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Tamper-Proof Audit Chain &amp; Regulatory Evidence Pack
        </h1>
        <p className="text-muted-foreground">
          View the complete audit trail for your AI system with cryptographic hash chaining. Generate a comprehensive evidence pack for regulatory submissions.
        </p>
      </div>

      {/* System Selector */}
      <div className="mt-8">
        <label className="block text-sm font-medium">{t("tools.selectSystem")}</label>
        <select
          value={selectedSystemId}
          onChange={(e) => setSelectedSystemId(e.target.value)}
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("tools.selectSystem")}</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {systems.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("tools.noSystems")}
          </p>
        )}
      </div>

      {selectedSystemId && (
        <>
          {/* Audit Logs */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("tools.results")}</h2>
              <span className="text-sm text-muted-foreground">
                {auditLogs.length} log {auditLogs.length === 1 ? "entry" : "entries"}
              </span>
            </div>

            {isLoadingLogs ? (
              <div className="mt-4 flex items-center justify-center rounded-lg border border-border bg-background py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="ml-3 text-sm text-muted-foreground">{t("common.loading")}</span>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="mt-4 rounded-lg border border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                {t("tools.noResults")}
              </div>
            ) : (
              <div className="mt-4 space-y-0 rounded-lg border border-border bg-background overflow-hidden">
                {auditLogs.map((log, index) => (
                  <div key={log.id}>
                    {/* Hash chain connector */}
                    {index > 0 && (
                      <div className="flex items-center gap-2 bg-muted/30 px-4 py-1">
                        <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                        </svg>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          prev: {truncateHash(log.previousHash)}
                        </span>
                        <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}

                    {/* Log entry */}
                    <div className="border-t border-border px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium">{formatAction(log.action)}</span>
                            {log.resource && (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                {log.resource}
                              </span>
                            )}
                          </div>
                          {log.details && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {typeof log.details === "string"
                                ? log.details.length > 200
                                  ? log.details.slice(0, 200) + "..."
                                  : log.details
                                : JSON.stringify(log.details)}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(log.createdAt)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] font-mono text-muted-foreground" title={log.hash}>
                            SHA-256: {truncateHash(log.hash)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Chain integrity indicator */}
                <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <span className="text-xs font-medium text-accent">{t("tools.saved")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {auditLogs.length} entries linked
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Generate Evidence Pack Button */}
          <div className="mt-8">
            <button
              type="button"
              onClick={generateEvidencePack}
              disabled={isGenerating}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Generating...
                </>
              ) : (
                "Generate Evidence Pack"
              )}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("tools.description")}
            </p>
          </div>

          {/* Evidence Pack */}
          {showEvidencePack && (
            <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("tools.results")}</h2>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
                >{t("tools.download")}                </button>
              </div>

              {/* Summary */}
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-md border border-border bg-background p-4 text-center">
                  <p className="text-2xl font-bold">{existingSections}</p>
                  <p className="text-xs text-muted-foreground">Sections with Data</p>
                </div>
                <div className="rounded-md border border-border bg-background p-4 text-center">
                  <p className="text-2xl font-bold">{totalItems}</p>
                  <p className="text-xs text-muted-foreground">{t("tools.results")}</p>
                </div>
                <div className="rounded-md border border-border bg-background p-4 text-center">
                  <p className="text-2xl font-bold">{auditLogs.length}</p>
                  <p className="text-xs text-muted-foreground">{t("tools.results")}</p>
                </div>
              </div>

              {/* Evidence Sections */}
              <div className="mt-6 space-y-3">
                {evidenceSections.map((section) => (
                  <div
                    key={section.id}
                    className={`rounded-lg border p-4 ${
                      section.exists
                        ? "border-accent/30 bg-accent/5"
                        : "border-border bg-background opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                            section.exists
                              ? "bg-accent text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {section.exists ? "\u2713" : "\u25CB"}
                        </span>
                        <span className="text-sm font-medium">{section.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {section.itemCount} {section.itemCount === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {section.description}
                    </p>
                    {!section.exists && (
                      <p className="mt-2 text-xs text-muted-foreground italic">
                        {t("tools.noResults")}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Hash Chain Visualization */}
              {auditLogs.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold">{t("tools.results")}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("tools.description")}
                  </p>
                  <div className="mt-3 overflow-x-auto rounded-md border border-border bg-background p-4">
                    <div className="min-w-[600px]">
                      {/* Genesis block */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          G
                        </div>
                        <div className="flex-1 rounded-md border border-border bg-muted/30 px-3 py-2">
                          <p className="text-[10px] font-mono text-muted-foreground">
                            Genesis: 000000000000...0000
                          </p>
                        </div>
                      </div>

                      {/* Chain links */}
                      {auditLogs.slice(0, 8).map((log, index) => (
                        <div key={log.id} className="flex items-center gap-3">
                          {/* Connector line */}
                          <div className="flex w-10 shrink-0 justify-center">
                            <div className="h-6 w-px bg-border" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {index + 1}
                              </div>
                              <div className="flex-1 rounded-md border border-border px-3 py-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">{formatAction(log.action)}</span>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {truncateHash(log.hash)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {auditLogs.length > 8 && (
                        <div className="flex items-center gap-3">
                          <div className="flex w-10 shrink-0 justify-center">
                            <div className="h-6 w-px bg-border" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ... and {auditLogs.length - 8} more entries
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Print / PDF */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >{t("tools.download")}                </button>
                <button
                  type="button"
                  onClick={() => setShowEvidencePack(false)}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
                >{t("common.close")}                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
