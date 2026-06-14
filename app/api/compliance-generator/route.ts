// Compliance Generator API - One-Click Compliance Document Generation
// GET:  Returns generation status and available items for the user's subscription tier
// POST: Generates all (or selected) compliance documents and assessments for a given AI system
//
// Tier capabilities:
//   free:         risk-assessment, url-scan
//   starter:      + prohibited-practices, transparency, basic-docs
//   professional: + lifecycle, data-governance, specialized-checks, fria, technical-doc
//   business:     + qms, deployer-obligations, regulatory-compliance, industry-templates, role-obligations, evidence-pack
//   enterprise:   + gpai-compliance, gdpr-scan, regulation-tracker, custom-checklists, ai-assistant

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GenerationItem {
  id: string;
  title: string;
  description: string;
  articleRef: string;
  type: string; // "document" | "fria" | "qms" | "scan"
}

interface SystemWithRelations {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  systemType: string;
  status: string;
  riskLevel: string | null;
  industry: string | null;
  art6Compliant: boolean;
  art9Compliant: boolean;
  art10Compliant: boolean;
  art12Compliant: boolean;
  art13Compliant: boolean;
  art14Compliant: boolean;
  art15Compliant: boolean;
  art17Compliant: boolean;
  art27Compliant: boolean;
  createdAt: Date;
  updatedAt: Date;
  deployedAt: Date | null;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  fria: {
    id: string;
    status: string;
    overallScore: number | null;
    section1: string | null;
    section2: string | null;
    section3: string | null;
    section4: string | null;
    section5: string | null;
    section6: string | null;
  } | null;
  qms: {
    id: string;
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
  } | null;
  scanResults: {
    id: string;
    scanType: string;
    score: number;
    status: string;
    findings: string | null;
    createdAt: Date;
  }[];
  documents: {
    id: string;
    type: string;
    title: string;
    status: string;
    createdAt: Date;
  }[];
}

interface ComplianceAnalysis {
  riskLevel: string;
  systemType: string;
  industry: string | null;
  isHighRisk: boolean;
  isLimitedRisk: boolean;
  isUnacceptableRisk: boolean;
  isMinimalRisk: boolean;
  applicableAnnexIII: string[];
  prohibitedPracticesRisk: string[];
  transparencyRequired: boolean;
  transparencyArticles: string[];
  complianceFlags: Record<string, boolean>;
  gaps: Array<{ article: string; label: string; compliant: boolean; severity: string }>;
  scanFindings: Array<{ type: string; status: string; score: number; summary: string }>;
  overallComplianceScore: number;
}

// ---------------------------------------------------------------------------
// Tier capability definitions
// ---------------------------------------------------------------------------

const TIER_ITEMS: Record<string, GenerationItem[]> = {
  free: [
    {
      id: "risk-assessment",
      title: "Risk Classification Report",
      description: "Art.6 self-assessment for AI system risk levels (unacceptable, high, limited, minimal)",
      articleRef: "Art.6",
      type: "document",
    },
    {
      id: "url-scan",
      title: "URL Compliance Scan",
      description: "Scan any URL for AI compliance indicators, GDPR notices, and risk markers",
      articleRef: "General",
      type: "scan",
    },
  ],
  starter: [
    {
      id: "risk-assessment",
      title: "Risk Classification Report",
      description: "Art.6 self-assessment for AI system risk levels (unacceptable, high, limited, minimal)",
      articleRef: "Art.6",
      type: "document",
    },
    {
      id: "url-scan",
      title: "URL Compliance Scan",
      description: "Scan any URL for AI compliance indicators, GDPR notices, and risk markers",
      articleRef: "General",
      type: "scan",
    },
    {
      id: "prohibited-practices",
      title: "Prohibited Practices Check",
      description: "Check your system against Art.5 banned AI practices including social scoring, real-time biometric identification, and exploitation of vulnerabilities",
      articleRef: "Art.5",
      type: "document",
    },
    {
      id: "transparency",
      title: "Transparency Obligations Check",
      description: "Verify Art.50 transparency obligations including disclosure of AI interaction, emotional manipulation, and biometric categorisation",
      articleRef: "Art.50",
      type: "document",
    },
    {
      id: "basic-docs",
      title: "Basic Technical Documentation",
      description: "Foundational technical documentation covering system overview, intended purpose, and basic architecture",
      articleRef: "Art.11",
      type: "document",
    },
  ],
  professional: [
    {
      id: "risk-assessment",
      title: "Risk Classification Report",
      description: "Art.6 self-assessment for AI system risk levels (unacceptable, high, limited, minimal)",
      articleRef: "Art.6",
      type: "document",
    },
    {
      id: "url-scan",
      title: "URL Compliance Scan",
      description: "Scan any URL for AI compliance indicators, GDPR notices, and risk markers",
      articleRef: "General",
      type: "scan",
    },
    {
      id: "prohibited-practices",
      title: "Prohibited Practices Check",
      description: "Check your system against Art.5 banned AI practices including social scoring, real-time biometric identification, and exploitation of vulnerabilities",
      articleRef: "Art.5",
      type: "document",
    },
    {
      id: "transparency",
      title: "Transparency Obligations Check",
      description: "Verify Art.50 transparency obligations including disclosure of AI interaction, emotional manipulation, and biometric categorisation",
      articleRef: "Art.50",
      type: "document",
    },
    {
      id: "basic-docs",
      title: "Basic Technical Documentation",
      description: "Foundational technical documentation covering system overview, intended purpose, and basic architecture",
      articleRef: "Art.11",
      type: "document",
    },
    {
      id: "lifecycle",
      title: "Lifecycle Management Report",
      description: "Art.9 risk management system covering design, development, deployment, monitoring, and decommissioning phases",
      articleRef: "Art.9",
      type: "document",
    },
    {
      id: "data-governance",
      title: "Data Governance Assessment",
      description: "Art.10 training data governance covering data quality, relevance, bias mitigation, and provenance tracking",
      articleRef: "Art.10",
      type: "document",
    },
    {
      id: "specialized-checks",
      title: "Specialized Compliance Checks",
      description: "Art.12-15 checks covering technical documentation adequacy, record-keeping, transparency, and human oversight",
      articleRef: "Art.12-15",
      type: "document",
    },
    {
      id: "fria",
      title: "Fundamental Rights Impact Assessment",
      description: "Art.27 FRIA covering system purpose, legal basis, risks to fundamental rights, mitigation measures, stakeholder consultation, and authority notification",
      articleRef: "Art.27",
      type: "fria",
    },
    {
      id: "technical-doc",
      title: "Full Technical Documentation (Annex IV)",
      description: "Comprehensive Annex IV technical documentation including system design, training methodology, performance metrics, and risk management",
      articleRef: "Annex IV",
      type: "document",
    },
  ],
  business: [
    {
      id: "risk-assessment",
      title: "Risk Classification Report",
      description: "Art.6 self-assessment for AI system risk levels (unacceptable, high, limited, minimal)",
      articleRef: "Art.6",
      type: "document",
    },
    {
      id: "url-scan",
      title: "URL Compliance Scan",
      description: "Scan any URL for AI compliance indicators, GDPR notices, and risk markers",
      articleRef: "General",
      type: "scan",
    },
    {
      id: "prohibited-practices",
      title: "Prohibited Practices Check",
      description: "Check your system against Art.5 banned AI practices including social scoring, real-time biometric identification, and exploitation of vulnerabilities",
      articleRef: "Art.5",
      type: "document",
    },
    {
      id: "transparency",
      title: "Transparency Obligations Check",
      description: "Verify Art.50 transparency obligations including disclosure of AI interaction, emotional manipulation, and biometric categorisation",
      articleRef: "Art.50",
      type: "document",
    },
    {
      id: "basic-docs",
      title: "Basic Technical Documentation",
      description: "Foundational technical documentation covering system overview, intended purpose, and basic architecture",
      articleRef: "Art.11",
      type: "document",
    },
    {
      id: "lifecycle",
      title: "Lifecycle Management Report",
      description: "Art.9 risk management system covering design, development, deployment, monitoring, and decommissioning phases",
      articleRef: "Art.9",
      type: "document",
    },
    {
      id: "data-governance",
      title: "Data Governance Assessment",
      description: "Art.10 training data governance covering data quality, relevance, bias mitigation, and provenance tracking",
      articleRef: "Art.10",
      type: "document",
    },
    {
      id: "specialized-checks",
      title: "Specialized Compliance Checks",
      description: "Art.12-15 checks covering technical documentation adequacy, record-keeping, transparency, and human oversight",
      articleRef: "Art.12-15",
      type: "document",
    },
    {
      id: "fria",
      title: "Fundamental Rights Impact Assessment",
      description: "Art.27 FRIA covering system purpose, legal basis, risks to fundamental rights, mitigation measures, stakeholder consultation, and authority notification",
      articleRef: "Art.27",
      type: "fria",
    },
    {
      id: "technical-doc",
      title: "Full Technical Documentation (Annex IV)",
      description: "Comprehensive Annex IV technical documentation including system design, training methodology, performance metrics, and risk management",
      articleRef: "Annex IV",
      type: "document",
    },
    {
      id: "qms",
      title: "Quality Management System Checklist",
      description: "Art.17 QMS covering risk management, data governance, technical documentation, record-keeping, transparency, human oversight, accuracy, cybersecurity, quality control, post-market monitoring, and incident reporting",
      articleRef: "Art.17",
      type: "qms",
    },
    {
      id: "deployer-obligations",
      title: "Deployer Obligations Checklist",
      description: "Art.26 deployer obligations covering use of high-risk AI systems, human oversight, fundamental rights impact, and logging requirements",
      articleRef: "Art.26",
      type: "document",
    },
    {
      id: "regulatory-compliance",
      title: "Regulatory Compliance Report",
      description: "Art.43-73 comprehensive regulatory compliance covering conformity assessment, CE marking, market surveillance, post-market monitoring, and enforcement",
      articleRef: "Art.43-73",
      type: "document",
    },
    {
      id: "industry-templates",
      title: "Industry-Specific Compliance Templates",
      description: "Pre-built compliance templates tailored to your industry sector including healthcare, finance, marketing, and customer service",
      articleRef: "General",
      type: "document",
    },
    {
      id: "role-obligations",
      title: "Role-Based Obligations Matrix",
      description: "Comprehensive matrix of obligations by role (provider, deployer, importer, distributor, manufacturer, authorized representative)",
      articleRef: "General",
      type: "document",
    },
    {
      id: "evidence-pack",
      title: "Evidence Pack Summary",
      description: "Consolidated evidence pack for demonstrating compliance to regulators, including all generated documents and assessment results",
      articleRef: "General",
      type: "document",
    },
  ],
  enterprise: [
    {
      id: "risk-assessment",
      title: "Risk Classification Report",
      description: "Art.6 self-assessment for AI system risk levels (unacceptable, high, limited, minimal)",
      articleRef: "Art.6",
      type: "document",
    },
    {
      id: "url-scan",
      title: "URL Compliance Scan",
      description: "Scan any URL for AI compliance indicators, GDPR notices, and risk markers",
      articleRef: "General",
      type: "scan",
    },
    {
      id: "prohibited-practices",
      title: "Prohibited Practices Check",
      description: "Check your system against Art.5 banned AI practices including social scoring, real-time biometric identification, and exploitation of vulnerabilities",
      articleRef: "Art.5",
      type: "document",
    },
    {
      id: "transparency",
      title: "Transparency Obligations Check",
      description: "Verify Art.50 transparency obligations including disclosure of AI interaction, emotional manipulation, and biometric categorisation",
      articleRef: "Art.50",
      type: "document",
    },
    {
      id: "basic-docs",
      title: "Basic Technical Documentation",
      description: "Foundational technical documentation covering system overview, intended purpose, and basic architecture",
      articleRef: "Art.11",
      type: "document",
    },
    {
      id: "lifecycle",
      title: "Lifecycle Management Report",
      description: "Art.9 risk management system covering design, development, deployment, monitoring, and decommissioning phases",
      articleRef: "Art.9",
      type: "document",
    },
    {
      id: "data-governance",
      title: "Data Governance Assessment",
      description: "Art.10 training data governance covering data quality, relevance, bias mitigation, and provenance tracking",
      articleRef: "Art.10",
      type: "document",
    },
    {
      id: "specialized-checks",
      title: "Specialized Compliance Checks",
      description: "Art.12-15 checks covering technical documentation adequacy, record-keeping, transparency, and human oversight",
      articleRef: "Art.12-15",
      type: "document",
    },
    {
      id: "fria",
      title: "Fundamental Rights Impact Assessment",
      description: "Art.27 FRIA covering system purpose, legal basis, risks to fundamental rights, mitigation measures, stakeholder consultation, and authority notification",
      articleRef: "Art.27",
      type: "fria",
    },
    {
      id: "technical-doc",
      title: "Full Technical Documentation (Annex IV)",
      description: "Comprehensive Annex IV technical documentation including system design, training methodology, performance metrics, and risk management",
      articleRef: "Annex IV",
      type: "document",
    },
    {
      id: "qms",
      title: "Quality Management System Checklist",
      description: "Art.17 QMS covering risk management, data governance, technical documentation, record-keeping, transparency, human oversight, accuracy, cybersecurity, quality control, post-market monitoring, and incident reporting",
      articleRef: "Art.17",
      type: "qms",
    },
    {
      id: "deployer-obligations",
      title: "Deployer Obligations Checklist",
      description: "Art.26 deployer obligations covering use of high-risk AI systems, human oversight, fundamental rights impact, and logging requirements",
      articleRef: "Art.26",
      type: "document",
    },
    {
      id: "regulatory-compliance",
      title: "Regulatory Compliance Report",
      description: "Art.43-73 comprehensive regulatory compliance covering conformity assessment, CE marking, market surveillance, post-market monitoring, and enforcement",
      articleRef: "Art.43-73",
      type: "document",
    },
    {
      id: "industry-templates",
      title: "Industry-Specific Compliance Templates",
      description: "Pre-built compliance templates tailored to your industry sector including healthcare, finance, marketing, and customer service",
      articleRef: "General",
      type: "document",
    },
    {
      id: "role-obligations",
      title: "Role-Based Obligations Matrix",
      description: "Comprehensive matrix of obligations by role (provider, deployer, importer, distributor, manufacturer, authorized representative)",
      articleRef: "General",
      type: "document",
    },
    {
      id: "evidence-pack",
      title: "Evidence Pack Summary",
      description: "Consolidated evidence pack for demonstrating compliance to regulators, including all generated documents and assessment results",
      articleRef: "General",
      type: "document",
    },
    {
      id: "gpai-compliance",
      title: "GPAI Obligations Checklist",
      description: "GPAI model obligations under Art.51-56 including technical documentation, copyright compliance, and systemic risk assessment",
      articleRef: "Art.51-56",
      type: "document",
    },
    {
      id: "gdpr-scan",
      title: "GDPR Compliance Assessment",
      description: "Comprehensive GDPR compliance scan covering data processing lawfulness, data subject rights, DPIA requirements, and cross-regulation alignment with the EU AI Act",
      articleRef: "GDPR / Art.36",
      type: "document",
    },
    {
      id: "regulation-tracker",
      title: "Regulation Change Analysis",
      description: "Tracking and analysis of regulatory changes affecting AI compliance, including implementation timelines and impact assessment",
      articleRef: "General",
      type: "document",
    },
    {
      id: "custom-checklists",
      title: "Custom Compliance Checklists",
      description: "Tailorable compliance checklists that can be customised for specific organisational needs, additional regulatory frameworks, or internal policies",
      articleRef: "General",
      type: "document",
    },
    {
      id: "ai-assistant",
      title: "AI Compliance Overview",
      description: "AI-generated compliance overview summarising all assessments, gaps, and recommended actions for the AI system",
      articleRef: "General",
      type: "document",
    },
  ],
};

// ---------------------------------------------------------------------------
// Helper: analyze system compliance based on actual database data
// ---------------------------------------------------------------------------

function analyzeSystemCompliance(system: SystemWithRelations): ComplianceAnalysis {
  const riskLevel = (system.riskLevel || "unknown").toLowerCase();
  const systemType = (system.systemType || "unknown").toLowerCase();
  const industry = system.industry || null;

  const isUnacceptableRisk = riskLevel === "unacceptable";
  const isHighRisk = riskLevel === "high";
  const isLimitedRisk = riskLevel === "limited";
  const isMinimalRisk = riskLevel === "minimal";

  // Determine applicable Annex III categories based on systemType
  const applicableAnnexIII: string[] = [];
  if (systemType.includes("biometric") || systemType.includes("facial") || systemType.includes("recognition")) {
    applicableAnnexIII.push("1. Biometric identification and categorisation");
  }
  if (systemType.includes("infrastructure") || systemType.includes("critical") || systemType.includes("transport") || systemType.includes("energy")) {
    applicableAnnexIII.push("2. Management and operation of critical infrastructure");
  }
  if (systemType.includes("education") || systemType.includes("training") || systemType.includes("learning") || systemType.includes("exam")) {
    applicableAnnexIII.push("3. Education and vocational training");
  }
  if (systemType.includes("employment") || systemType.includes("recruitment") || systemType.includes("hr") || systemType.includes("worker")) {
    applicableAnnexIII.push("4. Employment and workers management");
  }
  if (systemType.includes("credit") || systemType.includes("insurance") || systemType.includes("benefit") || systemType.includes("service")) {
    applicableAnnexIII.push("5. Access to essential private and public services");
  }
  if (systemType.includes("law") || systemType.includes("police") || systemType.includes("enforcement") || systemType.includes("crime")) {
    applicableAnnexIII.push("6. Law enforcement");
  }
  if (systemType.includes("migration") || systemType.includes("border") || systemType.includes("asylum") || systemType.includes("visa")) {
    applicableAnnexIII.push("7. Migration, asylum, and border control");
  }
  if (systemType.includes("justice") || systemType.includes("court") || systemType.includes("democratic") || systemType.includes("election")) {
    applicableAnnexIII.push("8. Administration of justice and democratic processes");
  }
  if (applicableAnnexIII.length === 0 && isHighRisk) {
    applicableAnnexIII.push("Annex III category to be determined based on detailed system assessment");
  }

  // Determine prohibited practices risk based on systemType
  const prohibitedPracticesRisk: string[] = [];
  if (systemType.includes("social") || systemType.includes("scoring") || systemType.includes("rating")) {
    prohibitedPracticesRisk.push("Social scoring (Art.5(1)(c))");
  }
  if (systemType.includes("biometric") || systemType.includes("facial") || systemType.includes("real-time")) {
    prohibitedPracticesRisk.push("Real-time remote biometric identification (Art.5(1)(h))");
  }
  if (systemType.includes("emotion") || systemType.includes("sentiment") || systemType.includes("mood")) {
    prohibitedPracticesRisk.push("Emotion inference in workplace/education (Art.5(1)(f))");
  }
  if (systemType.includes("policing") || systemType.includes("predictive") || systemType.includes("crime")) {
    prohibitedPracticesRisk.push("Individual predictive policing (Art.5(1)(d))");
  }
  if (systemType.includes("subliminal") || systemType.includes("manipulative")) {
    prohibitedPracticesRisk.push("Subliminal techniques (Art.5(1)(a))");
  }

  // Determine transparency requirements
  const transparencyRequired =
    isLimitedRisk ||
    isHighRisk ||
    systemType.includes("chatbot") ||
    systemType.includes("chat") ||
    systemType.includes("content") ||
    systemType.includes("generate") ||
    systemType.includes("deepfake") ||
    systemType.includes("synthetic") ||
    systemType.includes("biometric") ||
    systemType.includes("emotion");

  const transparencyArticles: string[] = [];
  if (systemType.includes("chatbot") || systemType.includes("chat") || isLimitedRisk || isHighRisk) {
    transparencyArticles.push("Art.50(1) - AI system disclosure");
  }
  if (systemType.includes("emotion") || systemType.includes("biometric")) {
    transparencyArticles.push("Art.50(2) - Emotion/biometric categorisation disclosure");
  }
  if (systemType.includes("deepfake") || systemType.includes("synthetic") || systemType.includes("generate")) {
    transparencyArticles.push("Art.50(3) - Deepfake/synthetic content labelling");
  }
  if (systemType.includes("text") || systemType.includes("news") || systemType.includes("public")) {
    transparencyArticles.push("Art.50(4) - AI-generated text disclosure");
  }

  // Compliance flags from database
  const complianceFlags: Record<string, boolean> = {
    art6: system.art6Compliant,
    art9: system.art9Compliant,
    art10: system.art10Compliant,
    art12: system.art12Compliant,
    art13: system.art13Compliant,
    art14: system.art14Compliant,
    art15: system.art15Compliant,
    art17: system.art17Compliant,
    art27: system.art27Compliant,
  };

  // Identify gaps
  const gaps: Array<{ article: string; label: string; compliant: boolean; severity: string }> = [
    { article: "Art.6", label: "Risk Classification", compliant: system.art6Compliant, severity: isHighRisk || isUnacceptableRisk ? "high" : "medium" },
    { article: "Art.9", label: "Risk Management System", compliant: system.art9Compliant, severity: isHighRisk ? "high" : "medium" },
    { article: "Art.10", label: "Data Governance", compliant: system.art10Compliant, severity: isHighRisk ? "high" : "medium" },
    { article: "Art.12", label: "Record-Keeping", compliant: system.art12Compliant, severity: isHighRisk ? "high" : "low" },
    { article: "Art.13", label: "Transparency to Deployers", compliant: system.art13Compliant, severity: isHighRisk ? "high" : "medium" },
    { article: "Art.14", label: "Human Oversight", compliant: system.art14Compliant, severity: isHighRisk ? "critical" : "medium" },
    { article: "Art.15", label: "Accuracy, Robustness, Cybersecurity", compliant: system.art15Compliant, severity: isHighRisk ? "high" : "medium" },
    { article: "Art.17", label: "Quality Management System", compliant: system.art17Compliant, severity: isHighRisk ? "high" : "medium" },
    { article: "Art.27", label: "FRIA", compliant: system.art27Compliant, severity: isHighRisk ? "critical" : "low" },
  ];

  // Scan findings summary
  const scanFindings: Array<{ type: string; status: string; score: number; summary: string }> =
    system.scanResults.map((sr) => {
      let summary = "Scan completed";
      try {
        const findings = sr.findings ? JSON.parse(sr.findings) : null;
        if (Array.isArray(findings) && findings.length > 0) {
          summary = findings[0].message || findings[0].description || `Found ${findings.length} issue(s)`;
        }
      } catch {
        summary = sr.findings ? sr.findings.substring(0, 200) : "Scan completed";
      }
      return {
        type: sr.scanType,
        status: sr.status,
        score: sr.score,
        summary,
      };
    });

  // Calculate overall compliance score
  const totalFlags = Object.keys(complianceFlags).length;
  const passedFlags = Object.values(complianceFlags).filter(Boolean).length;
  const baseScore = totalFlags > 0 ? Math.round((passedFlags / totalFlags) * 100) : 0;
  // Adjust based on risk level
  let overallComplianceScore = baseScore;
  if (isHighRisk && baseScore < 60) overallComplianceScore = Math.max(baseScore - 10, 0);
  if (isMinimalRisk && baseScore > 80) overallComplianceScore = Math.min(baseScore + 5, 100);

  return {
    riskLevel,
    systemType,
    industry,
    isHighRisk,
    isLimitedRisk,
    isUnacceptableRisk,
    isMinimalRisk,
    applicableAnnexIII,
    prohibitedPracticesRisk,
    transparencyRequired,
    transparencyArticles,
    complianceFlags,
    gaps,
    scanFindings,
    overallComplianceScore,
  };
}

// ---------------------------------------------------------------------------
// Helper: get risk-based recommendations
// ---------------------------------------------------------------------------

function getRiskBasedRecommendations(riskLevel: string, systemType: string): Array<{ priority: string; action: string; article: string; deadline: string }> {
  const recommendations: Array<{ priority: string; action: string; article: string; deadline: string }> = [];
  const rl = riskLevel.toLowerCase();

  if (rl === "unacceptable") {
    recommendations.push({ priority: "critical", action: "Cease deployment immediately - system falls under prohibited practices under Art.5", article: "Art.5", deadline: "Immediate" });
    recommendations.push({ priority: "critical", action: "Conduct legal review to determine if any narrow exceptions apply", article: "Art.5", deadline: "Within 7 days" });
    recommendations.push({ priority: "high", action: "Document rationale for prohibition determination and notify stakeholders", article: "Art.5", deadline: "Within 14 days" });
    return recommendations;
  }

  if (rl === "high") {
    recommendations.push({ priority: "critical", action: "Establish a full Quality Management System (QMS) under Art.17", article: "Art.17", deadline: "Within 30 days" });
    recommendations.push({ priority: "critical", action: "Complete a Fundamental Rights Impact Assessment (FRIA) under Art.27", article: "Art.27", deadline: "Before deployment" });
    recommendations.push({ priority: "critical", action: "Prepare comprehensive technical documentation per Annex IV", article: "Annex IV", deadline: "Within 30 days" });
    recommendations.push({ priority: "high", action: "Implement continuous risk management system throughout lifecycle (Art.9)", article: "Art.9", deadline: "Within 30 days" });
    recommendations.push({ priority: "high", action: "Establish data governance procedures for training, validation, and testing data (Art.10)", article: "Art.10", deadline: "Within 30 days" });
    recommendations.push({ priority: "high", action: "Design and implement human oversight mechanisms (Art.14)", article: "Art.14", deadline: "Before deployment" });
    recommendations.push({ priority: "high", action: "Conduct conformity assessment and obtain CE marking (Art.43-49)", article: "Art.43-49", deadline: "Before market placement" });
    recommendations.push({ priority: "medium", action: "Register the system in the EU database for high-risk AI systems", article: "Art.71", deadline: "Before deployment" });
  } else if (rl === "limited") {
    recommendations.push({ priority: "high", action: "Implement transparency disclosures for AI interaction (Art.50)", article: "Art.50", deadline: "Before deployment" });
    recommendations.push({ priority: "medium", action: "Ensure users are informed when interacting with an AI system", article: "Art.50(1)", deadline: "Before deployment" });
    if (systemType.includes("deepfake") || systemType.includes("synthetic") || systemType.includes("generate")) {
      recommendations.push({ priority: "high", action: "Label AI-generated content and embed disclosure metadata", article: "Art.50(3)", deadline: "Before deployment" });
    }
    recommendations.push({ priority: "medium", action: "Document system purpose and capabilities for transparency", article: "Art.50", deadline: "Within 14 days" });
  } else if (rl === "minimal") {
    recommendations.push({ priority: "low", action: "Consider voluntary codes of conduct for AI governance", article: "General", deadline: "Ongoing" });
    recommendations.push({ priority: "low", action: "Maintain basic documentation of system purpose and limitations", article: "General", deadline: "Ongoing" });
  } else {
    recommendations.push({ priority: "high", action: "Complete risk classification assessment to determine applicable obligations", article: "Art.6", deadline: "Within 14 days" });
  }

  // System-type specific recommendations
  if (systemType.includes("biometric") || systemType.includes("facial")) {
    recommendations.push({ priority: "critical", action: "Ensure biometric data processing complies with GDPR and Art.5 prohibitions", article: "Art.5 / GDPR", deadline: "Immediate" });
  }
  if (systemType.includes("healthcare") || systemType.includes("medical")) {
    recommendations.push({ priority: "high", action: "Align with MDR/IVDR requirements for medical device AI", article: "Annex I", deadline: "Before deployment" });
  }
  if (systemType.includes("finance") || systemType.includes("credit") || systemType.includes("insurance")) {
    recommendations.push({ priority: "high", action: "Ensure compliance with sectoral financial regulations alongside AI Act", article: "Art.6 / Sectoral", deadline: "Before deployment" });
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// Helper: get industry-specific requirements
// ---------------------------------------------------------------------------

function getIndustrySpecificRequirements(industry: string | null): Array<{ requirement: string; regulation: string; impact: string }> {
  if (!industry) return [];
  const ind = industry.toLowerCase();
  const requirements: Array<{ requirement: string; regulation: string; impact: string }> = [];

  if (ind.includes("health") || ind.includes("medical")) {
    requirements.push({ requirement: "Medical Device Regulation (MDR) 2017/745 or IVDR 2017/746 alignment", regulation: "MDR/IVDR", impact: "high" });
    requirements.push({ requirement: "Clinical evaluation and post-market clinical follow-up", regulation: "MDR Art.61", impact: "high" });
    requirements.push({ requirement: "Patient safety monitoring and incident reporting to competent authorities", regulation: "MDR Art.87-92", impact: "high" });
  }
  if (ind.includes("finance") || ind.includes("bank") || ind.includes("insurance") || ind.includes("credit")) {
    requirements.push({ requirement: "Credit scoring and insurance pricing must not discriminate against protected groups", regulation: "Art.6 / GDPR", impact: "high" });
    requirements.push({ requirement: "Compliance with sectoral financial regulations (MiFID II, Solvency II, CRD/CRR)", regulation: "Sectoral", impact: "medium" });
    requirements.push({ requirement: "Robust model risk management and validation frameworks", regulation: "EBA/ESMA Guidelines", impact: "high" });
  }
  if (ind.includes("employ") || ind.includes("hr") || ind.includes("recruit")) {
    requirements.push({ requirement: "Worker rights and non-discrimination in automated decision-making", regulation: "Art.6 / GDPR Art.22", impact: "high" });
    requirements.push({ requirement: "Transparency to candidates about automated evaluation", regulation: "Art.50 / GDPR", impact: "high" });
    requirements.push({ requirement: "Human review of adverse automated decisions", regulation: "GDPR Art.22", impact: "high" });
  }
  if (ind.includes("education") || ind.includes("school") || ind.includes("university")) {
    requirements.push({ requirement: "Student data protection and parental consent for minors", regulation: "GDPR", impact: "high" });
    requirements.push({ requirement: "Fairness and non-discrimination in educational assessments", regulation: "Art.6 / Art.10", impact: "high" });
    requirements.push({ requirement: "Prohibition on emotion recognition in educational settings (Art.5(1)(f))", regulation: "Art.5", impact: "critical" });
  }
  if (ind.includes("transport") || ind.includes("automotive") || ind.includes("vehicle")) {
    requirements.push({ requirement: "Type approval and safety assessment for autonomous vehicle systems", regulation: "Regulation 2019/2144", impact: "high" });
    requirements.push({ requirement: "Functional safety and cybersecurity management (UN R155/R156)", regulation: "UN Regulations", impact: "high" });
  }
  if (ind.includes("marketing") || ind.includes("advertising") || ind.includes("ecommerce")) {
    requirements.push({ requirement: "Consumer protection and prohibition of manipulative practices", regulation: "Art.5 / UCPD", impact: "medium" });
    requirements.push({ requirement: "Transparency in personalised advertising and recommender systems", regulation: "Art.50 / DSA", impact: "medium" });
  }
  if (ind.includes("law") || ind.includes("justice")) {
    requirements.push({ requirement: "Judicial independence and right to fair trial safeguards", regulation: "Art.6 / ECHR Art.6", impact: "critical" });
    requirements.push({ requirement: "Human review of AI-assisted judicial or administrative decisions", regulation: "Art.14 / GDPR Art.22", impact: "critical" });
  }

  return requirements;
}

// ---------------------------------------------------------------------------
// Helper: generate dynamic content based on system data and analysis
// ---------------------------------------------------------------------------

function generateDynamicContent(system: SystemWithRelations, analysis: ComplianceAnalysis, documentType: string): string {
  const baseInfo = {
    reportTitle: "",
    systemInfo: {
      name: system.name,
      type: system.systemType,
      industry: system.industry || "Not specified",
      riskLevel: system.riskLevel || "Unknown",
      description: system.description || "No description provided",
      status: system.status,
      deployedAt: system.deployedAt ? system.deployedAt.toISOString() : null,
      lastReviewedAt: system.lastReviewedAt ? system.lastReviewedAt.toISOString() : null,
    },
    complianceStatus: analysis.complianceFlags,
    findings: analysis.gaps.filter((g) => !g.compliant).map((g) => ({
      article: g.article,
      label: g.label,
      severity: g.severity,
      description: `${g.label} is not yet compliant. ${g.severity === "critical" ? "Immediate action required." : g.severity === "high" ? "Priority remediation recommended." : "Address when resources permit."}`,
    })),
    recommendations: getRiskBasedRecommendations(analysis.riskLevel, analysis.systemType),
    regulatoryReferences: [] as string[],
    generatedAt: new Date().toISOString(),
  };

  switch (documentType) {
    case "risk-assessment": {
      baseInfo.reportTitle = `${system.name} - Risk Classification Report`;
      baseInfo.regulatoryReferences = ["Art.6", "Annex III", "Art.5"];
      return JSON.stringify({
        ...baseInfo,
        classification: {
          currentLevel: system.riskLevel || "pending-assessment",
          systemType: system.systemType,
          industry: system.industry,
          assessedBy: "automated-generator",
          assessmentDate: new Date().toISOString(),
          nextReviewDate: system.nextReviewAt ? system.nextReviewAt.toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
        annexIIIAnalysis: {
          applicableCategories: analysis.applicableAnnexIII,
          categoryCount: analysis.applicableAnnexIII.length,
          notes: analysis.applicableAnnexIII.length === 0
            ? "No specific Annex III categories were automatically identified based on the current system type. A manual review is recommended."
            : `Based on the system type "${system.systemType}", the above Annex III categories may apply. Verify each category against the system's actual deployment context.`,
        },
        prohibitedPracticeScreening: {
          riskFlags: analysis.prohibitedPracticesRisk,
          riskCount: analysis.prohibitedPracticesRisk.length,
          status: analysis.prohibitedPracticesRisk.length > 0 ? "requires-review" : "no-flags",
        },
        actionItems: analysis.gaps
          .filter((g) => g.severity === "critical" || g.severity === "high")
          .map((g) => ({
            article: g.article,
            action: `Address ${g.label} compliance gap`,
            priority: g.severity,
            dueDate: g.severity === "critical" ? "Immediate" : "Within 30 days",
          })),
        sections: [
          {
            title: "1. System Identification",
            content: `This report provides a risk classification for the AI system "${system.name}" (type: ${system.systemType}, industry: ${system.industry || "Not specified"}) in accordance with Article 6 of the EU AI Act. The classification determines which regulatory obligations apply based on the system's intended purpose, capabilities, and deployment context.`,
          },
          {
            title: "2. Assigned Risk Level",
            content: `The system has been assigned a risk level of "${system.riskLevel || "Unknown"}". ${analysis.isHighRisk ? "As a high-risk system, it is subject to the full range of obligations under the EU AI Act including conformity assessment, technical documentation, QMS, human oversight, and registration." : analysis.isLimitedRisk ? "As a limited-risk system, it is primarily subject to transparency obligations under Article 50." : analysis.isMinimalRisk ? "As a minimal-risk system, there are no specific mandatory obligations, though voluntary codes of conduct are encouraged." : analysis.isUnacceptableRisk ? "This risk level indicates the system may fall under prohibited practices under Article 5 and must not be deployed." : "The risk level has not yet been determined. A full assessment is required."}`,
          },
          {
            title: "3. Annex III High-Risk Categories",
            content: analysis.applicableAnnexIII.length > 0
              ? `The following Annex III categories may apply to this system:\n${analysis.applicableAnnexIII.map((c) => `- ${c}`).join("\n")}\n\nEach category must be verified against the system's actual deployment context.`
              : "No specific Annex III categories were automatically identified. If the system is classified as high-risk, a manual review against all Annex III categories is required.",
          },
          {
            title: "4. Prohibited Practice Screening (Art.5)",
            content: analysis.prohibitedPracticesRisk.length > 0
              ? `The following prohibited practice risks were flagged based on the system type:\n${analysis.prohibitedPracticesRisk.map((r) => `- ${r}`).join("\n")}\n\nEach flagged practice must be reviewed to confirm whether the system actually engages in the prohibited activity.`
              : "No prohibited practice risks were automatically flagged based on the system type. However, a complete screening against all Art.5 practices is still required.",
          },
          {
            title: "5. Recommended Actions",
            content: `Based on the assigned risk level (${system.riskLevel || "Unknown"}), the following actions are recommended:\n${getRiskBasedRecommendations(analysis.riskLevel, analysis.systemType).slice(0, 6).map((r) => `- [${r.priority.toUpperCase()}] ${r.action} (${r.article}) - ${r.deadline}`).join("\n")}`,
          },
        ],
      });
    }

    case "prohibited-practices": {
      baseInfo.reportTitle = `${system.name} - Prohibited Practices Check`;
      baseInfo.regulatoryReferences = ["Art.5"];

      const checks = [
        { id: "subliminal", label: "Subliminal Techniques (Art.5(1)(a))", status: analysis.prohibitedPracticesRisk.includes("Subliminal techniques (Art.5(1)(a))") ? "non-compliant" : "not-applicable", notes: analysis.systemType.includes("subliminal") || analysis.systemType.includes("manipulative") ? "System type suggests potential use of subliminal or manipulative techniques. Requires detailed review." : `System type "${system.systemType}" does not typically involve subliminal techniques.` },
        { id: "vulnerabilities", label: "Exploitation of Vulnerabilities (Art.5(1)(b))", status: "pending", notes: "Assess whether the system exploits vulnerabilities of specific groups (age, disability, social/economic situation)." },
        { id: "social-scoring", label: "Social Scoring (Art.5(1)(c))", status: analysis.prohibitedPracticesRisk.includes("Social scoring (Art.5(1)(c))") ? "non-compliant" : "not-applicable", notes: analysis.systemType.includes("social") || analysis.systemType.includes("scoring") ? "System type indicates potential social scoring functionality. Verify whether operated by public authority and leads to detrimental treatment." : "System type does not indicate social scoring functionality." },
        { id: "predictive-policing", label: "Individual Predictive Policing (Art.5(1)(d))", status: analysis.prohibitedPracticesRisk.includes("Individual predictive policing (Art.5(1)(d))") ? "non-compliant" : "not-applicable", notes: analysis.systemType.includes("policing") || analysis.systemType.includes("predictive") ? "System type suggests predictive policing capabilities. Verify whether predictions are individual-based and solely on profiling." : "System type does not indicate predictive policing functionality." },
        { id: "facial-scraping", label: "Facial Recognition Database Scraping (Art.5(1)(e))", status: analysis.systemType.includes("scraping") || analysis.systemType.includes("crawl") ? "non-compliant" : "not-applicable", notes: analysis.systemType.includes("scraping") ? "System type indicates untargeted scraping of facial images. This is prohibited unless a narrow law enforcement exception applies." : "System type does not indicate facial image scraping functionality." },
        { id: "emotion-inference", label: "Emotion Inference (Art.5(1)(f))", status: analysis.prohibitedPracticesRisk.includes("Emotion inference in workplace/education (Art.5(1)(f))") ? "non-compliant" : "not-applicable", notes: analysis.systemType.includes("emotion") || analysis.systemType.includes("sentiment") ? "System type indicates emotion inference capabilities. Verify deployment context - prohibited in workplace and educational institutions except for medical/safety purposes." : "System type does not indicate emotion inference functionality." },
        { id: "biometric-cat", label: "Biometric Categorisation (Art.5(1)(g))", status: analysis.prohibitedPracticesRisk.includes("Real-time remote biometric identification (Art.5(1)(h))") ? "non-compliant" : "not-applicable", notes: analysis.systemType.includes("biometric") || analysis.systemType.includes("categorisation") ? "System type indicates biometric processing. Verify whether sensitive characteristics (race, political opinions, religious beliefs, sexual orientation, trade union membership) are used." : "System type does not indicate biometric categorisation functionality." },
        { id: "remote-biometric", label: "Real-Time Remote Biometric ID (Art.5(1)(h))", status: analysis.prohibitedPracticesRisk.includes("Real-time remote biometric identification (Art.5(1)(h))") ? "non-compliant" : "not-applicable", notes: analysis.systemType.includes("biometric") || analysis.systemType.includes("real-time") || analysis.systemType.includes("facial") ? "System type indicates real-time biometric identification. Prohibited in publicly accessible spaces for law enforcement except under narrow exceptions." : "System type does not indicate real-time remote biometric identification." },
      ];

      return JSON.stringify({
        ...baseInfo,
        checks,
        sections: [
          {
            title: "1. Prohibited Practices Overview (Art.5)",
            content: `Article 5 of the EU AI Act prohibits specific AI practices that pose a clear threat to fundamental rights, democratic values, and the rule of law. This assessment evaluates whether "${system.name}" (type: ${system.systemType}) engages in or enables any of these prohibited practices.`,
          },
          {
            title: "2. System-Specific Screening Results",
            content: `Based on the system type "${system.systemType}" and risk level "${system.riskLevel || "Unknown"}", the following screening results were generated:\n\n${checks.map((c) => `- ${c.label}: ${c.status.toUpperCase()}${c.notes ? " - " + c.notes : ""}`).join("\n")}`,
          },
          {
            title: "3. Compliance Summary",
            content: `Summary of all prohibited practice checks for "${system.name}":\n- Total checks: ${checks.length}\n- Flagged for review: ${checks.filter((c) => c.status === "non-compliant").length}\n- Not applicable: ${checks.filter((c) => c.status === "not-applicable").length}\n- Requires manual evaluation: ${checks.filter((c) => c.status === "pending").length}\n\nAny Non-Compliant finding requires immediate remediation or system modification before deployment.`,
          },
        ],
      });
    }

    case "transparency": {
      baseInfo.reportTitle = `${system.name} - Transparency Obligations Check`;
      baseInfo.regulatoryReferences = ["Art.50"];

      const checks = [
        { id: "ai-disclosure", label: "AI System Disclosure (Art.50(1))", status: analysis.transparencyRequired ? (system.art13Compliant ? "compliant" : "non-compliant") : "not-applicable", notes: analysis.transparencyRequired ? `System type "${system.systemType}" requires AI disclosure to natural persons. ${system.art13Compliant ? "Art.13 compliance flag indicates transparency measures are in place." : "Art.13 compliance flag is false - disclosure mechanisms need to be implemented."}` : `System type "${system.systemType}" does not typically require Art.50(1) disclosure.` },
        { id: "emotion-disclosure", label: "Emotion/Biometric Disclosure (Art.50(2))", status: analysis.systemType.includes("emotion") || analysis.systemType.includes("biometric") ? (system.art13Compliant ? "compliant" : "non-compliant") : "not-applicable", notes: analysis.systemType.includes("emotion") || analysis.systemType.includes("biometric") ? "System performs emotion recognition or biometric categorisation. Exposed persons must be informed." : "System does not perform emotion recognition or biometric categorisation." },
        { id: "deepfake-labelling", label: "Deepfake/Synthetic Content Labelling (Art.50(3))", status: analysis.systemType.includes("deepfake") || analysis.systemType.includes("synthetic") || analysis.systemType.includes("generate") ? (system.art13Compliant ? "compliant" : "non-compliant") : "not-applicable", notes: analysis.systemType.includes("deepfake") || analysis.systemType.includes("synthetic") || analysis.systemType.includes("generate") ? "System generates or manipulates image, audio, or video content. Output must be labelled as artificially generated or manipulated." : "System does not generate or manipulate synthetic content." },
        { id: "text-disclosure", label: "AI-Generated Text Disclosure (Art.50(4))", status: analysis.systemType.includes("text") || analysis.systemType.includes("news") || analysis.systemType.includes("public") ? (system.art13Compliant ? "compliant" : "non-compliant") : "not-applicable", notes: analysis.systemType.includes("text") || analysis.systemType.includes("news") || analysis.systemType.includes("public") ? "System generates text for public information purposes. Content must be disclosed as artificially generated." : "System does not generate public-facing text content." },
      ];

      return JSON.stringify({
        ...baseInfo,
        transparencyAnalysis: {
          transparencyRequired: analysis.transparencyRequired,
          applicableArticles: analysis.transparencyArticles,
          systemType: system.systemType,
        },
        checks,
        sections: [
          {
            title: "1. Transparency Obligations Overview (Art.50)",
            content: `Article 50 of the EU AI Act establishes transparency obligations for AI systems that interact with humans, generate content, or classify individuals. This assessment evaluates compliance for "${system.name}" (type: ${system.systemType}, risk level: ${system.riskLevel || "Unknown"}).`,
          },
          {
            title: "2. Applicable Transparency Requirements",
            content: analysis.transparencyRequired
              ? `Based on the system type and risk level, the following transparency requirements apply:\n${analysis.transparencyArticles.map((a) => `- ${a}`).join("\n")}\n\nEach applicable requirement must be implemented before deployment.`
              : `Based on the current system type "${system.systemType}" and risk level "${system.riskLevel || "Unknown"}", no specific Art.50 transparency obligations were automatically identified. However, if the system interacts with natural persons or generates content, a manual review is recommended.`,
          },
          {
            title: "3. Compliance Matrix",
            content: `Transparency compliance matrix for "${system.name}":\n\n${checks.map((c) => `- ${c.label}: ${c.status.toUpperCase()}${c.notes ? " - " + c.notes : ""}`).join("\n")}`,
          },
          {
            title: "4. Implementation Recommendations",
            content: `Based on the assessment findings, specific recommendations for achieving full transparency compliance:\n${getRiskBasedRecommendations(analysis.riskLevel, analysis.systemType).filter((r) => r.article.includes("50")).map((r) => `- [${r.priority.toUpperCase()}] ${r.action} (${r.article}) - ${r.deadline}`).join("\n") || "- Ensure all user-facing interfaces clearly disclose AI nature of interaction\n- Add metadata tags to AI-generated content\n- Establish monitoring processes to ensure ongoing compliance"}`,
          },
        ],
      });
    }

    case "basic-docs": {
      baseInfo.reportTitle = `${system.name} - Basic Technical Documentation`;
      baseInfo.regulatoryReferences = ["Art.11"];
      return JSON.stringify({
        ...baseInfo,
        sections: [
          {
            title: "1. System Overview",
            content: `This document provides the foundational technical documentation for the AI system "${system.name}". It covers the system's identity, intended purpose, basic architecture, and operational context as required under Article 11 of the EU AI Act.\n\nSystem Name: ${system.name}\nSystem Type: ${system.systemType}\nIndustry: ${system.industry || "Not specified"}\nRisk Level: ${system.riskLevel || "Not classified"}\nStatus: ${system.status}\nDescription: ${system.description || "No description provided"}`,
          },
          {
            title: "2. System Identification",
            content: `System name: ${system.name}\nSystem type: ${system.systemType}\nIndustry sector: ${system.industry || "Not specified"}\nRisk classification: ${system.riskLevel || "Pending"}\nDeployment status: ${system.status}\nCreated: ${system.createdAt.toISOString()}\nLast updated: ${system.updatedAt.toISOString()}${system.deployedAt ? "\nDeployed: " + system.deployedAt.toISOString() : ""}`,
          },
          {
            title: "3. Intended Purpose",
            content: `The intended purpose of "${system.name}" is described as: ${system.description || "[To be completed - provide a clear and concise description of the system's intended purpose, specific tasks, deployment contexts, target user groups, and limitations.]"}\n\nThis section must be sufficiently specific to enable compliance assessment under the EU AI Act.`,
          },
          {
            title: "4. Applicable Regulatory Requirements",
            content: `Based on the risk level "${system.riskLevel || "Unknown"}" and system type "${system.systemType}", the following regulatory requirements apply:\n${analysis.isHighRisk ? "- Full high-risk AI system obligations (Art.6-49, Annex IV)\n- Conformity assessment and CE marking required\n- Registration in EU database required" : analysis.isLimitedRisk ? "- Transparency obligations (Art.50)\n- Voluntary codes of conduct encouraged" : analysis.isMinimalRisk ? "- No specific mandatory obligations\n- Voluntary codes of conduct encouraged" : analysis.isUnacceptableRisk ? "- System is prohibited under Art.5\n- Must not be deployed" : "- Risk classification pending - complete assessment to determine obligations"}`,
          },
          {
            title: "5. Compliance Status",
            content: `Current compliance status for "${system.name}":\n${analysis.gaps.map((g) => `- ${g.article} (${g.label}): ${g.compliant ? "Compliant" : "Non-compliant"} [${g.severity.toUpperCase()}]`).join("\n")}`,
          },
        ],
      });
    }

    case "lifecycle": {
      baseInfo.reportTitle = `${system.name} - Lifecycle Management Report`;
      baseInfo.regulatoryReferences = ["Art.9"];
      return JSON.stringify({
        ...baseInfo,
        sections: [
          {
            title: "1. Risk Management System Overview (Art.9)",
            content: `Article 9 of the EU AI Act requires providers of high-risk AI systems to establish a continuous risk management system throughout the entire lifecycle. This report documents the risk management approach for "${system.name}" (type: ${system.systemType}, risk level: ${system.riskLevel || "Unknown"}) across all lifecycle phases.`,
          },
          {
            title: "2. System Context",
            content: `System: ${system.name}\nType: ${system.systemType}\nIndustry: ${system.industry || "Not specified"}\nRisk Level: ${system.riskLevel || "Unknown"}\nStatus: ${system.status}\n\n${analysis.isHighRisk ? "As a high-risk system, a comprehensive risk management system is mandatory throughout the entire lifecycle." : analysis.isLimitedRisk ? "As a limited-risk system, risk management should focus on transparency and user-facing risks." : "Risk management obligations are proportionate to the assigned risk level."}`,
          },
          {
            title: "3. Design Phase Risk Management",
            content: `Risk identification and mitigation during system design for "${system.name}":\n(a) Identify potential risks arising from intended use and reasonably foreseeable misuse in ${system.industry || "the relevant industry context"}\n(b) Analyze risks to health, safety, and fundamental rights specific to ${system.systemType} systems\n(c) Estimate probability and severity of identified risks\n(d) Determine risk acceptance criteria aligned with ${system.riskLevel || "pending"} risk level\n(e) Design risk mitigation measures including safety controls and fallback mechanisms\n(f) Document design decisions and risk trade-offs`,
          },
          {
            title: "4. Deployment Phase Risk Management",
            content: `Deployment readiness for "${system.name}":\n- System status: ${system.status}\n${system.deployedAt ? "- Deployed on: " + system.deployedAt.toISOString() : "- Not yet deployed"}\n- Art.9 compliance: ${system.art9Compliant ? "Flagged as compliant" : "Not yet flagged as compliant"}\n\nBefore deployment, ensure:\n(a) Deployment readiness assessment completed\n(b) User acceptance testing performed\n(c) Pilot deployment and monitoring configured\n(d) Rollback procedures established\n(e) User training on system limitations planned\n(f) Incident response procedures established`,
          },
          {
            title: "5. Operational Monitoring",
            content: `Continuous risk monitoring during operation:\n- Last reviewed: ${system.lastReviewedAt ? system.lastReviewedAt.toISOString() : "Never"}\n- Next review: ${system.nextReviewAt ? system.nextReviewAt.toISOString() : "Not scheduled"}\n\nMonitoring requirements:\n(a) Performance monitoring against defined KPIs\n(b) Drift detection for data and model performance\n(c) User feedback collection and analysis\n(d) Incident detection and classification\n(e) Regular risk re-assessment cycles${analysis.isHighRisk ? " (at least annually)" : ""}\n(f) Monitoring of regulatory changes affecting risk classification`,
          },
          {
            title: "6. Recommended Actions",
            content: `Priority actions for lifecycle risk management:\n${getRiskBasedRecommendations(analysis.riskLevel, analysis.systemType).filter((r) => r.article === "Art.9" || r.article.includes("Annex")).map((r) => `- [${r.priority.toUpperCase()}] ${r.action} - ${r.deadline}`).join("\n") || "- Establish risk management plan\n- Define risk acceptance criteria\n- Schedule regular risk reviews"}`,
          },
        ],
      });
    }

    case "data-governance": {
      baseInfo.reportTitle = `${system.name} - Data Governance Assessment`;
      baseInfo.regulatoryReferences = ["Art.10"];
      return JSON.stringify({
        ...baseInfo,
        sections: [
          {
            title: "1. Data Governance Framework (Art.10)",
            content: `Article 10 of the EU AI Act requires high-risk AI system providers to implement data governance practices for training, validation, and testing data. This assessment documents the data governance framework for "${system.name}" (type: ${system.systemType}, industry: ${system.industry || "Not specified"}) covering data quality, relevance, representativeness, and bias mitigation.`,
          },
          {
            title: "2. System Context",
            content: `System: ${system.name}\nType: ${system.systemType}\nIndustry: ${system.industry || "Not specified"}\nRisk Level: ${system.riskLevel || "Unknown"}\nArt.10 Compliance: ${system.art10Compliant ? "Flagged as compliant" : "Not yet flagged as compliant"}\n\n${analysis.isHighRisk ? "Full Art.10 data governance obligations apply." : analysis.isLimitedRisk ? "Data governance should focus on transparency and user data rights." : "Data governance obligations are proportionate to risk level."}`,
          },
          {
            title: "3. Training Data Quality",
            content: `Assessment of training data quality measures for "${system.name}":\n(a) Data collection methodology and sources relevant to ${system.industry || "the target domain"}\n(b) Data cleaning and preprocessing procedures\n(c) Data validation rules and quality checks\n(d) Handling of missing, corrupted, or anomalous data\n(e) Data labelling quality assurance\n(f) Documentation of data quality metrics and thresholds`,
          },
          {
            title: "4. Bias Detection and Mitigation",
            content: `Bias assessment for ${system.systemType} systems in ${system.industry || "this sector"}:\n(a) Identification of protected characteristics and potential bias vectors\n(b) Statistical fairness metrics (demographic parity, equalised odds, calibration)\n(c) Bias testing methodology and results\n(d) Mitigation techniques (re-sampling, re-weighting, adversarial debiasing)\n(e) Residual bias assessment and acceptance criteria\n(f) Ongoing bias monitoring plan`,
          },
          {
            title: "5. Data Protection Compliance",
            content: `Alignment with GDPR requirements for "${system.name}":\n(a) Lawful basis for data processing\n(b) Data minimisation assessment\n(c) Purpose limitation compliance\n(d) Data subject rights handling\n(e) Data Protection Impact Assessment (DPIA) status\n(f) Cross-border data transfer mechanisms\n(g) Data retention and deletion policies`,
          },
          {
            title: "6. Recommended Actions",
            content: `Priority data governance actions:\n${getRiskBasedRecommendations(analysis.riskLevel, analysis.systemType).filter((r) => r.article === "Art.10").map((r) => `- [${r.priority.toUpperCase()}] ${r.action} - ${r.deadline}`).join("\n") || "- Document data sources and collection methodology\n- Implement data quality checks\n- Conduct bias assessment\n- Ensure GDPR alignment"}`,
          },
        ],
      });
    }

    case "specialized-checks": {
      baseInfo.reportTitle = `${system.name} - Specialized Compliance Checks`;
      baseInfo.regulatoryReferences = ["Art.12-15"];
      const checks = [
        { id: "tech-doc", label: "Technical Documentation Adequacy", article: "Art.12", status: system.art12Compliant ? "compliant" : "non-compliant" },
        { id: "auto-logging", label: "Automatic Logging", article: "Art.12", status: system.art12Compliant ? "compliant" : "non-compliant" },
        { id: "record-keeping", label: "Record-Keeping", article: "Art.12", status: system.art12Compliant ? "compliant" : "non-compliant" },
        { id: "transparency-deployer", label: "Transparency to Deployers", article: "Art.13", status: system.art13Compliant ? "compliant" : "non-compliant" },
        { id: "human-oversight", label: "Human Oversight", article: "Art.14", status: system.art14Compliant ? "compliant" : "non-compliant" },
        { id: "accuracy-robustness", label: "Accuracy, Robustness, Cybersecurity", article: "Art.15", status: system.art15Compliant ? "compliant" : "non-compliant" },
      ];
      return JSON.stringify({
        ...baseInfo,
        checks,
        sections: [
          {
            title: "1. Technical Documentation Adequacy (Art.12)",
            content: `Assessment of technical documentation compliance for "${system.name}" under Art.12:\n- Art.12 compliance flag: ${system.art12Compliant ? "Compliant" : "Non-compliant"}\n- System type: ${system.systemType}\n- Risk level: ${system.riskLevel || "Unknown"}\n\nEvaluation criteria: (a) completeness against Annex IV; (b) clarity and accessibility; (c) version control; (d) availability to competent authorities; (e) language requirements; (f) review and approval evidence.`,
          },
          {
            title: "2. Transparency to Deployers (Art.13)",
            content: `Assessment of provider-to-deployer transparency for "${system.name}":\n- Art.13 compliance flag: ${system.art13Compliant ? "Compliant" : "Non-compliant"}\n\nRequired: (a) clear instructions for use; (b) system capabilities and limitations; (c) input data requirements; (d) expected performance metrics; (e) known failure modes; (f) human oversight requirements; (g) maintenance and update obligations.`,
          },
          {
            title: "3. Human Oversight (Art.14)",
            content: `Assessment of human oversight mechanisms for "${system.name}":\n- Art.14 compliance flag: ${system.art14Compliant ? "Compliant" : "Non-compliant"}\n- Risk level: ${system.riskLevel || "Unknown"}\n\n${analysis.isHighRisk ? "Human oversight is MANDATORY for this high-risk system." : "Human oversight requirements are proportionate to risk level."}\n\nEvaluation: (a) oversight interfaces; (b) override/correction ability; (c) overseer training; (d) escalation procedures; (e) oversight effectiveness metrics.`,
          },
          {
            title: "4. Accuracy, Robustness, and Cybersecurity (Art.15)",
            content: `Assessment of system quality attributes for "${system.name}":\n- Art.15 compliance flag: ${system.art15Compliant ? "Compliant" : "Non-compliant"}\n\nEvaluation: (a) accuracy metrics and testing; (b) robustness to adversarial attacks; (c) resilience to environmental changes; (d) cybersecurity measures; (e) vulnerability management; (f) incident response capabilities; (g) regular security assessment schedule.`,
          },
          {
            title: "5. Compliance Summary",
            content: `Consolidated summary of Art.12-15 compliance checks:\n${checks.map((c) => `- ${c.label} (${c.article}): ${c.status.toUpperCase()}`).join("\n")}\n\nOverall: ${checks.filter((c) => c.status === "compliant").length}/${checks.length} checks compliant.`,
          },
        ],
      });
    }

    case "technical-doc": {
      baseInfo.reportTitle = `${system.name} - Full Technical Documentation (Annex IV)`;
      baseInfo.regulatoryReferences = ["Annex IV"];
      return JSON.stringify({
        ...baseInfo,
        sections: [
          {
            title: "1. General Information (Annex IV, Section 1)",
            content: `Complete technical documentation for "${system.name}" as required by Annex IV of the EU AI Act.\n\nSystem Name: ${system.name}\nSystem Type: ${system.systemType}\nIndustry: ${system.industry || "Not specified"}\nRisk Level: ${system.riskLevel || "Unknown"}\nStatus: ${system.status}\nCreated: ${system.createdAt.toISOString()}\nLast Updated: ${system.updatedAt.toISOString()}`,
          },
          {
            title: "2. System Description and Intended Purpose (Annex IV, Section 2)",
            content: `System description for "${system.name}":\n${system.description || "[To be completed]"}\n\nSystem Type: ${system.systemType}\nIndustry Context: ${system.industry || "Not specified"}\nRisk Classification: ${system.riskLevel || "Pending"}\n\nRequired: (a) provider name and contact; (b) system description and main features; (c) intended purpose and context; (d) target user groups; (e) integration points; (f) limitations and known issues; (g) lifecycle description.`,
          },
          {
            title: "3. Applicable Regulatory Requirements",
            content: `Based on risk level "${system.riskLevel || "Unknown"}":\n${analysis.isHighRisk ? "- Full Annex IV technical documentation required\n- Conformity assessment (Annex VI or VII)\n- CE marking and EU database registration" : analysis.isLimitedRisk ? "- Transparency documentation required\n- Instructions for use" : analysis.isMinimalRisk ? "- Basic documentation recommended" : "- Complete risk classification to determine documentation requirements"}`,
          },
          {
            title: "4. Compliance Status Integration",
            content: `Current compliance flags for "${system.name}":\n${analysis.gaps.map((g) => `- ${g.article} (${g.label}): ${g.compliant ? "Compliant" : "Non-compliant"}`).join("\n")}\n\nOverall compliance score: ${analysis.overallComplianceScore}/100`,
          },
        ],
      });
    }

    case "deployer-obligations": {
      baseInfo.reportTitle = `${system.name} - Deployer Obligations Checklist`;
      baseInfo.regulatoryReferences = ["Art.26"];
      const checks = [
        { id: "ce-marking", label: "CE Marking and Registration Verification", status: analysis.isHighRisk ? "pending" : "not-applicable" },
        { id: "human-oversight", label: "Human Oversight Assignment", status: system.art14Compliant ? "compliant" : analysis.isHighRisk ? "non-compliant" : "pending" },
        { id: "fria", label: "Fundamental Rights Impact Assessment", status: system.art27Compliant ? "compliant" : analysis.isHighRisk ? "non-compliant" : "pending" },
        { id: "data-quality", label: "Data Quality Assurance", status: system.art10Compliant ? "compliant" : "pending" },
        { id: "logging", label: "Logging and Documentation", status: system.art12Compliant ? "compliant" : "pending" },
        { id: "incident-reporting", label: "Incident Reporting Procedures", status: "pending" },
      ];
      return JSON.stringify({
        ...baseInfo,
        checks,
        sections: [
          {
            title: "1. Deployer Obligations Overview (Art.26)",
            content: `Article 26 sets out obligations for deployers (users) of high-risk AI systems. This checklist assesses compliance for "${system.name}" (risk level: ${system.riskLevel || "Unknown"}).`,
          },
          {
            title: "2. System Context",
            content: `System: ${system.name}\nType: ${system.systemType}\nRisk Level: ${system.riskLevel || "Unknown"}\n${analysis.isHighRisk ? "This is a HIGH-RISK system. All Art.26 deployer obligations apply." : analysis.isLimitedRisk ? "This is a LIMITED-RISK system. Deployer obligations focus on transparency." : "Deployer obligations are proportionate to the system's risk level."}`,
          },
          {
            title: "3. Compliance Checklist",
            content: `Deployer obligations checklist:\n${checks.map((c) => `- ${c.label}: ${c.status.toUpperCase()}`).join("\n")}`,
          },
        ],
      });
    }

    case "regulatory-compliance": {
      baseInfo.reportTitle = `${system.name} - Regulatory Compliance Report`;
      baseInfo.regulatoryReferences = ["Art.43-73"];
      return JSON.stringify({
        ...baseInfo,
        sections: [
          {
            title: "1. Conformity Assessment (Art.43-49)",
            content: `Assessment of conformity assessment procedures for "${system.name}":\n- Risk level: ${system.riskLevel || "Unknown"}\n- System type: ${system.systemType}\n\n${analysis.isHighRisk ? "High-risk systems require conformity assessment under Annex VI (internal control) or Annex VII (notified body involvement)." : "Conformity assessment requirements depend on final risk classification."}`,
          },
          {
            title: "2. Implementation Timeline",
            content: `Key dates for "${system.name}":\n- System created: ${system.createdAt.toISOString()}\n- Last updated: ${system.updatedAt.toISOString()}\n${system.deployedAt ? "- Deployed: " + system.deployedAt.toISOString() : "- Not yet deployed"}\n\nEU AI Act deadlines:\n- Prohibited practices (Art.5): 2 February 2025\n- GPAI obligations (Art.51-56): 2 August 2025\n- High-risk obligations (Art.6-49): 2 August 2026\n- Specific high-risk systems (Annex I): 2 August 2027`,
          },
          {
            title: "3. Compliance Status",
            content: `Current compliance status:\n${analysis.gaps.map((g) => `- ${g.article} (${g.label}): ${g.compliant ? "Compliant" : "Non-compliant"} [${g.severity.toUpperCase()}]`).join("\n")}\n\nOverall score: ${analysis.overallComplianceScore}/100`,
          },
        ],
      });
    }

    case "industry-templates": {
      baseInfo.reportTitle = `${system.name} - Industry-Specific Compliance Templates`;
      baseInfo.regulatoryReferences = ["General"];
      const industryReqs = getIndustrySpecificRequirements(system.industry);
      return JSON.stringify({
        ...baseInfo,
        industry: system.industry || "general",
        industryRequirements: industryReqs,
        sections: [
          {
            title: "1. Industry Context Analysis",
            content: `Analysis of industry-specific compliance requirements for "${system.name}" in the ${system.industry || "general"} sector. This section maps the EU AI Act requirements to the specific regulatory landscape, operational practices, and risk profiles of the relevant industry.`,
          },
          {
            title: "2. Sector-Specific Regulatory Mapping",
            content: industryReqs.length > 0
              ? `The following sector-specific requirements were identified for ${system.industry}:\n${industryReqs.map((r) => `- ${r.requirement} (${r.regulation}) [Impact: ${r.impact.toUpperCase()}]`).join("\n")}`
              : "No specific industry requirements were identified. The system should still comply with general EU AI Act obligations.",
          },
          {
            title: "3. Industry-Specific Risk Factors",
            content: `Common risk patterns for ${system.systemType} systems in ${system.industry || "this sector"}:\n- Sector-specific vulnerable populations\n- Industry-specific failure modes and consequences\n- Data quality challenges in ${system.industry || "this domain"}\n- Bias and fairness concerns specific to ${system.systemType} applications`,
          },
          {
            title: "4. Compliance Templates",
            content: `Pre-built compliance templates for ${system.industry || "general"}:\n- Risk assessment templates for ${system.systemType}\n- Technical documentation with ${system.industry || "industry"}-specific sections\n- Transparency notices for ${system.systemType} deployment\n- Human oversight procedures`,
          },
        ],
      });
    }

    case "role-obligations": {
      baseInfo.reportTitle = `${system.name} - Role-Based Obligations Matrix`;
      baseInfo.regulatoryReferences = ["General"];
      return JSON.stringify({
        ...baseInfo,
        roles: ["provider", "deployer", "importer", "distributor", "manufacturer", "authorized-representative"],
        sections: [
          {
            title: "1. Role Definitions",
            content: "Definitions of roles under the EU AI Act: (a) Provider - develops an AI system and places it on the market; (b) Deployer - uses an AI system under its authority; (c) Importer - places an AI system from a third country on the EU market; (d) Distributor - makes an AI system available on the EU market; (e) Manufacturer - manufactures a product into which an AI system is embedded; (f) Authorized Representative - established in the EU and authorised by the provider.",
          },
          {
            title: "2. Obligation Assignment for This System",
            content: `Specific obligation assignment for "${system.name}":\n- System type: ${system.systemType}\n- Risk level: ${system.riskLevel || "Unknown"}\n- Industry: ${system.industry || "Not specified"}\n\n(a) Identify the organisation's role(s) in relation to this system\n(b) Map applicable obligations based on assigned role(s)\n(c) Identify shared or overlapping obligations\n(d) Assign responsibility for each obligation to specific individuals or teams\n(e) Establish timeline for compliance with each obligation`,
          },
          {
            title: "3. Provider Obligations",
            content: `Provider obligations for "${system.name}":\n- Risk management system (Art.9): ${system.art9Compliant ? "Compliant" : "Pending"}\n- Data governance (Art.10): ${system.art10Compliant ? "Compliant" : "Pending"}\n- Technical documentation (Art.11): ${system.art12Compliant ? "Compliant" : "Pending"}\n- Record-keeping (Art.12): ${system.art12Compliant ? "Compliant" : "Pending"}\n- Transparency to deployers (Art.13): ${system.art13Compliant ? "Compliant" : "Pending"}\n- Human oversight design (Art.14): ${system.art14Compliant ? "Compliant" : "Pending"}\n- Accuracy and robustness (Art.15): ${system.art15Compliant ? "Compliant" : "Pending"}\n- Quality management system (Art.17): ${system.art17Compliant ? "Compliant" : "Pending"}\n- Conformity assessment (Art.43-49): ${analysis.isHighRisk ? "Required" : "Depends on risk level"}\n- Post-market monitoring (Art.72): Ongoing`,
          },
        ],
      });
    }

    case "evidence-pack": {
      baseInfo.reportTitle = `${system.name} - Evidence Pack Summary`;
      baseInfo.regulatoryReferences = ["General"];
      return JSON.stringify({
        ...baseInfo,
        documentInventory: system.documents.map((d) => ({
          type: d.type,
          title: d.title,
          status: d.status,
          createdAt: d.createdAt.toISOString(),
        })),
        sections: [
          {
            title: "1. Evidence Pack Overview",
            content: `This evidence pack consolidates all compliance documentation and assessment results for "${system.name}" into a comprehensive package suitable for demonstrating compliance to regulators, auditors, and stakeholders.`,
          },
          {
            title: "2. Document Inventory",
            content: `Generated documents for "${system.name}":\n${system.documents.length > 0 ? system.documents.map((d) => `- ${d.title} (${d.type}) [${d.status}]`).join("\n") : "No documents have been generated yet."}`,
          },
          {
            title: "3. Compliance Status Dashboard",
            content: `Compliance status across all assessed articles:\n${analysis.gaps.map((g) => `- ${g.article} (${g.label}): ${g.compliant ? "Compliant" : "Non-compliant"} [${g.severity.toUpperCase()}]`).join("\n")}\n\nOverall compliance score: ${analysis.overallComplianceScore}/100`,
          },
          {
            title: "4. Gap Analysis",
            content: `Identified compliance gaps:\n${analysis.gaps.filter((g) => !g.compliant).map((g) => `- ${g.article} (${g.label}): ${g.severity.toUpperCase()} severity`).join("\n") || "No gaps identified - all tracked articles are compliant."}\n\nPriority ranking:\n${analysis.gaps.filter((g) => !g.compliant).sort((a) => (a.severity === "critical" ? -1 : 1)).map((g) => `- [${g.severity.toUpperCase()}] ${g.label} (${g.article})`).join("\n") || "None"}`,
          },
          {
            title: "5. Scan Results Summary",
            content: `Automated scan results:\n${analysis.scanFindings.length > 0 ? analysis.scanFindings.map((s) => `- ${s.type}: ${s.status.toUpperCase()} (score: ${s.score}) - ${s.summary}`).join("\n") : "No scan results available."}`,
          },
        ],
      });
    }

    case "gpai-compliance": {
      baseInfo.reportTitle = `${system.name} - GPAI Obligations Checklist`;
      baseInfo.regulatoryReferences = ["Art.51-56"];
      const isGPAI = system.systemType.includes("gpai") || system.systemType.includes("general") || system.systemType.includes("foundation") || system.systemType.includes("llm") || system.systemType.includes("model");
      const checks = [
        { id: "tech-doc", label: "GPAI Technical Documentation", status: isGPAI ? "pending" : "not-applicable" },
        { id: "copyright", label: "Copyright Compliance Policy", status: isGPAI ? "pending" : "not-applicable" },
        { id: "opt-out", label: "Opt-Out Mechanism Compliance", status: isGPAI ? "pending" : "not-applicable" },
        { id: "training-summary", label: "Training Data Summary", status: isGPAI ? "pending" : "not-applicable" },
        { id: "systemic-risk", label: "Systemic Risk Assessment", status: isGPAI ? "pending" : "not-applicable" },
        { id: "adversarial", label: "Adversarial Testing", status: isGPAI ? "pending" : "not-applicable" },
        { id: "incident", label: "Incident Tracking", status: isGPAI ? "pending" : "not-applicable" },
        { id: "cybersecurity", label: "Cybersecurity Protection", status: isGPAI ? "pending" : "not-applicable" },
      ];
      return JSON.stringify({
        ...baseInfo,
        isGPAISystem: isGPAI,
        checks,
        sections: [
          {
            title: "1. GPAI Model Obligations Overview (Art.51-56)",
            content: `Assessment of General-Purpose AI (GPAI) model obligations for "${system.name}" under Articles 51-56.\n\nSystem type: ${system.systemType}\nGPAI classification: ${isGPAI ? "This system appears to be a GPAI model based on its type." : "This system does not appear to be a GPAI model based on its type."}`,
          },
          {
            title: "2. Technical Documentation (Art.51)",
            content: isGPAI
              ? "GPAI technical documentation requirements apply: (a) training data and methodology; (b) model architecture; (c) performance benchmarks; (d) intended and actual use cases; (e) known limitations; (f) evaluation methodologies; (g) safety and security measures."
              : "GPAI technical documentation requirements do not apply to this system type.",
          },
          {
            title: "3. Systemic Risk Assessment (Art.55)",
            content: isGPAI
              ? "If this GPAI model meets the systemic risk threshold (computing power, training data scale, user base), additional obligations under Art.55-56 apply."
              : "Systemic risk assessment for GPAI models does not apply to this system type.",
          },
        ],
      });
    }

    case "gdpr-scan": {
      baseInfo.reportTitle = `${system.name} - GDPR Compliance Assessment`;
      baseInfo.regulatoryReferences = ["GDPR / Art.36"];
      const checks = [
        { id: "lawful-basis", label: "Lawful Basis Determined", status: "pending" },
        { id: "data-subject-rights", label: "Data Subject Rights Implemented", status: "pending" },
        { id: "dpia", label: "DPIA Conducted", status: analysis.isHighRisk ? "pending" : "not-applicable" },
        { id: "data-minimisation", label: "Data Minimisation Applied", status: "pending" },
        { id: "automated-decisions", label: "Automated Decision Safeguards", status: analysis.isHighRisk || system.systemType.includes("decision") ? "pending" : "not-applicable" },
        { id: "cross-regulation", label: "GDPR-AI Act Alignment", status: "pending" },
      ];
      return JSON.stringify({
        ...baseInfo,
        checks,
        sections: [
          {
            title: "1. GDPR-AI Act Intersection",
            content: `Assessment of GDPR compliance for "${system.name}" in the context of the EU AI Act. The EU AI Act operates alongside the GDPR, and compliance with both frameworks is essential.`,
          },
          {
            title: "2. Lawful Basis Assessment",
            content: `GDPR lawful basis analysis for "${system.name}":\n(a) Identify applicable lawful basis (consent, contract, legal obligation, vital interests, public task, legitimate interests)\n(b) Assess consent validity for AI processing\n(c) Evaluate legitimate interests balancing test\n(d) Document lawful basis determination`,
          },
          {
            title: "3. Data Protection Impact Assessment (DPIA)",
            content: `DPIA requirements for "${system.name}":\n- Risk level: ${system.riskLevel || "Unknown"}\n- System type: ${system.systemType}\n${analysis.isHighRisk ? "A DPIA is HIGHLY LIKELY required under GDPR Art.35 for this high-risk AI system." : "DPIA requirement depends on specific processing activities and risk assessment."}`,
          },
          {
            title: "4. Cross-Regulation Alignment",
            content: `Alignment between GDPR and EU AI Act for "${system.name}":\n- DPIA and FRIA overlap: ${system.art27Compliant ? "FRIA completed - coordinate with DPIA" : "Both may be required"}\n- Data governance: Art.10 AI Act + GDPR data protection principles\n- Transparency: Art.50 AI Act + GDPR transparency obligations\n- Human oversight: Art.14 AI Act + GDPR Art.22 human review`,
          },
        ],
      });
    }

    case "regulation-tracker": {
      baseInfo.reportTitle = `${system.name} - Regulation Change Analysis`;
      baseInfo.regulatoryReferences = ["General"];
      return JSON.stringify({
        ...baseInfo,
        sections: [
          {
            title: "1. Regulatory Landscape Overview",
            content: `Current regulatory landscape affecting "${system.name}" (type: ${system.systemType}, industry: ${system.industry || "Not specified"}): (a) EU AI Act implementation timeline; (b) relevant national transposition measures; (c) sector-specific regulatory developments; (d) international regulatory developments.`,
          },
          {
            title: "2. EU AI Act Implementation Timeline",
            content: `Key implementation dates:\n- Entry into force: 1 August 2024\n- Prohibited practices (Art.5): 2 February 2025\n- GPAI obligations (Art.51-56): 2 August 2025\n- High-risk obligations (Art.6-49): 2 August 2026\n- Specific high-risk systems (Annex I): 2 August 2027\n\nSystem risk level: ${system.riskLevel || "Unknown"}\n${analysis.isHighRisk ? "This high-risk system must comply by 2 August 2026." : analysis.isLimitedRisk ? "This limited-risk system must comply with transparency obligations by 2 August 2026." : "Compliance timeline depends on final risk classification."}`,
          },
          {
            title: "3. System-Specific Impact Assessment",
            content: `Impact of regulatory changes on "${system.name}":\n- Risk level: ${system.riskLevel || "Unknown"}\n- Applicable articles: ${analysis.isHighRisk ? "Art.6-49, Annex IV" : analysis.isLimitedRisk ? "Art.50" : analysis.isUnacceptableRisk ? "Art.5 (prohibited)" : "To be determined"}\n- Industry-specific regulations: ${getIndustrySpecificRequirements(system.industry).map((r) => r.regulation).join(", ") || "None identified"}`,
          },
        ],
      });
    }

    case "custom-checklists": {
      baseInfo.reportTitle = `${system.name} - Custom Compliance Checklists`;
      baseInfo.regulatoryReferences = ["General"];
      return JSON.stringify({
        ...baseInfo,
        customItems: [],
        sections: [
          {
            title: "1. EU AI Act Core Checklist",
            content: `Core EU AI Act compliance checklist for "${system.name}":\n${analysis.gaps.map((g) => `- [${g.compliant ? "x" : " "}] ${g.label} (${g.article}) [${g.severity.toUpperCase()}]`).join("\n")}`,
          },
          {
            title: "2. System-Specific Checklist",
            content: `Checklist tailored for ${system.systemType} systems in ${system.industry || "general"}:\n${getRiskBasedRecommendations(analysis.riskLevel, analysis.systemType).map((r) => `- [ ] ${r.action} (${r.article}) [${r.priority.toUpperCase()}] - ${r.deadline}`).join("\n")}`,
          },
          {
            title: "3. Industry-Specific Items",
            content: `Additional items for ${system.industry || "general"}:\n${getIndustrySpecificRequirements(system.industry).map((r) => `- [ ] ${r.requirement} (${r.regulation}) [${r.impact.toUpperCase()}]`).join("\n") || "No specific industry requirements identified."}`,
          },
        ],
      });
    }

    case "ai-assistant": {
      baseInfo.reportTitle = `${system.name} - AI Compliance Overview`;
      baseInfo.regulatoryReferences = ["General"];
      const compliantCount = analysis.gaps.filter((g) => g.compliant).length;
      const totalCount = analysis.gaps.length;
      return JSON.stringify({
        ...baseInfo,
        complianceScorecard: {
          totalArticlesAssessed: totalCount,
          compliant: compliantCount,
          nonCompliant: totalCount - compliantCount,
          overallPercentage: totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0,
        },
        sections: [
          {
            title: "1. Executive Summary",
            content: `AI-generated compliance overview for "${system.name}" (type: ${system.systemType}, risk level: ${system.riskLevel || "Unknown"}, industry: ${system.industry || "Not specified"}). This document provides a consolidated summary of all compliance assessments, identifies gaps and priorities, and recommends next steps.`,
          },
          {
            title: "2. Compliance Scorecard",
            content: `Overall compliance scorecard for "${system.name}":\n- Total articles assessed: ${totalCount}\n- Compliant: ${compliantCount}\n- Non-compliant: ${totalCount - compliantCount}\n- Overall compliance: ${totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0}%`,
          },
          {
            title: "3. Key Findings",
            content: `Key findings for "${system.name}":\n- Critical gaps: ${analysis.gaps.filter((g) => !g.compliant && g.severity === "critical").length}\n- High-priority gaps: ${analysis.gaps.filter((g) => !g.compliant && g.severity === "high").length}\n- Medium-priority gaps: ${analysis.gaps.filter((g) => !g.compliant && g.severity === "medium").length}\n- Compliant articles: ${compliantCount}\n\n${analysis.overallComplianceScore < 50 ? "Overall compliance is LOW. Immediate action is required across multiple articles." : analysis.overallComplianceScore < 80 ? "Overall compliance is MODERATE. Several gaps need to be addressed." : "Overall compliance is GOOD. Continue monitoring and maintain standards."}`,
          },
          {
            title: "4. Priority Actions",
            content: `Prioritised recommended actions for "${system.name}":\n${getRiskBasedRecommendations(analysis.riskLevel, analysis.systemType).slice(0, 8).map((r) => `- [${r.priority.toUpperCase()}] ${r.action} (${r.article}) - ${r.deadline}`).join("\n")}`,
          },
          {
            title: "5. Document References",
            content: `Generated documents for "${system.name}":\n${system.documents.length > 0 ? system.documents.map((d) => `- ${d.title} (${d.type})`).join("\n") : "No documents generated yet."}\n\nScan results:\n${analysis.scanFindings.length > 0 ? analysis.scanFindings.map((s) => `- ${s.type}: ${s.status} (score: ${s.score})`).join("\n") : "No scan results available."}`,
          },
        ],
      });
    }

    default:
      return JSON.stringify({
        reportTitle: `${system.name} - Compliance Document`,
        systemInfo: baseInfo.systemInfo,
        complianceStatus: analysis.complianceFlags,
        generatedAt: new Date().toISOString(),
        note: "Dynamic content generation for this document type is not yet implemented.",
      });
  }
}

// ---------------------------------------------------------------------------
// Document content generators (legacy wrappers - now dynamic)
// ---------------------------------------------------------------------------

function generateRiskAssessmentContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "risk-assessment");
}

function generateProhibitedPracticesContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "prohibited-practices");
}

function generateTransparencyContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "transparency");
}

function generateBasicDocsContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "basic-docs");
}

function generateLifecycleContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "lifecycle");
}

function generateDataGovernanceContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "data-governance");
}

function generateSpecializedChecksContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "specialized-checks");
}

function generateFRIASections(system: SystemWithRelations) {
  const analysis = analyzeSystemCompliance(system);
  const baseInfo = {
    systemInfo: {
      name: system.name,
      type: system.systemType,
      industry: system.industry || "Not specified",
      riskLevel: system.riskLevel || "Unknown",
      description: system.description || "No description provided",
    },
    complianceStatus: analysis.complianceFlags,
    generatedAt: new Date().toISOString(),
  };

  // Calculate FRIA overall score based on actual data if exists
  let overallScore = 50;
  if (system.fria && system.fria.overallScore !== null) {
    overallScore = system.fria.overallScore;
  } else {
    // Calculate based on compliance gaps
    const criticalGaps = analysis.gaps.filter((g) => !g.compliant && g.severity === "critical").length;
    const highGaps = analysis.gaps.filter((g) => !g.compliant && g.severity === "high").length;
    overallScore = Math.max(0, Math.min(100, 100 - criticalGaps * 25 - highGaps * 10));
  }

  return {
    section1: JSON.stringify({
      title: "Section 1: System Description and Intended Purpose",
      ...baseInfo,
      content: `This section describes the AI system "${system.name}" and its intended purpose as required under Article 27 of the EU AI Act.\n\nSystem Name: ${system.name}\nSystem Type: ${system.systemType}\nIndustry: ${system.industry || "Not specified"}\nRisk Level: ${system.riskLevel || "Unknown"}\n\nSystem Description: ${system.description || "[To be completed - provide a detailed description of the AI system including its name, version, developer, and core functionality.]"}\n\nIntended Purpose: [Describe the specific task(s) the system is designed to perform and the context(s) in which it will be deployed.]\n\nTarget Users: [Identify the individuals or groups who will interact with or be affected by the system.]\n\nDeployment Context: [Describe the physical, technical, and organisational environment in which the system will operate.]\n\nInteraction Modalities: [Describe how users interact with the system - e.g., web interface, API, embedded device, voice interface.]\n\nDecision Authority: [Describe whether the system makes autonomous decisions, provides recommendations, or supports human decision-making.]`,
    }),
    section2: JSON.stringify({
      title: "Section 2: Legal Basis and Necessity",
      ...baseInfo,
      content: `This section establishes the legal basis for deploying "${system.name}" and demonstrates its necessity.\n\nSystem: ${system.name}\nType: ${system.systemType}\nIndustry: ${system.industry || "Not specified"}\n\nLegal Basis: [Identify the applicable legal framework(s) authorising the use of this AI system, including EU and national law provisions.]\n\nNecessity Assessment: [Explain why an AI system is necessary to achieve the stated purpose, and why alternative non-AI solutions are insufficient.]\n\nProportionality Assessment: [Demonstrate that the use of the AI system is proportionate to the intended benefit, considering the potential impact on fundamental rights.]\n\nLawful Basis for Data Processing: [Under GDPR, identify the lawful basis for processing personal data through this system.]\n\nData Protection Impact Assessment: [Reference any DPIA conducted and summarise key findings.]\n\nLegal Review: [Document the date and outcome of legal review.]`,
    }),
    section3: JSON.stringify({
      title: "Section 3: Risks to Fundamental Rights",
      ...baseInfo,
      content: `This section identifies and assesses risks to fundamental rights posed by "${system.name}".\n\nSystem: ${system.name}\nType: ${system.systemType}\nRisk Level: ${system.riskLevel || "Unknown"}\n\nRights at Risk: [Identify which fundamental rights may be affected, including: right to privacy, right to non-discrimination, right to freedom of expression, right to fair trial, right to dignity, right to data protection, right to effective remedy.]\n\nRisk Identification: [For each identified right, describe the specific risk scenario and how the system could interfere with the right.]\n\nRisk Assessment Matrix:\n- Likelihood: [Low/Medium/High]\n- Severity: [Low/Medium/High]\n- Reversibility: [Reversible/Partially Reversible/Irreversible]\n- Scope: [Individual/Group/Societal]\n\nVulnerable Groups: [Identify groups that may be disproportionately affected, including children, elderly, persons with disabilities, ethnic minorities.]\n\nCumulative Effects: [Assess whether the system's effects combine with other systems or processes to create compounded risks.]\n\nLong-term Effects: [Consider potential long-term societal effects of widespread deployment.]`,
    }),
    section4: JSON.stringify({
      title: "Section 4: Measures to Mitigate Risks",
      ...baseInfo,
      content: `This section describes the measures implemented to mitigate identified risks to fundamental rights for "${system.name}".\n\nCurrent Compliance Status:\n${analysis.gaps.map((g) => `- ${g.article} (${g.label}): ${g.compliant ? "Compliant" : "Non-compliant"}`).join("\n")}\n\nTechnical Measures: [Describe technical safeguards including: accuracy improvements, bias mitigation, robustness testing, security measures, audit logging, anomaly detection.]\n\nOrganisational Measures: [Describe organisational safeguards including: training programmes, governance structures, escalation procedures, accountability frameworks.]\n\nProcedural Measures: [Describe procedural safeguards including: human oversight mechanisms, appeal and redress processes, complaint handling, monitoring and review cycles.]\n\nTransparency Measures: [Describe how affected individuals are informed about the system's operation and their rights.]\n\nData Protection Measures: [Describe data protection safeguards including: data minimisation, purpose limitation, retention policies, encryption, access controls.]\n\nEffectiveness Assessment: [Evaluate the effectiveness of each mitigation measure and identify any residual risks.]\n\nMonitoring Plan: [Describe ongoing monitoring arrangements to detect and respond to new or evolving risks.]`,
    }),
    section5: JSON.stringify({
      title: "Section 5: Consultation with Stakeholders",
      ...baseInfo,
      content: `This section documents consultation with relevant stakeholders as part of the FRIA process for "${system.name}".\n\nStakeholders Identified: [List all stakeholders consulted, including: data protection officers, works councils, employee representatives, civil society organisations, affected communities, domain experts, legal advisors.]\n\nConsultation Methodology: [Describe the methods used for consultation - e.g., interviews, surveys, workshops, public consultations.]\n\nKey Findings from Consultation: [Summarise the main concerns, suggestions, and recommendations raised by stakeholders.]\n\nStakeholder Concerns Addressed: [Describe how stakeholder feedback was incorporated into the system design and risk mitigation measures.]\n\nOutstanding Concerns: [Document any unresolved concerns and the rationale for proceeding despite these concerns.]\n\nConsultation Timeline: [Provide dates and summary of each consultation event.]\n\nDocumentation: [Reference all consultation records and supporting materials.]`,
    }),
    section6: JSON.stringify({
      title: "Section 6: Notification to Authority",
      ...baseInfo,
      content: `This section covers the notification to the competent authority as required under Article 27 for "${system.name}".\n\nSystem: ${system.name}\nType: ${system.systemType}\nRisk Level: ${system.riskLevel || "Unknown"}\n\nCompetent Authority: [Identify the national competent authority responsible for AI regulation in the relevant jurisdiction.]\n\nNotification Content: [Describe the information provided to the authority, including: system description, FRIA summary, risk assessment results, mitigation measures, stakeholder consultation outcomes.]\n\nNotification Date: [Record the date of notification submission.]\n\nAuthority Response: [Document any response, guidance, or requirements from the authority.]\n\nFollow-up Actions: [Describe any actions taken in response to authority feedback.]\n\nOngoing Reporting: [Describe arrangements for ongoing reporting to the authority as required.]\n\nReview Schedule: [Document the schedule for FRIA review and update, including triggers for re-assessment such as significant system changes or new regulatory guidance.]`,
    }),
    overallScore,
  };
}

function generateTechnicalDocContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "technical-doc");
}

function generateDeployerObligationsContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "deployer-obligations");
}

function generateRegulatoryComplianceContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "regulatory-compliance");
}

function generateIndustryTemplatesContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "industry-templates");
}

function generateRoleObligationsContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "role-obligations");
}

function generateEvidencePackContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "evidence-pack");
}

function generateGPAIComplianceContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "gpai-compliance");
}

function generateGDPRScanContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "gdpr-scan");
}

function generateRegulationTrackerContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "regulation-tracker");
}

function generateCustomChecklistsContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "custom-checklists");
}

function generateAIAssistantContent(system: SystemWithRelations): string {
  const analysis = analyzeSystemCompliance(system);
  return generateDynamicContent(system, analysis, "ai-assistant");
}

// ---------------------------------------------------------------------------
// Helper: determine if an item has already been generated
// ---------------------------------------------------------------------------

function isItemGenerated(
  itemId: string,
  system: {
    fria: { id: string } | null;
    qms: { id: string } | null;
    documents: { type: string }[];
    scanResults: { scanType: string }[];
  }
): boolean {
  switch (itemId) {
    case "fria":
      return !!system.fria;
    case "qms":
      return !!system.qms;
    case "url-scan":
      return system.scanResults.some((s) => s.scanType === "url-scan");
    default:
      return system.documents.some((d) => {
        const typeMap: Record<string, string> = {
          "risk-assessment": "risk-assessment",
          "prohibited-practices": "prohibited-practices",
          transparency: "transparency",
          "basic-docs": "technical-doc",
          lifecycle: "lifecycle",
          "data-governance": "data-governance",
          "specialized-checks": "specialized-checks",
          "technical-doc": "technical-doc",
          "deployer-obligations": "deployer-obligations",
          "regulatory-compliance": "regulatory-compliance",
          "industry-template": "industry-template",
          "role-obligations": "role-obligations",
          "evidence-pack": "evidence-pack",
          "gpai-compliance": "gpai-compliance",
          "gdpr-scan": "gdpr-scan",
          "regulation-tracker": "regulation-tracker",
          "custom-checklist": "custom-checklist",
          "ai-compliance-summary": "ai-compliance-summary",
        };
        return d.type === typeMap[itemId];
      });
  }
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const systemId = searchParams.get("systemId");

    if (!systemId) {
      return NextResponse.json(
        { error: "systemId is required" },
        { status: 400 }
      );
    }

    // Get user's subscription tier
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { tier: true },
    });

    const tier = subscription?.tier ?? "free";

    // Get the AI system with relations
    const system = await prisma.aISystem.findUnique({
      where: { id: systemId },
      include: {
        fria: { select: { id: true } },
        qms: { select: { id: true } },
        scanResults: { select: { scanType: true } },
        documents: { select: { type: true } },
      },
    });

    if (!system) {
      return NextResponse.json(
        { error: "AI system not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (system.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get tier items
    const tierItems = TIER_ITEMS[tier] ?? TIER_ITEMS.free;

    // Build items with generation status
    const items = (tierItems ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      articleRef: item.articleRef,
      status: isItemGenerated(item.id, system) ? "generated" as const : "pending" as const,
      type: item.type,
    }));

    const generatedCount = items.filter((i) => i.status === "generated").length;

    return NextResponse.json({
      tier,
      system: {
        id: system.id,
        name: system.name,
        riskLevel: system.riskLevel,
        systemType: system.systemType,
      },
      items,
      generatedCount,
      totalCount: items.length,
    });
  } catch (error) {
    console.error("[COMPLIANCE-GENERATOR] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch generation status" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { systemId, items: selectedItems } = body as {
      systemId: string;
      items?: string[] | null;
    };

    if (!systemId) {
      return NextResponse.json(
        { error: "systemId is required" },
        { status: 400 }
      );
    }

    // Get user's subscription tier
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { tier: true },
    });

    const tier = subscription?.tier ?? "free";

    // Get the AI system with FULL relations for dynamic content generation
    const system = await prisma.aISystem.findUnique({
      where: { id: systemId },
      include: {
        fria: true,
        qms: true,
        scanResults: true,
        documents: true,
      },
    });

    if (!system) {
      return NextResponse.json(
        { error: "AI system not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (system.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get tier items
    const tierItems = TIER_ITEMS[tier] ?? TIER_ITEMS.free;

    // Determine which items to generate
    const safeTierItems = tierItems ?? [];
    let itemsToGenerate: GenerationItem[];
    if (selectedItems && selectedItems.length > 0) {
      itemsToGenerate = safeTierItems.filter((item) =>
        selectedItems.includes(item.id)
      );
    } else {
      // Generate all items not yet generated
      itemsToGenerate = safeTierItems.filter(
        (item) => !isItemGenerated(item.id, system)
      );
    }

    const generated: string[] = [];
    const userId = session.user.id;

    // Generate each item
    for (const item of itemsToGenerate) {
      try {
        switch (item.id) {
          case "risk-assessment": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Risk Classification Report (Art.6)`,
                type: "risk-assessment",
                content: generateRiskAssessmentContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "prohibited-practices": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Prohibited Practices Check (Art.5)`,
                type: "prohibited-practices",
                content: generateProhibitedPracticesContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "transparency": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Transparency Obligations Check (Art.50)`,
                type: "transparency",
                content: generateTransparencyContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "basic-docs": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Basic Technical Documentation (Art.11)`,
                type: "technical-doc",
                content: generateBasicDocsContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "lifecycle": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Lifecycle Management Report (Art.9)`,
                type: "lifecycle",
                content: generateLifecycleContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "data-governance": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Data Governance Assessment (Art.10)`,
                type: "data-governance",
                content: generateDataGovernanceContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "specialized-checks": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Specialized Compliance Checks (Art.12-15)`,
                type: "specialized-checks",
                content: generateSpecializedChecksContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "fria": {
            if (!system.fria) {
              const friaSections = generateFRIASections(system as SystemWithRelations);
              await prisma.fRIAAssessment.create({
                data: {
                  systemId,
                  section1: friaSections.section1,
                  section2: friaSections.section2,
                  section3: friaSections.section3,
                  section4: friaSections.section4,
                  section5: friaSections.section5,
                  section6: friaSections.section6,
                  status: "draft",
                  overallScore: friaSections.overallScore,
                },
              });
              generated.push(item.id);
            }
            break;
          }

          case "technical-doc": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Full Technical Documentation (Annex IV)`,
                type: "technical-doc",
                content: generateTechnicalDocContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "qms": {
            if (!system.qms) {
              // Calculate realistic QMS completion based on system risk level and existing compliance flags
              const riskLevel = (system.riskLevel || "").toLowerCase();
              const isHighRisk = riskLevel === "high";

              // Base completion: high-risk systems get more items checked by default
              const riskManagement = isHighRisk || system.art9Compliant;
              const dataGovernance = isHighRisk || system.art10Compliant;
              const technicalDoc = isHighRisk || system.art12Compliant || system.art13Compliant;
              const recordKeeping = isHighRisk || system.art12Compliant;
              const transparency = isHighRisk || system.art13Compliant;
              const humanOversight = isHighRisk || system.art14Compliant;
              const accuracyRobustness = isHighRisk || system.art15Compliant;
              const cybersecurity = isHighRisk;
              const qualityControl = isHighRisk;
              const postMarket = isHighRisk;
              const incidentReporting = isHighRisk;

              const checkedCount = [
                riskManagement, dataGovernance, technicalDoc, recordKeeping,
                transparency, humanOversight, accuracyRobustness, cybersecurity,
                qualityControl, postMarket, incidentReporting,
              ].filter(Boolean).length;
              const completionRate = Math.round((checkedCount / 11) * 100);

              await prisma.qMSChecklist.create({
                data: {
                  systemId,
                  riskManagement,
                  dataGovernance,
                  technicalDoc,
                  recordKeeping,
                  transparency,
                  humanOversight,
                  accuracyRobustness,
                  cybersecurity,
                  qualityControl,
                  postMarket,
                  incidentReporting,
                  completionRate,
                  status: completionRate === 100 ? "complete" : "incomplete",
                },
              });
              generated.push(item.id);
            }
            break;
          }

          case "deployer-obligations": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Deployer Obligations Checklist (Art.26)`,
                type: "deployer-obligations",
                content: generateDeployerObligationsContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "regulatory-compliance": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Regulatory Compliance Report (Art.43-73)`,
                type: "regulatory-compliance",
                content: generateRegulatoryComplianceContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "industry-templates": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Industry-Specific Compliance Templates`,
                type: "industry-template",
                content: generateIndustryTemplatesContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "role-obligations": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Role-Based Obligations Matrix`,
                type: "role-obligations",
                content: generateRoleObligationsContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "evidence-pack": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Evidence Pack Summary`,
                type: "evidence-pack",
                content: generateEvidencePackContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "gpai-compliance": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - GPAI Obligations Checklist (Art.51-56)`,
                type: "gpai-compliance",
                content: generateGPAIComplianceContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "gdpr-scan": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - GDPR Compliance Assessment`,
                type: "gdpr-scan",
                content: generateGDPRScanContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "regulation-tracker": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Regulation Change Analysis`,
                type: "regulation-tracker",
                content: generateRegulationTrackerContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "custom-checklists": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - Custom Compliance Checklists`,
                type: "custom-checklist",
                content: generateCustomChecklistsContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "ai-assistant": {
            await prisma.complianceDocument.create({
              data: {
                userId,
                systemId,
                title: `${system.name} - AI Compliance Overview`,
                type: "ai-compliance-summary",
                content: generateAIAssistantContent(system as SystemWithRelations),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "url-scan": {
            // URL scan is handled separately by the URL scanner tool
            // Mark as skipped in this generator
            break;
          }

          default:
            console.warn(
              `[COMPLIANCE-GENERATOR] Unknown item: ${item.id}`
            );
        }
      } catch (itemError) {
        console.error(
          `[COMPLIANCE-GENERATOR] Failed to generate item "${item.id}":`,
          itemError
        );
        // Continue generating other items
      }
    }

    // Update AI system compliance flags based on what was generated
    const complianceUpdate: Record<string, boolean> = {};
    if (generated.includes("risk-assessment")) {
      complianceUpdate.art6Compliant = true;
    }
    if (generated.includes("lifecycle")) {
      complianceUpdate.art9Compliant = true;
    }
    if (generated.includes("data-governance")) {
      complianceUpdate.art10Compliant = true;
    }
    if (generated.includes("specialized-checks")) {
      complianceUpdate.art12Compliant = true;
      complianceUpdate.art13Compliant = true;
      complianceUpdate.art14Compliant = true;
      complianceUpdate.art15Compliant = true;
    }
    if (generated.includes("qms")) {
      complianceUpdate.art17Compliant = true;
    }
    if (generated.includes("fria")) {
      complianceUpdate.art27Compliant = true;
    }

    if (Object.keys(complianceUpdate).length > 0) {
      await prisma.aISystem.update({
        where: { id: systemId },
        data: complianceUpdate,
      });
    }

    // Create audit log entry
    await createAuditLog({
      userId,
      action: "report_generated",
      resource: "compliance-generator",
      details: {
        systemId,
        systemName: system.name,
        tier,
        itemsGenerated: generated,
        totalGenerated: generated.length,
      },
    });

    return NextResponse.json({
      success: true,
      generated,
      systemId,
      totalGenerated: generated.length,
    });
  } catch (error) {
    console.error("[COMPLIANCE-GENERATOR] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to generate compliance documents" },
      { status: 500 }
    );
  }
}
