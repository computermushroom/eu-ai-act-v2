// Art.13/50 Transparency Obligations Check API
// GET: Returns recent transparency checks for the user
// POST: Accepts system info and current transparency measures, evaluates
//       against Art.13/50 requirements, stores result, creates audit log

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { requireTier } from "@/lib/subscription-guard";
import { z } from "zod";

// ============================================================
// Zod Validation Schemas
// ============================================================

const SYSTEM_TYPES = [
  "generative-ai",
  "predictive-analytics",
  "computer-vision",
  "nlp",
  "robotics",
  "recommendation",
  "decision-support",
  "autonomous-systems",
  "other",
] as const;

const RISK_LEVELS = ["prohibited", "high-risk", "limited-risk", "minimal-risk"] as const;

const currentTransparencySchema = z.object({
  hasDisclosure: z.boolean(),
  hasUserInformation: z.boolean(),
  hasOptOut: z.boolean(),
  hasHumanContact: z.boolean(),
  hasImpactInfo: z.boolean(),
  hasDataHandling: z.boolean(),
  hasLoggingPolicy: z.boolean(),
  hasRightToExplanation: z.boolean(),
  hasAccessibility: z.boolean(),
  hasMultilingual: z.boolean(),
});

const transparencyCheckSchema = z.object({
  systemName: z.string().min(1).max(200),
  systemType: z.enum(SYSTEM_TYPES),
  riskLevel: z.enum(RISK_LEVELS).optional().default("limited-risk"),
  description: z.string().max(2000).optional().default(""),
  currentTransparency: currentTransparencySchema,
});

type TransparencyCheckInput = z.infer<typeof transparencyCheckSchema>;

// ============================================================
// Art.13/50 Transparency Check Definitions
// ============================================================

interface TransparencyCheck {
  id: string;
  article: string;
  title: string;
  description: string;
  requirement: string;
  /**
   * Determines compliance status based on current transparency measures
   * and system characteristics.
   */
  evaluate: (
    current: z.infer<typeof currentTransparencySchema>,
    systemType: string,
    riskLevel: string
  ) => {
    status: "compliant" | "partial" | "non-compliant";
    evidence: string;
    recommendation: string;
  };
}

const TRANSPARENCY_CHECKS: TransparencyCheck[] = [
  {
    id: "art50-1-disclosure",
    article: "Art.50(1)",
    title: "Clear Disclosure of AI Interaction",
    description:
      "Users must be clearly informed when they are interacting with an AI system, unless this is obvious from the context and circumstances of the use.",
    requirement:
      "Display a clear, prominent notice before or at the start of the interaction indicating that the user is interacting with an AI system.",
    evaluate: (current, systemType, riskLevel) => {
      if (current.hasDisclosure) {
        return {
          status: "compliant",
          evidence: "AI interaction disclosure is in place.",
          recommendation: "Ensure disclosure is prominently displayed and updated as needed.",
        };
      }
      const isApplicable =
        ["generative-ai", "nlp", "recommendation", "decision-support"].includes(systemType) ||
        riskLevel === "limited-risk" ||
        riskLevel === "high-risk";
      if (!isApplicable) {
        return {
          status: "compliant",
          evidence: "System type does not require explicit AI interaction disclosure.",
          recommendation: "Monitor for changes in system use that may trigger this requirement.",
        };
      }
      return {
        status: "non-compliant",
        evidence: "No AI interaction disclosure detected for a system that requires it.",
        recommendation:
          "Implement a clear disclosure notice at the start of every AI interaction. Example: 'You are interacting with an AI system.'",
      };
    },
  },
  {
    id: "art13-1-capabilities",
    article: "Art.13(1)",
    title: "Inform Users About Capabilities and Limitations",
    description:
      "Deployers of high-risk AI systems must inform affected persons about the use of the AI system, its intended purpose, and the categories of personal data processed.",
    requirement:
      "Provide clear information about what the AI system does, its intended purpose, its capabilities, and its limitations to all affected users.",
    evaluate: (current, systemType, riskLevel) => {
      if (current.hasUserInformation) {
        return {
          status: "compliant",
          evidence: "User information about AI capabilities and limitations is provided.",
          recommendation: "Keep capability and limitation information up to date with system changes.",
        };
      }
      if (riskLevel === "high-risk") {
        return {
          status: "non-compliant",
          evidence: "High-risk system lacks required user information about capabilities and limitations.",
          recommendation:
            "Art.13(1) mandates that deployers of high-risk AI systems inform users about the system's purpose, capabilities, and limitations. Implement comprehensive user information pages.",
        };
      }
      return {
        status: "partial",
        evidence: "User information about AI capabilities is not provided, but not strictly required for this risk level.",
        recommendation:
          "While not mandatory for this risk level, providing information about AI capabilities is recommended as best practice under Art.69 voluntary codes.",
      };
    },
  },
  {
    id: "art13-3-optout",
    article: "Art.13(3)",
    title: "Provide Opt-Out Mechanism Where Applicable",
    description:
      "Deployers of high-risk AI systems must provide affected persons with the right to contest the AI system's output and request human review.",
    requirement:
      "Implement a clear, accessible opt-out or contestation mechanism allowing users to request human review of AI-driven decisions.",
    evaluate: (current, systemType, riskLevel) => {
      if (current.hasOptOut) {
        return {
          status: "compliant",
          evidence: "Opt-out mechanism is available for users.",
          recommendation: "Ensure the opt-out mechanism is easily accessible and clearly communicated.",
        };
      }
      if (riskLevel === "high-risk") {
        return {
          status: "non-compliant",
          evidence: "High-risk system lacks required opt-out/contestation mechanism.",
          recommendation:
            "Art.13(3) requires deployers of high-risk AI systems to enable affected persons to contest the system's output. Implement a human review request mechanism.",
        };
      }
      return {
        status: "partial",
        evidence: "No opt-out mechanism detected.",
        recommendation:
          "Consider implementing an opt-out mechanism even for non-high-risk systems as a best practice.",
      };
    },
  },
  {
    id: "art14-human-oversight",
    article: "Art.14",
    title: "Human Oversight Information",
    description:
      "High-risk AI systems must be designed to allow effective oversight by natural persons during the period of use, and users must be informed about the oversight mechanisms.",
    requirement:
      "Document and communicate the human oversight measures in place, including who oversees the system, how oversight is conducted, and how users can escalate to a human.",
    evaluate: (current, systemType, riskLevel) => {
      if (current.hasHumanContact) {
        return {
          status: "compliant",
          evidence: "Human oversight information and contact mechanisms are in place.",
          recommendation: "Ensure human oversight procedures are regularly tested and updated.",
        };
      }
      if (riskLevel === "high-risk") {
        return {
          status: "non-compliant",
          evidence: "High-risk system lacks required human oversight information.",
          recommendation:
            "Art.14 requires high-risk AI systems to enable effective human oversight. Implement human-in-the-loop or human-on-the-loop mechanisms and inform users about them.",
        };
      }
      return {
        status: "partial",
        evidence: "No human oversight information provided.",
        recommendation:
          "Consider documenting human oversight measures even for non-high-risk systems.",
      };
    },
  },
  {
    id: "art13-2d-impact",
    article: "Art.13(2)(d)",
    title: "Impact Assessment Disclosure",
    description:
      "Deployers of high-risk AI systems must inform affected persons about the logic involved in the AI system's decision-making, the significance and envisaged consequences, and the factors that led to the decision.",
    requirement:
      "Provide a clear explanation of how the AI system makes decisions, what factors influence its outputs, and what the potential consequences are for affected persons.",
    evaluate: (current, systemType, riskLevel) => {
      if (current.hasImpactInfo) {
        return {
          status: "compliant",
          evidence: "Impact assessment disclosure is available to users.",
          recommendation: "Update impact assessment information when system logic or scope changes.",
        };
      }
      if (riskLevel === "high-risk") {
        return {
          status: "non-compliant",
          evidence: "High-risk system lacks required impact assessment disclosure.",
          recommendation:
            "Art.13(2)(d) requires deployers to inform affected persons about the system's decision-making logic and consequences. Create and publish an impact assessment summary.",
        };
      }
      return {
        status: "partial",
        evidence: "No impact assessment disclosure found.",
        recommendation:
          "Provide transparency about how the AI system works and its potential impact, even for non-high-risk systems.",
      };
    },
  },
  {
    id: "art13-2a-data-handling",
    article: "Art.13(2)(a)",
    title: "Data Handling Transparency",
    description:
      "Deployers of high-risk AI systems must inform affected persons about the categories of personal data being processed and the extent to which the system's output is based on personal data.",
    requirement:
      "Clearly disclose what personal data is collected, how it is processed, how long it is retained, and how it influences the AI system's outputs.",
    evaluate: (current, systemType, riskLevel) => {
      if (current.hasDataHandling) {
        return {
          status: "compliant",
          evidence: "Data handling transparency measures are in place.",
          recommendation: "Ensure data handling disclosures comply with both EU AI Act and GDPR requirements.",
        };
      }
      if (riskLevel === "high-risk") {
        return {
          status: "non-compliant",
          evidence: "High-risk system lacks required data handling transparency.",
          recommendation:
            "Art.13(2)(a) requires disclosure of personal data categories processed and the extent to which outputs are based on personal data. Implement a comprehensive data handling notice.",
        };
      }
      return {
        status: "partial",
        evidence: "No data handling transparency measures detected.",
        recommendation:
          "Provide data handling information even for non-high-risk systems to comply with GDPR transparency principles.",
      };
    },
  },
  {
    id: "art12-logging",
    article: "Art.12",
    title: "Logging and Monitoring Disclosure",
    description:
      "High-risk AI systems must be designed to enable the automatic logging of events relevant to identifying high-risk situations, and deployers must retain logs for an appropriate period.",
    requirement:
      "Document the logging and monitoring practices in place, including what events are logged, retention periods, and how logs are used for oversight.",
    evaluate: (current, systemType, riskLevel) => {
      if (current.hasLoggingPolicy) {
        return {
          status: "compliant",
          evidence: "Logging and monitoring policy is documented and disclosed.",
          recommendation: "Review logging practices periodically to ensure they capture all relevant events.",
        };
      }
      if (riskLevel === "high-risk") {
        return {
          status: "non-compliant",
          evidence: "High-risk system lacks required logging and monitoring disclosure.",
          recommendation:
            "Art.12 requires high-risk AI systems to implement automatic logging of relevant events. Establish a comprehensive logging policy and disclose it to relevant stakeholders.",
        };
      }
      return {
        status: "partial",
        evidence: "No logging policy disclosure found.",
        recommendation:
          "Document logging practices as a transparency best practice, even for non-high-risk systems.",
      };
    },
  },
  {
    id: "art13-2f-explanation",
    article: "Art.13(2)(f)",
    title: "Right to Explanation",
    description:
      "Deployers of high-risk AI systems must ensure that affected persons have the right to receive a meaningful explanation of the AI system's decisions and the factors that influenced them.",
    requirement:
      "Provide a mechanism for users to request and receive a clear, meaningful explanation of AI-driven decisions that affect them.",
    evaluate: (current, systemType, riskLevel) => {
      if (current.hasRightToExplanation) {
        return {
          status: "compliant",
          evidence: "Right to explanation mechanism is available.",
          recommendation: "Ensure explanations are meaningful, understandable to non-experts, and provided in a timely manner.",
        };
      }
      if (riskLevel === "high-risk") {
        return {
          status: "non-compliant",
          evidence: "High-risk system lacks required right to explanation mechanism.",
          recommendation:
            "Art.13(2)(f) requires deployers to provide affected persons with a meaningful explanation of AI decisions. Implement an explanation request and delivery mechanism.",
        };
      }
      return {
        status: "partial",
        evidence: "No right to explanation mechanism detected.",
        recommendation:
          "Implement explanation capabilities to build user trust and align with GDPR automated decision-making rights (Art.22).",
      };
    },
  },
  {
    id: "art13-3-accessibility",
    article: "Art.13(3)",
    title: "Accessibility Requirements",
    description:
      "Transparency information provided to affected persons must be accessible, clear, and easy to understand, taking into account the needs of vulnerable groups.",
    requirement:
      "Ensure all transparency disclosures are written in plain language, are accessible to persons with disabilities, and account for the needs of vulnerable populations.",
    evaluate: (current, systemType, riskLevel) => {
      if (current.hasAccessibility) {
        return {
          status: "compliant",
          evidence: "Accessibility measures are implemented for transparency disclosures.",
          recommendation: "Conduct regular accessibility audits to maintain compliance with EAA and WCAG standards.",
        };
      }
      if (riskLevel === "high-risk" || riskLevel === "limited-risk") {
        return {
          status: "non-compliant",
          evidence: "Transparency disclosures lack required accessibility measures.",
          recommendation:
            "Ensure all AI system disclosures comply with the European Accessibility Act (EAA) and WCAG 2.1 AA standards. Use plain language and provide accommodations for vulnerable groups.",
        };
      }
      return {
        status: "partial",
        evidence: "No specific accessibility measures detected.",
        recommendation:
          "Implement accessibility measures for all user-facing AI disclosures as a best practice.",
      };
    },
  },
  {
    id: "art13-5-multilingual",
    article: "Art.13(5)",
    title: "Multilingual Support",
    description:
      "Where applicable, transparency information should be provided in the official languages of the Member States where the AI system is made available.",
    requirement:
      "Provide transparency disclosures in the languages of all EU Member States where the system is available, or at minimum in English and the primary language of each market.",
    evaluate: (current, systemType, riskLevel) => {
      if (current.hasMultilingual) {
        return {
          status: "compliant",
          evidence: "Multilingual support is available for transparency disclosures.",
          recommendation: "Ensure translations are accurate and regularly updated alongside the primary language content.",
        };
      }
      if (riskLevel === "high-risk") {
        return {
          status: "non-compliant",
          evidence: "High-risk system lacks required multilingual support for transparency disclosures.",
          recommendation:
            "Art.13(5) requires transparency information to be available in the official languages of Member States where the system is placed on the market. Implement multilingual support.",
        };
      }
      return {
        status: "partial",
        evidence: "No multilingual support detected.",
        recommendation:
          "Consider providing multilingual transparency disclosures to support users across EU Member States.",
      };
    },
  },
];

// ============================================================
// Transparency Score Calculator
// ============================================================

interface TransparencyResult {
  score: number;
  status: "compliant" | "partial" | "non-compliant";
  checks: Array<{
    id: string;
    article: string;
    title: string;
    status: "compliant" | "partial" | "non-compliant";
    description: string;
    requirement: string;
    evidence: string;
    recommendation: string;
  }>;
  recommendations: string[];
  requiredActions: string[];
}

/**
 * Evaluates all transparency checks and calculates overall score
 */
function evaluateTransparency(
  input: TransparencyCheckInput
): TransparencyResult {
  const checks = TRANSPARENCY_CHECKS.map((check) => {
    const evaluation = check.evaluate(
      input.currentTransparency,
      input.systemType,
      input.riskLevel
    );

    return {
      id: check.id,
      article: check.article,
      title: check.title,
      status: evaluation.status,
      description: check.description,
      requirement: check.requirement,
      evidence: evaluation.evidence,
      recommendation: evaluation.recommendation,
    };
  });

  // Calculate score
  const compliantCount = checks.filter((c) => c.status === "compliant").length;
  const partialCount = checks.filter((c) => c.status === "partial").length;
  const nonCompliantCount = checks.filter((c) => c.status === "non-compliant").length;

  // Weighted score: compliant = 10, partial = 5, non-compliant = 0
  const rawScore =
    compliantCount * 10 + partialCount * 5;
  const maxScore = checks.length * 10;
  const score = Math.round((rawScore / maxScore) * 100);

  // Determine overall status
  const status: "compliant" | "partial" | "non-compliant" =
    nonCompliantCount > 0
      ? "non-compliant"
      : partialCount > 0
        ? "partial"
        : "compliant";

  // Generate recommendations
  const recommendations: string[] = [];
  if (score >= 90) {
    recommendations.push(
      "Excellent transparency compliance. Your AI system meets nearly all applicable transparency obligations."
    );
    recommendations.push(
      "Continue monitoring and updating transparency measures as the system evolves."
    );
  } else if (score >= 70) {
    recommendations.push(
      "Good transparency compliance with room for improvement. Address partial compliance items to reach full compliance."
    );
  } else if (score >= 40) {
    recommendations.push(
      "Significant transparency gaps detected. Prioritize addressing non-compliant items to avoid regulatory penalties."
    );
    recommendations.push(
      "Develop a transparency improvement plan with specific timelines for each gap."
    );
  } else {
    recommendations.push(
      "Critical transparency deficiencies. Your AI system may face enforcement action under Art.71 for non-compliance with Art.13/50 obligations."
    );
    recommendations.push(
      "Immediately implement a comprehensive transparency program addressing all identified gaps."
    );
  }

  // Generate required actions (only for non-compliant items)
  const requiredActions = checks
    .filter((c) => c.status === "non-compliant")
    .map((c) => `[${c.article}] ${c.title}: ${c.recommendation}`);

  return {
    score,
    status,
    checks,
    recommendations,
    requiredActions,
  };
}

// ============================================================
// API Route Handlers
// ============================================================

/**
 * GET /api/tools/transparency
 * Returns recent transparency checks for the authenticated user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check subscription tier (starter+ only)
    const guard = await requireTier("starter")(request);
    if (guard) return guard;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    // Fetch recent transparency scan results
    const results = await prisma.scanResult.findMany({
      where: {
        scanType: "transparency",
        system: { userId: session.user.id },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        system: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: results.map((r) => ({
        id: r.id,
        systemId: r.systemId,
        systemName: r.system.name,
        score: r.score,
        status: r.status,
        findings: r.findings,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("[TRANSPARENCY API] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch transparency checks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tools/transparency
 * Accepts system info and current transparency measures,
 * evaluates against Art.13/50, stores result, creates audit log
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check subscription tier (starter+ only)
    const guard = await requireTier("starter")(request);
    if (guard) return guard;

    const body = await request.json();

    // Validate input with Zod
    const parseResult = transparencyCheckSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Run transparency evaluation
    const result = evaluateTransparency(input);

    // Determine status for ScanResult
    const status =
      result.status === "compliant"
        ? "pass"
        : result.status === "partial"
          ? "warning"
          : "fail";

    // Find or create an AI system
    let systemId = body.systemId as string | undefined;
    if (systemId) {
      const system = await prisma.aISystem.findUnique({
        where: { id: systemId },
        select: { userId: true },
      });
      if (!system || system.userId !== session.user.id) {
        return NextResponse.json({ error: "AI system not found" }, { status: 404 });
      }
    } else {
      const newSystem = await prisma.aISystem.create({
        data: {
          userId: session.user.id,
          name: input.systemName,
          description: input.description,
          systemType: input.systemType,
          riskLevel: input.riskLevel === "high-risk" ? "high" : input.riskLevel === "limited-risk" ? "limited" : input.riskLevel === "prohibited" ? "unacceptable" : "minimal",
          status: "draft",
          art13Compliant: result.score >= 80,
        },
      });
      systemId = newSystem.id;
    }

    // Store result in ScanResult table
    const scanResult = await prisma.scanResult.create({
      data: {
        systemId,
        scanType: "transparency",
        score: result.score,
        status,
        findings: JSON.stringify({
          systemName: input.systemName,
          systemType: input.systemType,
          riskLevel: input.riskLevel,
          transparencyScore: result.score,
          transparencyStatus: result.status,
          checks: result.checks,
          recommendations: result.recommendations,
          requiredActions: result.requiredActions,
        }),
      },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: "tool_transparency_check",
      resource: "transparency",
      details: {
        systemId,
        systemName: input.systemName,
        systemType: input.systemType,
        riskLevel: input.riskLevel,
        transparencyScore: result.score,
        transparencyStatus: result.status,
        compliantChecks: result.checks.filter((c) => c.status === "compliant").length,
        nonCompliantChecks: result.checks.filter((c) => c.status === "non-compliant").length,
        partialChecks: result.checks.filter((c) => c.status === "partial").length,
        scanResultId: scanResult.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        systemId,
        scanResultId: scanResult.id,
        score: result.score,
        status: result.status,
        checks: result.checks,
        recommendations: result.recommendations,
        requiredActions: result.requiredActions,
      },
    });
  } catch (error) {
    console.error("[TRANSPARENCY API] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to process transparency check" },
      { status: 500 }
    );
  }
}
