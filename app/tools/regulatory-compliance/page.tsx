// Regulatory Compliance Tool - Art.43/47/71/72/73
// Client Component: conformity assessment, EU declaration of conformity,
// post-market monitoring, market surveillance, and incident reporting

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AISystem {
  id: string;
  name: string;
  riskLevel?: string;
}

type TabId =
  | "conformity"
  | "declaration"
  | "post-market"
  | "surveillance"
  | "incident";

interface TabDef {
  id: TabId;
  label: string;
  article: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface DeclarationField {
  id: string;
  label: string;
  value: string;
}

interface IncidentReport {
  id: string;
  label: string;
  value: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TABS: TabDef[] = [
  { id: "conformity", label: "Conformity Assessment", article: "Art.43" },
  { id: "declaration", label: "EU Declaration of Conformity", article: "Art.47" },
  { id: "post-market", label: "Post-Market Monitoring", article: "Art.71" },
  { id: "surveillance", label: "Market Surveillance", article: "Art.72" },
  { id: "incident", label: "Incident Reporting", article: "Art.73" },
];

const CONFORMITY_ITEMS: ChecklistItem[] = [
  { id: "c1", label: "Internal control checks completed for all high-risk requirements (Arts.8-15)", checked: false },
  { id: "c2", label: "Technical documentation prepared in accordance with Annex IV", checked: false },
  { id: "c3", label: "Testing and validation procedures executed and documented", checked: false },
  { id: "c4", label: "Quality management system (QMS) established per Art.17", checked: false },
  { id: "c5", label: "CE marking affixed to the AI system or its packaging", checked: false },
  { id: "c6", label: "EU declaration of conformity drafted per Annex VI", checked: false },
  { id: "c7", label: "Registration in the EU AI Database completed", checked: false },
  { id: "c8", label: "Post-market surveillance plan established", checked: false },
  { id: "c9", label: "Notified body involvement confirmed (if applicable)", checked: false },
  { id: "c10", label: "Instructions of use provided to deployers", checked: false },
];

const POST_MARKET_ITEMS: ChecklistItem[] = [
  { id: "pm1", label: "Data collection strategy defined for real-world performance monitoring", checked: false },
  { id: "pm2", label: "Performance metrics and KPIs established (accuracy, bias, reliability)", checked: false },
  { id: "pm3", label: "Incident detection and logging mechanism implemented", checked: false },
  { id: "pm4", label: "User feedback collection process in place", checked: false },
  { id: "pm5", label: "Periodic review schedule defined (at least annually)", checked: false },
  { id: "pm6", label: "Reporting obligations to market surveillance authorities documented", checked: false },
];

const SURVEILLANCE_ITEMS: ChecklistItem[] = [
  { id: "ms1", label: "Cooperation procedures with national market surveillance authorities established", checked: false },
  { id: "ms2", label: "Documentation access protocol for authority requests defined", checked: false },
  { id: "ms3", label: "Testing support and sample provision process documented", checked: false },
  { id: "ms4", label: "Corrective action procedures for non-compliant systems defined", checked: false },
  { id: "ms5", label: "Communication obligations and timelines documented", checked: false },
];

const INCIDENT_ITEMS: ChecklistItem[] = [
  { id: "ir1", label: "Incident identification and classification procedure in place", checked: false },
  { id: "ir2", label: "Severity assessment framework defined (critical / serious / moderate)", checked: false },
  { id: "ir3", label: "Notification timeline adhered to (within 15 days of awareness)", checked: false },
  { id: "ir4", label: "Authority contact information recorded and up to date", checked: false },
  { id: "ir5", label: "Follow-up actions and remediation plan documented", checked: false },
];

const DECLARATION_FIELDS: DeclarationField[] = [
  { id: "d1", label: "Provider Name and Address", value: "" },
  { id: "d2", label: "AI System Description and Identifier", value: "" },
  { id: "d3", label: "Applicable Provisions (Articles 8-15, Annex IV)", value: "" },
  { id: "d4", label: "Conformity Assessment Body (if applicable)", value: "" },
  { id: "d5", label: "References to Relevant Harmonised Standards", value: "" },
  { id: "d6", label: "Statement of Compliance", value: "" },
  { id: "d7", label: "Declaration Date", value: "" },
  { id: "d8", label: "Authorized Representative (name and address)", value: "" },
  { id: "d9", label: "Signature (responsible person name and function)", value: "" },
];

const INCIDENT_FIELDS: IncidentReport[] = [
  { id: "if1", label: "Incident Identification", value: "" },
  { id: "if2", label: "Severity Assessment", value: "" },
  { id: "if3", label: "Notification Timeline (date of awareness)", value: "" },
  { id: "if4", label: "Authority Contact Information", value: "" },
  { id: "if5", label: "Follow-Up Actions", value: "" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function countChecked(items: ChecklistItem[]): number {
  return items.filter((i) => i.checked).length;
}

function progressPercent(checked: number, total: number): number {
  return total === 0 ? 0 : Math.round((checked / total) * 100);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RegulatoryCompliancePage() {
  const t = useTranslations();

  /* ---- state ---- */
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("conformity");
  const [isLoadingSystems, setIsLoadingSystems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tab data
  const [conformityItems, setConformityItems] = useState<ChecklistItem[]>(CONFORMITY_ITEMS);
  const [postMarketItems, setPostMarketItems] = useState<ChecklistItem[]>(POST_MARKET_ITEMS);
  const [surveillanceItems, setSurveillanceItems] = useState<ChecklistItem[]>(SURVEILLANCE_ITEMS);
  const [incidentItems, setIncidentItems] = useState<ChecklistItem[]>(INCIDENT_ITEMS);
  const [declarationFields, setDeclarationFields] = useState<DeclarationField[]>(DECLARATION_FIELDS);
  const [incidentFields, setIncidentFields] = useState<IncidentReport[]>(INCIDENT_FIELDS);

  /* ---- fetch AI systems ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoadingSystems(true);
        const res = await fetch("/api/ai-systems");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            const list: AISystem[] = data.data ?? [];
            setSystems(list);
            if (list.length > 0 && list[0]) setSelectedSystemId(list[0].id);
          }
        }
      } catch {
        // silent fail - user can still use tool without system selection
      } finally {
        if (!cancelled) setIsLoadingSystems(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- auto-save ---- */
  const saveDocument = useCallback(async () => {
    if (!selectedSystemId) return;
    setSaving(true);
    try {
      const payload = {
        type: "regulatory-compliance",
        systemId: selectedSystemId,
        tab: activeTab,
        conformity: conformityItems,
        declaration: declarationFields,
        postMarket: postMarketItems,
        surveillance: surveillanceItems,
        incident: incidentItems,
        incidentReport: incidentFields,
      };
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveStatus("Saved");
      } else {
        setSaveStatus("Save failed");
      }
    } catch {
      setSaveStatus("Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, [
    selectedSystemId,
    activeTab,
    conformityItems,
    declarationFields,
    postMarketItems,
    surveillanceItems,
    incidentItems,
    incidentFields,
  ]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveDocument();
    }, 2000);
  }, [saveDocument]);

  /* ---- toggle helpers ---- */
  const toggleChecklistItem = useCallback(
    (tab: TabId, id: string) => {
      const updater = (items: ChecklistItem[]) =>
        items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));

      if (tab === "conformity") {
        setConformityItems(updater);
      } else if (tab === "post-market") {
        setPostMarketItems(updater);
      } else if (tab === "surveillance") {
        setSurveillanceItems(updater);
      } else if (tab === "incident") {
        setIncidentItems(updater);
      }
      scheduleAutoSave();
    },
    [scheduleAutoSave]
  );

  const updateDeclarationField = useCallback(
    (id: string, value: string) => {
      setDeclarationFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, value } : f))
      );
      scheduleAutoSave();
    },
    [scheduleAutoSave]
  );

  const updateIncidentField = useCallback(
    (id: string, value: string) => {
      setIncidentFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, value } : f))
      );
      scheduleAutoSave();
    },
    [scheduleAutoSave]
  );

  /* ---- progress calculations ---- */
  const conformityChecked = countChecked(conformityItems);
  const postMarketChecked = countChecked(postMarketItems);
  const surveillanceChecked = countChecked(surveillanceItems);
  const incidentChecked = countChecked(incidentItems);
  const declarationFilled = declarationFields.filter((f) => f.value.trim() !== "").length;

  const tabProgress: Record<TabId, number> = {
    conformity: progressPercent(conformityChecked, conformityItems.length),
    declaration: progressPercent(declarationFilled, declarationFields.length),
    "post-market": progressPercent(postMarketChecked, postMarketItems.length),
    surveillance: progressPercent(surveillanceChecked, surveillanceItems.length),
    incident: progressPercent(incidentChecked, incidentItems.length),
  };

  /* ---- cleanup timer ---- */
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Regulatory Compliance</h1>
            <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-600">{t("tools.results")}            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Art.43 / Art.47 / Art.71 / Art.72 / Art.73 -- Conformity
            assessment, EU declaration of conformity, post-market monitoring,
            market surveillance, and incident reporting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus && (
            <span
              className={`text-xs font-medium ${
                saveStatus === "Saved"
                  ? "text-accent"
                  : "text-destructive"
              }`}
            >
              {saveStatus === "Saved" ? "Auto-saved" : saveStatus}
            </span>
          )}
          {saving && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>
      </div>

      {/* System Selector */}
      <div className="mt-6 rounded-lg border border-border bg-background p-4">
        <label
          htmlFor="system-select"
          className="block text-sm font-medium"
        >{t("tools.selectSystem")}        </label>
        <select
          id="system-select"
          value={selectedSystemId}
          onChange={(e) => setSelectedSystemId(e.target.value)}
          disabled={isLoadingSystems}
          className="mt-1.5 block h-10 w-full rounded-md border border-border bg-background px-3 text-sm transition-colors focus:border-ring focus:outline-none disabled:opacity-50"
        >
          {isLoadingSystems ? (
            <option>{t("common.loading")}</option>
          ) : systems.length === 0 ? (
            <option value="">No AI systems found</option>
          ) : (
            systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.riskLevel ? ` (${s.riskLevel})` : ""}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            <span>{tab.label}</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {tab.article}
            </span>
            {/* Progress dot */}
            <span className="ml-1 text-[10px] text-muted-foreground">
              {tabProgress[tab.id]}%
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* ---------- Conformity Assessment (Art.43) ---------- */}
        {activeTab === "conformity" && (
          <TabPanel
            title="Conformity Assessment (Art.43)"
            description="Checklist for conformity assessment procedures before placing a high-risk AI system on the market."
            progress={tabProgress.conformity}
            checked={conformityChecked}
            total={conformityItems.length}
          >
            <ChecklistSection
              items={conformityItems}
              onToggle={(id) => toggleChecklistItem("conformity", id)}
            />
          </TabPanel>
        )}

        {/* ---------- EU Declaration of Conformity (Art.47) ---------- */}
        {activeTab === "declaration" && (
          <TabPanel
            title="EU Declaration of Conformity (Art.47)"
            description="Template for the EU declaration of conformity as required by Annex VI."
            progress={tabProgress.declaration}
            checked={declarationFilled}
            total={declarationFields.length}
          >
            <DeclarationForm
              fields={declarationFields}
              onChange={updateDeclarationField}
            />
          </TabPanel>
        )}

        {/* ---------- Post-Market Monitoring (Art.71) ---------- */}
        {activeTab === "post-market" && (
          <TabPanel
            title="Post-Market Monitoring (Art.71)"
            description="Checklist for establishing and maintaining post-market monitoring obligations."
            progress={tabProgress["post-market"]}
            checked={postMarketChecked}
            total={postMarketItems.length}
          >
            <ChecklistSection
              items={postMarketItems}
              onToggle={(id) => toggleChecklistItem("post-market", id)}
            />
          </TabPanel>
        )}

        {/* ---------- Market Surveillance (Art.72) ---------- */}
        {activeTab === "surveillance" && (
          <TabPanel
            title="Market Surveillance (Art.72)"
            description="Checklist for cooperation with market surveillance authorities."
            progress={tabProgress.surveillance}
            checked={surveillanceChecked}
            total={surveillanceItems.length}
          >
            <ChecklistSection
              items={surveillanceItems}
              onToggle={(id) => toggleChecklistItem("surveillance", id)}
            />
          </TabPanel>
        )}

        {/* ---------- Incident Reporting (Art.73) ---------- */}
        {activeTab === "incident" && (
          <TabPanel
            title="Incident Reporting (Art.73)"
            description="Form and checklist for serious incident reporting obligations."
            progress={tabProgress.incident}
            checked={incidentChecked}
            total={incidentItems.length}
          >
            <IncidentForm
              fields={incidentFields}
              onChange={updateIncidentField}
            />
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Incident Reporting Checklist</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Verify each step has been completed for the reported incident.
              </p>
              <ChecklistSection
                items={incidentItems}
                onToggle={(id) => toggleChecklistItem("incident", id)}
              />
            </div>
          </TabPanel>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function TabPanel({
  title,
  description,
  progress,
  checked,
  total,
  children,
}: {
  title: string;
  description: string;
  progress: number;
  checked: number;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background">
      {/* Panel header */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {checked}/{total}
            </span>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-primary">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Panel body */}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function ChecklistSection({
  items,
  onToggle,
}: {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/30">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggle(item.id)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary accent-primary"
            />
            <span
              className={`text-sm leading-snug ${
                item.checked
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }`}
            >
              {item.label}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function DeclarationForm({
  fields,
  onChange,
}: {
  fields: DeclarationField[];
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <div key={field.id}>
          <label
            htmlFor={field.id}
            className="block text-sm font-medium"
          >
            {field.label}
          </label>
          {field.id === "d6" ? (
            <textarea
              id={field.id}
              rows={3}
              value={field.value}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder="Enter the statement of compliance..."
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          ) : (
            <input
              id={field.id}
              type={field.id === "d7" ? "date" : "text"}
              value={field.value}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              className="mt-1 block h-10 w-full rounded-md border border-border bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function IncidentForm({
  fields,
  onChange,
}: {
  fields: IncidentReport[];
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold">Incident Report Form</h3>
      <p className="text-xs text-muted-foreground">
        Complete the following fields for each serious incident. Notifications
        must be submitted to the relevant market surveillance authority within 15
        days of becoming aware of the incident.
      </p>
      {fields.map((field) => (
        <div key={field.id}>
          <label
            htmlFor={field.id}
            className="block text-sm font-medium"
          >
            {field.label}
          </label>
          {field.id === "if5" ? (
            <textarea
              id={field.id}
              rows={3}
              value={field.value}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder="Describe follow-up actions and remediation plan..."
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          ) : (
            <input
              id={field.id}
              type={field.id === "if3" ? "date" : "text"}
              value={field.value}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              className="mt-1 block h-10 w-full rounded-md border border-border bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          )}
        </div>
      ))}
    </div>
  );
}
