// GPAI Compliance Tool
// Client Component: General-Purpose AI compliance checklist for Art.51-56 and Annex XI/XII
// Covers GPAI with Systemic Risk (Art.55-56) and Standard GPAI Obligations (Art.52-54)

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AISystem {
  id: string;
  name: string;
  riskLevel: string;
  category?: string;
}

interface ChecklistItem {
  id: string;
  articleRef: string;
  title: string;
  description: string;
  checked: boolean;
}

interface TabData {
  id: string;
  label: string;
  items: ChecklistItem[];
}

// ---------------------------------------------------------------------------
// Checklist definitions
// ---------------------------------------------------------------------------

const INITIAL_SYSTEMIC_RISK_ITEMS: ChecklistItem[] = [
  {
    id: "sr-1",
    articleRef: "Art.55(1)(a)",
    title: "Perform and document fundamental rights impact assessment",
    description:
      "Conduct a fundamental rights impact assessment to evaluate and document the potential impact of the GPAI model with systemic risk on fundamental rights, including risks to democracy, the rule of law, and public security.",
    checked: false,
  },
  {
    id: "sr-2",
    articleRef: "Art.55(1)(b)",
    title: "Ensure adequate risk mitigation measures",
    description:
      "Implement and maintain adequate measures to identify, assess, and mitigate possible known and reasonably foreseeable risks throughout the lifecycle of the GPAI model with systemic risk.",
    checked: false,
  },
  {
    id: "sr-3",
    articleRef: "Art.55(1)(c)",
    title: "Document serious incidents and reasons for them",
    description:
      "Document and report any serious incidents and the reasons for them, including the circumstances, consequences, and any corrective measures taken.",
    checked: false,
  },
  {
    id: "sr-4",
    articleRef: "Art.55(1)(d)",
    title: "Ensure adequate cybersecurity protection",
    description:
      "Ensure adequate cybersecurity protection for the GPAI model with systemic risk, including measures to prevent unauthorized access, use, or modification.",
    checked: false,
  },
  {
    id: "sr-5",
    articleRef: "Art.55(2)",
    title: "Ensure adequate internal governance",
    description:
      "Establish and maintain adequate internal governance and risk management systems, including clear allocation of responsibilities, oversight mechanisms, and regular review processes.",
    checked: false,
  },
  {
    id: "sr-6",
    articleRef: "Art.55 / Art.52",
    title: "Comply with obligations under Art.52 (training data, documentation, transparency, etc.)",
    description:
      "Fulfil all applicable obligations under Art.52, including maintaining technical documentation, complying with copyright law, publishing training content summaries, and ensuring data protection compliance.",
    checked: false,
  },
  {
    id: "sr-7",
    articleRef: "Art.56",
    title: "Register the GPAI model in the EU database",
    description:
      "Register the GPAI model with systemic risk in the EU database for GPAI models, providing all required information including model name, provider details, and risk assessment outcomes.",
    checked: false,
  },
  {
    id: "sr-8",
    articleRef: "Art.55(3)",
    title: "Report serious incidents to the AI Office",
    description:
      "Without undue delay, report any serious incidents to the European AI Office, including the nature of the incident, the GPAI model involved, and any measures taken to address it.",
    checked: false,
  },
];

const INITIAL_STANDARD_ITEMS: ChecklistItem[] = [
  {
    id: "std-1",
    articleRef: "Art.52(1), Annex XI",
    title: "Maintain up-to-date technical documentation",
    description:
      "Draw up and keep up-to-date technical documentation of the GPAI model in accordance with Annex XI, including model architecture, training methodology, performance metrics, and known limitations.",
    checked: false,
  },
  {
    id: "std-2",
    articleRef: "Art.52(2)",
    title: "Comply with copyright and EU copyright law",
    description:
      "Ensure compliance with Union law on copyright and related rights, including respecting the opt-out mechanisms for text and data mining under Directive (EU) 2019/790.",
    checked: false,
  },
  {
    id: "std-3",
    articleRef: "Art.52(3)",
    title: "Publish sufficiently detailed training content summaries",
    description:
      "Publish a sufficiently detailed summary about the content used for training, in a clear and accessible manner, to enable deployers to understand the data sources and scope of training.",
    checked: false,
  },
  {
    id: "std-4",
    articleRef: "Art.52(4)",
    title: "Ensure compliance with Union law on data protection and privacy",
    description:
      "Ensure that the GPAI model complies with Union law on data protection and privacy, including the General Data Protection Regulation (GDPR) and the ePrivacy Directive.",
    checked: false,
  },
  {
    id: "std-5",
    articleRef: "Art.52(2)(b)",
    title: "Establish a policy to comply with EU copyright law",
    description:
      "Put in place a policy to comply with EU copyright law, particularly regarding the use of copyrighted material in training data and the implementation of opt-out mechanisms.",
    checked: false,
  },
  {
    id: "std-6",
    articleRef: "Art.53, Annex XII",
    title: "Document and make publicly available training data summaries",
    description:
      "Document and make publicly available sufficiently detailed summaries of the training data used, including major categories of data sources, data curation and filtering processes, and any known limitations.",
    checked: false,
  },
  {
    id: "std-7",
    articleRef: "Art.53",
    title: "Ensure adequate transparency and information to deployers",
    description:
      "Provide deployers with sufficient information and documentation to understand the capabilities, limitations, and appropriate use of the GPAI model, including instructions for compliance monitoring.",
    checked: false,
  },
  {
    id: "std-8",
    articleRef: "Art.54",
    title: "Establish quality management system",
    description:
      "Establish and maintain a quality management system to ensure and demonstrate ongoing compliance with the obligations under this Regulation, including documented policies, procedures, and regular audits.",
    checked: false,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GPAICompliancePage() {
  const t = useTranslations();

  // -- System selector state ------------------------------------------------
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [isLoadingSystems, setIsLoadingSystems] = useState(true);

  // -- Tab state ------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<string>("systemic-risk");

  // -- Checklist state ------------------------------------------------------
  const [systemicRiskItems, setSystemicRiskItems] = useState<ChecklistItem[]>(
    INITIAL_SYSTEMIC_RISK_ITEMS
  );
  const [standardItems, setStandardItems] = useState<ChecklistItem[]>(
    INITIAL_STANDARD_ITEMS
  );

  // -- Save state -----------------------------------------------------------
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -- Fetch AI systems -----------------------------------------------------
  const fetchSystems = useCallback(async () => {
    setIsLoadingSystems(true);
    try {
      const res = await fetch("/api/ai-systems");
      if (res.ok) {
        const data = await res.json();
        setSystems(data.data ?? []);
      }
    } catch (err) {
      console.error("[GPAI] Failed to fetch AI systems:", err);
    } finally {
      setIsLoadingSystems(false);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  // -- Toggle checklist item -------------------------------------------------
  const toggleItem = useCallback(
    (tabId: string, itemId: string) => {
      const updater = (items: ChecklistItem[]) =>
        items.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );

      if (tabId === "systemic-risk") {
        setSystemicRiskItems(updater);
      } else {
        setStandardItems(updater);
      }
    },
    []
  );

  // -- Auto-save via POST /api/documents ------------------------------------
  const saveDocument = useCallback(async () => {
    if (!selectedSystemId) return;

    setIsSaving(true);
    try {
      const payload = {
        type: "gpai-compliance",
        systemId: selectedSystemId,
        activeTab,
        systemicRiskItems,
        standardItems,
      };

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setLastSavedAt(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("[GPAI] Auto-save failed:", err);
    } finally {
      setIsSaving(false);
    }
  }, [selectedSystemId, activeTab, systemicRiskItems, standardItems]);

  // Debounced auto-save on checklist change
  useEffect(() => {
    if (!selectedSystemId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDocument();
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedSystemId, systemicRiskItems, standardItems, saveDocument]);

  // -- Progress calculation -------------------------------------------------
  const getProgress = (items: ChecklistItem[]) => {
    if (items.length === 0) return 0;
    const checked = items.filter((i) => i.checked).length;
    return Math.round((checked / items.length) * 100);
  };

  const systemicRiskProgress = getProgress(systemicRiskItems);
  const standardProgress = getProgress(standardItems);

  // -- Tab data -------------------------------------------------------------
  const tabs: TabData[] = [
    {
      id: "systemic-risk",
      label: "GPAI with Systemic Risk (Art.55-56)",
      items: systemicRiskItems,
    },
    {
      id: "standard",
      label: "Standard GPAI Obligations (Art.52-54)",
      items: standardItems,
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0]!;
  const currentProgress =
    activeTab === "systemic-risk" ? systemicRiskProgress : standardProgress;

  // -- Print / Save as PDF --------------------------------------------------
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // -- Render ---------------------------------------------------------------
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">GPAI Compliance</h1>
            <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-600">{t("tools.results")}            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            General-Purpose AI compliance checklist for Art.51-56 and Annex
            XI/XII of the EU AI Act
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
            />
          </svg>{t("tools.download")}        </button>
      </div>

      {/* System Selector */}
      <div className="mt-6 rounded-lg border border-border bg-background p-5">
        <label
          htmlFor="system-select"
          className="block text-sm font-medium"
        >{t("tools.selectSystem")}        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("tools.selectSystem")}
        </p>
        <select
          id="system-select"
          value={selectedSystemId}
          onChange={(e) => setSelectedSystemId(e.target.value)}
          className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          disabled={isLoadingSystems}
        >
          <option value="">
            {isLoadingSystems ? "Loading systems..." : "-- Select a system --"}
          </option>
          {systems.map((sys) => (
            <option key={sys.id} value={sys.id}>
              {sys.name}
              {sys.riskLevel ? ` (${sys.riskLevel})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="mt-6 border-b border-border">
        <nav className="-mb-px flex gap-0" aria-label="Tabs">
          {tabs.map((tab) => {
            const progress =
              tab.id === "systemic-risk"
                ? systemicRiskProgress
                : standardProgress;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    progress === 100
                      ? "bg-accent/10 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {progress}%
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{currentTab.label}</span>
          <span>
            {currentTab.items.filter((i) => i.checked).length} /{" "}
            {currentTab.items.length} completed
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              currentProgress === 100 ? "bg-accent" : "bg-primary"
            }`}
            style={{ width: `${currentProgress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="mt-6 space-y-3">
        {currentTab.items.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border bg-background p-4 transition-colors ${
              item.checked
                ? "border-accent/30 bg-accent/5"
                : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id={item.id}
                checked={item.checked}
                onChange={() => toggleItem(activeTab, item.id)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={item.id}
                    className="cursor-pointer text-sm font-medium"
                  >
                    {item.title}
                  </label>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    {item.articleRef}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save Status */}
      <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {isSaving ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>{t("common.loading")}</span>
            </>
          ) : lastSavedAt ? (
            <>
              <svg
                className="h-3 w-3 text-accent"
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
              <span>Last saved at {lastSavedAt}</span>
            </>
          ) : (
            <span>{t("tools.results")}</span>
          )}
        </div>
        {selectedSystemId && (
          <button
            type="button"
            onClick={saveDocument}
            disabled={isSaving}
            className="inline-flex h-7 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >{t("common.save")}          </button>
        )}
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block print:mt-8 print:border-t print:border-border print:pt-4 print:text-xs print:text-muted-foreground">
        <p>
          Generated by EU AI Act Compliance Tool -- GPAI Compliance Assessment
          (Art.51-56, Annex XI/XII)
        </p>
        <p className="mt-1">
          Report Date: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
