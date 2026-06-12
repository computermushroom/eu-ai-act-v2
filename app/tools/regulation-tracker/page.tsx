// Regulation Change Push & Impact Analysis Tool
// Client Component: tracks regulation updates with impact analysis

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Status = "active" | "pending" | "draft";
type Impact = "high" | "medium" | "low";

interface RegulationUpdate {
  id: string;
  title: string;
  date: string;
  status: Status;
  impact: Impact;
  summary: string;
  affectedArticles: string[];
  requiredActions: string[];
  deadline: string;
  estimatedEffort: string;
}

const REGULATIONS: RegulationUpdate[] = [
  {
    id: "reg-1",
    title: "EU AI Act Enforcement Begins - Feb 2025",
    date: "2025-02-02",
    status: "active",
    impact: "high",
    summary:
      "The EU AI Act's first enforcement milestone takes effect on February 2, 2025. Prohibited AI practices under Art.5 and transparency obligations under Art.50 become enforceable. Organizations deploying AI systems must ensure immediate compliance with banned practices and disclosure requirements.",
    affectedArticles: ["Art.5 (Prohibited Practices)", "Art.50 (Transparency)", "Art.78 (Penalties)"],
    requiredActions: [
      "Audit all AI systems for prohibited practices under Art.5",
      "Implement transparency disclosures for chatbots and AI-generated content",
      "Review emotion recognition systems for compliance",
      "Establish internal compliance reporting procedures",
      "Train staff on prohibited practice identification",
    ],
    deadline: "February 2, 2025",
    estimatedEffort: "High - 3-6 months for full compliance program",
  },
  {
    id: "reg-2",
    title: "Updated Guidelines on Prohibited AI Practices",
    date: "2025-03-15",
    status: "active",
    impact: "medium",
    summary:
      "The European AI Office has published updated guidelines clarifying the scope and interpretation of prohibited AI practices under Art.5. The guidelines provide detailed examples of subliminal manipulation, vulnerability exploitation, and social scoring scenarios, along with compliance checklists for each prohibited category.",
    affectedArticles: ["Art.5(1)(a) - Subliminal Techniques", "Art.5(1)(b) - Vulnerability Exploitation", "Art.5(1)(c) - Social Scoring"],
    requiredActions: [
      "Review updated guidelines against current AI system inventory",
      "Update internal risk assessment frameworks",
      "Conduct gap analysis for newly clarified prohibited scenarios",
      "Revise compliance documentation and policies",
    ],
    deadline: "Immediate - guidelines already in effect",
    estimatedEffort: "Medium - 1-3 months for review and gap analysis",
  },
  {
    id: "reg-3",
    title: "New GPAI Code of Practice Published",
    date: "2025-04-01",
    status: "active",
    impact: "high",
    summary:
      "The first Code of Practice for General-Purpose AI (GPAI) models has been finalized under Art.56. The code establishes standards for transparency, copyright compliance, safety testing, and risk mitigation for GPAI model providers. Providers of GPAI models with systemic risk face additional obligations.",
    affectedArticles: ["Art.51 (GPAI Definitions)", "Art.52 (GPAI Obligations)", "Art.53 (GPAI Systemic Risk)", "Art.55 (Codes of Practice)", "Art.56 (Compliance)"],
    requiredActions: [
      "Assess whether deployed models qualify as GPAI under Art.51",
      "Review and implement GPAI Code of Practice requirements",
      "Establish technical documentation for GPAI models",
      "Implement copyright compliance policies for training data",
      "Conduct safety evaluations and red-teaming assessments",
      "Report systemic risk assessments if applicable",
    ],
    deadline: "August 2, 2025 (full compliance deadline)",
    estimatedEffort: "High - 4-8 months for GPAI providers",
  },
  {
    id: "reg-4",
    title: "Harmonized Standards for Art.9 Risk Management",
    date: "2025-06-01",
    status: "pending",
    impact: "medium",
    summary:
      "CEN-CENELEC has drafted harmonized standards for Art.9 risk management requirements. Once adopted, compliance with these standards will create a presumption of conformity with Art.9 obligations. The standards cover risk identification, analysis, evaluation, and mitigation throughout the AI system lifecycle.",
    affectedArticles: ["Art.9 (Risk Management)", "Art.8 (Risk Management System)", "Annex IV (Technical Documentation - Risk Section)"],
    requiredActions: [
      "Monitor harmonized standard adoption timeline",
      "Review current risk management processes against draft standards",
      "Plan updates to risk management documentation",
      "Assess impact on existing conformity assessments",
    ],
    deadline: "Expected Q4 2025 - pending formal adoption",
    estimatedEffort: "Medium - 2-4 months for standards alignment",
  },
  {
    id: "reg-5",
    title: "Amendment to Annex IV Technical Documentation",
    date: "2025-07-15",
    status: "pending",
    impact: "low",
    summary:
      "A proposed amendment to Annex IV technical documentation requirements introduces additional fields for GPAI model documentation and clarifies existing requirements for high-risk AI systems. The amendment adds sections on environmental impact assessment and energy efficiency metrics.",
    affectedArticles: ["Art.11 (Technical Documentation)", "Annex IV (Technical Documentation Requirements)", "Art.52(3) (GPAI Documentation)"],
    requiredActions: [
      "Review proposed amendments to Annex IV",
      "Identify gaps in current technical documentation",
      "Plan documentation updates for new required sections",
      "Assess need for environmental impact assessment capabilities",
    ],
    deadline: "Expected Q1 2026 - pending legislative process",
    estimatedEffort: "Low - 1-2 months for documentation updates",
  },
  {
    id: "reg-6",
    title: "European AI Office Established - Reporting Requirements",
    date: "2025-05-01",
    status: "active",
    impact: "high",
    summary:
      "The European AI Office has been formally established under Art.57 with full operational capacity. New reporting requirements for providers of GPAI models with systemic risk and high-risk AI system providers are now in effect. The Office will coordinate market surveillance, enforce GPAI rules, and issue guidance.",
    affectedArticles: ["Art.57 (European AI Office)", "Art.58 (Board)", "Art.62 (Serious Incident Reporting)", "Art.64 (Market Surveillance)", "Art.71 (Post-Market Monitoring)"],
    requiredActions: [
      "Register with the European AI Office if applicable",
      "Establish serious incident reporting procedures (Art.62)",
      "Implement post-market monitoring systems (Art.72)",
      "Designate contact points for regulatory inquiries",
      "Review and update conformity assessment procedures",
      "Ensure market surveillance cooperation mechanisms are in place",
    ],
    deadline: "Active - immediate compliance required",
    estimatedEffort: "High - 3-6 months for full reporting infrastructure",
  },
];

const STATUS_STYLES: Record<Status, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  draft: "bg-gray-100 text-gray-600",
};

const IMPACT_STYLES: Record<Impact, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-orange-100 text-orange-700",
  low: "bg-blue-100 text-blue-700",
};

export default function RegulationTrackerPage() {
  const t = useTranslations();

  const [selectedRegulation, setSelectedRegulation] =
    useState<RegulationUpdate | null>(null);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Monitoring
          </span>
          <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">{t("tools.results")}          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Regulation Change &amp; Impact Analysis
        </h1>
        <p className="text-muted-foreground">
          Track regulatory updates, analyze their impact on your compliance
          obligations, and plan required actions.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-background p-4 text-center">
          <p className="text-2xl font-bold">
            {REGULATIONS.filter((r) => r.status === "active").length}
          </p>
          <p className="text-xs text-muted-foreground">Active Regulations</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4 text-center">
          <p className="text-2xl font-bold">
            {REGULATIONS.filter((r) => r.status === "pending").length}
          </p>
          <p className="text-xs text-muted-foreground">Pending Updates</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4 text-center">
          <p className="text-2xl font-bold">
            {REGULATIONS.filter((r) => r.impact === "high").length}
          </p>
          <p className="text-xs text-muted-foreground">High Impact</p>
        </div>
      </div>

      {/* Regulation List */}
      <div className="mt-8 space-y-4">
        {REGULATIONS.map((reg) => (
          <div
            key={reg.id}
            className="rounded-lg border border-border bg-background p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold">{reg.title}</h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[reg.status]}`}
                  >
                    {reg.status}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${IMPACT_STYLES[reg.impact]}`}
                  >
                    {reg.impact} impact
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Published: {reg.date}
                </p>
                <p className="text-sm text-muted-foreground">{reg.summary}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRegulation(reg)}
                className="inline-flex h-9 flex-shrink-0 items-center justify-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Analyze Impact
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Impact Analysis Modal */}
      {selectedRegulation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-background p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">
                  Impact Analysis
                </h2>
                <p className="text-sm font-medium text-primary">
                  {selectedRegulation.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRegulation(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm transition-colors hover:bg-muted"
              >
                X
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Status & Impact */}
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[selectedRegulation.status]}`}
                >
                  {selectedRegulation.status}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${IMPACT_STYLES[selectedRegulation.impact]}`}
                >
                  {selectedRegulation.impact} impact
                </span>
                <span className="text-xs text-muted-foreground">
                  Published: {selectedRegulation.date}
                </span>
              </div>

              {/* Summary */}
              <div>
                <h3 className="text-sm font-semibold">Summary</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedRegulation.summary}
                </p>
              </div>

              {/* Affected Articles */}
              <div>
                <h3 className="text-sm font-semibold">Affected Articles</h3>
                <ul className="mt-2 space-y-1">
                  {selectedRegulation.affectedArticles.map((article) => (
                    <li
                      key={article}
                      className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      {article}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Actions */}
              <div>
                <h3 className="text-sm font-semibold">Required Actions</h3>
                <ul className="mt-2 space-y-1">
                  {selectedRegulation.requiredActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {idx + 1}
                      </span>
                      <span className="text-muted-foreground">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Deadline & Effort */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedRegulation.deadline}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">
                    Estimated Effort
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedRegulation.estimatedEffort}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRegulation(null)}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-6 text-sm font-medium transition-colors hover:bg-muted"
                >{t("common.close")}                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
