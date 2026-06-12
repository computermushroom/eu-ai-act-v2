// Art.9 Lifecycle Management Tool UI
// Client Component: system dropdown, horizontal stepper timeline, checklist per phase

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface AISystem {
  id: string;
  name: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface PhaseData {
  phase: string;
  status: "completed" | "pending" | "na";
  checklist: ChecklistItem[];
  recommendations: string[];
}

interface LifecycleSystem {
  systemId: string;
  systemName: string;
  systemType: string;
  riskLevel: string | null;
  art9Compliant: boolean;
  overallPercent: number;
  phases: PhaseData[];
}

const PHASE_LABELS: Record<string, string> = {
  design: "Design",
  development: "Development",
  deployment: "Deployment",
  operation: "Operation",
  monitoring: "Monitoring",
  retirement: "Retirement",
};

const PHASE_ORDER = ["design", "development", "deployment", "operation", "monitoring", "retirement"];

export default function LifecyclePage() {
  const t = useTranslations();

  const [systems, setSystems] = useState<AISystem[]>([]);
  const [lifecycleData, setLifecycleData] = useState<LifecycleSystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch user's AI systems
  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-systems");
      if (res.ok) {
        const data = await res.json();
        setSystems(data.data ?? []);
      }
    } catch (err) {
      console.error("[LIFECYCLE] Failed to fetch systems:", err);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  // Fetch lifecycle data for all systems
  const fetchLifecycleData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/lifecycle");
      if (res.ok) {
        const data = await res.json();
        setLifecycleData(data.data ?? []);
      } else {
        const err = await res.json();
        setError(err.error ?? "Failed to load lifecycle data");
      }
    } catch (err) {
      console.error("[LIFECYCLE] Failed to fetch lifecycle:", err);
      setError(t("tools.errorSaving"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLifecycleData();
  }, [fetchLifecycleData]);

  const selectedSystem = lifecycleData.find((s) => s.systemId === selectedSystemId);

  const handleMarkComplete = async (phase: string) => {
    if (!selectedSystemId) return;
    setIsSaving(true);
    try {
      // Persist phase status to server
      const res = await fetch("/api/tools/lifecycle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemId: selectedSystemId, phase, status: "completed" }),
      });

      if (res.ok) {
        // Update local state
        setLifecycleData((prev) =>
          prev.map((sys) => {
            if (sys.systemId !== selectedSystemId) return sys;
            const updatedPhases = sys.phases.map((p) =>
              p.phase === phase ? { ...p, status: "completed" as const } : p
            );
            const completedCount = updatedPhases.filter((p) => p.status === "completed").length;
            const applicableCount = updatedPhases.filter((p) => p.status !== "na").length;
            const overallPercent = applicableCount > 0 ? Math.round((completedCount / applicableCount) * 100) : 0;
            return { ...sys, phases: updatedPhases, overallPercent };
          })
        );

        // Check if all phases complete for Art.9 compliance
        const updatedSystem = lifecycleData.find((s) => s.systemId === selectedSystemId);
        if (updatedSystem) {
          const newCompleted = updatedSystem.phases.filter(
            (p) => p.status === "completed" || p.phase === phase
          ).length;
          const newApplicable = updatedSystem.phases.filter((p) => p.status !== "na" || p.phase === phase).length;
          const newPercent = newApplicable > 0 ? Math.round((newCompleted / newApplicable) * 100) : 0;

          if (newPercent >= 100) {
            await fetch(`/api/ai-systems/${selectedSystemId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ art9Compliant: true }),
            });
          }
        }
      }
    } catch (err) {
      console.error("[LIFECYCLE] Mark complete failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Art. 9
          </span>
          <span className="text-xs text-muted-foreground">{t("tools.results")}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Lifecycle Risk Management</h1>
        <p className="text-muted-foreground">
          Track compliance across the 6 lifecycle phases of your AI system. Click Mark Complete as you finish each phase.
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

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      {selectedSystem && (
        <>
          {/* Overall Progress */}
          <div className="mt-8 rounded-lg border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedSystem.systemName}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedSystem.systemType} · Risk: {selectedSystem.riskLevel ?? "Unknown"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{selectedSystem.overallPercent}%</span>
                <p className="text-xs text-muted-foreground">{t("tools.saved")}</p>
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-muted">
              <div
                className={`h-2 rounded-full transition-all ${
                  selectedSystem.overallPercent === 100 ? "bg-accent" : "bg-primary"
                }`}
                style={{ width: `${selectedSystem.overallPercent}%` }}
              />
            </div>
          </div>

          {/* Timeline Stepper */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              {PHASE_ORDER.map((phase, idx) => {
                const phaseData = selectedSystem.phases.find((p) => p.phase === phase);
                const isCompleted = phaseData?.status === "completed";
                const isNa = phaseData?.status === "na";
                return (
                  <div key={phase} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          isCompleted
                            ? "bg-accent text-white"
                            : isNa
                            ? "bg-muted text-muted-foreground"
                            : "border-2 border-primary text-primary"
                        }`}
                      >
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {PHASE_LABELS[phase]}
                      </span>
                    </div>
                    {idx < PHASE_ORDER.length - 1 && (
                      <div
                        className={`mx-2 h-0.5 flex-1 ${
                          isCompleted ? "bg-accent" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase Details */}
          <div className="mt-8 space-y-6">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
            ) : (
              PHASE_ORDER.map((phase) => {
                const phaseData = selectedSystem.phases.find((p) => p.phase === phase);
                if (!phaseData) return null;

                const completedCount = phaseData.checklist.filter((c) => c.completed).length;

                return (
                  <div
                    key={phase}
                    id={`phase-${phase}`}
                    className="rounded-lg border border-border bg-background p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold">{PHASE_LABELS[phase]}</h2>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            phaseData.status === "completed"
                              ? "bg-accent/10 text-accent"
                              : phaseData.status === "na"
                              ? "bg-muted text-muted-foreground"
                              : "bg-orange-500/10 text-orange-600"
                          }`}
                        >
                          {phaseData.status === "completed"
                            ? "Completed"
                            : phaseData.status === "na"
                            ? "N/A"
                            : "Pending"}
                        </span>
                      </div>
                      {(phaseData.status === "pending" || phaseData.status === "na") && (
                        <button
                          type="button"
                          onClick={() => handleMarkComplete(phase)}
                          disabled={isSaving}
                          className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isSaving ? "Saving..." : "Mark Complete"}
                        </button>
                      )}
                    </div>

                    {/* Checklist */}
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {completedCount} / {phaseData.checklist.length} items checked
                      </p>
                      {phaseData.checklist.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold ${
                              item.completed
                                ? "bg-accent text-white"
                                : "border border-border text-muted-foreground"
                            }`}
                          >
                            {item.completed ? "✓" : ""}
                          </span>
                          <span className={item.completed ? "text-foreground" : "text-muted-foreground"}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    {phaseData.recommendations.length > 0 && (
                      <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
                        <p className="text-xs font-medium text-muted-foreground">{t("tools.results")}</p>
                        <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                          {phaseData.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
