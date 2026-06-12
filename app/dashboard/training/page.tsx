// Training Dashboard - Enterprise tier
// Client Component: shows available training modules as cards with progress bars

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface TrainingModule {
  id: string;
  title: string;
  description: string | null;
  articleRef: string | null;
  difficulty: string;
  duration: number;
  order: number;
  progress: {
    status: string;
    score: number | null;
    completedAt: string | null;
  } | null;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-600",
  intermediate: "bg-blue-500/10 text-blue-600",
  advanced: "bg-purple-500/10 text-purple-600",
};

export default function TrainingDashboardPage() {
  const t = useTranslations();

  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch("/api/training");
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules ?? []);
      }
    } catch (error) {
      console.error("[TRAINING DASHBOARD] Failed to fetch modules:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleStartOrComplete = async (moduleId: string) => {
    setCompletingId(moduleId);
    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });

      if (res.ok) {
        // Refresh modules to show updated progress
        await fetchModules();
      } else {
        const err = await res.json();
        console.error("[TRAINING DASHBOARD] Failed to complete module:", err);
      }
    } catch (error) {
      console.error("[TRAINING DASHBOARD] Network error:", error);
    } finally {
      setCompletingId(null);
    }
  };

  const completedCount = modules.filter(
    (m) => m.progress?.status === "completed"
  ).length;
  const totalCount = modules.length;
  const overallProgress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-600">{t("tools.results")}          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Compliance Training
        </h1>
        <p className="text-muted-foreground">
          Complete training modules to build EU AI Act expertise across your
          team.
        </p>
      </div>

      {/* Overall Progress */}
      <div className="mt-8 rounded-lg border border-border bg-background p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Overall Progress: {completedCount} / {totalCount} modules
          </span>
          <span className="text-muted-foreground">{overallProgress}%</span>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Modules Grid */}
      {isLoading ? (
        <div className="mt-8 text-sm text-muted-foreground">
          Loading training modules...
        </div>
      ) : modules.length === 0 ? (
        <div className="mt-8 text-sm text-muted-foreground">
          No training modules available.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const isCompleted = mod.progress?.status === "completed";
            const isCompleting = completingId === mod.id;

            return (
              <div
                key={mod.id}
                className={`flex flex-col rounded-lg border p-5 ${
                  isCompleted
                    ? "border-accent/30 bg-accent/5"
                    : "border-border bg-background"
                }`}
              >
                {/* Top row: article ref + difficulty */}
                <div className="flex items-center justify-between">
                  {mod.articleRef && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                      {mod.articleRef}
                    </span>
                  )}
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      DIFFICULTY_STYLES[mod.difficulty] ??
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    {mod.difficulty}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-3 text-sm font-semibold">{mod.title}</h3>

                {/* Description */}
                {mod.description && (
                  <p className="mt-1 flex-1 text-xs text-muted-foreground">
                    {mod.description}
                  </p>
                )}

                {/* Duration */}
                <p className="mt-3 text-xs text-muted-foreground">
                  Duration: {mod.duration} min
                </p>

                {/* Progress bar for in-progress or completed */}
                {isCompleted && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-accent"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Completed{" "}
                      {mod.progress?.completedAt
                        ? new Date(
                            mod.progress.completedAt
                          ).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                )}

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => handleStartOrComplete(mod.id)}
                  disabled={isCompleted || isCompleting}
                  className={`mt-4 inline-flex h-9 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors disabled:opacity-50 ${
                    isCompleted
                      ? "border border-border bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isCompleting
                    ? "Processing..."
                    : isCompleted
                    ? "Completed"
                    : "Start Training"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
