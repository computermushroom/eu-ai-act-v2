// GDPR Deep Integration Scan Tool
// Client Component: 12-item GDPR compliance checklist with scoring, expandable guidance, and auto-save

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface AISystem {
  id: string;
  name: string;
}

type GDPRItemKey =
  | "lawfulBasis"
  | "dpia"
  | "dataMinimization"
  | "consentManagement"
  | "accessRights"
  | "erasureRights"
  | "dataPortability"
  | "automatedDecisionMaking"
  | "dpoAppointment"
  | "crossBorderTransfer"
  | "breachNotification"
  | "recordsOfProcessing";

interface GDPRChecklist {
  systemId: string;
  scanUrl: string;
  lawfulBasis: boolean;
  dpia: boolean;
  dataMinimization: boolean;
  consentManagement: boolean;
  accessRights: boolean;
  erasureRights: boolean;
  dataPortability: boolean;
  automatedDecisionMaking: boolean;
  dpoAppointment: boolean;
  crossBorderTransfer: boolean;
  breachNotification: boolean;
  recordsOfProcessing: boolean;
  score: number;
  status: string;
}

interface GDPRItem {
  key: GDPRItemKey;
  title: string;
  articleRef: string;
  description: string;
  guidance: string;
}

const GDPR_ITEMS: GDPRItem[] = [
  {
    key: "lawfulBasis",
    title: "Lawful Basis for Processing",
    articleRef: "Art.6 GDPR",
    description:
      "Identify and document a valid legal basis (consent, contract, legal obligation, vital interests, public task, or legitimate interests) for all personal data processing activities related to the AI system.",
    guidance:
      "Map every data processing activity in your AI system to one of the six lawful bases under Art.6. Document the justification for each basis. If relying on legitimate interests, conduct and record a Legitimate Interests Assessment (LIA). Review bases when processing purposes change.",
  },
  {
    key: "dpia",
    title: "Data Protection Impact Assessment",
    articleRef: "Art.35 GDPR",
    description:
      "Conduct a DPIA for AI systems that involve systematic profiling, large-scale processing, or automated decision-making with legal or significant effects on individuals.",
    guidance:
      "A DPIA is mandatory when processing is likely to result in high risk to individuals. For AI systems, this typically applies to high-risk AI under the EU AI Act. The DPIA must describe the processing, assess necessity and proportionality, identify risks, and outline mitigation measures. Consult your DPO and, where required, the supervisory authority.",
  },
  {
    key: "dataMinimization",
    title: "Data Minimization and Purpose Limitation",
    articleRef: "Art.5(1)(b)(c)",
    description:
      "Ensure personal data collected is adequate, relevant, and limited to what is necessary for the specified purposes. Data must not be further processed in a manner incompatible with those purposes.",
    guidance:
      "Audit your AI training data, validation data, and inference inputs to confirm only necessary personal data is collected. Implement technical controls to prevent scope creep. Document the specific purposes for each data category. Regularly review data holdings and purge data that is no longer needed for the stated purpose.",
  },
  {
    key: "consentManagement",
    title: "Consent Management and Withdrawal",
    articleRef: "Art.7 GDPR",
    description:
      "If consent is the legal basis, ensure it is freely given, specific, informed, and unambiguous. Provide an easy mechanism for data subjects to withdraw consent at any time.",
    guidance:
      "Consent requests must be clearly distinguishable from other matters, using plain language. Avoid bundled consent for unrelated purposes. Implement a preference center where users can view and withdraw consents with the same ease they were given. Withdrawal must be processed without undue delay and must not affect the lawfulness of prior processing.",
  },
  {
    key: "accessRights",
    title: "Data Subject Access Rights",
    articleRef: "Art.15 GDPR",
    description:
      "Enable data subjects to obtain confirmation of processing and access to their personal data, including processing purposes, categories of data, recipients, and retention periods.",
    guidance:
      "Establish a streamlined process for handling Subject Access Requests (SARs) within the 30-day statutory deadline. The response should include: categories of personal data processed, purposes of processing, recipients or categories of recipients, retention periods, and copies of the actual data. For AI systems, include information about logic involved in automated processing.",
  },
  {
    key: "erasureRights",
    title: "Right to Erasure / Right to Be Forgotten",
    articleRef: "Art.17 GDPR",
    description:
      "Implement mechanisms allowing data subjects to request deletion of their personal data, including from AI training datasets, model outputs, and backup systems.",
    guidance:
      "For AI systems, erasure is particularly complex as personal data may be embedded in model weights. Implement technical measures such as: data deletion pipelines, retraining protocols for models trained on erased data, and machine unlearning techniques where feasible. Maintain logs of erasure requests and confirm completion to the data subject.",
  },
  {
    key: "dataPortability",
    title: "Data Portability",
    articleRef: "Art.20 GDPR",
    description:
      "Provide data subjects with the ability to receive their personal data in a structured, commonly used, and machine-readable format, and to transmit it to another controller.",
    guidance:
      "Implement data export functionality supporting standard formats such as JSON, CSV, or XML. For AI systems, consider whether training data provided by the data subject can be ported. Ensure the exported data includes all categories the subject has provided directly. Facilitate direct transmission between controllers via APIs where technically feasible.",
  },
  {
    key: "automatedDecisionMaking",
    title: "Automated Decision-Making Safeguards",
    articleRef: "Art.22 GDPR",
    description:
      "Protect data subjects against decisions based solely on automated processing that produce legal or similarly significant effects, including the right to human intervention and to contest the decision.",
    guidance:
      "If your AI system makes or supports decisions with legal or significant effects (e.g., credit scoring, employment, access to services), you must: inform data subjects about the logic involved, provide the right to obtain human intervention, enable the right to express their point of view, and provide the right to contest the decision. Implement human-in-the-loop or human-on-the-loop mechanisms.",
  },
  {
    key: "dpoAppointment",
    title: "Data Protection Officer Appointment",
    articleRef: "Art.37 GDPR",
    description:
      "Appoint a Data Protection Officer where required (public authority, core activities involve large-scale monitoring, or large-scale processing of special categories of data).",
    guidance:
      "Determine whether your organization is required to appoint a DPO under Art.37. Even where not mandatory, appointing a DPO is best practice. The DPO must have independence, adequate resources, and expert knowledge. Register the DPO with the relevant supervisory authority. Ensure the DPO is involved in all issues relating to protection of personal data, including AI system design and deployment.",
  },
  {
    key: "crossBorderTransfer",
    title: "Cross-Border Data Transfer Safeguards",
    articleRef: "Art.44-49 GDPR",
    description:
      "Ensure personal data transferred outside the EEA is protected through adequate safeguards such as Standard Contractual Clauses, Binding Corporate Rules, or adequacy decisions.",
    guidance:
      "Map all international data flows in your AI system pipeline. For transfers to countries without an adequacy decision, implement appropriate safeguards: Standard Contractual Clauses (SCCs) with Transfer Impact Assessments, Binding Corporate Rules (BCRs), or approved codes of conduct. For AI-specific transfers, consider where model training or inference occurs geographically and apply safeguards accordingly.",
  },
  {
    key: "breachNotification",
    title: "Data Breach Notification Procedures",
    articleRef: "Art.33-34 GDPR",
    description:
      "Establish procedures for detecting, reporting, and notifying personal data breaches to the supervisory authority within 72 hours and to affected data subjects without undue delay where there is high risk.",
    guidance:
      "Create an incident response plan specific to AI-related data breaches. This includes: breach detection mechanisms (monitoring for model inversion, membership inference, or data extraction attacks), an internal escalation procedure, a 72-hour notification workflow to the supervisory authority, a risk assessment framework to determine if data subject notification is required, and documentation of all breaches regardless of notification.",
  },
  {
    key: "recordsOfProcessing",
    title: "Records of Processing Activities",
    articleRef: "Art.30 GDPR",
    description:
      "Maintain comprehensive records of all processing activities carried out by or on behalf of the organization, including purposes, data categories, recipients, retention, and security measures.",
    guidance:
      "Document all AI-related processing activities in a Record of Processing Activities (RoPA). For each activity, record: the name and contact details of the controller/DPO, purposes of processing, categories of data subjects and personal data, recipients, international transfers, retention periods, and general technical and organizational security measures. Update the RoPA when AI systems change or new processing is introduced.",
  },
];

const DEFAULT_CHECKLIST: GDPRChecklist = {
  systemId: "",
  scanUrl: "",
  lawfulBasis: false,
  dpia: false,
  dataMinimization: false,
  consentManagement: false,
  accessRights: false,
  erasureRights: false,
  dataPortability: false,
  automatedDecisionMaking: false,
  dpoAppointment: false,
  crossBorderTransfer: false,
  breachNotification: false,
  recordsOfProcessing: false,
  score: 0,
  status: "incomplete",
};

export default function GDPRScanPage() {
  const t = useTranslations();

  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [scanUrl, setScanUrl] = useState<string>("");
  const [checklist, setChecklist] = useState<GDPRChecklist>(DEFAULT_CHECKLIST);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Fetch user's AI systems
  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-systems");
      if (res.ok) {
        const data = await res.json();
        setSystems(data.data ?? []);
      }
    } catch (error) {
      console.error("[GDPR-SCAN] Failed to fetch systems:", error);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  // Fetch GDPR checklist when system selected
  const fetchChecklist = useCallback(async (systemId: string) => {
    if (!systemId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents?type=gdpr-scan&systemId=${systemId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.document) {
          const parsed = JSON.parse(data.document.content);
          setChecklist(parsed);
          setScanUrl(parsed.scanUrl ?? "");
        } else {
          setChecklist({ ...DEFAULT_CHECKLIST, systemId });
          setScanUrl("");
        }
      }
    } catch (error) {
      console.error("[GDPR-SCAN] Failed to fetch checklist:", error);
      setChecklist({ ...DEFAULT_CHECKLIST, systemId });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSystemId) {
      fetchChecklist(selectedSystemId);
    }
  }, [selectedSystemId, fetchChecklist]);

  // Auto-save via POST /api/documents
  const saveChecklist = useCallback(
    async (updated: GDPRChecklist) => {
      if (!selectedSystemId) return;
      setIsSaving(true);
      setSaveMessage("");
      try {
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemId: selectedSystemId,
            type: "gdpr-scan",
            title: `GDPR Compliance Scan - ${new Date().toISOString().split("T")[0]}`,
            content: JSON.stringify(updated),
          }),
        });
        if (res.ok) {
          setSaveMessage(t("tools.saved"));
          setTimeout(() => setSaveMessage(""), 1500);
        }
      } catch (error) {
        console.error("[GDPR-SCAN] Auto-save failed:", error);
        setSaveMessage(t("tools.errorSaving"));
      } finally {
        setIsSaving(false);
      }
    },
    [selectedSystemId]
  );

  const handleToggle = (key: GDPRItemKey) => {
    setChecklist((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      const checkedCount = GDPR_ITEMS.filter((item) => updated[item.key]).length;
      updated.score = Math.round((checkedCount / GDPR_ITEMS.length) * 100);
      updated.status = checkedCount === GDPR_ITEMS.length ? "complete" : "incomplete";
      return updated;
    });
  };

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedSystemId && checklist.systemId) {
        saveChecklist(checklist);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [checklist, selectedSystemId, saveChecklist]);

  const checkedCount = GDPR_ITEMS.filter((item) => checklist[item.key]).length;
  const score = checklist.score;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-accent";
    if (s >= 50) return "text-orange-600";
    return "text-destructive";
  };

  const getScoreBg = (s: number) => {
    if (s >= 80) return "bg-accent";
    if (s >= 50) return "bg-orange-500";
    return "bg-destructive";
  };

  const toggleExpand = (key: string) => {
    setExpandedItem((prev) => (prev === key ? null : key));
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{t("tools.results")}          </span>
          <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-600">{t("tools.results")}          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">GDPR Deep Integration Scan</h1>
        <p className="text-muted-foreground">
          Assess your AI system against 12 core GDPR requirements. Check each item, review the guidance, and track your compliance score. Changes auto-save.
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

      {/* URL Input */}
      <div className="mt-6">
        <label className="block text-sm font-medium">{t("tools.results")}</label>
        <input
          type="url"
          value={scanUrl}
          onChange={(e) => {
            setScanUrl(e.target.value);
            setChecklist((prev) => ({ ...prev, scanUrl: e.target.value }));
          }}
          placeholder={t("tools.searchPlaceholder")}
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t("tools.description")}
        </p>
      </div>

      {selectedSystemId && (
        <>
          {/* Score & Progress */}
          <div className="mt-8 rounded-lg border border-border bg-background p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("tools.results")}</p>
                <p className={`mt-1 text-3xl font-bold ${getScoreColor(score)}`}>
                  {score}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {checkedCount} / {GDPR_ITEMS.length} items checked
                </p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    checklist.status === "complete"
                      ? "bg-accent/10 text-accent"
                      : "bg-orange-500/10 text-orange-600"
                  }`}
                >
                  {checklist.status === "complete" ? "Compliant" : "In Progress"}
                </span>
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-muted">
              <div
                className={`h-2 rounded-full transition-all ${getScoreBg(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
            {saveMessage && (
              <p className="mt-2 text-xs text-muted-foreground">
                {saveMessage} {isSaving && "..."}
              </p>
            )}
          </div>

          {/* Checklist */}
          {isLoading ? (
            <div className="mt-8 text-sm text-muted-foreground">{t("common.loading")}</div>
          ) : (
            <div className="mt-8 space-y-3">
              {GDPR_ITEMS.map((item) => {
                const isChecked = checklist[item.key];
                const isExpanded = expandedItem === item.key;

                return (
                  <div
                    key={item.key}
                    className={`rounded-lg border transition-colors ${
                      isChecked
                        ? "border-accent/30 bg-accent/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-3 p-4">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(item.key)}
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">{item.title}</span>
                            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                              {item.articleRef}
                            </span>
                          </div>
                          {isChecked && (
                            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">{t("tools.saved")}                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </label>

                    {/* Expandable Guidance */}
                    <div className="border-t border-border">
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.key)}
                        className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30"
                      >
                        <span>{isExpanded ? "Hide Guidance" : "Show Guidance"}</span>
                        <svg
                          className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1">
                          <div className="rounded-md bg-muted/50 p-3">
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {item.guidance}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Score Breakdown */}
          <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
            <h2 className="text-lg font-semibold">{t("tools.results")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {GDPR_ITEMS.map((item) => {
                const isChecked = checklist[item.key];
                return (
                  <div key={item.key} className="flex items-center gap-2 text-sm">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                        isChecked
                          ? "bg-accent text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isChecked ? "\u2713" : "\u25CB"}
                    </span>
                    <span
                      className={
                        isChecked
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
