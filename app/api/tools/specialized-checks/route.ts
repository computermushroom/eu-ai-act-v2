// Specialized Compliance Checks API - Articles 12-15
// POST: Run automated compliance checks for a specific AI system
// GET: Return last check results for the user's systems

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface ArticleCheckResult {
  compliant: boolean;
  findings: string[];
  score: number;
}

interface CheckResults {
  art12: ArticleCheckResult;
  art13: ArticleCheckResult;
  art14: ArticleCheckResult;
  art15: ArticleCheckResult;
}

/**
 * Run Article 12 (Record-keeping) check
 */
async function checkArt12(
  systemId: string,
  system: { riskLevel: string | null }
): Promise<ArticleCheckResult> {
  const findings: string[] = [];

  const recordDocs = await prisma.complianceDocument.findMany({
    where: { systemId, type: "record-keeping" },
  });

  if (recordDocs.length === 0) {
    findings.push("No record-keeping documents found. Art.12 requires automatic recording of events (logs) over the lifetime of the AI system.");
  } else {
    findings.push(`Found ${recordDocs.length} record-keeping document(s).`);
  }

  if (system.riskLevel === "high" && recordDocs.length === 0) {
    findings.push("High-risk systems must maintain detailed logs per Art.12(1).");
  }

  const score = recordDocs.length > 0 ? 100 : 0;
  return {
    compliant: recordDocs.length > 0,
    findings,
    score,
  };
}

/**
 * Run Article 13 (Transparency) check
 */
async function checkArt13(
  systemId: string,
  system: { riskLevel: string | null; systemType: string }
): Promise<ArticleCheckResult> {
  const findings: string[] = [];

  const transparencyDocs = await prisma.complianceDocument.findMany({
    where: { systemId, type: "technical-doc" },
  });

  if (transparencyDocs.length === 0) {
    findings.push("No transparency/technical documentation found. Art.13 requires the AI system to be designed so deployers can interpret output and use it appropriately.");
  } else {
    findings.push(`Found ${transparencyDocs.length} transparency document(s).`);
  }

  if (!system.riskLevel) {
    findings.push("Risk level is not set. Transparency requirements depend on correct risk classification.");
  } else if (system.riskLevel === "high" && system.systemType !== "high-risk") {
    findings.push("Risk level is 'high' but system type is not 'high-risk'. Ensure risk labeling is consistent.");
  }

  const hasDocs = transparencyDocs.length > 0;
  const correctLabel = system.riskLevel === "high" ? system.systemType === "high-risk" : true;

  const score = (hasDocs ? 50 : 0) + (correctLabel ? 50 : 0);
  return {
    compliant: hasDocs && correctLabel,
    findings,
    score,
  };
}

/**
 * Run Article 14 (Human oversight) check
 */
async function checkArt14(systemId: string): Promise<ArticleCheckResult> {
  const findings: string[] = [];

  const qms = await prisma.qMSChecklist.findUnique({
    where: { systemId },
  });

  if (!qms) {
    findings.push("No QMS checklist found. Art.14 requires human oversight measures to be established through the QMS.");
    return { compliant: false, findings, score: 0 };
  }

  if (qms.humanOversight) {
    findings.push("Human oversight is enabled in the QMS checklist.");
  } else {
    findings.push("Human oversight is NOT enabled in the QMS checklist. Art.14 requires the AI system to be effectively overseen by natural persons during use.");
  }

  const score = qms.humanOversight ? 100 : 0;
  return {
    compliant: qms.humanOversight,
    findings,
    score,
  };
}

/**
 * Run Article 15 (Accuracy/Robustness) check
 */
async function checkArt15(systemId: string): Promise<ArticleCheckResult> {
  const findings: string[] = [];

  const qms = await prisma.qMSChecklist.findUnique({
    where: { systemId },
  });

  if (!qms) {
    findings.push("No QMS checklist found. Art.15 requires accuracy, robustness, and cybersecurity measures to be established through the QMS.");
    return { compliant: false, findings, score: 0 };
  }

  if (qms.accuracyRobustness) {
    findings.push("Accuracy and robustness measures are enabled in the QMS checklist.");
  } else {
    findings.push("Accuracy and robustness measures are NOT enabled in the QMS checklist. Art.15 requires appropriate levels of accuracy, robustness, and cybersecurity throughout the lifecycle.");
  }

  const score = qms.accuracyRobustness ? 100 : 0;
  return {
    compliant: qms.accuracyRobustness,
    findings,
    score,
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

  try {
    const body = await request.json();
    const { systemId } = body as { systemId?: string };

    if (!systemId) {
      return NextResponse.json({ error: "systemId is required" }, { status: 400 });
    }

    // Verify AI system ownership
    const system = await prisma.aISystem.findUnique({
      where: { id: systemId },
      select: { userId: true, name: true, riskLevel: true, systemType: true },
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
      checkArt13(systemId, { riskLevel: system.riskLevel, systemType: system.systemType }),
      checkArt14(systemId),
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
