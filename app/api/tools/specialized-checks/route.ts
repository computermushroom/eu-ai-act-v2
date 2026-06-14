// Specialized Compliance Checks API - Articles 12-15
// POST: Run automated compliance checks for a specific AI system
// GET: Return last check results for the user's systems

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { requireTier } from "@/lib/subscription-guard";

interface ArticleCheckResult {
  compliant: boolean;
  findings: string[];
  score: number;
  recommendations: string[];
  details?: Record<string, unknown>;
}

interface CheckResults {
  art12: ArticleCheckResult;
  art13: ArticleCheckResult;
  art14: ArticleCheckResult;
  art15: ArticleCheckResult;
}

/**
 * Run Article 12 (Record-keeping) check
 * Art.12 requires automatic recording of events (logs) over the lifetime of the AI system.
 * Scoring: has docs (30pts) + has audit logs (30pts) + has scans (20pts) + doc quality (20pts)
 */
async function checkArt12(
  systemId: string,
  system: { riskLevel: string | null }
): Promise<ArticleCheckResult> {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // 1. Check for technical documentation with substantial content (>500 chars)
  const techDocs = await prisma.complianceDocument.findMany({
    where: { systemId, type: "technical-doc" },
  });

  const substantialTechDocs = techDocs.filter(
    (doc) => doc.content && doc.content.trim().length > 500
  );

  if (techDocs.length === 0) {
    findings.push("No technical documentation found. Art.12 requires comprehensive record-keeping of the AI system's operation, including logs, events, and technical documentation throughout its lifecycle.");
    recommendations.push("Create technical documentation that describes the AI system's architecture, data flows, and operational parameters in detail (>500 characters).");
  } else if (substantialTechDocs.length === 0) {
    findings.push(`Found ${techDocs.length} technical document(s), but none contain substantial content (all under 500 characters). Art.12 requires detailed and meaningful record-keeping.`);
    recommendations.push("Expand your technical documentation to include detailed descriptions of system architecture, data processing logic, decision-making processes, and operational parameters. Each document should exceed 500 characters of substantive content.");
    score += 10; // Partial credit for having docs but low quality
  } else {
    const avgLength = Math.round(
      substantialTechDocs.reduce((sum, doc) => sum + doc.content.trim().length, 0) /
        substantialTechDocs.length
    );
    findings.push(`Found ${substantialTechDocs.length} technical document(s) with substantial content (average length: ${avgLength} characters). This meets the Art.12 record-keeping documentation requirement.`);
    score += 30;
  }

  // 2. Check for audit logs related to this system
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      resource: { startsWith: `ai-system:${systemId}` },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (auditLogs.length === 0) {
    findings.push("No audit logs found for this AI system. Art.12(1) requires logging of events relevant to identifying situations that may result in risks, including system malfunctions, errors, and deviations from intended operation.");
    recommendations.push("Ensure the system generates and maintains audit logs for all significant events, including configuration changes, compliance scans, and operational incidents.");
  } else {
    findings.push(`Found ${auditLogs.length} recent audit log(s) for this system. Audit trail is being maintained as required by Art.12(1).`);
    score += 30;
  }

  // 3. Check for scan results (indicating ongoing monitoring)
  const scanResults = await prisma.scanResult.findMany({
    where: { systemId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (scanResults.length === 0) {
    findings.push("No scan results found. Art.12 requires ongoing monitoring and recording of the AI system's performance and compliance status throughout its lifecycle.");
    recommendations.push("Run compliance scans regularly to generate scan results that document the system's ongoing compliance status.");
    score += 0;
  } else {
    const latestScan = scanResults[0];
    if (latestScan) {
      findings.push(`Found ${scanResults.length} scan result(s). Most recent scan scored ${latestScan.score}/100 (${latestScan.status}) on ${latestScan.createdAt.toISOString().split("T")[0]}.`);
      score += 20;
    }
  }

  // 4. Document quality assessment (based on content richness)
  const allDocs = await prisma.complianceDocument.findMany({
    where: { systemId },
  });

  if (allDocs.length === 0) {
    findings.push("No compliance documents of any type found for this system. Art.12 requires comprehensive record-keeping documentation.");
    score += 0;
  } else {
    const totalContentLength = allDocs.reduce(
      (sum, doc) => sum + (doc.content ? doc.content.trim().length : 0),
      0
    );
    const avgDocLength = Math.round(totalContentLength / allDocs.length);

    if (avgDocLength > 1000) {
      findings.push(`Document quality is good: ${allDocs.length} document(s) with average content length of ${avgDocLength} characters.`);
      score += 20;
    } else if (avgDocLength > 500) {
      findings.push(`Document quality is moderate: ${allDocs.length} document(s) with average content length of ${avgDocLength} characters. Consider adding more detail.`);
      score += 12;
      recommendations.push("Improve document quality by adding more detailed content, including specific procedures, metrics, and evidence of compliance measures.");
    } else {
      findings.push(`Document quality is low: ${allDocs.length} document(s) with average content length of only ${avgDocLength} characters. Documents appear to be placeholders.`);
      score += 5;
      recommendations.push("Significantly improve document quality. Each document should contain detailed, substantive content describing specific procedures, evidence, and compliance measures (target >1000 characters per document).");
    }
  }

  // High-risk systems get extra scrutiny
  if (system.riskLevel === "high" && score < 70) {
    findings.push("WARNING: High-risk systems must maintain detailed logs per Art.12(1). Current score is below the recommended threshold for high-risk classification.");
    recommendations.push("As a high-risk AI system, ensure all Art.12 requirements are fully met, including comprehensive logging, detailed technical documentation, and regular compliance monitoring.");
  }

  const compliant = score >= 60;

  return {
    compliant,
    findings,
    score,
    recommendations,
    details: {
      techDocCount: techDocs.length,
      substantialDocCount: substantialTechDocs.length,
      auditLogCount: auditLogs.length,
      scanCount: scanResults.length,
      totalDocCount: allDocs.length,
    },
  };
}

/**
 * Run Article 13 (Transparency) check
 * Art.13 requires AI systems to be designed and developed so that deployers
 * can interpret the output and use it appropriately.
 * Scoring: basic info complete (25pts) + risk disclosure (25pts) + user info doc (25pts) + art13 flag (25pts)
 */
async function checkArt13(
  systemId: string,
  system: {
    riskLevel: string | null;
    systemType: string;
    name: string;
    description: string | null;
  }
): Promise<ArticleCheckResult> {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // 1. Check basic info completeness (name, description, systemType, riskLevel)
  const hasName = !!system.name && system.name.trim().length > 0;
  const hasDescription = !!system.description && system.description.trim().length > 20;
  const hasSystemType = !!system.systemType && system.systemType.trim().length > 0;
  const hasRiskLevel = !!system.riskLevel && system.riskLevel.trim().length > 0;

  const basicInfoComplete = hasName && hasDescription && hasSystemType && hasRiskLevel;

  if (!hasName) {
    findings.push("System name is missing or empty. Art.13 requires clear identification of AI systems.");
    recommendations.push("Provide a clear, descriptive name for the AI system.");
  }
  if (!hasDescription) {
    findings.push("System description is missing or too brief (under 20 characters). Art.13 requires deployers to understand the system's purpose and capabilities.");
    recommendations.push("Provide a detailed description of the AI system's purpose, capabilities, intended use cases, and limitations (minimum 20 characters).");
  }
  if (!hasSystemType) {
    findings.push("System type is not specified. Transparency requires clear classification of the AI system type.");
    recommendations.push("Classify the system type (e.g., high-risk, limited-risk, minimal-risk, prohibited).");
  }
  if (!hasRiskLevel) {
    findings.push("Risk level is not set. Art.13 transparency requirements depend on correct risk classification.");
    recommendations.push("Assess and set the risk level (unacceptable, high, limited, minimal) for the AI system.");
  }

  if (basicInfoComplete) {
    findings.push("Basic system information is complete: name, description, system type, and risk level are all provided. This satisfies the Art.13 transparency identification requirement.");
    score += 25;
  } else {
    const filledCount = [hasName, hasDescription, hasSystemType, hasRiskLevel].filter(Boolean).length;
    score += Math.round((filledCount / 4) * 15); // Partial credit
    findings.push(`Basic information is partially complete (${filledCount}/4 fields filled).`);
  }

  // 2. Check risk disclosure consistency
  if (system.riskLevel === "high" && system.systemType !== "high-risk") {
    findings.push("RISK DISCREPANCY: Risk level is 'high' but system type is not 'high-risk'. Art.13 requires consistent and accurate risk classification for transparency to deployers and affected persons.");
    recommendations.push("Ensure risk level and system type are consistent. If the system is classified as high-risk, the system type should reflect this classification.");
    score += 0;
  } else if (system.riskLevel && system.systemType) {
    findings.push(`Risk classification is consistent: risk level '${system.riskLevel}' aligns with system type '${system.systemType}'. This supports Art.13 transparency requirements.`);
    score += 25;
  } else {
    findings.push("Risk disclosure cannot be fully evaluated because either risk level or system type is missing.");
    score += 5;
  }

  // 3. Check for transparency-related documents
  const transparencyDocs = await prisma.complianceDocument.findMany({
    where: {
      systemId,
      type: { in: ["technical-doc", "report", "policy"] },
    },
  });

  const hasTransparencyContent = transparencyDocs.some(
    (doc) =>
      doc.content &&
      (doc.content.toLowerCase().includes("transparency") ||
        doc.content.toLowerCase().includes("user information") ||
        doc.content.toLowerCase().includes("disclosure") ||
        doc.content.toLowerCase().includes("deployer") ||
        doc.content.toLowerCase().includes("affected person"))
  );

  if (transparencyDocs.length === 0) {
    findings.push("No transparency-related documentation found. Art.13 requires that deployers are provided with sufficient information to interpret the system's output and use it appropriately.");
    recommendations.push("Create transparency documentation that explains: (1) how to interpret the AI system's output, (2) the system's intended purpose and limitations, (3) relevant performance metrics, and (4) instructions for appropriate use.");
    score += 0;
  } else if (!hasTransparencyContent) {
    findings.push(`Found ${transparencyDocs.length} document(s) of relevant types, but none explicitly address transparency, disclosure, or user information topics required by Art.13.`);
    recommendations.push("Update your documentation to explicitly address transparency requirements: explain how deployers should interpret outputs, describe system limitations, and provide clear usage instructions.");
    score += 12;
  } else {
    findings.push(`Found ${transparencyDocs.length} document(s) with transparency-related content. Documentation addresses Art.13 transparency requirements.`);
    score += 25;
  }

  // 4. Check art13Compliant flag consistency
  const systemWithFlags = await prisma.aISystem.findUnique({
    where: { id: systemId },
    select: { art13Compliant: true },
  });

  const expectedCompliance = basicInfoComplete && hasTransparencyContent;
  const flagMatches = systemWithFlags?.art13Compliant === expectedCompliance;

  if (systemWithFlags?.art13Compliant && !expectedCompliance) {
    findings.push("Art.13 compliance flag is set to TRUE, but the actual assessment indicates non-compliance. The flag appears to be outdated or manually overridden.");
    recommendations.push("Review and update the Art.13 compliance flag to reflect the actual compliance status based on this assessment.");
    score += 10; // Partial credit for having a flag but it's wrong
  } else if (!systemWithFlags?.art13Compliant && expectedCompliance) {
    findings.push("Art.13 compliance flag is set to FALSE, but the actual assessment indicates compliance. Consider updating the flag.");
    score += 20; // Full credit for actual compliance, flag just needs updating
  } else if (systemWithFlags?.art13Compliant && expectedCompliance) {
    findings.push("Art.13 compliance flag is correctly set to TRUE, consistent with the assessment results.");
    score += 25;
  } else {
    findings.push("Art.13 compliance flag is correctly set to FALSE, consistent with the assessment results. Focus on addressing the gaps identified above.");
    score += 15; // Partial credit for accurate negative flag
  }

  const compliant = score >= 60;

  return {
    compliant,
    findings,
    score,
    recommendations,
    details: {
      hasName,
      hasDescription,
      hasSystemType,
      hasRiskLevel,
      basicInfoComplete,
      transparencyDocCount: transparencyDocs.length,
      hasTransparencyContent,
      art13Flag: systemWithFlags?.art13Compliant,
      flagConsistent: flagMatches,
    },
  };
}

/**
 * Run Article 14 (Human oversight) check
 * Art.14 requires AI systems to be designed and developed in such a way
 * that they can be effectively overseen by natural persons during use.
 * Scoring: QMS item (40pts) + oversight doc (30pts) + deployment plan (30pts)
 */
async function checkArt14(
  systemId: string,
  system: { deployedAt: Date | null }
): Promise<ArticleCheckResult> {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // 1. Check QMS checklist humanOversight item
  const qms = await prisma.qMSChecklist.findUnique({
    where: { systemId },
  });

  if (!qms) {
    findings.push("No QMS checklist found. Art.14 requires human oversight measures to be established through the Quality Management System (Art.17). A QMS checklist must be created first.");
    recommendations.push("Create a QMS checklist for this AI system and ensure the human oversight item is enabled. This is a prerequisite for Art.14 compliance.");
    score += 0;
  } else if (!qms.humanOversight) {
    findings.push("Human oversight is NOT enabled in the QMS checklist. Art.14(1) requires high-risk AI systems to be designed and developed so that they can be effectively overseen by natural persons during the period of use.");
    recommendations.push("Enable the human oversight item in the QMS checklist and document the specific oversight mechanisms, including: (1) who is responsible for oversight, (2) how outputs are reviewed, (3) what intervention mechanisms exist, and (4) how oversight is logged.");
    score += 0;
  } else {
    findings.push("Human oversight is enabled in the QMS checklist. This satisfies the Art.14(1) requirement for establishing oversight through the QMS.");
    score += 40;
  }

  // 2. Check for human oversight procedure documents
  const oversightDocs = await prisma.complianceDocument.findMany({
    where: { systemId },
  });

  const hasOversightDoc = oversightDocs.some(
    (doc) =>
      doc.content &&
      (doc.content.toLowerCase().includes("human oversight") ||
        doc.content.toLowerCase().includes("human intervention") ||
        doc.content.toLowerCase().includes("manual override") ||
        doc.content.toLowerCase().includes("stop button") ||
        doc.content.toLowerCase().includes("oversight procedure") ||
        doc.content.toLowerCase().includes("supervision"))
  );

  if (!hasOversightDoc) {
    findings.push("No documentation describing human oversight procedures found. Art.14(2) requires that the type and frequency of human oversight is determined during the design and development phase, with appropriate human-machine interface tools.");
    recommendations.push("Create a human oversight procedure document that describes: (1) the oversight mechanism (e.g., human-in-the-loop, human-on-the-loop, human-out-of-loop), (2) the interface tools available for human oversight, (3) the frequency and scope of oversight activities, (4) escalation procedures, and (5) training requirements for overseers.");
    score += 0;
  } else {
    const oversightDoc = oversightDocs.find(
      (doc) =>
        doc.content &&
        (doc.content.toLowerCase().includes("human oversight") ||
          doc.content.toLowerCase().includes("oversight procedure"))
    );
    const contentLength = oversightDoc?.content?.trim().length ?? 0;

    if (contentLength > 300) {
      findings.push(`Human oversight documentation found with substantial content (${contentLength} characters). The oversight procedures are documented as required by Art.14.`);
      score += 30;
    } else {
      findings.push(`Human oversight documentation exists but content is brief (${contentLength} characters). Art.14 requires detailed oversight procedures including mechanisms, responsibilities, and intervention protocols.`);
      recommendations.push("Expand the human oversight documentation to include detailed procedures, specific oversight mechanisms, intervention protocols, and responsible personnel.");
      score += 15;
    }
  }

  // 3. Check if system has deployment date (indicating oversight plan exists)
  if (!system.deployedAt) {
    findings.push("No deployment date set for this AI system. While not directly required by Art.14, a deployment plan should include human oversight arrangements before the system goes live.");
    recommendations.push("Set a deployment date and create a pre-deployment oversight plan that specifies human oversight arrangements for the operational phase.");
    score += 0;
  } else {
    findings.push(`Deployment date is set (${system.deployedAt.toISOString().split("T")[0]}), indicating a deployment plan exists. Ensure the plan includes human oversight arrangements as required by Art.14.`);
    score += 30;
  }

  const compliant = score >= 60;

  return {
    compliant,
    findings,
    score,
    recommendations,
    details: {
      hasQms: !!qms,
      qmsHumanOversight: qms?.humanOversight ?? false,
      hasOversightDoc,
      hasDeploymentDate: !!system.deployedAt,
      deployedAt: system.deployedAt?.toISOString() ?? null,
    },
  };
}

/**
 * Run Article 15 (Accuracy/Robustness) check
 * Art.15 requires high-risk AI systems to achieve appropriate levels of
 * accuracy, robustness, and cybersecurity throughout their lifecycle.
 * Scoring: QMS item (35pts) + test docs (35pts) + scan accuracy (30pts)
 */
async function checkArt15(systemId: string): Promise<ArticleCheckResult> {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // 1. Check QMS checklist accuracyRobustness item
  const qms = await prisma.qMSChecklist.findUnique({
    where: { systemId },
  });

  if (!qms) {
    findings.push("No QMS checklist found. Art.15 requires accuracy, robustness, and cybersecurity measures to be established through the Quality Management System (Art.17). A QMS checklist must be created first.");
    recommendations.push("Create a QMS checklist for this AI system and enable the accuracy and robustness item. This is a prerequisite for Art.15 compliance.");
    score += 0;
  } else if (!qms.accuracyRobustness) {
    findings.push("Accuracy and robustness measures are NOT enabled in the QMS checklist. Art.15(1) requires high-risk AI systems to achieve appropriate levels of accuracy, robustness, and cybersecurity performance throughout their lifecycle.");
    recommendations.push("Enable the accuracy and robustness item in the QMS checklist and document: (1) accuracy metrics and targets, (2) robustness testing methodology, (3) cybersecurity measures, and (4) ongoing monitoring procedures.");
    score += 0;
  } else {
    findings.push("Accuracy and robustness measures are enabled in the QMS checklist. This satisfies the Art.15 requirement for establishing these measures through the QMS.");
    score += 35;
  }

  // 2. Check for test/validation documents
  const allDocs = await prisma.complianceDocument.findMany({
    where: { systemId },
  });

  const hasTestDoc = allDocs.some(
    (doc) =>
      doc.content &&
      (doc.content.toLowerCase().includes("test") ||
        doc.content.toLowerCase().includes("validation") ||
        doc.content.toLowerCase().includes("accuracy") ||
        doc.content.toLowerCase().includes("robustness") ||
        doc.content.toLowerCase().includes("benchmark") ||
        doc.content.toLowerCase().includes("performance metric") ||
        doc.content.toLowerCase().includes("cybersecurity"))
  );

  if (!hasTestDoc) {
    findings.push("No test or validation documentation found. Art.15(2) requires training, validation, and testing datasets to be relevant, representative, free of errors, and complete. Test results must be documented.");
    recommendations.push("Create test and validation documentation that includes: (1) test datasets used and their characteristics, (2) accuracy metrics and results, (3) robustness testing outcomes (adversarial testing, edge cases), (4) cybersecurity assessment results, and (5) known limitations and failure modes.");
    score += 0;
  } else {
    const testDocs = allDocs.filter(
      (doc) =>
        doc.content &&
        (doc.content.toLowerCase().includes("test") ||
          doc.content.toLowerCase().includes("validation") ||
          doc.content.toLowerCase().includes("accuracy") ||
          doc.content.toLowerCase().includes("robustness") ||
          doc.content.toLowerCase().includes("benchmark"))
    );
    const totalTestContent = testDocs.reduce(
      (sum, doc) => sum + (doc.content?.trim().length ?? 0),
      0
    );

    if (totalTestContent > 500) {
      findings.push(`Test/validation documentation found with substantial content (${testDocs.length} document(s), ${totalTestContent} total characters). Art.15 testing requirements are documented.`);
      score += 35;
    } else {
      findings.push(`Test/validation documentation exists but content is limited (${testDocs.length} document(s), ${totalTestContent} total characters). Art.15 requires detailed test results, accuracy metrics, and robustness evidence.`);
      recommendations.push("Expand test and validation documentation to include specific test results, accuracy metrics, robustness evidence, and cybersecurity assessment details.");
      score += 18;
    }
  }

  // 3. Check scan results for accuracy scores
  const scanResults = await prisma.scanResult.findMany({
    where: { systemId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (scanResults.length === 0) {
    findings.push("No scan results found to assess accuracy and robustness. Art.15 requires ongoing monitoring of system performance throughout the lifecycle.");
    recommendations.push("Run compliance scans to generate performance data that can be used to assess the system's accuracy and robustness over time.");
    score += 0;
  } else {
    const avgScore = Math.round(
      scanResults.reduce((sum, scan) => sum + scan.score, 0) / scanResults.length
    );
    const latestScore = scanResults[0]?.score ?? 0;

    if (avgScore >= 80) {
      findings.push(`Scan results indicate strong performance: average score ${avgScore}/100 across ${scanResults.length} scan(s). Latest scan: ${latestScore}/100. This supports Art.15 accuracy and robustness requirements.`);
      score += 30;
    } else if (avgScore >= 60) {
      findings.push(`Scan results indicate moderate performance: average score ${avgScore}/100 across ${scanResults.length} scan(s). Latest scan: ${latestScore}/100. Art.15 requires appropriate levels of accuracy; consider improvements.`);
      recommendations.push("Investigate scan findings to identify areas where accuracy and robustness can be improved. Target an average scan score of 80 or above.");
      score += 20;
    } else {
      findings.push(`Scan results indicate potential accuracy/robustness concerns: average score ${avgScore}/100 across ${scanResults.length} scan(s). Latest scan: ${latestScore}/100. Art.15 requires appropriate levels of accuracy, robustness, and cybersecurity.`);
      recommendations.push("Address scan findings urgently. Review system architecture, training data quality, and operational procedures to improve accuracy and robustness scores.");
      score += 10;
    }
  }

  const compliant = score >= 60;

  return {
    compliant,
    findings,
    score,
    recommendations,
    details: {
      hasQms: !!qms,
      qmsAccuracyRobustness: qms?.accuracyRobustness ?? false,
      hasTestDoc,
      scanCount: scanResults.length,
      avgScanScore: scanResults.length > 0
        ? Math.round(scanResults.reduce((sum, s) => sum + s.score, 0) / scanResults.length)
        : null,
      latestScanScore: scanResults[0]?.score ?? null,
    },
  };
}

/**
 * POST /api/tools/specialized-checks
 * Body: { systemId: string }
 * Runs automated compliance checks for Articles 12-15
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier('professional')(request);
  if (tierCheck) return tierCheck;

  try {
    const body = await request.json();
    const { systemId } = body as { systemId?: string };

    if (!systemId) {
      return NextResponse.json({ error: "systemId is required" }, { status: 400 });
    }

    // Verify AI system ownership
    const system = await prisma.aISystem.findUnique({
      where: { id: systemId },
      select: {
        userId: true,
        name: true,
        riskLevel: true,
        systemType: true,
        description: true,
        deployedAt: true,
      },
    });

    if (!system) {
      return NextResponse.json({ error: "AI system not found" }, { status: 404 });
    }

    if (system.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Run all four checks in parallel
    const [art12, art13, art14, art15] = await Promise.all([
      checkArt12(systemId, { riskLevel: system.riskLevel }),
      checkArt13(systemId, {
        riskLevel: system.riskLevel,
        systemType: system.systemType,
        name: system.name,
        description: system.description,
      }),
      checkArt14(systemId, { deployedAt: system.deployedAt }),
      checkArt15(systemId),
    ]);

    const results: CheckResults = { art12, art13, art14, art15 };

    // Update AI system compliance flags
    await prisma.aISystem.update({
      where: { id: systemId },
      data: {
        art12Compliant: art12.compliant,
        art13Compliant: art13.compliant,
        art14Compliant: art14.compliant,
        art15Compliant: art15.compliant,
      },
    });

    // Store scan result for GET retrieval
    const overallScore = Math.round(
      (art12.score + art13.score + art14.score + art15.score) / 4
    );

    await prisma.scanResult.create({
      data: {
        systemId,
        scanType: "specialized-checks",
        score: overallScore,
        status: overallScore >= 80 ? "pass" : overallScore >= 50 ? "warning" : "fail",
        findings: JSON.stringify(results),
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "tool_specialized_checks",
      resource: `ai-system:${systemId}`,
      details: {
        systemId,
        systemName: system.name,
        art12Score: art12.score,
        art13Score: art13.score,
        art14Score: art14.score,
        art15Score: art15.score,
        overallScore,
      },
    });

    return NextResponse.json({
      success: true,
      systemId,
      systemName: system.name,
      results,
      overallScore,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[SPECIALIZED-CHECKS API] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to run specialized compliance checks" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tools/specialized-checks
 * Returns last check results for the user's systems
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier('professional')({} as NextRequest);
  if (tierCheck) return tierCheck;

  try {
    // Get user's systems with their latest specialized-checks scan results
    const systems = await prisma.aISystem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        scanResults: {
          where: { scanType: "specialized-checks" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const lastChecks = systems.map((system) => {
      const lastScan = system.scanResults[0];
      let parsedFindings: CheckResults | null = null;

      if (lastScan?.findings) {
        try {
          parsedFindings = JSON.parse(lastScan.findings) as CheckResults;
        } catch {
          parsedFindings = null;
        }
      }

      return {
        systemId: system.id,
        systemName: system.name,
        checkedAt: lastScan?.createdAt ?? null,
        overallScore: lastScan?.score ?? null,
        status: lastScan?.status ?? null,
        results: parsedFindings,
      };
    });

    return NextResponse.json({
      success: true,
      lastChecks,
    });
  } catch (error) {
    console.error("[SPECIALIZED-CHECKS API] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch last check results" },
      { status: 500 }
    );
  }
}
