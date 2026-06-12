// QMS Checklist Tool - Quality Management System (Art.17)
// Client Component: 11-item checkbox list with auto-save and report generation

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface AISystem {
  id: string;
  name: string;
}

type RequirementKey = "riskManagement" | "dataGovernance" | "technicalDoc" | "recordKeeping" | "transparency" | "humanOversight" | "accuracyRobustness" | "cybersecurity" | "qualityControl" | "postMarket" | "incidentReporting";

interface QMSChecklist {
  systemId: string;
  riskManagement: boolean;
  dataGovernance: boolean;
  technicalDoc: boolean;
  recordKeeping: boolean;
  transparency: boolean;
  humanOversight: boolean;
  accuracyRobustness: boolean;
  cybersecurity: boolean;
  qualityControl: boolean;
  postMarket: boolean;
  incidentReporting: boolean;
  completionRate: number;
  status: string;
}

const REQUIREMENTS: { key: RequirementKey; label: string; description: string }[] = [
  {
    key: "riskManagement",
    label: "Risk Management System",
    description: "Establish, implement, document, and maintain a risk management system throughout the entire lifecycle of the AI system (Art.9).",
  },
  {
    key: "dataGovernance",
    label: "Data Governance & Management",
    description: "Implement training, validation, and testing data governance practices including bias detection and mitigation (Art.10).",
  },
  {
    key: "technicalDoc",
    label: "Technical Documentation",
    description: "Prepare and maintain up-to-date technical documentation demonstrating compliance with requirements (Art.11, Annex IV).",
  },
  {
    key: "recordKeeping",
    label: "Record-Keeping & Logs",
    description: "Enable automatic recording of events (logs) over the lifetime of the AI system for traceability (Art.12).",
  },
  {
    key: "transparency",
    label: "Transparency & Provision of Information",
    description: "Design the AI system to enable deployers to interpret output and use it appropriately (Art.13).",
  },
  {
    key: "humanOversight",
    label: "Human Oversight",
    description: "Design and develop the AI system so it can be effectively overseen by natural persons during use (Art.14).",
  },
  {
    key: "accuracyRobustness",
    label: "Accuracy, Robustness & Cybersecurity",
    description: "Achieve appropriate levels of accuracy, robustness, and cybersecurity throughout the lifecycle (Art.15).",
  },
  {
    key: "cybersecurity",
    label: "Cybersecurity Measures",
    description: "Implement specific technical and organizational measures to protect against unauthorized access and attacks.",
  },
  {
    key: "qualityControl",
    label: "Quality Control & Conformity Assessment",
    description: "Perform internal quality control and, where applicable, third-party conformity assessment before placing on the market (Art.43).",
  },
  {
    key: "postMarket",
    label: "Post-Market Monitoring",
    description: "Establish and document a post-market monitoring system to actively collect and review performance data (Art.72).",
  },
  {
    key: "incidentReporting",
    label: "Incident Reporting",
    description: "Report serious incidents and malfunctioning to the market surveillance authorities of Member States (Art.73).",
  },
];

const DEFAULT_CHECKLIST: QMSChecklist = {
  systemId: "",
  riskManagement: false,
  dataGovernance: false,
  technicalDoc: false,
  recordKeeping: false,
  transparency: false,
  humanOversight: false,
  accuracyRobustness: false,
  cybersecurity: false,
  qualityControl: false,
  postMarket: false,
  incidentReporting: false,
  completionRate: 0,
  status: "incomplete",
};

export default function QMSPage() {
  const t = useTranslations();

  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [checklist, setChecklist] = useState<QMSChecklist>(DEFAULT_CHECKLIST);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showReport, setShowReport] = useState(false);

  // Fetch user's AI systems
  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-systems");
      if (res.ok) {
        const data = await res.json();
        setSystems(data.data ?? []);
      }
    } catch (error) {
      console.error("[QMS] Failed to fetch systems:", error);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  // Fetch QMS checklist when system selected
  const fetchChecklist = useCallback(async (systemId: string) => {
    if (!systemId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/qms?systemId=${systemId}`);
      if (res.ok) {
        const data = await res.json();
        setChecklist(data.checklist ?? DEFAULT_CHECKLIST);
      }
    } catch (error) {
      console.error("[QMS] Failed to fetch checklist:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSystemId) {
      fetchChecklist(selectedSystemId);
      setShowReport(false);
    }
  }, [selectedSystemId, fetchChecklist]);

  // Auto-save on toggle
  const saveChecklist = useCallback(
    async (updated: QMSChecklist) => {
      if (!selectedSystemId) return;
      setIsSaving(true);
      setSaveMessage("");
      try {
        const body: Record<string, unknown> = { systemId: selectedSystemId };
        for (const req of REQUIREMENTS) {
          body[req.key] = updated[req.key];
        }
        const res = await fetch("/api/qms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json();
          setChecklist(data.checklist);
          setSaveMessage(t("tools.saved"));
          setTimeout(() => setSaveMessage(""), 1500);
        }
      } catch (error) {
        console.error("[QMS] Auto-save failed:", error);
        setSaveMessage(t("tools.errorSaving"));
      } finally {
        setIsSaving(false);
      }
    },
    [selectedSystemId]
  );

  const handleToggle = (key: RequirementKey) => {
    setChecklist((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      // Debounced save handled by effect below
      return updated;
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedSystemId) {
        saveChecklist(checklist);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [checklist, selectedSystemId, saveChecklist]);

  const checkedCount = REQUIREMENTS.filter((r) => checklist[r.key]).length;
  const progress = checklist.completionRate;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Art. 17
          </span>
          <span className="text-xs text-muted-foreground">{t("tools.results")}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Quality Management System Checklist</h1>
        <p className="text-muted-foreground">
          Check off the 11 Art.17 QMS requirements for your high-risk AI system. Changes auto-save.
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
          {/* Progress */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {checkedCount} / {REQUIREMENTS.length} requirements completed
              </span>
              <span className="text-muted-foreground">
                {progress}% complete
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className={`h-2 rounded-full transition-all ${
                  progress === 100 ? "bg-accent" : "bg-primary"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {saveMessage && (
              <p className="mt-1 text-xs text-muted-foreground">{saveMessage} {isSaving && "..."}</p>
            )}
          </div>

          {/* Checklist */}
          {isLoading ? (
            <div className="mt-8 text-sm text-muted-foreground">{t("common.loading")}</div>
          ) : (
            <div className="mt-8 space-y-3">
              {REQUIREMENTS.map((req) => {
                const isChecked = checklist[req.key];
                return (
                  <label
                    key={req.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      isChecked
                        ? "border-accent/30 bg-accent/5"
                        : "border-border bg-background hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(req.key)}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{req.label}</span>
                        {isChecked && (
                          <span className="rounded bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">{t("tools.saved")}                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {req.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Generate Report */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >{t("tools.generate")}            </button>
          </div>

          {/* Report */}
          {showReport && (
            <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
              <h2 className="text-xl font-semibold">{t("tools.results")}              </h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {t("tools.status")}
                  </span>
                  <span className="text-2xl font-bold">{progress}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{t("tools.status")}:</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      checklist.status === "complete"
                        ? "bg-accent/10 text-accent"
                        : "bg-orange-500/10 text-orange-600"
                    }`}
                  >
                    {checklist.status === "complete"
                      ? "Complete"
                      : "Incomplete"}
                  </span>
                </div>
                <div className="rounded-md border border-border bg-background p-4">
                  <h3 className="text-sm font-semibold">{t("tools.results")}</h3>
                  <ul className="mt-2 space-y-2">
                    {REQUIREMENTS.map((req) => (
                      <li
                        key={req.key}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                            checklist[req.key]
                              ? "bg-accent text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {checklist[req.key] ? "✓" : "○"}
                        </span>
                        <span
                          className={
                            checklist[req.key]
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {req.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {progress < 100 && (
                  <div className="rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                    <strong>Action Required:</strong> Complete the remaining{" "}
                    {REQUIREMENTS.length - checkedCount} requirement(s) to
                    achieve full QMS compliance under Art.17.
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
                >{t("tools.download")}                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
