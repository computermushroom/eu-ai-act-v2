// Art.6 Risk Classification API
// GET: Returns recent risk assessments for the user
// POST: Accepts system characteristics, runs real Art.6 risk classification algorithm,
//       stores result in ScanResult table, creates audit log

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

const riskAssessmentSchema = z.object({
  systemName: z.string().min(1).max(200),
  systemType: z.enum(SYSTEM_TYPES),
  domain: z.string().max(200).optional().default(""),
  description: z.string().max(2000).optional().default(""),
  processesPersonalData: z.boolean(),
  involvesVulnerableGroups: z.boolean(),
  biometricUsage: z.boolean(),
  criticalInfrastructure: z.boolean(),
  educationEmployment: z.boolean(),
  lawEnforcement: z.boolean(),
  migrationAsylum: z.boolean(),
  justiceDemocracy: z.boolean(),
  autonomousDecision: z.boolean(),
  emotionalManipulation: z.boolean(),
  safetyComponent: z.boolean(),
  healthImpact: z.boolean(),
  financialImpact: z.boolean(),
  employmentImpact: z.boolean(),
  legalImpact: z.boolean(),
});

type RiskAssessmentInput = z.infer<typeof riskAssessmentSchema>;

// ============================================================
// Art.5 Prohibited Criteria Definitions
// ============================================================

interface ProhibitedCriterion {
  id: string;
  name: string;
  articleRef: string;
  description: string;
  check: (input: RiskAssessmentInput) => boolean;
}

const PROHIBITED_CRITERIA: ProhibitedCriterion[] = [
  {
    id: "subliminal-manipulation",
    name: "Subliminal Manipulation Techniques",
    articleRef: "Art.5(1)(a)",
    description:
      "AI systems that deploy subliminal techniques beyond a person's consciousness to materially distort their behavior, leading to significant harm.",
    check: (input) => input.emotionalManipulation && input.autonomousDecision,
  },
  {
    id: "exploitation-of-vulnerabilities",
    name: "Exploitation of Vulnerable Groups",
    articleRef: "Art.5(1)(b)",
    description:
      "AI systems exploiting vulnerabilities of specific groups (age, disability, social/economic situation) to materially distort behavior causing significant harm.",
    check: (input) => input.involvesVulnerableGroups && input.emotionalManipulation,
  },
  {
    id: "social-scoring",
    name: "Social Scoring by Public Authorities",
    articleRef: "Art.5(1)(c)",
    description:
      "AI systems for social scoring by public authorities leading to disproportionate or unrelated detrimental treatment.",
    check: (input) =>
      input.lawEnforcement &&
      input.justiceDemocracy &&
      (input.financialImpact || input.employmentImpact || input.legalImpact),
  },
  {
    id: "realtime-biometric-id",
    name: "Real-time Remote Biometric Identification in Public Spaces",
    articleRef: "Art.5(1)(d)",
    description:
      "Real-time remote biometric identification systems in publicly accessible spaces for law enforcement purposes (with narrow exceptions).",
    check: (input) => input.biometricUsage && input.lawEnforcement,
  },
  {
    id: "individual-risk-profiling",
    name: "Individual Risk Assessment Based Solely on Profiling",
    articleRef: "Art.5(1)(d)",
    description:
      "AI systems assessing risk of natural persons committing criminal offenses based solely on profiling or personality traits.",
    check: (input) =>
      input.lawEnforcement &&
      input.autonomousDecision &&
      (input.legalImpact || input.employmentImpact),
  },
  {
    id: "emotion-inference-workplace",
    name: "Emotion Inference in Workplace or Education",
    articleRef: "Art.5(1)(b)",
    description:
      "AI systems inferring emotions of natural persons in workplace or education institutions (with health/safety exceptions).",
    check: (input) =>
      input.emotionalManipulation &&
      (input.educationEmployment || input.employmentImpact),
  },
  {
    id: "untargeted-facial-scraping",
    name: "Untargeted Facial Image Scraping for Recognition Databases",
    articleRef: "Art.5(1)(d)",
    description:
      "AI systems creating or expanding facial recognition databases through untargeted scraping of facial images from the internet or CCTV footage.",
    check: (input) => input.biometricUsage && input.processesPersonalData,
  },
  {
    id: "predictive-policing",
    name: "Predictive Policing Based Solely on Profiling",
    articleRef: "Art.5(1)(d)",
    description:
      "AI systems making risk assessments of natural persons' likelihood of committing criminal offenses based solely on profiling.",
    check: (input) =>
      input.lawEnforcement &&
      input.autonomousDecision &&
      input.processesPersonalData,
  },
  {
    id: "behavior-manipulation-circumvent-freewill",
    name: "Manipulation of Behavior to Circumvent Free Will",
    articleRef: "Art.5(1)(a)",
    description:
      "AI systems that manipulate behavior of persons or groups to circumvent their free will, causing significant harm.",
    check: (input) => input.emotionalManipulation && input.autonomousDecision && input.involvesVulnerableGroups,
  },
];

// ============================================================
// Annex III High-Risk Criteria Definitions
// ============================================================

interface HighRiskCriterion {
  id: string;
  name: string;
  articleRef: string;
  description: string;
  check: (input: RiskAssessmentInput) => boolean;
  weight: number;
}

const HIGH_RISK_CRITERIA: HighRiskCriterion[] = [
  {
    id: "annex3-1-biometric-id",
    name: "Biometric Identification and Categorization",
    articleRef: "Art.6(2), Annex III(1)",
    description:
      "AI systems intended to be used for biometric identification or categorization of natural persons.",
    check: (input) => input.biometricUsage,
    weight: 10,
  },
  {
    id: "annex3-2-critical-infrastructure",
    name: "Critical Infrastructure Management",
    articleRef: "Art.6(2), Annex III(2)",
    description:
      "AI systems intended to be used as safety components in the management and operation of critical infrastructure.",
    check: (input) => input.criticalInfrastructure && input.safetyComponent,
    weight: 10,
  },
  {
    id: "annex3-3-education",
    name: "Education and Vocational Training",
    articleRef: "Art.6(2), Annex III(3)",
    description:
      "AI systems intended to be used to determine access to education, evaluate learning outcomes, or make decisions on vocational training.",
    check: (input) => input.educationEmployment,
    weight: 8,
  },
  {
    id: "annex3-4-employment",
    name: "Employment and Worker Management",
    articleRef: "Art.6(2), Annex III(4)",
    description:
      "AI systems intended for recruitment, performance evaluation, promotion, termination decisions, or task allocation.",
    check: (input) => input.employmentImpact,
    weight: 8,
  },
  {
    id: "annex3-5-essential-services",
    name: "Access to Essential Private Services",
    articleRef: "Art.6(2), Annex III(5)",
    description:
      "AI systems evaluating creditworthiness or establishing credit scores, or evaluating eligibility for essential services (insurance, housing).",
    check: (input) => input.financialImpact || input.legalImpact,
    weight: 8,
  },
  {
    id: "annex3-6-law-enforcement",
    name: "Law Enforcement",
    articleRef: "Art.6(2), Annex III(6)",
    description:
      "AI systems intended to be used by law enforcement for risk assessment, polygraph/emotion detection, or evidence evaluation.",
    check: (input) => input.lawEnforcement,
    weight: 10,
  },
  {
    id: "annex3-7-migration-asylum",
    name: "Migration, Asylum, and Border Control",
    articleRef: "Art.6(2), Annex III(7)",
    description:
      "AI systems intended to assist competent authorities in examining applications for asylum, visa, or residence permits.",
    check: (input) => input.migrationAsylum,
    weight: 8,
  },
  {
    id: "annex3-8-justice",
    name: "Administration of Justice",
    articleRef: "Art.6(2), Annex III(8)",
    description:
      "AI systems intended to assist judicial authorities in researching or interpreting facts and law.",
    check: (input) => input.justiceDemocracy,
    weight: 8,
  },
  {
    id: "annex3-9-democratic-processes",
    name: "Democratic Processes",
    articleRef: "Art.6(2), Annex III(9)",
    description:
      "AI systems intended to influence the outcome of elections and referendums, or voter behavior.",
    check: (input) => input.justiceDemocracy && input.processesPersonalData,
    weight: 8,
  },
  {
    id: "annex3-10-health-medical",
    name: "Health and Medical Devices",
    articleRef: "Art.6(2), Annex III(10)",
    description:
      "AI systems intended for medical diagnosis, treatment recommendations, or as safety components of medical devices.",
    check: (input) => input.healthImpact,
    weight: 8,
  },
  {
    id: "annex3-11-industrial-safety",
    name: "Industrial and Manufacturing Safety",
    articleRef: "Art.6(2), Annex III(11)",
    description:
      "AI systems intended for safety-related functions in industrial manufacturing, robotics, or autonomous vehicles.",
    check: (input) => input.safetyComponent && input.criticalInfrastructure,
    weight: 8,
  },
];

// ============================================================
// Art.52 Transparency Criteria
// ============================================================

interface TransparencyCriterion {
  id: string;
  name: string;
  articleRef: string;
  check: (input: RiskAssessmentInput) => boolean;
}

const TRANSPARENCY_CRITERIA: TransparencyCriterion[] = [
  {
    id: "art52-chatbot",
    name: "AI System Interacting with Humans (Chatbot/Conversational AI)",
    articleRef: "Art.52(1)",
    check: (input) =>
      ["generative-ai", "nlp", "recommendation", "decision-support"].includes(input.systemType),
  },
  {
    id: "art52-emotion",
    name: "Emotion Recognition or Biometric Categorization",
    articleRef: "Art.52(3)",
    check: (input) => input.biometricUsage || input.emotionalManipulation,
  },
  {
    id: "art52-deepfake",
    name: "Generation or Manipulation of Content (Deepfakes/Synthetic Media)",
    articleRef: "Art.52(2)",
    check: (input) =>
      ["generative-ai", "computer-vision", "nlp"].includes(input.systemType) &&
      input.processesPersonalData,
  },
];

// ============================================================
// Risk Classification Algorithm
// ============================================================

interface ClassificationResult {
  riskLevel: "prohibited" | "high-risk" | "limited-risk" | "minimal-risk";
  riskScore: number;
  applicableArticles: string[];
  prohibitedCriteria: string[];
  highRiskCriteria: string[];
  recommendations: string[];
  detailedAnalysis: {
    prohibitedChecks: Array<{
      id: string;
      name: string;
      articleRef: string;
      description: string;
      triggered: boolean;
    }>;
    highRiskChecks: Array<{
      id: string;
      name: string;
      articleRef: string;
      description: string;
      triggered: boolean;
      weight: number;
    }>;
    transparencyChecks: Array<{
      id: string;
      name: string;
      articleRef: string;
      triggered: boolean;
    }>;
  };
}

/**
 * Implements the real EU AI Act Art.6 risk classification algorithm:
 * Step 1: Check Art.5 prohibited criteria -> "prohibited"
 * Step 2: Check Annex III high-risk criteria -> "high-risk"
 * Step 3: Check Art.52 transparency obligations -> "limited-risk"
 * Step 4: Otherwise -> "minimal-risk"
 */
function classifyRisk(input: RiskAssessmentInput): ClassificationResult {
  const applicableArticles: string[] = [];
  const prohibitedCriteria: string[] = [];
  const highRiskCriteria: string[] = [];
  const recommendations: string[] = [];

  // Step 1: Check Art.5 prohibited practices
  const prohibitedChecks = PROHIBITED_CRITERIA.map((criterion) => ({
    id: criterion.id,
    name: criterion.name,
    articleRef: criterion.articleRef,
    description: criterion.description,
    triggered: criterion.check(input),
  }));

  const triggeredProhibited = prohibitedChecks.filter((c) => c.triggered);
  for (const c of triggeredProhibited) {
    prohibitedCriteria.push(c.name);
    if (!applicableArticles.includes(c.articleRef)) {
      applicableArticles.push(c.articleRef);
    }
  }

  // If any prohibited criteria match, system is prohibited
  if (triggeredProhibited.length > 0) {
    applicableArticles.push("Art.5");
    recommendations.push(
      "URGENT: Your AI system appears to engage in prohibited practices under Art.5. These practices are banned in the EU."
    );
    recommendations.push(
      "Immediately consult legal counsel before any further development or deployment."
    );
    recommendations.push(
      "Consider fundamental redesign of the AI system to eliminate prohibited elements."
    );
    recommendations.push(
      "Do not deploy this system in the EU market in its current form."
    );

    return {
      riskLevel: "prohibited",
      riskScore: 100,
      applicableArticles,
      prohibitedCriteria,
      highRiskCriteria,
      recommendations,
      detailedAnalysis: {
        prohibitedChecks,
        highRiskChecks: [],
        transparencyChecks: [],
      },
    };
  }

  // Step 2: Check Annex III high-risk criteria
  const highRiskChecks = HIGH_RISK_CRITERIA.map((criterion) => ({
    id: criterion.id,
    name: criterion.name,
    articleRef: criterion.articleRef,
    description: criterion.description,
    triggered: criterion.check(input),
    weight: criterion.weight,
  }));

  const triggeredHighRisk = highRiskChecks.filter((c) => c.triggered);
  for (const c of triggeredHighRisk) {
    highRiskCriteria.push(c.name);
    if (!applicableArticles.includes(c.articleRef)) {
      applicableArticles.push(c.articleRef);
    }
  }

  if (triggeredHighRisk.length > 0) {
    applicableArticles.push("Art.6", "Art.7", "Art.8", "Art.9", "Art.10", "Art.11", "Art.12", "Art.13", "Art.14", "Art.15");
    // Calculate risk score based on number and weight of triggered criteria
    const totalWeight = triggeredHighRisk.reduce((sum, c) => sum + c.weight, 0);
    const maxPossibleWeight = HIGH_RISK_CRITERIA.reduce((sum, c) => sum + c.weight, 0);
    const riskScore = Math.min(85, Math.round((totalWeight / maxPossibleWeight) * 100) + 50);

    recommendations.push(
      "Your AI system qualifies as HIGH-RISK under Art.6(2) and Annex III of the EU AI Act."
    );
    recommendations.push(
      "You must implement a comprehensive risk management system (Art.9)."
    );
    recommendations.push(
      "Ensure data governance practices comply with Art.10 requirements."
    );
    recommendations.push(
      "Prepare technical documentation in accordance with Art.11 and Annex IV."
    );
    recommendations.push(
      "Implement automatic logging capabilities (Art.12)."
    );
    recommendations.push(
      "Provide clear transparency information to deployers and users (Art.13)."
    );
    recommendations.push(
      "Design and implement human oversight measures (Art.14)."
    );
    recommendations.push(
      "Achieve appropriate levels of accuracy, robustness, and cybersecurity (Art.15)."
    );
    recommendations.push(
      "Undergo conformity assessment before market placement (Art.43)."
    );
    recommendations.push(
      "Register the system in the EU AI database (Art.71)."
    );

    return {
      riskLevel: "high-risk",
      riskScore,
      applicableArticles,
      prohibitedCriteria,
      highRiskCriteria,
      recommendations,
      detailedAnalysis: {
        prohibitedChecks,
        highRiskChecks,
        transparencyChecks: [],
      },
    };
  }

  // Step 3: Check Art.52 transparency obligations
  const transparencyChecks = TRANSPARENCY_CRITERIA.map((criterion) => ({
    id: criterion.id,
    name: criterion.name,
    articleRef: criterion.articleRef,
    triggered: criterion.check(input),
  }));

  const triggeredTransparency = transparencyChecks.filter((c) => c.triggered);
  for (const c of triggeredTransparency) {
    if (!applicableArticles.includes(c.articleRef)) {
      applicableArticles.push(c.articleRef);
    }
  }

  if (triggeredTransparency.length > 0) {
    applicableArticles.push("Art.52");
    const riskScore = 30 + triggeredTransparency.length * 10;

    recommendations.push(
      "Your AI system has LIMITED RISK obligations under Art.52 of the EU AI Act."
    );
    recommendations.push(
      "Ensure users are clearly informed when interacting with an AI system (Art.52(1))."
    );
    if (triggeredTransparency.some((c) => c.id === "art52-deepfake")) {
      recommendations.push(
        "Label all AI-generated or manipulated content as artificially generated (Art.52(2))."
      );
    }
    if (triggeredTransparency.some((c) => c.id === "art52-emotion")) {
      recommendations.push(
        "Inform users when emotion recognition or biometric categorization is being performed (Art.52(3))."
      );
    }

    return {
      riskLevel: "limited-risk",
      riskScore,
      applicableArticles,
      prohibitedCriteria,
      highRiskCriteria,
      recommendations,
      detailedAnalysis: {
        prohibitedChecks,
        highRiskChecks,
        transparencyChecks,
      },
    };
  }

  // Step 4: Minimal risk
  recommendations.push(
    "Your AI system poses MINIMAL RISK under the EU AI Act classification."
  );
  recommendations.push(
    "No specific regulatory obligations apply under the EU AI Act."
  );
  recommendations.push(
    "Consider adopting voluntary codes of conduct as recommended by Art.69."
  );
  recommendations.push(
    "Monitor for changes in the system's scope or use case that could change its risk classification."
  );
  recommendations.push(
    "Stay informed about regulatory updates and guidelines from the EU AI Office."
  );

  return {
    riskLevel: "minimal-risk",
    riskScore: 10,
    applicableArticles,
    prohibitedCriteria,
    highRiskCriteria,
    recommendations,
    detailedAnalysis: {
      prohibitedChecks,
      highRiskChecks,
      transparencyChecks,
    },
  };
}

// ============================================================
// API Route Handlers
// ============================================================

/**
 * GET /api/tools/risk-assessment
 * Returns recent risk assessments for the authenticated user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check subscription tier (all tiers can access)
    const guard = await requireTier("free")(request);
    if (guard) return guard;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    // Fetch recent risk assessment scan results
    const results = await prisma.scanResult.findMany({
      where: {
        scanType: "risk-assessment",
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
    console.error("[RISK-ASSESSMENT API] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk assessments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tools/risk-assessment
 * Accepts system characteristics, runs Art.6 risk classification,
 * stores result in ScanResult table, creates audit log
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check subscription tier (all tiers can access)
    const guard = await requireTier("free")(request);
    if (guard) return guard;

    const body = await request.json();

    // Validate input with Zod
    const parseResult = riskAssessmentSchema.safeParse(body);
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

    // Run the Art.6 risk classification algorithm
    const result = classifyRisk(input);

    // Determine status for ScanResult
    const status =
      result.riskLevel === "prohibited"
        ? "fail"
        : result.riskLevel === "high-risk"
          ? "warning"
          : "pass";

    // Find or create an AI system for this assessment
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
      // Create a new AI system record for this assessment
      const newSystem = await prisma.aISystem.create({
        data: {
          userId: session.user.id,
          name: input.systemName,
          description: input.description,
          systemType: input.systemType,
          riskLevel: result.riskLevel === "prohibited" ? "unacceptable" : result.riskLevel === "high-risk" ? "high" : result.riskLevel === "limited-risk" ? "limited" : "minimal",
          status: "draft",
          art6Compliant: result.riskLevel !== "prohibited",
        },
      });
      systemId = newSystem.id;
    }

    // Store result in ScanResult table
    const scanResult = await prisma.scanResult.create({
      data: {
        systemId,
        scanType: "risk-assessment",
        score: result.riskScore,
        status,
        findings: JSON.stringify({
          systemName: input.systemName,
          systemType: input.systemType,
          riskLevel: result.riskLevel,
          applicableArticles: result.applicableArticles,
          prohibitedCriteria: result.prohibitedCriteria,
          highRiskCriteria: result.highRiskCriteria,
          recommendations: result.recommendations,
          detailedAnalysis: result.detailedAnalysis,
        }),
      },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: "tool_risk_assessment",
      resource: "risk-assessment",
      details: {
        systemId,
        systemName: input.systemName,
        systemType: input.systemType,
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
        prohibitedCount: result.prohibitedCriteria.length,
        highRiskCount: result.highRiskCriteria.length,
        scanResultId: scanResult.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        systemId,
        scanResultId: scanResult.id,
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
        applicableArticles: result.applicableArticles,
        prohibitedCriteria: result.prohibitedCriteria,
        highRiskCriteria: result.highRiskCriteria,
        recommendations: result.recommendations,
        detailedAnalysis: result.detailedAnalysis,
      },
    });
  } catch (error) {
    console.error("[RISK-ASSESSMENT API] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to process risk assessment" },
      { status: 500 }
    );
  }
}
