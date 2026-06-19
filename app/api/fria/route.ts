// FRIA API - Fundamental Rights Impact Assessment (Art.27)
// GET: List FRIA assessments for user's AI systems
// POST: Create/update FRIA assessment with sections 1-6

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { requireTier } from "@/lib/subscription-guard";

// ============================================================
// Section-level content quality validators
// ============================================================

interface SectionAnalysis {
  score: number;       // 0-20
  feedback: string[];
  recommendations: string[];
  filled: boolean;
  contentLength: number;
}

/**
 * Section 1: System Description
 * Must contain: system purpose, capabilities, decision-making process
 * Minimum 100 chars. Score: 0-20 based on completeness.
 */
function analyzeSection1(content: string | null | undefined): SectionAnalysis {
  const analysis: SectionAnalysis = {
    score: 0,
    feedback: [],
    recommendations: [],
    filled: false,
    contentLength: 0,
  };

  if (!content || content.trim().length === 0) {
    analysis.feedback.push("Section 1 (System Description) is empty. A description of the AI system, its intended purpose, and capabilities is required.");
    analysis.recommendations.push("Provide a comprehensive description of the AI system including: (1) the system's purpose and intended use cases, (2) its technical capabilities and decision-making process, (3) the context in which it operates, and (4) who interacts with the system.");
    return analysis;
  }

  analysis.filled = true;
  analysis.contentLength = content.trim().length;
  const lower = content.toLowerCase();

  // Check for system purpose
  const hasPurpose =
    lower.includes("purpose") ||
    lower.includes("intended use") ||
    lower.includes("objective") ||
    lower.includes("goal") ||
    lower.includes("function");

  // Check for capabilities
  const hasCapabilities =
    lower.includes("capabilit") ||
    lower.includes("feature") ||
    lower.includes("can ") ||
    lower.includes("able to") ||
    lower.includes("functionality") ||
    lower.includes("process");

  // Check for decision-making process
  const hasDecisionMaking =
    lower.includes("decision") ||
    lower.includes("output") ||
    lower.includes("predict") ||
    lower.includes("classif") ||
    lower.includes("recommend") ||
    lower.includes("algorithm") ||
    lower.includes("model") ||
    lower.includes("infer");

  // Check minimum length
  const meetsMinLength = content.trim().length >= 100;

  if (!meetsMinLength) {
    analysis.feedback.push(`Section 1 content is too brief (${content.trim().length} characters). Minimum 100 characters required for a meaningful system description.`);
    analysis.recommendations.push("Expand the system description to at least 100 characters, covering the system's purpose, capabilities, and decision-making process.");
    analysis.score = 2;
  } else {
    analysis.score += 4; // Base score for meeting minimum length
  }

  if (hasPurpose) {
    analysis.feedback.push("System purpose is described.");
    analysis.score += 6;
  } else {
    analysis.feedback.push("System purpose is not clearly described. Art.27 requires a clear explanation of the AI system's intended purpose.");
    analysis.recommendations.push("Explicitly describe the system's purpose and intended use cases.");
  }

  if (hasCapabilities) {
    analysis.feedback.push("System capabilities are described.");
    analysis.score += 5;
  } else {
    analysis.feedback.push("System capabilities are not described. The FRIA should explain what the AI system can do.");
    analysis.recommendations.push("Describe the system's technical capabilities and functionalities.");
  }

  if (hasDecisionMaking) {
    analysis.feedback.push("Decision-making process is described.");
    analysis.score += 5;
  } else {
    analysis.feedback.push("Decision-making process is not described. Art.27 requires explanation of how the AI system makes decisions or produces outputs.");
    analysis.recommendations.push("Explain the system's decision-making process, including what inputs it uses and how it produces outputs.");
  }

  return analysis;
}

/**
 * Section 2: Legal Basis
 * Must reference specific EU AI Act articles
 * Must identify data protection legal basis (GDPR Art.6)
 * Score: 0-20 based on legal references found.
 */
function analyzeSection2(content: string | null | undefined): SectionAnalysis {
  const analysis: SectionAnalysis = {
    score: 0,
    feedback: [],
    recommendations: [],
    filled: false,
    contentLength: 0,
  };

  if (!content || content.trim().length === 0) {
    analysis.feedback.push("Section 2 (Legal Basis) is empty. Identification of the legal basis under the EU AI Act and GDPR is required.");
    analysis.recommendations.push("Provide the legal basis for the AI system, including: (1) relevant EU AI Act articles (e.g., Art.6 for prohibited practices, Art.9-15 for high-risk requirements), (2) GDPR legal basis for data processing (Art.6), and (3) any other applicable EU legislation.");
    return analysis;
  }

  analysis.filled = true;
  analysis.contentLength = content.trim().length;
  const lower = content.toLowerCase();

  // Check for EU AI Act article references
  const hasEUAIActRef =
    lower.includes("eu ai act") ||
    lower.includes("ai act") ||
    lower.includes("art.") ||
    lower.includes("article") ||
    lower.includes("regulation (eu)") ||
    lower.includes("regulation 2024");

  // Check for specific article numbers
  const hasSpecificArticle = /\bart\.?\s*\d+/i.test(content) || /article\s*\d+/i.test(content);

  // Check for GDPR Art.6 reference
  const hasGDPRRef =
    lower.includes("gdpr") ||
    lower.includes("general data protection") ||
    lower.includes("art. 6") ||
    lower.includes("art.6") ||
    lower.includes("article 6") ||
    lower.includes("data protection");

  // Check for specific legal basis types
  const hasLegalBasisType =
    lower.includes("consent") ||
    lower.includes("legitimate interest") ||
    lower.includes("contract") ||
    lower.includes("legal obligation") ||
    lower.includes("vital interest") ||
    lower.includes("public interest") ||
    lower.includes("public task");

  if (hasEUAIActRef) {
    analysis.feedback.push("EU AI Act is referenced.");
    analysis.score += 5;
  } else {
    analysis.feedback.push("No reference to the EU AI Act found. Section 2 must identify the applicable EU AI Act provisions.");
    analysis.recommendations.push("Reference the specific EU AI Act articles that apply to this AI system.");
  }

  if (hasSpecificArticle) {
    analysis.feedback.push("Specific EU AI Act articles are referenced.");
    analysis.score += 5;
  } else {
    analysis.feedback.push("No specific article numbers cited. Reference specific articles (e.g., Art.6, Art.9, Art.27) for clarity.");
    analysis.recommendations.push("Cite specific EU AI Act article numbers that are relevant to this system.");
  }

  if (hasGDPRRef) {
    analysis.feedback.push("GDPR / data protection is referenced.");
    analysis.score += 5;
  } else {
    analysis.feedback.push("No GDPR or data protection reference found. Art.27 FRIA must consider data protection implications under GDPR Art.6.");
    analysis.recommendations.push("Identify the GDPR legal basis for data processing (e.g., consent, legitimate interest, contract performance) as required by GDPR Art.6.");
  }

  if (hasLegalBasisType) {
    analysis.feedback.push("Specific legal basis type is identified.");
    analysis.score += 5;
  } else {
    analysis.feedback.push("No specific legal basis type identified. Specify which legal basis applies (e.g., consent, legitimate interest, contract).");
    analysis.recommendations.push("Specify the exact legal basis for processing personal data (e.g., Art.6(1)(a) consent, Art.6(1)(b) contract, Art.6(1)(f) legitimate interest).");
  }

  return analysis;
}

/**
 * Section 3: Fundamental Rights Risks
 * Must identify at least one specific fundamental right at risk
 * Must describe the mechanism of harm
 * Score: 0-20 based on specificity.
 */
function analyzeSection3(content: string | null | undefined): SectionAnalysis {
  const analysis: SectionAnalysis = {
    score: 0,
    feedback: [],
    recommendations: [],
    filled: false,
    contentLength: 0,
  };

  if (!content || content.trim().length === 0) {
    analysis.feedback.push("Section 3 (Fundamental Rights Risks) is empty. Identification of risks to fundamental rights is a core requirement of Art.27.");
    analysis.recommendations.push("Identify and describe specific fundamental rights that may be at risk from the AI system, including: (1) the specific right(s) affected (e.g., privacy, non-discrimination, freedom of expression), (2) how the system could infringe on these rights, and (3) the mechanism of harm.");
    return analysis;
  }

  analysis.filled = true;
  analysis.contentLength = content.trim().length;
  const lower = content.toLowerCase();

  // Check for specific fundamental rights
  const fundamentalRightsKeywords = [
    "privacy",
    "data protection",
    "non-discrimination",
    "discrimination",
    "equality",
    "freedom of expression",
    "freedom of assembly",
    "right to education",
    "consumer protection",
    "workers' rights",
    "labor rights",
    "human dignity",
    "fair trial",
    "due process",
    "freedom of movement",
    "children",
    "vulnerable",
    "minority",
  ];

  const identifiedRights = fundamentalRightsKeywords.filter((keyword) =>
    lower.includes(keyword)
  );

  // Check for mechanism of harm
  const hasMechanismOfHarm =
    lower.includes("risk") ||
    lower.includes("harm") ||
    lower.includes("impact") ||
    lower.includes("threat") ||
    lower.includes("concern") ||
    lower.includes("danger") ||
    lower.includes("negative effect") ||
    lower.includes("adverse");

  // Check for specificity (mentions specific scenarios or affected groups)
  const hasSpecificity =
    lower.includes("could") ||
    lower.includes("may") ||
    lower.includes("for example") ||
    lower.includes("such as") ||
    lower.includes("specific") ||
    lower.includes("instance") ||
    lower.includes("scenario") ||
    lower.includes("case") ||
    lower.includes("affect") ||
    lower.includes("consequence");

  if (identifiedRights.length >= 2) {
    analysis.feedback.push(`Multiple fundamental rights identified: ${identifiedRights.join(", ")}.`);
    analysis.score += 8;
  } else if (identifiedRights.length === 1) {
    analysis.feedback.push(`One fundamental right identified: ${identifiedRights[0]}. Consider whether additional rights may be at risk.`);
    analysis.score += 5;
    analysis.recommendations.push("Review whether additional fundamental rights beyond the one identified could be affected by the AI system.");
  } else {
    analysis.feedback.push("No specific fundamental rights identified. Art.27(1)(c) requires identification of specific fundamental rights at risk.");
    analysis.recommendations.push("Identify the specific fundamental rights at risk (e.g., privacy, non-discrimination, freedom of expression, human dignity, consumer protection, workers' rights).");
  }

  if (hasMechanismOfHarm) {
    analysis.feedback.push("Mechanism of harm or risk is described.");
    analysis.score += 6;
  } else {
    analysis.feedback.push("No mechanism of harm described. Art.27 requires explanation of how the AI system could negatively affect fundamental rights.");
    analysis.recommendations.push("Describe the specific mechanisms by which the AI system could cause harm or negatively impact fundamental rights.");
  }

  if (hasSpecificity) {
    analysis.feedback.push("Risk description includes specific scenarios or affected groups.");
    analysis.score += 6;
  } else {
    analysis.feedback.push("Risk description lacks specificity. Provide concrete scenarios or identify specific groups that could be affected.");
    analysis.recommendations.push("Add specific examples of how risks could materialize, including scenarios and affected groups.");
  }

  return analysis;
}

/**
 * Section 4: Mitigation Measures
 * Must describe concrete measures (not just "we will comply")
 * Must link measures to identified risks
 * Score: 0-20 based on concreteness.
 */
function analyzeSection4(content: string | null | undefined): SectionAnalysis {
  const analysis: SectionAnalysis = {
    score: 0,
    feedback: [],
    recommendations: [],
    filled: false,
    contentLength: 0,
  };

  if (!content || content.trim().length === 0) {
    analysis.feedback.push("Section 4 (Mitigation Measures) is empty. Art.27 requires description of concrete measures to mitigate identified fundamental rights risks.");
    analysis.recommendations.push("Describe concrete mitigation measures that address the risks identified in Section 3, including: (1) technical safeguards, (2) organizational measures, (3) monitoring mechanisms, and (4) remediation procedures.");
    return analysis;
  }

  analysis.filled = true;
  analysis.contentLength = content.trim().length;
  const lower = content.toLowerCase();

  // Check for concrete measures (not just vague statements)
  const vaguePatterns = [
    "we will comply",
    "we comply",
    "in compliance",
    "we follow",
    "we adhere",
  ];
  const isVague = vaguePatterns.some((pattern) => lower.includes(pattern)) && content.trim().length < 200;

  const hasConcreteMeasures =
    lower.includes("implement") ||
    lower.includes("measure") ||
    lower.includes("safeguard") ||
    lower.includes("control") ||
    lower.includes("monitor") ||
    lower.includes("audit") ||
    lower.includes("review") ||
    lower.includes("procedure") ||
    lower.includes("protocol") ||
    lower.includes("training") ||
    lower.includes("encrypt") ||
    lower.includes("anonymiz") ||
    lower.includes("pseudonym") ||
    lower.includes("access control") ||
    lower.includes("bias") ||
    lower.includes("fairness");

  // Check for risk-mitigation linkage
  const hasRiskLinkage =
    lower.includes("to address") ||
    lower.includes("to mitigate") ||
    lower.includes("to prevent") ||
    lower.includes("to reduce") ||
    lower.includes("in response to") ||
    lower.includes("countermeasure") ||
    lower.includes("address the risk") ||
    lower.includes("mitigate the") ||
    lower.includes("prevent");

  // Check for organizational/technical distinction
  const hasTechnicalMeasures =
    lower.includes("technical") ||
    lower.includes("algorithm") ||
    lower.includes("software") ||
    lower.includes("system") ||
    lower.includes("automat") ||
    lower.includes("encrypt") ||
    lower.includes("access control");

  const hasOrganizationalMeasures =
    lower.includes("training") ||
    lower.includes("staff") ||
    lower.includes("employee") ||
    lower.includes("policy") ||
    lower.includes("procedure") ||
    lower.includes("organizational") ||
    lower.includes("management") ||
    lower.includes("team");

  if (isVague) {
    analysis.feedback.push("Mitigation measures appear vague or generic. Art.27 requires concrete, specific measures rather than general compliance statements.");
    analysis.recommendations.push("Replace vague compliance statements with specific, actionable mitigation measures. Describe exactly what will be done, by whom, and how effectiveness will be measured.");
    analysis.score += 2;
  } else if (hasConcreteMeasures) {
    analysis.feedback.push("Concrete mitigation measures are described.");
    analysis.score += 7;
  } else {
    analysis.feedback.push("Mitigation measures lack concreteness. Describe specific actions, tools, or procedures that will be implemented.");
    analysis.recommendations.push("Describe specific mitigation measures using action-oriented language (e.g., 'implement bias detection tools', 'conduct quarterly audits', 'establish a review board').");
  }

  if (hasRiskLinkage) {
    analysis.feedback.push("Measures are linked to identified risks.");
    analysis.score += 7;
  } else {
    analysis.feedback.push("Measures are not explicitly linked to identified risks. Art.27 requires that mitigation measures address the specific risks identified in Section 3.");
    analysis.recommendations.push("Explicitly link each mitigation measure to the specific risk(s) it addresses from Section 3. For example: 'To mitigate the discrimination risk identified above, we will...'");
  }

  if (hasTechnicalMeasures && hasOrganizationalMeasures) {
    analysis.feedback.push("Both technical and organizational measures are described.");
    analysis.score += 6;
  } else if (hasTechnicalMeasures || hasOrganizationalMeasures) {
    const type = hasTechnicalMeasures ? "technical" : "organizational";
    const missing = hasTechnicalMeasures ? "organizational" : "technical";
    analysis.feedback.push(`${type} measures are described, but ${missing} measures are missing. A comprehensive mitigation strategy should include both.`);
    analysis.recommendations.push(`Add ${missing} measures to complement the existing ${type} measures. A robust mitigation strategy typically includes both technical safeguards and organizational policies.`);
    analysis.score += 3;
  } else {
    analysis.feedback.push("Neither technical nor organizational measures are clearly described.");
    analysis.recommendations.push("Include both technical measures (e.g., access controls, encryption, bias detection) and organizational measures (e.g., staff training, review procedures, governance policies).");
  }

  return analysis;
}

/**
 * Section 5: Stakeholder Consultation
 * Must describe consultation process
 * Must identify stakeholders consulted
 * Score: 0-20 based on detail level.
 */
function analyzeSection5(content: string | null | undefined): SectionAnalysis {
  const analysis: SectionAnalysis = {
    score: 0,
    feedback: [],
    recommendations: [],
    filled: false,
    contentLength: 0,
  };

  if (!content || content.trim().length === 0) {
    analysis.feedback.push("Section 5 (Stakeholder Consultation) is empty. Art.27 requires documentation of stakeholder consultation as part of the fundamental rights impact assessment.");
    analysis.recommendations.push("Describe the stakeholder consultation process, including: (1) which stakeholders were or will be consulted, (2) the consultation method (interviews, surveys, workshops), (3) the timeline, and (4) key outcomes or feedback received.");
    return analysis;
  }

  analysis.filled = true;
  analysis.contentLength = content.trim().length;
  const lower = content.toLowerCase();

  // Check for stakeholder identification
  const hasStakeholders =
    lower.includes("stakeholder") ||
    lower.includes("consulted") ||
    lower.includes("user") ||
    lower.includes("affected") ||
    lower.includes("expert") ||
    lower.includes("authority") ||
    lower.includes("regulator") ||
    lower.includes("civil society") ||
    lower.includes("public") ||
    lower.includes("employee") ||
    lower.includes("customer") ||
    lower.includes("worker") ||
    lower.includes("dpo") ||
    lower.includes("data protection officer");

  // Check for consultation process description
  const hasProcess =
    lower.includes("consult") ||
    lower.includes("interview") ||
    lower.includes("survey") ||
    lower.includes("workshop") ||
    lower.includes("meeting") ||
    lower.includes("discussion") ||
    lower.includes("feedback") ||
    lower.includes("engagement") ||
    lower.includes("participat");

  // Check for outcomes/results
  const hasOutcomes =
    lower.includes("outcome") ||
    lower.includes("result") ||
    lower.includes("finding") ||
    lower.includes("feedback") ||
    lower.includes("conclusion") ||
    lower.includes("recommendation") ||
    lower.includes("insight") ||
    lower.includes("concern raised") ||
    lower.includes("suggestion");

  if (hasStakeholders) {
    analysis.feedback.push("Stakeholders are identified or described.");
    analysis.score += 7;
  } else {
    analysis.feedback.push("No specific stakeholders identified. Art.27 requires identification of relevant stakeholders who should be consulted about the AI system's impact on fundamental rights.");
    analysis.recommendations.push("Identify the specific stakeholders consulted or planned for consultation (e.g., affected users, domain experts, data protection officers, civil society organizations, regulatory authorities).");
  }

  if (hasProcess) {
    analysis.feedback.push("Consultation process is described.");
    analysis.score += 7;
  } else {
    analysis.feedback.push("Consultation process is not described. Explain how stakeholders were or will be engaged.");
    analysis.recommendations.push("Describe the consultation methodology (e.g., structured interviews, online surveys, focus groups, public consultation periods).");
  }

  if (hasOutcomes) {
    analysis.feedback.push("Consultation outcomes or findings are documented.");
    analysis.score += 6;
  } else {
    analysis.feedback.push("No consultation outcomes documented. Record key findings, concerns raised, and recommendations from stakeholders.");
    analysis.recommendations.push("Document the key outcomes of stakeholder consultations, including concerns raised, suggestions made, and how they influenced the risk assessment or mitigation measures.");
  }

  return analysis;
}

/**
 * Section 6: Authority Notification
 * Must describe notification plan
 * Must identify relevant authority
 * Score: 0-20 based on completeness.
 */
function analyzeSection6(content: string | null | undefined): SectionAnalysis {
  const analysis: SectionAnalysis = {
    score: 0,
    feedback: [],
    recommendations: [],
    filled: false,
    contentLength: 0,
  };

  if (!content || content.trim().length === 0) {
    analysis.feedback.push("Section 6 (Authority Notification) is empty. Art.27 requires a plan for notifying relevant authorities about the FRIA results and any significant risks identified.");
    analysis.recommendations.push("Describe the authority notification plan, including: (1) which authority will be notified, (2) the timeline for notification, (3) the format and content of the notification, and (4) the process for follow-up actions.");
    return analysis;
  }

  analysis.filled = true;
  analysis.contentLength = content.trim().length;
  const lower = content.toLowerCase();

  // Check for authority identification
  const hasAuthority =
    lower.includes("authority") ||
    lower.includes("supervisory") ||
    lower.includes("regulator") ||
    lower.includes("commission") ||
    lower.includes("agency") ||
    lower.includes("board") ||
    lower.includes("national authority") ||
    lower.includes("market surveillance") ||
    lower.includes("data protection authority") ||
    lower.includes("dpa");

  // Check for notification plan
  const hasNotificationPlan =
    lower.includes("notif") ||
    lower.includes("submit") ||
    lower.includes("report") ||
    lower.includes("inform") ||
    lower.includes("communicate") ||
    lower.includes("send") ||
    lower.includes("provide");

  // Check for timeline
  const hasTimeline =
    lower.includes("timeline") ||
    lower.includes("deadline") ||
    lower.includes("date") ||
    lower.includes("before") ||
    lower.includes("after") ||
    lower.includes("when") ||
    lower.includes("prior to") ||
    lower.includes("upon") ||
    lower.includes("schedule");

  // Check for follow-up actions
  const hasFollowUp =
    lower.includes("follow-up") ||
    lower.includes("follow up") ||
    lower.includes("response") ||
    lower.includes("action") ||
    lower.includes("remed") ||
    lower.includes("correct") ||
    lower.includes("update") ||
    lower.includes("review");

  if (hasAuthority) {
    analysis.feedback.push("Relevant authority is identified or described.");
    analysis.score += 7;
  } else {
    analysis.feedback.push("No relevant authority identified. Art.27 requires identification of the authority or authorities that should be notified of the FRIA results.");
    analysis.recommendations.push("Identify the specific authority (e.g., national market surveillance authority, data protection authority, sector-specific regulator) that should receive the FRIA results.");
  }

  if (hasNotificationPlan) {
    analysis.feedback.push("Notification plan or process is described.");
    analysis.score += 7;
  } else {
    analysis.feedback.push("No notification plan described. Explain how and when the authority will be notified.");
    analysis.recommendations.push("Describe the notification process, including the method of notification, the content to be submitted, and the responsible party.");
  }

  if (hasTimeline || hasFollowUp) {
    if (hasTimeline) {
      analysis.feedback.push("Timeline for notification is mentioned.");
    }
    if (hasFollowUp) {
      analysis.feedback.push("Follow-up actions are described.");
    }
    analysis.score += 6;
  } else {
    analysis.feedback.push("No timeline or follow-up actions described. Include when the notification will occur and what actions will follow.");
    analysis.recommendations.push("Specify the timeline for authority notification and describe follow-up actions that will be taken based on the authority's response.");
  }

  return analysis;
}

/**
 * Compute overall FRIA score from section analyses.
 * Each section scores 0-20, total 0-120, scaled to 0-100.
 * 
 * IMPORTANT: This is an automated content quality score, NOT a legal compliance determination.
 * A score >= 70 means the content is sufficiently detailed for human review,
 * but does NOT guarantee EU AI Act Art.27 compliance.
 * Human review is required before marking as officially compliant.
 */
function computeOverallScore(sections: SectionAnalysis[]): {
  overallScore: number;
  compliant: boolean;
} {
  const rawTotal = sections.reduce((sum, s) => sum + s.score, 0);
  const overallScore = Math.round((rawTotal / 120) * 100);
  const compliant = overallScore >= 70;
  return { overallScore, compliant };
}

/**
 * GET /api/fria?systemId=...
 * Returns FRIA assessment for a specific AI system, or list all for user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier('business')(request);
  if (tierCheck) return tierCheck;

  try {
    const { searchParams } = new URL(request.url);
    const systemId = searchParams.get("systemId");

    if (systemId) {
      // Fetch specific FRIA assessment
      const assessment = await prisma.fRIAAssessment.findUnique({
        where: { systemId },
        include: { system: { select: { id: true, name: true, userId: true } } },
      });

      if (!assessment) {
        return NextResponse.json({ assessment: null });
      }

      // Verify ownership
      if (assessment.system.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ assessment });
    }

    // List all FRIA assessments for user's AI systems
    const assessments = await prisma.fRIAAssessment.findMany({
      where: {
        system: { userId: session.user.id },
      },
      include: {
        system: { select: { id: true, name: true, riskLevel: true, status: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ assessments });
  } catch (error) {
    console.error("[FRIA API] GET failed:", error);
    return NextResponse.json({ error: "Failed to fetch FRIA assessment" }, { status: 500 });
  }
}

/**
 * POST /api/fria
 * Create or update a FRIA assessment
 * Body: { systemId: string, section1?: string, ... section6?: string, status?: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier('business')(request);
  if (tierCheck) return tierCheck;

  try {
    const body = await request.json();
    const {
      systemId,
      section1,
      section2,
      section3,
      section4,
      section5,
      section6,
      status,
    } = body as {
      systemId: string;
      section1?: string;
      section2?: string;
      section3?: string;
      section4?: string;
      section5?: string;
      section6?: string;
      status?: string;
    };

    if (!systemId) {
      return NextResponse.json({ error: "systemId is required" }, { status: 400 });
    }

    // Verify AI system ownership
    const system = await prisma.aISystem.findUnique({
      where: { id: systemId },
      select: { userId: true },
    });

    if (!system) {
      return NextResponse.json({ error: "AI system not found" }, { status: 404 });
    }

    if (system.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Run content quality analysis on each section
    const section1Analysis = analyzeSection1(section1);
    const section2Analysis = analyzeSection2(section2);
    const section3Analysis = analyzeSection3(section3);
    const section4Analysis = analyzeSection4(section4);
    const section5Analysis = analyzeSection5(section5);
    const section6Analysis = analyzeSection6(section6);

    const allAnalyses = [
      section1Analysis,
      section2Analysis,
      section3Analysis,
      section4Analysis,
      section5Analysis,
      section6Analysis,
    ];

    // Compute overall score (0-120 raw, scaled to 0-100)
    const { overallScore, compliant } = computeOverallScore(allAnalyses);

    // Build detailed analysis object
    const detailedAnalysis = {
      section1: {
        label: "System Description",
        ...section1Analysis,
      },
      section2: {
        label: "Legal Basis",
        ...section2Analysis,
      },
      section3: {
        label: "Fundamental Rights Risks",
        ...section3Analysis,
      },
      section4: {
        label: "Mitigation Measures",
        ...section4Analysis,
      },
      section5: {
        label: "Stakeholder Consultation",
        ...section5Analysis,
      },
      section6: {
        label: "Authority Notification",
        ...section6Analysis,
      },
      overallScore,
      compliant,
      threshold: 70,
      filledSections: allAnalyses.filter((a) => a.filled).length,
      totalSections: 6,
      disclaimer: "This assessment is an automated preliminary evaluation based on content analysis. It does not constitute legal advice. A qualified legal professional should review the assessment before submission to regulatory authorities.",
    };

    // Determine the effective status:
    // - Auto-score reaching threshold does NOT mean compliant; it means "ready for human review"
    // - Only explicitly setting status to "approved" marks the system as art27Compliant
    let newStatus = status ?? "draft";
    if (compliant && newStatus !== "approved") {
      newStatus = "pending_review";
    }

    // Upsert FRIA assessment
    const assessment = await prisma.fRIAAssessment.upsert({
      where: { systemId },
      create: {
        systemId,
        section1: section1 ?? null,
        section2: section2 ?? null,
        section3: section3 ?? null,
        section4: section4 ?? null,
        section5: section5 ?? null,
        section6: section6 ?? null,
        status: newStatus,
        overallScore,
      },
      update: {
        section1: section1 !== undefined ? section1 : undefined,
        section2: section2 !== undefined ? section2 : undefined,
        section3: section3 !== undefined ? section3 : undefined,
        section4: section4 !== undefined ? section4 : undefined,
        section5: section5 !== undefined ? section5 : undefined,
        section6: section6 !== undefined ? section6 : undefined,
        status: newStatus,
        overallScore,
        submittedAt: newStatus === "submitted" || newStatus === "pending_review" ? new Date() : undefined,
      },
    });

    // Only mark as art27Compliant when human review has approved
    await prisma.aISystem.update({
      where: { id: systemId },
      data: { art27Compliant: newStatus === "approved" },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "tool_fria_assessment",
      resource: "fria",
      details: {
        systemId,
        status: assessment.status,
        score: overallScore,
        compliant,
        filledSections: detailedAnalysis.filledSections,
        sectionScores: {
          section1: section1Analysis.score,
          section2: section2Analysis.score,
          section3: section3Analysis.score,
          section4: section4Analysis.score,
          section5: section5Analysis.score,
          section6: section6Analysis.score,
        },
      },
    });

    return NextResponse.json({
      success: true,
      assessment,
      detailedAnalysis,
      reviewStatus: {
        status: newStatus,
        autoCompliant: compliant,
        humanApproved: newStatus === "approved",
        needsReview: compliant && newStatus !== "approved",
      },
    });
  } catch (error) {
    console.error("[FRIA API] POST failed:", error);
    return NextResponse.json({ error: "Failed to save FRIA assessment" }, { status: 500 });
  }
}
