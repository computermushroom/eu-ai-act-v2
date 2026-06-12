// ONE-CLICK COMPLIANCE GENERATOR - Flagship Page
// Client Component: select AI system, generate all compliance documents with one click
// Available to all tiers, shows tier-appropriate items

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import type { SubscriptionTier, AIRiskLevel } from "@/types";
import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AISystemOption {
  id: string;
  name: string;
  systemType?: string | null;
  riskLevel?: AIRiskLevel | null;
  status?: string | null;
  description?: string | null;
}

interface GenerationItem {
  id: string;
  title: string;
  articleRef: string;
  description: string;
  status: "generated" | "pending";
  tier?: SubscriptionTier;
  category: GenerationCategory;
  href: string;
}

type GenerationCategory =
  | "risk-classification"
  | "technical-compliance"
  | "fundamental-rights"
  | "quality-operations"
  | "advanced-enterprise";

interface CategoryGroup {
  key: GenerationCategory;
  label: string;
  description: string;
}

interface GenerationResult {
  id: string;
  title: string;
  articleRef: string;
  href: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: CategoryGroup[] = [
  {
    key: "risk-classification",
    label: "Risk & Classification",
    description: "Core risk assessment and classification under the EU AI Act",
  },
  {
    key: "technical-compliance",
    label: "Technical Compliance",
    description: "Technical documentation, data governance, and lifecycle management",
  },
  {
    key: "fundamental-rights",
    label: "Fundamental Rights",
    description: "Fundamental rights impact assessment and deployer obligations",
  },
  {
    key: "quality-operations",
    label: "Quality & Operations",
    description: "Quality management systems, regulatory compliance, and evidence packs",
  },
  {
    key: "advanced-enterprise",
    label: "Advanced (Enterprise)",
    description: "GPAI compliance, GDPR scanning, regulation tracking, and AI assistant",
  },
];

const CATEGORY_ORDER: GenerationCategory[] = [
  "risk-classification",
  "technical-compliance",
  "fundamental-rights",
  "quality-operations",
  "advanced-enterprise",
];

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  business: "Business",
  enterprise: "Enterprise",
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-500/10 text-blue-600",
  professional: "bg-purple-500/10 text-purple-600",
  business: "bg-orange-500/10 text-orange-600",
  enterprise: "bg-amber-500/10 text-amber-600",
};

const RISK_LEVEL_COLORS: Record<string, string> = {
  unacceptable: "bg-destructive/10 text-destructive",
  high: "bg-orange-500/10 text-orange-600",
  limited: "bg-yellow-500/10 text-yellow-600",
  minimal: "bg-accent/10 text-accent",
  unknown: "bg-muted text-muted-foreground",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRiskLevel(level: string | null | undefined): string {
  if (!level || level === "unknown") return "Not classified";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatStatus(status: string | null | undefined): string {
  if (!status) return "Draft";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ComplianceGeneratorPage() {
  const t = useTranslations();

  // --- State ---
  const [systems, setSystems] = useState<AISystemOption[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [selectedSystem, setSelectedSystem] = useState<AISystemOption | null>(null);
  const [items, setItems] = useState<GenerationItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isLoadingSystems, setIsLoadingSystems] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
    currentItem: "",
  });
  const [generationResults, setGenerationResults] = useState<GenerationResult[] | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // --- Fetch AI Systems ---
  const fetchSystems = useCallback(async () => {
    setIsLoadingSystems(true);
    try {
      const res = await fetch("/api/ai-systems");
      if (res.ok) {
        const data = await res.json();
        const list: AISystemOption[] = (data.data ?? []).map(
          (s: { id: string; name: string; systemType?: string | null; riskLevel?: string | null; status?: string | null; description?: string | null }) => ({
            id: s.id,
            name: s.name,
            systemType: s.systemType,
            riskLevel: s.riskLevel as AIRiskLevel | null,
            status: s.status,
            description: s.description,
          })
        );
        setSystems(list);
      }
    } catch (error) {
      console.error("[COMPLIANCE-GEN] Failed to fetch systems:", error);
    } finally {
      setIsLoadingSystems(false);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  // --- Fetch Generation Items when system selected ---
  const fetchItems = useCallback(async (systemId: string) => {
    if (!systemId) return;
    setIsLoadingItems(true);
    setGenerationResults(null);
    setGenerationError(null);
    try {
      const res = await fetch(`/api/compliance-generator?systemId=${systemId}`);
      if (res.ok) {
        const data = await res.json();
        const fetchedItems: GenerationItem[] = data.items ?? [];
        setItems(fetchedItems);
        // Pre-check pending items, leave generated ones unchecked
        const initialChecked: Record<string, boolean> = {};
        fetchedItems.forEach((item: GenerationItem) => {
          initialChecked[item.id] = item.status === "pending";
        });
        setCheckedItems(initialChecked);
      }
    } catch (error) {
      console.error("[COMPLIANCE-GEN] Failed to fetch items:", error);
      setItems([]);
      setCheckedItems({});
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  const handleSystemSelect = useCallback(
    (systemId: string) => {
      setSelectedSystemId(systemId);
      setGenerationResults(null);
      setGenerationError(null);
      if (systemId) {
        const sys = systems.find((s) => s.id === systemId) ?? null;
        setSelectedSystem(sys);
        fetchItems(systemId);
      } else {
        setSelectedSystem(null);
        setItems([]);
        setCheckedItems({});
      }
    },
    [systems, fetchItems]
  );

  // --- Toggle individual item ---
  const toggleItem = useCallback((itemId: string) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);

  // --- Toggle all items in a category ---
  const toggleCategory = useCallback(
    (categoryKey: GenerationCategory) => {
      const categoryItems = items.filter((i) => i.category === categoryKey);
      const allChecked = categoryItems.every((i) => checkedItems[i.id]);
      setCheckedItems((prev) => {
        const next = { ...prev };
        categoryItems.forEach((i) => {
          next[i.id] = !allChecked;
        });
        return next;
      });
    },
    [items, checkedItems]
  );

  // --- Computed values ---
  const checkedCount = useMemo(
    () => Object.values(checkedItems).filter(Boolean).length,
    [checkedItems]
  );
  const pendingCount = useMemo(
    () => items.filter((i) => i.status === "pending").length,
    [items]
  );
  const generatedCount = useMemo(
    () => items.filter((i) => i.status === "generated").length,
    [items]
  );

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<GenerationCategory, GenerationItem[]> = {
      "risk-classification": [],
      "technical-compliance": [],
      "fundamental-rights": [],
      "quality-operations": [],
      "advanced-enterprise": [],
    };
    items.forEach((item) => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    });
    return groups;
  }, [items]);

  // --- Generate Selected ---
  const handleGenerateSelected = useCallback(async () => {
    if (!selectedSystemId || checkedCount === 0) return;
    const selectedIds = Object.entries(checkedItems)
      .filter(([, checked]) => checked)
      .map(([id]) => id);

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: selectedIds.length, currentItem: "" });
    setGenerationResults(null);
    setGenerationError(null);

    try {
      const res = await fetch("/api/compliance-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemId: selectedSystemId, items: selectedIds }),
      });

      if (!res.ok) {
        throw new Error("Generation failed. Please try again.");
      }

      // Simulate progress animation while waiting for response
      const data = await res.json();
      const results: GenerationResult[] = (data.results ?? []).map(
        (r: { id: string; title: string; articleRef: string; href: string }) => r
      );

      setGenerationResults(results);
      // Refresh items to update statuses
      fetchItems(selectedSystemId);
    } catch (error) {
      console.error("[COMPLIANCE-GEN] Generation failed:", error);
      setGenerationError(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
    } finally {
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0, currentItem: "" });
    }
  }, [selectedSystemId, checkedCount, checkedItems, fetchItems]);

  // --- Generate All ---
  const handleGenerateAll = useCallback(async () => {
    if (!selectedSystemId) return;

    // Check all items first
    const allChecked: Record<string, boolean> = {};
    items.forEach((item) => {
      allChecked[item.id] = true;
    });
    setCheckedItems(allChecked);

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: items.length, currentItem: "" });
    setGenerationResults(null);
    setGenerationError(null);

    try {
      const res = await fetch("/api/compliance-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemId: selectedSystemId }),
      });

      if (!res.ok) {
        throw new Error("Generation failed. Please try again.");
      }

      const data = await res.json();
      const results: GenerationResult[] = (data.results ?? []).map(
        (r: { id: string; title: string; articleRef: string; href: string }) => r
      );

      setGenerationResults(results);
      fetchItems(selectedSystemId);
    } catch (error) {
      console.error("[COMPLIANCE-GEN] Generation failed:", error);
      setGenerationError(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
    } finally {
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0, currentItem: "" });
    }
  }, [selectedSystemId, items, fetchItems]);

  // --- Progress animation during generation ---
  useEffect(() => {
    if (!isGenerating || generationProgress.total === 0) return;

    const itemTitles = items
      .filter((i) => checkedItems[i.id])
      .map((i) => i.title);

    let current = generationProgress.current;
    const interval = setInterval(() => {
      current += 1;
      if (current <= generationProgress.total) {
        setGenerationProgress((prev) => ({
          ...prev,
          current,
          currentItem: itemTitles[current - 1] ?? t("tools.generating"),
        }));
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating, generationProgress.total]);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Compliance Generator</h1>
        <p className="text-muted-foreground">
          Generate all required compliance documents and assessments for your AI
          system in one click
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Step 1: System Selection                                          */}
      {/* ----------------------------------------------------------------- */}
      <div className="mt-10">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            1
          </span>
          <h2 className="text-lg font-semibold">{t("tools.selectSystem")}</h2>
        </div>

        <div className="mt-4">
          <label htmlFor="system-select" className="block text-sm font-medium">
            {t("tools.selectSystem")}
          </label>
          <select
            id="system-select"
            value={selectedSystemId}
            onChange={(e) => handleSystemSelect(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">{t("tools.selectSystem")}</option>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {isLoadingSystems && (
            <p className="mt-2 text-xs text-muted-foreground">
              Loading AI systems...
            </p>
          )}
          {!isLoadingSystems && systems.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("tools.noSystems")}.{" "}
              <Link href="/dashboard" className="text-primary hover:underline">
                {t("tools.startNewAssessment")}
              </Link>{" "}
              first.
            </p>
          )}
        </div>

        {/* System Info Card */}
        {selectedSystem && (
          <div className="mt-4 rounded-lg border border-border bg-gradient-to-r from-primary/5 to-transparent p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-sm font-semibold">{selectedSystem.name}</p>
                {selectedSystem.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedSystem.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedSystem.systemType && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {selectedSystem.systemType}
                  </span>
                )}
                {selectedSystem.riskLevel && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      RISK_LEVEL_COLORS[selectedSystem.riskLevel] ?? RISK_LEVEL_COLORS.unknown
                    }`}
                  >
                    {formatRiskLevel(selectedSystem.riskLevel)}
                  </span>
                )}
                {selectedSystem.status && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {formatStatus(selectedSystem.status)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Empty State (before system selection)                             */}
      {/* ----------------------------------------------------------------- */}
      {!selectedSystemId && !isLoadingItems && (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          {/* SVG Illustration */}
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10">
            <svg
              className="h-12 w-12 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">
            {t("tools.selectSystem")}
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            The Compliance Generator creates all required EU AI Act documents and
            assessments for your AI system. Select a system above to see which
            documents are needed and generate them with a single click.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-4 text-center shadow-sm">
              <p className="text-lg font-bold text-primary">15+</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("tools.results")}              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 text-center shadow-sm">
              <p className="text-lg font-bold text-primary">{t("tools.generate")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("tools.generateAll")}              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 text-center shadow-sm">
              <p className="text-lg font-bold text-primary">Auto</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("tools.status")}              </p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Loading Items                                                     */}
      {/* ----------------------------------------------------------------- */}
      {selectedSystemId && isLoadingItems && (
        <div className="mt-10 flex items-center justify-center rounded-lg border border-border bg-background py-16 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">
              Loading compliance items...
            </span>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Step 2: Generation Items (shown after system selected & loaded)    */}
      {/* ----------------------------------------------------------------- */}
      {selectedSystemId && !isLoadingItems && items.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="mt-10 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              <h2 className="text-lg font-semibold">{t("tools.results")}</h2>
            </div>
            <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                <span className="font-semibold text-accent">{generatedCount}</span> generated
              </span>
              <span className="text-border">|</span>
              <span>
                <span className="font-semibold text-orange-500">{pendingCount}</span> pending
              </span>
              <span className="text-border">|</span>
              <span>
                <span className="font-semibold">{checkedCount}</span> selected
              </span>
            </div>
          </div>

          {/* Category groups */}
          <div className="mt-6 space-y-8">
            {CATEGORY_ORDER.map((catKey) => {
              const category = CATEGORIES.find((c) => c.key === catKey);
              const categoryItems = groupedItems[catKey] ?? [];
              if (categoryItems.length === 0) return null;

              const allCatChecked =
                categoryItems.length > 0 &&
                categoryItems.every((i) => checkedItems[i.id]);

              return (
                <div key={catKey}>
                  {/* Category header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">{category?.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {category?.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCategory(catKey)}
                      className="rounded-md border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      {allCatChecked ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  {/* Items grid */}
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {categoryItems.map((item) => (
                      <GenerationItemCard
                        key={item.id}
                        item={item}
                        checked={!!checkedItems[item.id]}
                        onToggle={() => toggleItem(item.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* Step 3: Action Buttons                                             */}
          {/* ----------------------------------------------------------------- */}
          <div className="mt-10 flex flex-col items-center gap-4 rounded-lg border border-border bg-gradient-to-r from-primary/5 via-transparent to-accent/5 p-6 shadow-sm sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleGenerateSelected}
              disabled={checkedCount === 0 || isGenerating}
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-semibold shadow-sm transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >{t("tools.generateSelected")}              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {checkedCount}
              </span>
            </button>
            <button
              type="button"
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>{t("tools.generateAll")}                  <span className="ml-2 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
                    {items.length}
                  </span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Generation Progress Modal/Overlay                                  */}
      {/* ----------------------------------------------------------------- */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-background p-8 shadow-xl">
            <div className="flex flex-col items-center text-center">
              {/* Animated spinner */}
              <div className="relative mb-6">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
                <svg
                  className="absolute inset-0 h-16 w-16 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-semibold">{t("tools.generating")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {generationProgress.total > 0
                  ? `Generating ${generationProgress.current} / ${generationProgress.total} documents...`
                  : t("tools.generating")}
              </p>

              {/* Current item */}
              {generationProgress.currentItem && (
                <p className="mt-3 text-sm font-medium text-primary">
                  {generationProgress.currentItem}
                </p>
              )}

              {/* Progress bar */}
              <div className="mt-6 w-full">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                    style={{
                      width:
                        generationProgress.total > 0
                          ? `${Math.min(
                              (generationProgress.current / generationProgress.total) * 100,
                              100
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>
                    {generationProgress.current} of {generationProgress.total}
                  </span>
                  <span>
                    {generationProgress.total > 0
                      ? Math.round(
                          (generationProgress.current / generationProgress.total) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                {t("tools.generating")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Results                                                           */}
      {/* ----------------------------------------------------------------- */}
      {generationResults && (
        <div className="mt-10 rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
              <svg
                className="h-6 w-6 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-accent">
                {t("tools.generationComplete")} {generationResults.length} compliance
                document{generationResults.length === 1 ? "" : "s"}
              </h3>
              <p className="text-sm text-muted-foreground">
                All documents have been saved and are ready for review.
              </p>
            </div>
          </div>

          {/* Generated items list */}
          <div className="mt-6 space-y-2">
            {generationResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium">{result.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.articleRef}
                    </p>
                  </div>
                </div>
                <Link
                  href={result.href}
                  className="rounded-md px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >{t("common.learnMore")}                </Link>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/documents"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >{t("tools.viewDocuments")}            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium transition-colors hover:bg-muted"
            >{t("tools.download")}            </button>
            <button
              type="button"
              onClick={() => setGenerationResults(null)}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium transition-colors hover:bg-muted"
            >{t("common.close")}            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Error                                                             */}
      {/* ----------------------------------------------------------------- */}
      {generationError && (
        <div className="mt-10 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-destructive">{t("tools.errorSaving")}              </p>
              <p className="text-sm text-muted-foreground">{generationError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGenerationError(null)}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-xs font-medium transition-colors hover:bg-muted"
          >{t("common.close")}          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generation Item Card Sub-component
// ---------------------------------------------------------------------------

function GenerationItemCard({
  item,
  checked,
  onToggle,
}: {
  item: GenerationItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group relative flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all shadow-sm ${
        checked
          ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "border-border bg-background hover:border-primary/20 hover:bg-muted/30"
      }`}
    >
      {/* Checkbox */}
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          checked
            ? "border-primary bg-primary"
            : "border-muted-foreground/30 bg-background group-hover:border-primary/40"
        }`}
      >
        {checked && (
          <svg
            className="h-3 w-3 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{item.title}</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            {item.articleRef}
          </span>
          {item.tier && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                TIER_COLORS[item.tier] ?? TIER_COLORS.free
              }`}
            >
              {TIER_LABELS[item.tier]}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground truncate">
          {item.description}
        </p>
      </div>

      {/* Status badge */}
      <span
        className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          item.status === "generated"
            ? "bg-accent/10 text-accent"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {item.status === "generated" ? "Generated" : "Pending"}
      </span>
    </button>
  );
}
