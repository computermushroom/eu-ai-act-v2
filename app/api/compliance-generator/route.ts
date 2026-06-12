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
// Document content generators
// ---------------------------------------------------------------------------

function generateRiskAssessmentContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Risk Classification Report`,
    articleRef: "Art.6",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. System Identification",
        content: `This report provides a risk classification for the AI system "${systemName}" in accordance with Article 6 of the EU AI Act (Regulation (EU) 2024/1689). The classification determines which regulatory obligations apply based on the system's intended purpose, capabilities, and deployment context.`,
      },
      {
        title: "2. Risk Classification Methodology",
        content: "The risk classification follows the four-tier framework established by the EU AI Act: (1) Unacceptable Risk - practices prohibited under Art.5; (2) High Risk - systems listed in Annex III requiring full conformity assessment; (3) Limited Risk - systems subject to transparency obligations under Art.50; (4) Minimal Risk - systems with no specific regulatory requirements beyond general principles. Each criterion is evaluated against the system's documented capabilities and intended use cases.",
      },
      {
        title: "3. Prohibited Practice Screening (Art.5)",
        content: "Screening against all prohibited practices listed in Article 5: (a) subliminal techniques to distort behaviour; (b) exploiting vulnerabilities of specific groups; (c) social scoring by public authorities; (d) individual predictive policing based solely on profiling; (e) untargeted scraping of facial images for facial recognition; (f) emotion inference in workplace and education (except for medical/safety purposes); (g) biometric categorisation using sensitive characteristics; (h) real-time remote biometric identification in public spaces for law enforcement (with narrow exceptions). Result: Each item must be assessed against the system's actual functionality.",
      },
      {
        title: "4. High-Risk Assessment (Annex III)",
        content: "Evaluation against Annex III high-risk categories: (1) Biometric identification and categorisation systems; (2) Critical infrastructure management; (3) Education and vocational training; (4) Employment and workers management; (5) Access to essential private and public services; (6) Law enforcement; (7) Migration, asylum, and border control; (8) Administration of justice and democratic processes. Each category is assessed for relevance to the system's deployment context.",
      },
      {
        title: "5. Limited Risk Assessment (Art.50)",
        content: "Assessment of transparency obligations: Does the system interact with natural persons? Does it generate or manipulate image, audio, or video content that appears authentic (deepfakes)? Is the AI nature of the interaction or content sufficiently disclosed to users? If any of these apply, the system falls under limited risk with mandatory transparency requirements.",
      },
      {
        title: "6. Final Classification",
        content: "Based on the analysis above, the risk classification is determined. This classification drives the applicable regulatory requirements: Unacceptable risk systems must be prohibited; High-risk systems require conformity assessment, technical documentation, QMS, human oversight, and registration; Limited-risk systems require transparency disclosures; Minimal-risk systems are encouraged to follow voluntary codes of conduct.",
      },
      {
        title: "7. Recommended Actions",
        content: "Based on the assigned risk level, the following actions are recommended: (1) Review and update the classification annually or upon significant system changes; (2) Implement the compliance obligations corresponding to the assigned risk level; (3) Document the rationale for the classification decision; (4) Maintain records of the classification methodology and evidence used.",
      },
    ],
    classification: {
      currentLevel: "pending-assessment",
      assessedBy: "automated-generator",
      assessmentDate: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
}

function generateProhibitedPracticesContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Prohibited Practices Check`,
    articleRef: "Art.5",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Prohibited Practices Overview (Art.5)",
        content: "Article 5 of the EU AI Act prohibits specific AI practices that pose a clear threat to fundamental rights, democratic values, and the rule of law. This assessment evaluates whether the AI system engages in or enables any of these prohibited practices.",
      },
      {
        title: "2. Subliminal Techniques (Art.5(1)(a))",
        content: "Assessment: Does the system deploy subliminal techniques beyond a person's consciousness to materially distort their behaviour, with the objective or effect of causing or likely to cause significant harm? Evaluation criteria: (a) whether the system uses techniques that bypass conscious perception; (b) whether such techniques are intended to distort decision-making; (c) whether the distortion could lead to significant harm to individuals or groups. Status: To be evaluated based on system design and deployment.",
      },
      {
        title: "3. Exploitation of Vulnerabilities (Art.5(1)(b))",
        content: "Assessment: Does the system exploit vulnerabilities of specific groups of persons due to their age, disability, or social or economic situation, with the objective or effect of causing or likely to cause significant harm? Evaluation criteria: (a) identification of target user groups; (b) assessment of whether the system design exploits known vulnerabilities; (c) evaluation of potential harm severity. Status: To be evaluated based on user demographics and system design.",
      },
      {
        title: "4. Social Scoring (Art.5(1)(c))",
        content: "Assessment: Is the system used by public authorities for social scoring that leads to detrimental treatment unrelated to the context in which the data was generated? This prohibition covers general-purpose social scoring systems that aggregate diverse behavioural data to classify individuals. Status: To be evaluated based on system purpose and deployer context.",
      },
      {
        title: "5. Individual Predictive Policing (Art.5(1)(d))",
        content: "Assessment: Does the system make risk assessments of natural persons based solely on profiling or personality traits, for the purpose of predicting criminal or administrative offences? This applies only to individual-level predictions, not area-based or group-based risk analysis. Status: To be evaluated based on system methodology and output.",
      },
      {
        title: "6. Facial Recognition Database Scraping (Art.5(1)(e))",
        content: "Assessment: Does the system create or expand facial recognition databases through untargeted scraping of facial images from the internet or CCTV footage? Exceptions exist for law enforcement in specific circumstances. Status: To be evaluated based on data collection methodology.",
      },
      {
        title: "7. Emotion Inference (Art.5(1)(f))",
        content: "Assessment: Does the system infer emotions of natural persons in workplace or educational institutions, unless for medical or safety reasons? This prohibition covers real-time and post-hoc emotion recognition in these specific contexts. Status: To be evaluated based on deployment context and system capabilities.",
      },
      {
        title: "8. Biometric Categorisation (Art.5(1)(g))",
        content: "Assessment: Does the system use biometric categorisation systems that use sensitive characteristics (race, political opinions, trade union membership, religious beliefs, sexual orientation)? Status: To be evaluated based on classification categories and data processing methodology.",
      },
      {
        title: "9. Real-Time Remote Biometric ID (Art.5(1)(h))",
        content: "Assessment: Does the system perform real-time remote biometric identification in publicly accessible spaces for law enforcement purposes? Narrow exceptions exist for targeted searches of victims, prevention of imminent threats, and prosecution of serious crimes with judicial authorisation. Status: To be evaluated based on system capabilities and deployment context.",
      },
      {
        title: "10. Compliance Summary",
        content: "Summary of all prohibited practice checks. Each item must be marked as Compliant, Non-Compliant, or Not Applicable. Any Non-Compliant finding requires immediate remediation or system modification before deployment. Items marked Not Applicable should include justification for the determination.",
      },
    ],
    checks: [
      { id: "subliminal", label: "Subliminal Techniques", status: "pending", notes: "" },
      { id: "vulnerabilities", label: "Exploitation of Vulnerabilities", status: "pending", notes: "" },
      { id: "social-scoring", label: "Social Scoring", status: "pending", notes: "" },
      { id: "predictive-policing", label: "Individual Predictive Policing", status: "pending", notes: "" },
      { id: "facial-scraping", label: "Facial Recognition Scraping", status: "pending", notes: "" },
      { id: "emotion-inference", label: "Emotion Inference", status: "pending", notes: "" },
      { id: "biometric-cat", label: "Biometric Categorisation", status: "pending", notes: "" },
      { id: "remote-biometric", label: "Real-Time Remote Biometric ID", status: "pending", notes: "" },
    ],
  });
}

function generateTransparencyContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Transparency Obligations Check`,
    articleRef: "Art.50",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Transparency Obligations Overview (Art.50)",
        content: "Article 50 of the EU AI Act establishes transparency obligations for AI systems that interact with humans, generate content, or classify individuals. This assessment evaluates compliance with all applicable transparency requirements.",
      },
      {
        title: "2. AI System Disclosure (Art.50(1))",
        content: "Assessment: Does the system interact with natural persons? If so, the deployer must inform natural persons that they are interacting with an AI system. This obligation applies unless it is obvious from the context. Evaluation: (a) identify all interaction modalities (chat, voice, video); (b) determine if AI nature is obvious to users; (c) assess adequacy of current disclosure mechanisms; (d) document disclosure placement and wording.",
      },
      {
        title: "3. Emotion Recognition / Biometric Categorisation (Art.50(2))",
        content: "Assessment: Does the system perform emotion recognition or biometric categorisation? If so, the deployer must inform exposed natural persons of the operation of the AI system. This applies to both real-time and non-real-time systems. Evaluation: (a) identify all biometric processing functions; (b) assess current notification mechanisms; (c) verify compliance with data protection requirements.",
      },
      {
        title: "4. Deepfake / Synthetic Content (Art.50(3))",
        content: "Assessment: Does the system generate or manipulate image, audio, or video content that resembles authentic content? If so, the output must be labelled as artificially generated or manipulated. This covers deepfakes, AI-generated text, voice cloning, and image generation. Evaluation: (a) identify all content generation capabilities; (b) assess adequacy of labelling mechanisms; (c) verify metadata embedding practices; (d) evaluate detectability of AI-generated markers.",
      },
      {
        title: "5. AI-Generated Text Disclosure (Art.50(4))",
        content: "Assessment: Does the system generate text for the purpose of informing the public on matters of public interest? If so, the deployer must disclose that the content has been artificially generated. This applies to news articles, public communications, and informational content. Evaluation: (a) identify public-facing text generation use cases; (b) assess disclosure adequacy; (c) verify compliance with journalistic standards.",
      },
      {
        title: "6. Compliance Matrix",
        content: "Summary matrix mapping each transparency obligation to the system's current compliance status. Each obligation is rated as Compliant, Partially Compliant, Non-Compliant, or Not Applicable with supporting evidence and remediation recommendations.",
      },
      {
        title: "7. Implementation Recommendations",
        content: "Based on the assessment findings, specific recommendations for achieving full transparency compliance: (1) implement clear AI disclosure notices in all user-facing interfaces; (2) add metadata tags to AI-generated content; (3) establish monitoring processes to ensure ongoing compliance; (4) train staff on transparency obligations; (5) document all disclosure mechanisms for audit purposes.",
      },
    ],
    checks: [
      { id: "ai-disclosure", label: "AI System Disclosure", status: "pending", notes: "" },
      { id: "emotion-disclosure", label: "Emotion/Biometric Disclosure", status: "pending", notes: "" },
      { id: "deepfake-labelling", label: "Deepfake/Synthetic Content Labelling", status: "pending", notes: "" },
      { id: "text-disclosure", label: "AI-Generated Text Disclosure", status: "pending", notes: "" },
    ],
  });
}

function generateBasicDocsContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Basic Technical Documentation`,
    articleRef: "Art.11",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. System Overview",
        content: `This document provides the foundational technical documentation for the AI system "${systemName}". It covers the system's identity, intended purpose, basic architecture, and operational context as required under Article 11 of the EU AI Act.`,
      },
      {
        title: "2. System Identification",
        content: "System name, version, and unique identifiers. Provider/developer information including legal entity name, registration number, and contact details. Intended deployment jurisdiction(s) and applicable regulatory frameworks.",
      },
      {
        title: "3. Intended Purpose",
        content: "A clear and concise description of the system's intended purpose. This includes: (a) the specific task(s) the system is designed to perform; (b) the context(s) in which it is intended to be used; (c) the target user groups; (d) any limitations or constraints on use. The intended purpose must be sufficiently specific to enable compliance assessment.",
      },
      {
        title: "4. System Architecture",
        content: "High-level description of the system architecture including: (a) main components and their interactions; (b) data flow between components; (c) integration points with external systems; (d) deployment topology (cloud, on-premise, edge, hybrid). This section provides a foundation for more detailed technical documentation at higher tiers.",
      },
      {
        title: "5. Input Data Description",
        content: "Description of input data types, formats, and sources. This includes: (a) the nature of input data (text, images, audio, video, structured data); (b) expected data quality requirements; (c) data preprocessing steps; (d) any data validation or sanitisation applied before processing.",
      },
      {
        title: "6. Output Description",
        content: "Description of system outputs including: (a) the format and type of outputs; (b) the intended interpretation of outputs; (c) known limitations on output accuracy; (d) confidence scores or uncertainty measures if applicable; (e) expected output latency and throughput.",
      },
      {
        title: "7. Known Limitations",
        content: "Documentation of known system limitations including: (a) scenarios where the system is not designed to function; (b) known failure modes and edge cases; (c) performance degradation under specific conditions; (d) any bias or fairness concerns identified during development. This section should be updated as new limitations are discovered.",
      },
    ],
  });
}

function generateLifecycleContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Lifecycle Management Report`,
    articleRef: "Art.9",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Risk Management System Overview (Art.9)",
        content: `Article 9 of the EU AI Act requires providers of high-risk AI systems to establish a continuous risk management system throughout the entire lifecycle of the AI system. This report documents the risk management approach for "${systemName}" across all lifecycle phases.`,
      },
      {
        title: "2. Design Phase Risk Management",
        content: "Risk identification and mitigation during system design: (a) identification of potential risks arising from the intended use and reasonably foreseeable misuse; (b) analysis of risks to health, safety, and fundamental rights; (c) estimation of probability and severity of identified risks; (d) determination of risk acceptance criteria; (e) design of risk mitigation measures including safety controls and fallback mechanisms; (f) documentation of design decisions and risk trade-offs.",
      },
      {
        title: "3. Development Phase Risk Management",
        content: "Risk management during system development: (a) implementation of designed risk mitigation measures; (b) testing and validation of risk controls; (c) bias detection and fairness testing; (d) adversarial robustness testing; (e) performance benchmarking against defined metrics; (f) code review and security assessment; (g) documentation of development-phase risk findings and resolutions.",
      },
      {
        title: "4. Deployment Phase Risk Management",
        content: "Risk management during system deployment: (a) deployment readiness assessment; (b) user acceptance testing; (c) pilot deployment and monitoring; (d) rollback procedures; (e) user training on system limitations and appropriate use; (f) establishment of incident response procedures; (g) configuration of monitoring and alerting systems.",
      },
      {
        title: "5. Operational Monitoring",
        content: "Continuous risk monitoring during operation: (a) performance monitoring against defined KPIs; (b) drift detection for data and model performance; (c) user feedback collection and analysis; (d) incident detection and classification; (e) regular risk re-assessment cycles; (f) monitoring of regulatory changes affecting risk classification; (g) documentation of operational risk findings.",
      },
      {
        title: "6. Update and Change Management",
        content: "Risk management for system updates: (a) impact assessment for proposed changes; (b) regression testing requirements; (c) re-validation of risk mitigations; (d) stakeholder notification procedures; (e) version control and audit trail; (f) rollback plans for failed updates; (g) documentation of change-related risk assessments.",
      },
      {
        title: "7. Decommissioning",
        content: "Risk management during system decommissioning: (a) data retention and deletion procedures; (b) user notification requirements; (c) transition planning for replacement systems; (d) archival of compliance documentation; (e) post-decommissioning monitoring period; (f) final risk assessment and closure report.",
      },
      {
        title: "8. Risk Register",
        content: "Template risk register capturing: risk ID, description, category, probability (1-5), severity (1-5), risk score, mitigation measures, residual risk, owner, status, and review date. This register should be maintained and reviewed at regular intervals throughout the system lifecycle.",
      },
    ],
  });
}

function generateDataGovernanceContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Data Governance Assessment`,
    articleRef: "Art.10",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Data Governance Framework (Art.10)",
        content: `Article 10 of the EU AI Act requires high-risk AI system providers to implement data governance practices for training, validation, and testing data. This assessment documents the data governance framework for "${systemName}" covering data quality, relevance, representativeness, and bias mitigation.`,
      },
      {
        title: "2. Training Data Quality",
        content: "Assessment of training data quality measures: (a) data collection methodology and sources; (b) data cleaning and preprocessing procedures; (c) data validation rules and quality checks; (d) handling of missing, corrupted, or anomalous data; (e) data labelling quality assurance; (f) documentation of data quality metrics and thresholds.",
      },
      {
        title: "3. Data Relevance and Representativeness",
        content: "Assessment of data relevance and representativeness: (a) alignment between training data and intended deployment context; (b) coverage of relevant use cases and edge cases; (c) demographic and geographic representativeness; (d) temporal relevance and currency of data; (e) identification of underrepresented populations or scenarios; (f) strategies for addressing representativeness gaps.",
      },
      {
        title: "4. Bias Detection and Mitigation",
        content: "Bias assessment and mitigation strategies: (a) identification of protected characteristics and potential bias vectors; (b) statistical fairness metrics applied (demographic parity, equalised odds, calibration); (c) bias testing methodology and results; (d) mitigation techniques applied (re-sampling, re-weighting, adversarial debiasing); (e) residual bias assessment and acceptance criteria; (f) ongoing bias monitoring plan.",
      },
      {
        title: "5. Data Provenance and Lineage",
        content: "Data provenance tracking: (a) documentation of data origin and collection context; (b) data transformation and processing history; (c) data sharing and licensing agreements; (d) intellectual property and copyright compliance; (e) consent and lawful basis documentation; (f) data lineage tracking mechanisms.",
      },
      {
        title: "6. Data Protection Compliance",
        content: "Alignment with GDPR requirements: (a) lawful basis for data processing; (b) data minimisation assessment; (c) purpose limitation compliance; (d) data subject rights handling; (e) Data Protection Impact Assessment (DPIA) status; (f) cross-border data transfer mechanisms; (g) data retention and deletion policies.",
      },
      {
        title: "7. Data Governance Policies",
        content: "Documented data governance policies: (a) data access control and authorisation; (b) data classification and sensitivity labelling; (c) data quality monitoring and reporting; (d) data incident response procedures; (e) data governance roles and responsibilities; (f) data governance review and audit schedule.",
      },
    ],
  });
}

function generateSpecializedChecksContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Specialized Compliance Checks`,
    articleRef: "Art.12-15",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Technical Documentation Adequacy (Art.12)",
        content: `Assessment of technical documentation compliance for "${systemName}" under Art.12: (a) completeness check against Annex IV requirements; (b) clarity and accessibility of documentation; (c) version control and update procedures; (d) availability of documentation to competent authorities; (e) documentation language requirements; (f) evidence of documentation review and approval.`,
      },
      {
        title: "2. Automatic Logging (Art.12(1)(d))",
        content: "Assessment of automatic logging capabilities: (a) logging of system events and decisions; (b) log retention period and storage; (c) log integrity and tamper protection; (d) log access controls; (e) logging of human oversight interventions; (f) traceability of system outputs to inputs and decisions.",
      },
      {
        title: "3. Record-Keeping (Art.12(1)(e))",
        content: "Assessment of record-keeping obligations: (a) duration of record retention (minimum 6 months for high-risk systems); (b) types of records maintained; (c) record storage and security; (d) record retrieval capabilities; (e) record disposal procedures; (f) compliance with data protection requirements for records.",
      },
      {
        title: "4. Transparency to Deployers (Art.13)",
        content: "Assessment of provider-to-deployer transparency: (a) clear instructions for use included in documentation; (b) identification of system capabilities and limitations; (c) specification of input data requirements; (d) expected performance metrics and accuracy levels; (e) known failure modes and edge cases; (f) human oversight requirements and configuration options; (g) maintenance and update obligations.",
      },
      {
        title: "5. Human Oversight (Art.14)",
        content: "Assessment of human oversight mechanisms: (a) identification of human oversight requirements; (b) design of oversight interfaces and tools; (c) ability for humans to override or correct system outputs; (d) training requirements for human overseers; (e) escalation procedures for anomalous situations; (f) documentation of oversight processes; (g) effectiveness of oversight measures.",
      },
      {
        title: "6. Accuracy, Robustness, and Cybersecurity (Art.15)",
        content: "Assessment of system quality attributes: (a) accuracy metrics and testing results; (b) robustness to input perturbations and adversarial attacks; (c) resilience to environmental changes; (d) cybersecurity measures including encryption, access control, and intrusion detection; (e) vulnerability management and patching procedures; (f) incident response and recovery capabilities; (g) regular security assessment schedule.",
      },
      {
        title: "7. Compliance Summary",
        content: "Consolidated summary of all Art.12-15 compliance checks with status indicators (Compliant, Partially Compliant, Non-Compliant, Not Applicable) and prioritised remediation recommendations.",
      },
    ],
    checks: [
      { id: "tech-doc", label: "Technical Documentation Adequacy", article: "Art.12", status: "pending" },
      { id: "auto-logging", label: "Automatic Logging", article: "Art.12", status: "pending" },
      { id: "record-keeping", label: "Record-Keeping", article: "Art.12", status: "pending" },
      { id: "transparency-deployer", label: "Transparency to Deployers", article: "Art.13", status: "pending" },
      { id: "human-oversight", label: "Human Oversight", article: "Art.14", status: "pending" },
      { id: "accuracy-robustness", label: "Accuracy, Robustness, Cybersecurity", article: "Art.15", status: "pending" },
    ],
  });
}

function generateFRIASections(systemName: string) {
  return {
    section1: JSON.stringify({
      title: "Section 1: System Description and Intended Purpose",
      content: `This section describes the AI system "${systemName}" and its intended purpose as required under Article 27 of the EU AI Act.\n\nSystem Description: [Provide a detailed description of the AI system including its name, version, developer, and core functionality.]\n\nIntended Purpose: [Describe the specific task(s) the system is designed to perform and the context(s) in which it will be deployed.]\n\nTarget Users: [Identify the individuals or groups who will interact with or be affected by the system.]\n\nDeployment Context: [Describe the physical, technical, and organisational environment in which the system will operate.]\n\nInteraction Modalities: [Describe how users interact with the system - e.g., web interface, API, embedded device, voice interface.]\n\nDecision Authority: [Describe whether the system makes autonomous decisions, provides recommendations, or supports human decision-making.]`,
    }),
    section2: JSON.stringify({
      title: "Section 2: Legal Basis and Necessity",
      content: `This section establishes the legal basis for deploying the AI system and demonstrates its necessity.\n\nLegal Basis: [Identify the applicable legal framework(s) authorising the use of this AI system, including EU and national law provisions.]\n\nNecessity Assessment: [Explain why an AI system is necessary to achieve the stated purpose, and why alternative non-AI solutions are insufficient.]\n\nProportionality Assessment: [Demonstrate that the use of the AI system is proportionate to the intended benefit, considering the potential impact on fundamental rights.]\n\nLawful Basis for Data Processing: [Under GDPR, identify the lawful basis for processing personal data through this system - e.g., consent, legitimate interest, legal obligation.]\n\nData Protection Impact Assessment: [Reference any DPIA conducted and summarise key findings.]\n\nLegal Review: [Document the date and outcome of legal review of the system's compliance with applicable law.]`,
    }),
    section3: JSON.stringify({
      title: "Section 3: Risks to Fundamental Rights",
      content: `This section identifies and assesses risks to fundamental rights posed by the AI system.\n\nRights at Risk: [Identify which fundamental rights may be affected, including: right to privacy, right to non-discrimination, right to freedom of expression, right to fair trial, right to dignity, right to data protection, right to effective remedy, right to freedom of assembly, rights of the child.]\n\nRisk Identification: [For each identified right, describe the specific risk scenario and how the system could interfere with the right.]\n\nRisk Assessment Matrix:\n- Likelihood: [Rate as Low/Medium/High based on probability of occurrence]\n- Severity: [Rate as Low/Medium/High based on impact on affected individuals]\n- Reversibility: [Rate as Reversible/Partially Reversible/Irreversible]\n- Scope: [Rate as Individual/Group/Societal]\n\nVulnerable Groups: [Identify groups that may be disproportionately affected, including children, elderly, persons with disabilities, ethnic minorities, and other protected groups.]\n\nCumulative Effects: [Assess whether the system's effects combine with other systems or processes to create compounded risks.]\n\nLong-term Effects: [Consider potential long-term societal effects of widespread deployment.]`,
    }),
    section4: JSON.stringify({
      title: "Section 4: Measures to Mitigate Risks",
      content: `This section describes the measures implemented to mitigate identified risks to fundamental rights.\n\nTechnical Measures: [Describe technical safeguards including: accuracy improvements, bias mitigation, robustness testing, security measures, audit logging, anomaly detection.]\n\nOrganisational Measures: [Describe organisational safeguards including: training programmes, governance structures, escalation procedures, accountability frameworks, staff supervision.]\n\nProcedural Measures: [Describe procedural safeguards including: human oversight mechanisms, appeal and redress processes, complaint handling, monitoring and review cycles.]\n\nTransparency Measures: [Describe how affected individuals are informed about the system's operation and their rights.]\n\nData Protection Measures: [Describe data protection safeguards including: data minimisation, purpose limitation, retention policies, encryption, access controls.]\n\nEffectiveness Assessment: [Evaluate the effectiveness of each mitigation measure and identify any residual risks.]\n\nMonitoring Plan: [Describe ongoing monitoring arrangements to detect and respond to new or evolving risks.]`,
    }),
    section5: JSON.stringify({
      title: "Section 5: Consultation with Stakeholders",
      content: `This section documents consultation with relevant stakeholders as part of the FRIA process.\n\nStakeholders Identified: [List all stakeholders consulted, including: data protection officers, works councils, employee representatives, civil society organisations, affected communities, domain experts, legal advisors.]\n\nConsultation Methodology: [Describe the methods used for consultation - e.g., interviews, surveys, workshops, public consultations.]\n\nKey Findings from Consultation: [Summarise the main concerns, suggestions, and recommendations raised by stakeholders.]\n\nStakeholder Concerns Addressed: [Describe how stakeholder feedback was incorporated into the system design and risk mitigation measures.]\n\nOutstanding Concerns: [Document any unresolved concerns and the rationale for proceeding despite these concerns.]\n\nConsultation Timeline: [Provide dates and summary of each consultation event.]\n\nDocumentation: [Reference all consultation records and supporting materials.]`,
    }),
    section6: JSON.stringify({
      title: "Section 6: Notification to Authority",
      content: `This section covers the notification to the competent authority as required under Article 27.\n\nCompetent Authority: [Identify the national competent authority responsible for AI regulation in the relevant jurisdiction.]\n\nNotification Content: [Describe the information provided to the authority, including: system description, FRIA summary, risk assessment results, mitigation measures, stakeholder consultation outcomes.]\n\nNotification Date: [Record the date of notification submission.]\n\nAuthority Response: [Document any response, guidance, or requirements from the authority.]\n\nFollow-up Actions: [Describe any actions taken in response to authority feedback.]\n\nOngoing Reporting: [Describe arrangements for ongoing reporting to the authority as required.]\n\nReview Schedule: [Document the schedule for FRIA review and update, including triggers for re-assessment such as significant system changes or new regulatory guidance.]`,
    }),
  };
}

function generateTechnicalDocContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Full Technical Documentation (Annex IV)`,
    articleRef: "Annex IV",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. General Information (Annex IV, Section 1)",
        content: `Complete technical documentation for "${systemName}" as required by Annex IV of the EU AI Act. This document provides comprehensive information about the AI system's design, development, training, testing, and deployment.`,
      },
      {
        title: "2. System Description and Intended Purpose (Annex IV, Section 2)",
        content: "Detailed description of: (a) system name, version, and release date; (b) provider name, address, and contact details; (c) system description including its main features and capabilities; (d) intended purpose and context of use; (e) target user groups and affected persons; (f) integration with other systems or processes; (g) system limitations and known issues; (h) system lifecycle description including maintenance and support arrangements.",
      },
      {
        title: "3. Technical Documentation of Design and Development (Annex IV, Section 3)",
        content: "Comprehensive design and development documentation: (a) system architecture and design diagrams; (b) algorithms and models used, including their type and version; (c) data requirements and specifications; (d) development methodology and tools; (e) design choices and trade-offs; (f) interface specifications; (g) performance requirements and constraints; (h) security design and threat model.",
      },
      {
        title: "4. Training Data and Training Process (Annex IV, Section 4)",
        content: "Detailed training data documentation: (a) data sources and collection methods; (b) data volumes and statistics; (c) data preprocessing and cleaning procedures; (d) data labelling methodology and quality assurance; (e) data representativeness analysis; (f) bias identification and mitigation measures; (g) data protection compliance assessment; (h) data governance policies applied; (i) training methodology including hyperparameters, training schedule, and computational resources.",
      },
      {
        title: "5. Validation and Testing (Annex IV, Section 5)",
        content: "Validation and testing documentation: (a) testing methodology and test plan; (b) validation datasets and their characteristics; (c) performance metrics and benchmark results; (d) accuracy, precision, recall, F1 scores; (e) robustness testing results; (f) adversarial testing results; (g) bias and fairness testing results; (h) cybersecurity testing results; (i) user acceptance testing results; (j) known failure modes and edge case handling.",
      },
      {
        title: "6. Performance Metrics (Annex IV, Section 6)",
        content: "System performance documentation: (a) key performance indicators (KPIs); (b) accuracy metrics across different use cases; (c) latency and throughput measurements; (d) resource consumption (CPU, memory, storage); (e) performance under different conditions; (f) performance degradation patterns; (g) comparison with baseline methods; (h) performance monitoring plan for deployment.",
      },
      {
        title: "7. Risk Management (Annex IV, Section 7)",
        content: "Risk management documentation: (a) risk management methodology; (b) risk identification results; (c) risk assessment and classification; (d) risk mitigation measures implemented; (e) residual risk assessment; (f) risk management throughout the lifecycle; (g) risk monitoring and review procedures; (h) risk register with current status of all identified risks.",
      },
      {
        title: "8. Human Oversight (Annex IV, Section 8)",
        content: "Human oversight documentation: (a) oversight interface design; (b) override and correction mechanisms; (c) human intervention triggers; (d) training requirements for human overseers; (e) escalation procedures; (f) effectiveness metrics for oversight; (g) documentation of oversight processes; (h) governance structure for oversight activities.",
      },
      {
        title: "9. Information for Deployers (Annex IV, Section 9)",
        content: "Deployer information documentation: (a) intended purpose and context of use; (b) system capabilities and limitations; (c) input data requirements and specifications; (d) expected performance metrics; (e) known failure modes and edge cases; (f) human oversight requirements; (g) monitoring and logging requirements; (h) maintenance and update procedures; (i) technical support contact information; (j) compliance obligations for deployers.",
      },
      {
        title: "10. Conformity Assessment (Annex IV, Section 10)",
        content: "Conformity assessment documentation: (a) applicable regulatory requirements; (b) conformity assessment procedure followed; (c) notified body involvement (if applicable); (d) EU declaration of conformity draft; (e) CE marking requirements; (f) registration in the EU database; (g) post-market monitoring plan; (h) incident reporting procedures.",
      },
    ],
  });
}

function generateDeployerObligationsContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Deployer Obligations Checklist`,
    articleRef: "Art.26",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Deployer Obligations Overview (Art.26)",
        content: `Article 26 of the EU AI Act sets out obligations for deployers (users) of high-risk AI systems. This checklist assesses compliance with all applicable deployer obligations for "${systemName}".`,
      },
      {
        title: "2. Use of High-Risk AI Systems (Art.26(1))",
        content: "Assessment: (a) verify the system bears CE marking and is registered in the EU database; (b) verify the provider has established the required technical documentation; (c) ensure the provider has implemented the required quality management system; (d) check that the provider has assigned a unique identification number; (e) verify the system includes the required instructions for use.",
      },
      {
        title: "3. Human Oversight (Art.26(2))",
        content: "Assessment: (a) assign competent individuals to oversee the operation of the AI system; (b) ensure overseers understand the system's capabilities and limitations; (c) provide adequate training to human overseers; (d) establish clear procedures for human intervention; (e) ensure sufficient resources for effective oversight; (f) document oversight activities and outcomes.",
      },
      {
        title: "4. Fundamental Rights Impact (Art.26(3))",
        content: "Assessment: (a) conduct a fundamental rights impact assessment before first use; (b) assess the impact on fundamental rights including privacy, non-discrimination, and fair trial; (c) identify and implement measures to mitigate negative impacts; (d) document the assessment findings and mitigation measures; (e) review and update the assessment periodically; (f) notify the market surveillance authority if significant risks are identified.",
      },
      {
        title: "5. Data Quality (Art.26(4))",
        content: "Assessment: (a) ensure input data is relevant and representative; (b) implement data quality checks; (c) monitor data quality during operation; (d) address data quality issues promptly; (e) document data quality procedures and results.",
      },
      {
        title: "6. Logging and Documentation (Art.26(5))",
        content: "Assessment: (a) maintain logs of system operation as required; (b) ensure logs capture sufficient detail for audit purposes; (c) implement log retention for the required period; (d) protect logs from unauthorised access or modification; (e) make logs available to competent authorities upon request.",
      },
      {
        title: "7. Incident Reporting (Art.26(6))",
        content: "Assessment: (a) establish procedures for detecting and reporting serious incidents; (b) report serious incidents to the provider and market surveillance authority; (c) document all incidents and corrective actions; (d) cooperate with investigations by competent authorities.",
      },
    ],
    checks: [
      { id: "ce-marking", label: "CE Marking and Registration Verification", status: "pending" },
      { id: "human-oversight", label: "Human Oversight Assignment", status: "pending" },
      { id: "fria", label: "Fundamental Rights Impact Assessment", status: "pending" },
      { id: "data-quality", label: "Data Quality Assurance", status: "pending" },
      { id: "logging", label: "Logging and Documentation", status: "pending" },
      { id: "incident-reporting", label: "Incident Reporting Procedures", status: "pending" },
    ],
  });
}

function generateRegulatoryComplianceContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Regulatory Compliance Report`,
    articleRef: "Art.43-73",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Conformity Assessment (Art.43-49)",
        content: `Assessment of conformity assessment procedures for "${systemName}": (a) determination of applicable conformity assessment procedure (Annex VI or VII); (b) selection and engagement of notified body (if required); (c) preparation of technical documentation; (d) submission for conformity assessment; (e) issuance of EU declaration of conformity; (f) CE marking affixation; (g) registration in the EU database for high-risk AI systems.`,
      },
      {
        title: "2. Notified Bodies (Art.43-46)",
        content: "Assessment of notified body requirements: (a) identification of applicable notified bodies; (b) conformity assessment application process; (c) documentation requirements for notified body review; (d) ongoing surveillance and re-assessment schedule; (e) notification of significant changes to the system.",
      },
      {
        title: "3. Market Surveillance (Art.58-63)",
        content: "Market surveillance obligations: (a) identification of relevant market surveillance authorities; (b) cooperation with market surveillance requests; (c) provision of access to technical documentation; (d) participation in market surveillance activities; (e) reporting of non-compliance findings; (f) corrective action procedures.",
      },
      {
        title: "4. Post-Market Monitoring (Art.72)",
        content: "Post-market monitoring plan: (a) monitoring methodology and scope; (b) performance tracking metrics; (c) incident detection and reporting procedures; (d) user feedback collection and analysis; (e) periodic review schedule; (f) trigger events for re-assessment; (g) documentation and reporting requirements.",
      },
      {
        title: "5. Enforcement and Penalties (Art.66-71)",
        content: "Awareness of enforcement provisions: (a) applicable penalties for non-compliance; (b) maximum penalty amounts by infringement type; (c) authority to restrict or prohibit system deployment; (d) right to appeal enforcement decisions; (e) cooperation obligations with investigating authorities.",
      },
      {
        title: "6. Implementation Timeline",
        content: "Key dates and deadlines: (a) application date of the EU AI Act; (b) phased implementation timeline for different provisions; (c) deadlines for specific obligations (prohibited practices, GPAI obligations, high-risk obligations); (d) grace periods and transitional provisions; (e) upcoming regulatory milestones.",
      },
    ],
  });
}

function generateIndustryTemplatesContent(systemName: string, industry?: string | null): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Industry-Specific Compliance Templates`,
    articleRef: "General",
    generatedAt: new Date().toISOString(),
    industry: industry || "general",
    sections: [
      {
        title: "1. Industry Context Analysis",
        content: `Analysis of industry-specific compliance requirements for "${systemName}" in the ${industry || "general"} sector. This section maps the EU AI Act requirements to the specific regulatory landscape, operational practices, and risk profiles of the relevant industry.`,
      },
      {
        title: "2. Sector-Specific Regulatory Mapping",
        content: "Mapping of EU AI Act requirements to sector-specific regulations: (a) identification of overlapping regulatory requirements; (b) analysis of sector-specific guidance from regulators; (c) identification of sector-specific codes of conduct; (d) assessment of industry standards and best practices; (e) cross-regulation compliance strategy.",
      },
      {
        title: "3. Industry-Specific Risk Factors",
        content: "Industry-specific risk assessment: (a) common risk patterns in the sector; (b) sector-specific vulnerable populations; (c) industry-specific failure modes and their consequences; (d) sector-specific data quality challenges; (e) industry-specific bias and fairness concerns; (f) operational context risks.",
      },
      {
        title: "4. Compliance Templates",
        content: "Pre-built compliance templates for the sector: (a) risk assessment templates tailored to industry use cases; (b) technical documentation templates with industry-specific sections; (c) transparency notice templates for common deployment scenarios; (d) human oversight procedure templates; (e) incident response playbooks for industry-specific scenarios.",
      },
      {
        title: "5. Best Practice Recommendations",
        content: "Industry best practices for AI compliance: (a) sector-specific governance frameworks; (b) industry benchmarking data; (c) peer comparison of compliance approaches; (d) industry association guidance; (e) case studies of compliance implementations in the sector.",
      },
    ],
  });
}

function generateRoleObligationsContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Role-Based Obligations Matrix`,
    articleRef: "General",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Role Definitions",
        content: "Definitions of roles under the EU AI Act: (a) Provider - any natural or legal person that develops an AI system or a GPAI model and places it on the market or puts it into service under its own name or trademark; (b) Deployer - any natural or legal person using an AI system under its authority; (c) Importer - any natural or legal person placing an AI system from a third country on the EU market; (d) Distributor - any natural or legal person making an AI system available on the EU market; (e) Manufacturer - any natural or legal person manufacturing a product into which an AI system is embedded; (f) Authorized Representative - natural or legal person established in the EU authorised by the provider.",
      },
      {
        title: "2. Provider Obligations Matrix",
        content: "Comprehensive provider obligations: risk management system (Art.9), data governance (Art.10), technical documentation (Art.11), record-keeping (Art.12), transparency to deployers (Art.13), human oversight design (Art.14), accuracy and robustness (Art.15), quality management system (Art.17), conformity assessment (Art.43), post-market monitoring (Art.72), registration obligations, and incident reporting.",
      },
      {
        title: "3. Deployer Obligations Matrix",
        content: "Comprehensive deployer obligations: use of high-risk AI systems (Art.26), human oversight (Art.26(2)), fundamental rights impact assessment (Art.26(3)), data quality (Art.26(4)), logging (Art.26(5)), incident reporting (Art.26(6)), transparency obligations (Art.50), and cooperation with authorities.",
      },
      {
        title: "4. Importer and Distributor Obligations",
        content: "Importer obligations (Art.25): verify conformity assessment, ensure provider has drawn up technical documentation, maintain complaint handling, inform authorities of risks. Distributor obligations (Art.25): verify CE marking and documentation, ensure storage/transport conditions preserve compliance, inform authorities of concerns.",
      },
      {
        title: "5. Obligation Assignment for This System",
        content: `Specific obligation assignment for "${systemName}": (a) identification of the organisation's role(s) in relation to this system; (b) mapping of applicable obligations based on assigned role(s); (c) identification of shared or overlapping obligations; (d) assignment of responsibility for each obligation to specific individuals or teams; (e) timeline for compliance with each obligation.`,
      },
    ],
    roles: ["provider", "deployer", "importer", "distributor", "manufacturer", "authorized-representative"],
  });
}

function generateEvidencePackContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Evidence Pack Summary`,
    articleRef: "General",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Evidence Pack Overview",
        content: `This evidence pack consolidates all compliance documentation and assessment results for "${systemName}" into a comprehensive package suitable for demonstrating compliance to regulators, auditors, and stakeholders.`,
      },
      {
        title: "2. Document Inventory",
        content: "Complete inventory of all compliance documents generated for this system: (a) risk classification report; (b) prohibited practices check; (c) transparency obligations check; (d) technical documentation; (e) lifecycle management report; (f) data governance assessment; (g) specialized compliance checks; (h) FRIA assessment; (i) QMS checklist; (j) deployer obligations checklist; (k) regulatory compliance report; (l) evidence pack summary. Each document is listed with its generation date, version, and status.",
      },
      {
        title: "3. Compliance Status Dashboard",
        content: "Summary of compliance status across all assessed articles: (a) Art.5 - Prohibited Practices; (b) Art.6 - Risk Classification; (c) Art.9 - Risk Management; (d) Art.10 - Data Governance; (e) Art.11 - Technical Documentation; (f) Art.12 - Record-Keeping; (g) Art.13 - Transparency to Deployers; (h) Art.14 - Human Oversight; (i) Art.15 - Accuracy and Robustness; (j) Art.17 - Quality Management; (k) Art.26 - Deployer Obligations; (l) Art.27 - FRIA; (m) Art.50 - Transparency Obligations; (n) Art.43-73 - Regulatory Compliance.",
      },
      {
        title: "4. Gap Analysis",
        content: "Identification of compliance gaps: (a) articles with partial compliance; (b) articles requiring additional evidence; (c) outstanding assessments or reviews; (d) recommended remediation actions; (e) priority ranking of gaps based on risk level.",
      },
      {
        title: "5. Audit Trail",
        content: "Complete audit trail of compliance activities: (a) document generation timestamps; (b) assessment completion records; (c) review and approval history; (d) modification history; (e) system compliance flag updates.",
      },
    ],
  });
}

function generateGPAIComplianceContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - GPAI Obligations Checklist`,
    articleRef: "Art.51-56",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. GPAI Model Obligations Overview (Art.51-56)",
        content: `Assessment of General-Purpose AI (GPAI) model obligations for "${systemName}" under Articles 51-56 of the EU AI Act. This covers both general GPAI obligations and additional obligations for GPAI models with systemic risk.`,
      },
      {
        title: "2. Technical Documentation (Art.51)",
        content: "GPAI technical documentation requirements: (a) training data and methodology; (b) model architecture and design; (c) performance benchmarks; (d) intended and actual use cases; (e) known limitations and risks; (f) evaluation methodologies; (g) safety and security measures. Documentation must be sufficient to enable downstream providers to comply with their obligations.",
      },
      {
        title: "3. Copyright Compliance (Art.53)",
        content: "Copyright and intellectual property compliance: (a) policy to comply with EU copyright law; (b) documentation of training data sources; (c) compliance with opt-out mechanisms under Art.4(3) of the DSM Directive; (d) summary of content used for training; (e) measures to respect text and data mining exceptions and limitations.",
      },
      {
        title: "4. Systemic Risk Assessment (Art.55)",
        content: "Systemic risk assessment for GPAI models: (a) criteria for systemic risk classification (computing power threshold, training data scale, user base); (b) evaluation of model capabilities against risk indicators; (c) assessment of potential societal impacts; (d) determination of systemic risk status; (e) notification to the AI Office if applicable.",
      },
      {
        title: "5. Systemic Risk Mitigation (Art.56)",
        content: "If classified as a GPAI model with systemic risk: (a) performance evaluation and adversarial testing; (b) assessment and mitigation of systemic risks; (c) incident tracking and reporting; (d) cybersecurity protection; (e) model evaluation through standardised protocols; (f) downstream provider information requirements; (g) compliance with emergency measures from the Commission.",
      },
      {
        title: "6. Compliance Checklist",
        content: "Comprehensive checklist of all GPAI obligations with status tracking.",
      },
    ],
    checks: [
      { id: "tech-doc", label: "GPAI Technical Documentation", status: "pending" },
      { id: "copyright", label: "Copyright Compliance Policy", status: "pending" },
      { id: "opt-out", label: "Opt-Out Mechanism Compliance", status: "pending" },
      { id: "training-summary", label: "Training Data Summary", status: "pending" },
      { id: "systemic-risk", label: "Systemic Risk Assessment", status: "pending" },
      { id: "adversarial", label: "Adversarial Testing", status: "pending" },
      { id: "incident", label: "Incident Tracking", status: "pending" },
      { id: "cybersecurity", label: "Cybersecurity Protection", status: "pending" },
    ],
  });
}

function generateGDPRScanContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - GDPR Compliance Assessment`,
    articleRef: "GDPR / Art.36",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. GDPR-AI Act Intersection",
        content: `Assessment of GDPR compliance for "${systemName}" in the context of the EU AI Act. The EU AI Act operates alongside the GDPR, and compliance with both frameworks is essential. This assessment identifies overlaps and specific requirements under each regulation.`,
      },
      {
        title: "2. Lawful Basis Assessment",
        content: "GDPR lawful basis analysis: (a) identification of applicable lawful basis (consent, contract, legal obligation, vital interests, public task, legitimate interests); (b) assessment of consent validity and specificity for AI processing; (c) evaluation of legitimate interests balancing test; (d) documentation of lawful basis determination; (e) assessment of whether the AI system's processing is compatible with the original purpose.",
      },
      {
        title: "3. Data Subject Rights",
        content: "Assessment of data subject rights compliance: (a) right of access - can individuals access their AI-related data; (b) right to rectification - can inaccurate data be corrected; (c) right to erasure - can AI training data be deleted; (d) right to restriction - can processing be suspended; (e) right to data portability - can data be transferred; (f) right to object - can automated processing be challenged; (g) rights related to automated decision-making (Art.22) - access to human review.",
      },
      {
        title: "4. Data Protection Impact Assessment (DPIA)",
        content: "DPIA requirements assessment: (a) determination of whether a DPIA is required (Art.35); (b) DPIA scope and methodology; (c) identification of high-risk processing operations; (d) assessment of necessity and proportionality; (e) risk identification and mitigation; (f) consultation with DPA if high risk remains; (g) DPIA review schedule.",
      },
      {
        title: "5. Data Minimisation and Purpose Limitation",
        content: "Assessment of data minimisation: (a) whether collected data is adequate, relevant, and limited to what is necessary; (b) whether data retention periods are defined and enforced; (c) whether purpose limitation is maintained across the AI lifecycle; (d) whether secondary uses of data are compatible with original purposes.",
      },
      {
        title: "6. Automated Decision-Making (Art.22)",
        content: "Assessment of automated decision-making provisions: (a) identification of automated decisions with legal or similarly significant effects; (b) safeguards implemented (right to human intervention, to express point of view, to contest the decision); (c) transparency of automated decision-making logic; (d) profiling assessment and safeguards.",
      },
      {
        title: "7. Cross-Regulation Alignment",
        content: "Alignment between GDPR and EU AI Act requirements: (a) DPIA and FRIA overlap and coordination; (b) data governance requirements under both regulations; (c) transparency obligations alignment; (d) human oversight requirements; (e) documentation and record-keeping alignment; (f) supervisory authority coordination.",
      },
    ],
    checks: [
      { id: "lawful-basis", label: "Lawful Basis Determined", status: "pending" },
      { id: "data-subject-rights", label: "Data Subject Rights Implemented", status: "pending" },
      { id: "dpia", label: "DPIA Conducted", status: "pending" },
      { id: "data-minimisation", label: "Data Minimisation Applied", status: "pending" },
      { id: "automated-decisions", label: "Automated Decision Safeguards", status: "pending" },
      { id: "cross-regulation", label: "GDPR-AI Act Alignment", status: "pending" },
    ],
  });
}

function generateRegulationTrackerContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Regulation Change Analysis`,
    articleRef: "General",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Regulatory Landscape Overview",
        content: `Current regulatory landscape affecting "${systemName}": (a) EU AI Act implementation timeline; (b) relevant national transposition measures; (c) sector-specific regulatory developments; (d) international regulatory developments (UK, US, Canada, Asia-Pacific); (e) upcoming regulatory deadlines and milestones.`,
      },
      {
        title: "2. EU AI Act Implementation Timeline",
        content: "Key implementation dates: (a) Entry into force - 1 August 2024; (b) Prohibited practices (Art.5) - 2 February 2025; (c) GPAI obligations (Art.51-56) - 2 August 2025; (d) High-risk obligations (Art.6-49) - 2 August 2026; (e) Specific high-risk systems (Annex I) - 2 August 2027. Assessment of current compliance status against each deadline.",
      },
      {
        title: "3. Regulatory Change Tracking",
        content: "Mechanisms for tracking regulatory changes: (a) European Commission AI Office publications; (b) EU regulatory watch services; (c) national competent authority guidance; (d) industry association updates; (e) legal advisory services; (f) automated regulatory monitoring tools.",
      },
      {
        title: "4. Impact Assessment Framework",
        content: "Framework for assessing impact of regulatory changes: (a) change identification and classification; (b) impact analysis on current compliance status; (c) gap identification; (d) remediation planning; (e) resource allocation; (f) timeline for compliance; (g) documentation of impact assessment.",
      },
      {
        title: "5. Recent and Upcoming Changes",
        content: "Summary of recent regulatory developments and upcoming changes that may affect the system's compliance status. This section is updated as new guidance, standards, and implementing acts are published.",
      },
    ],
  });
}

function generateCustomChecklistsContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - Custom Compliance Checklists`,
    articleRef: "General",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Custom Checklist Framework",
        content: `Customisable compliance checklists for "${systemName}" that can be tailored to specific organisational needs, additional regulatory frameworks, or internal policies beyond the EU AI Act requirements.`,
      },
      {
        title: "2. EU AI Act Core Checklist",
        content: "Core EU AI Act compliance checklist covering all applicable articles: (a) prohibited practices (Art.5); (b) risk classification (Art.6); (c) risk management (Art.9); (d) data governance (Art.10); (e) technical documentation (Art.11); (f) record-keeping (Art.12); (g) transparency (Art.13, Art.50); (h) human oversight (Art.14); (i) accuracy and robustness (Art.15); (j) quality management (Art.17); (k) deployer obligations (Art.26); (l) FRIA (Art.27); (m) conformity assessment (Art.43-49); (n) post-market monitoring (Art.72).",
      },
      {
        title: "3. GDPR Integration Checklist",
        content: "GDPR-specific checklist items integrated with AI compliance: (a) lawful basis for AI processing; (b) DPIA completion; (c) data subject rights mechanisms; (d) data processing records; (e) international transfer safeguards; (f) data protection by design and by default; (g) DPO consultation requirements.",
      },
      {
        title: "4. Internal Policy Checklist",
        content: "Organisational policy checklist: (a) AI governance policy established; (b) responsible AI principles defined; (c) ethics review process in place; (d) employee AI usage policy; (e) vendor AI assessment policy; (f) incident response plan; (g) business continuity plan for AI failures; (h) training programme for AI literacy.",
      },
      {
        title: "5. Custom Items Template",
        content: "Template for adding custom checklist items: (a) item description; (b) regulatory reference; (c) responsible person/team; (d) due date; (e) evidence required; (f) status tracking; (g) notes and comments. This template can be duplicated and customised for additional frameworks such as ISO 42001, NIST AI RMF, or sector-specific standards.",
      },
    ],
    customItems: [],
  });
}

function generateAIAssistantContent(systemName: string): string {
  return JSON.stringify({
    reportTitle: `${systemName} - AI Compliance Overview`,
    articleRef: "General",
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: "1. Executive Summary",
        content: `AI-generated compliance overview for "${systemName}". This document provides a consolidated summary of all compliance assessments, identifies gaps and priorities, and recommends next steps for achieving and maintaining full EU AI Act compliance.`,
      },
      {
        title: "2. Compliance Scorecard",
        content: "Overall compliance scorecard: (a) total articles assessed; (b) articles fully compliant; (c) articles partially compliant; (d) articles non-compliant; (e) articles not applicable; (f) overall compliance percentage; (g) trend analysis compared to previous assessment period.",
      },
      {
        title: "3. Key Findings",
        content: "Summary of key findings from all assessments: (a) critical compliance gaps requiring immediate attention; (b) areas of strong compliance; (c) areas requiring improvement; (d) emerging risks identified; (e) positive compliance trends; (f) areas where additional evidence is needed.",
      },
      {
        title: "4. Priority Actions",
        content: "Prioritised list of recommended actions: (a) high-priority items (critical gaps, regulatory deadlines); (b) medium-priority items (improvements needed, best practice adoption); (c) low-priority items (enhancements, nice-to-have improvements). Each action includes estimated effort, responsible party, and suggested timeline.",
      },
      {
        title: "5. Regulatory Readiness Assessment",
        content: "Assessment of readiness for upcoming regulatory deadlines: (a) current readiness level for each upcoming deadline; (b) remaining work required; (c) resource requirements; (d) risk of non-compliance by deadline; (e) recommended acceleration measures if needed.",
      },
      {
        title: "6. Document References",
        content: "Cross-references to all generated compliance documents for detailed information on each topic. Links to risk assessment, prohibited practices check, transparency check, technical documentation, lifecycle report, data governance assessment, specialized checks, FRIA, QMS, deployer obligations, regulatory compliance, and evidence pack.",
      },
    ],
  });
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

    // Get the AI system with relations
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
                content: generateRiskAssessmentContent(system.name),
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
                content: generateProhibitedPracticesContent(system.name),
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
                content: generateTransparencyContent(system.name),
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
                content: generateBasicDocsContent(system.name),
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
                content: generateLifecycleContent(system.name),
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
                content: generateDataGovernanceContent(system.name),
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
                content: generateSpecializedChecksContent(system.name),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "fria": {
            if (!system.fria) {
              const friaSections = generateFRIASections(system.name);
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
                  overallScore: 50,
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
                content: generateTechnicalDocContent(system.name),
                version: 1,
                status: "draft",
              },
            });
            generated.push(item.id);
            break;
          }

          case "qms": {
            if (!system.qms) {
              await prisma.qMSChecklist.create({
                data: {
                  systemId,
                  riskManagement: true,
                  dataGovernance: true,
                  technicalDoc: true,
                  recordKeeping: true,
                  transparency: true,
                  humanOversight: true,
                  accuracyRobustness: true,
                  cybersecurity: true,
                  qualityControl: true,
                  postMarket: true,
                  incidentReporting: true,
                  completionRate: 100,
                  status: "complete",
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
                content: generateDeployerObligationsContent(system.name),
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
                content: generateRegulatoryComplianceContent(system.name),
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
                content: generateIndustryTemplatesContent(
                  system.name,
                  system.industry
                ),
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
                content: generateRoleObligationsContent(system.name),
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
                content: generateEvidencePackContent(system.name),
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
                content: generateGPAIComplianceContent(system.name),
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
                content: generateGDPRScanContent(system.name),
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
                content: generateRegulationTrackerContent(system.name),
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
                content: generateCustomChecklistsContent(system.name),
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
                content: generateAIAssistantContent(system.name),
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
