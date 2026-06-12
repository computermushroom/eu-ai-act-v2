// Specialized Compliance Checks Tool - Articles 12-15
// Client Component: dropdown to select AI system, 4 cards showing pass/fail status

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface AISystem {
  id: string;
  name: string;
}

interface ArticleResult {
  compliant: boolean;
  findings: string[];
  score: number;
}

interface CheckResults {
  art12: ArticleResult;
  art13: ArticleResult;
  art14: ArticleResult;
  art15: ArticleResult;
}

interface CheckResponse {
  success: boolean;
  systemId: string;
  systemName: string;
  results: CheckResults;
  overallScore: number;
  checkedAt: string;
}

const ARTICLES = [
  {
    key: "art12" as const,
    title: "Art. 12 - Record-Keeping",
    description:
      "Automatic recording of events (logs) over the lifetime of the AI system.",
  },
  {
    key: "art13" as const,
    title: "Art. 13 - Transparency",
    description:
      "Design the AI system so deployers can interpret output and use it appropriately.",
  },
  {
    key: "art14" as const,
    title: "Art. 14 - Human Oversight",
    description:
      "Design and develop the AI system so it can be effectively overseen by natural persons during use.",
  },
  {
    key: "art15" as const,
    title: "Art. 15 - Accuracy / Robustness",
    description:
      "Achieve appropriate levels of accuracy, robustness, and cybersecurity throughout the lifecycle.",
  },
];

export default function SpecializedChecksPage() {
  const t = useTranslations();

  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [results, setResults] = useState<CheckResults | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState("");

  // Fetch user's AI systems
  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-systems");
      if (res.ok) {
        const data = await res.json();
        setSystems(data.data ?? []);
      }
    } catch (error) {
      console.error("[SPECIALIZED-CHECKS] Failed to fetch systems:", error);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  // Auto-run check when system is selected
  const runCheck = useCallback(async (systemId: string) => {
    if (!systemId) return;
    setIsLoading(true);
    setResults(null);
    setOverallScore(null);
    setCheckedAt(null);
    setGenerateMessage("");

    try {
      const res = await fetch("/api/tools/specialized-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemId }),
      });

      if (res.ok) {
        const data: CheckResponse = await res.json();
        setResults(data.results);
        setOverallScore(data.overallScore);
        setCheckedAt(data.checkedAt);
      } else {
        const err = await res.json();
        console.error("[SPECIALIZED-CHECKS] Check failed:", err);
      }
    } catch (error) {
      console.error("[SPECIALIZED-CHECKS] Network error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSystemId) {
      runCheck(selectedSystemId);
    }
  }, [selectedSystemId, runCheck]);

  // Generate Fix Report
  const handleGenerateFixReport = async () => {
    if (!selectedSystemId || !results) return;
    setIsGenerating(true);
    setGenerateMessage("");

    try {
      const remediationSteps: string[] = [];

      if (!results.art12.compliant) {
        remediationSteps.push(
          "[Art.12] Create record-keeping documentation: establish automatic logging mechanisms, define log retention periods, and ensure logs cover the full AI system lifecycle."
        );
      }
      if (!results.art13.compliant) {
        remediationSteps.push(
          "[Art.13] Prepare transparency documentation: create technical documentation that enables deployers to interpret system output, verify risk classification labels are consistent."
        );
      }
      if (!results.art14.compliant) {
        remediationSteps.push(
          "[Art.14] Enable human oversight in the QMS checklist: design the system for effective natural-person oversight during use, define oversight roles and procedures."
        );
      }
      if (!results.art15.compliant) {
        remediationSteps.push(
          "[Art.15] Enable accuracy and robustness in the QMS checklist: implement accuracy metrics, robustness testing, and cybersecurity measures throughout the lifecycle."
        );
      }

      const content = remediationSteps.length
        ? remediationSteps.join("\n\n")
        : "All Articles 12-15 checks passed. No remediation steps required.";

      const title = `Art.12-15 Fix Report - ${new Date().toLocaleDateString()}`;

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId: selectedSystemId,
          title,
          type: "report",
          content,
        }),
      });

      if (res.ok) {
        setGenerateMessage("Fix report generated successfully.");
      } else if (res.status === 404) {
        setGenerateMessage("Fix report content prepared. (Document API not available yet)");
      } else {
        const err = await res.json();
        setGenerateMessage(err.error || "Failed to generate fix report.");
      }
    } catch (error) {
      console.error("[SPECIALIZED-CHECKS] Generate report failed:", error);
      setGenerateMessage("Failed to generate fix report.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Art. 12-15
          </span>
          <span className="text-xs text-muted-foreground">{t("tools.results")}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Specialized Compliance Checks</h1>
        <p className="text-muted-foreground">
          Automated checks for Articles 12-15: Record-Keeping, Transparency,
          Human Oversight, and Accuracy/Robustness.
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

      {/* Loading */}
      {isLoading && (
        <div className="mt-8 text-sm text-muted-foreground">
          Running compliance checks...
        </div>
      )}

      {/* Results */}
      {results && !isLoading && (
        <>
          {/* Overall Score */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Score</span>
                <span className="font-medium">
                  {overallScore}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full transition-all ${
                    (overallScore ?? 0) >= 80
                      ? "bg-accent"
                      : (overallScore ?? 0) >= 50
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${overallScore}%` }}
                />
              </div>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                (overallScore ?? 0) >= 80
                  ? "bg-accent/10 text-accent"
                  : (overallScore ?? 0) >= 50
                  ? "bg-orange-500/10 text-orange-600"
                  : "bg-red-500/10 text-red-600"
              }`}
            >
              {(overallScore ?? 0) >= 80
                ? "Pass"
                : (overallScore ?? 0) >= 50
                ? "Warning"
                : "Fail"}
            </span>
          </div>

          {checkedAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Checked at {new Date(checkedAt).toLocaleString()}
            </p>
          )}

          {/* Article Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {ARTICLES.map((article) => {
              const result = results[article.key];
              return (
                <div
                  key={article.key}
                  className={`rounded-lg border p-5 ${
                    result.compliant
                      ? "border-accent/30 bg-accent/5"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{article.title}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        result.compliant
                          ? "bg-accent/10 text-accent"
                          : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {result.compliant ? "Pass" : "Fail"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {article.description}
                  </p>
                  <div className="mt-3 text-xs">
                    <span className="font-medium">Score: {result.score}%</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {result.findings.map((finding, idx) => (
                      <li
                        key={idx}
                        className={`text-xs ${
                          finding.startsWith("No") || finding.includes("NOT")
                            ? "text-red-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Generate Fix Report */}
          <div className="mt-8">
            <button
              type="button"
              onClick={handleGenerateFixReport}
              disabled={isGenerating}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Fix Report"}
            </button>
            {generateMessage && (
              <p className="mt-2 text-xs text-muted-foreground">
                {generateMessage}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
