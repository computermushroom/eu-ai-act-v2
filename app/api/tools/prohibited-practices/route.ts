// Art.5 Prohibited Practices Check API
// GET: Returns recent prohibited practice checks for the user
// POST: Accepts system info and practice IDs, runs real Art.5 checks,
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

const VALID_PRACTICE_IDS = [
  "subliminal-manipulation",
  "exploitation-of-vulnerabilities",
  "social-scoring",
  "realtime-biometric-id",
  "individual-risk-profiling",
  "emotion-inference-workplace",
  "untargeted-facial-scraping",
  "predictive-policing",
  "behavior-manipulation-freewill",
] as const;

const prohibitedPracticesSchema = z.object({
  systemName: z.string().min(1).max(200),
  systemType: z.enum(SYSTEM_TYPES),
  description: z.string().max(2000).optional().default(""),
  practices: z
    .array(z.enum(VALID_PRACTICE_IDS))
    .min(1)
    .max(VALID_PRACTICE_IDS.length),
});

type ProhibitedPracticesInput = z.infer<typeof prohibitedPracticesSchema>;

// ============================================================
// Art.5 Prohibited Practice Definitions
// ============================================================

interface ProhibitedPractice {
  id: string;
  name: string;
  description: string;
  legalReference: string;
  /**
   * Determines whether this practice is applicable to the given system.
   * Returns an object with applicability, evidence, and mitigation guidance.
   */
  evaluate: (
    systemType: string,
    description: string
  ) => {
    isApplicable: boolean;
    riskLevel: "prohibited" | "restricted" | "low";
    evidence: string[];
    mitigation: string[];
  };
}

const PROHIBITED_PRACTICES: ProhibitedPractice[] = [
  {
    id: "subliminal-manipulation",
    name: "Subliminal Manipulation Techniques Beyond Conscious Awareness",
    description:
      "Placing an AI system on the market or putting it into service that deploys subliminal techniques beyond a person's consciousness to materially distort their behavior in a manner that causes or is likely to cause significant harm.",
    legalReference: "Art.5(1)(a)",
    evaluate: (systemType, description) => {
      const desc = description.toLowerCase();
      const isApplicable =
        ["generative-ai", "recommendation", "decision-support", "nlp"].includes(
          systemType
        ) &&
        (desc.includes("subliminal") ||
          desc.includes("manipulation") ||
          desc.includes("behavior") ||
          desc.includes("persuasion") ||
          desc.includes("nudge"));

      return {
        isApplicable,
        riskLevel: isApplicable ? "prohibited" : "low",
        evidence: isApplicable
          ? [
              "System type suggests capability for behavioral influence",
              "Description indicates potential for manipulation techniques",
              "Art.5(1)(a) prohibits subliminal techniques causing significant harm",
            ]
          : [],
        mitigation: isApplicable
          ? [
              "Remove all subliminal or unconscious influence mechanisms",
              "Implement explicit user consent for any behavioral nudges",
              "Ensure all system interactions are transparent and above consciousness",
              "Conduct a fundamental rights impact assessment (Art.27)",
              "Redesign system to avoid any form of behavioral distortion",
            ]
          : [],
      };
    },
  },
  {
    id: "exploitation-of-vulnerabilities",
    name: "Exploitation of Vulnerabilities of Specific Groups",
    description:
      "AI systems that exploit vulnerabilities of specific groups of persons due to their age, disability, or social or economic situation to materially distort their behavior in a manner that causes or is likely to cause significant harm.",
    legalReference: "Art.5(1)(b)",
    evaluate: (systemType, description) => {
      const desc = description.toLowerCase();
      const isApplicable =
        (desc.includes("vulnerable") ||
          desc.includes("children") ||
          desc.includes("elderly") ||
          desc.includes("disability") ||
          desc.includes("minor") ||
          desc.includes("low-income") ||
          desc.includes("socioeconomic")) &&
        (desc.includes("target") ||
          desc.includes("exploit") ||
          desc.includes("influence") ||
          desc.includes("recommend"));

      return {
        isApplicable,
        riskLevel: isApplicable ? "prohibited" : "low",
        evidence: isApplicable
          ? [
              "System targets or interacts with vulnerable populations",
              "Potential for exploiting vulnerabilities of specific groups",
              "Art.5(1)(b) prohibits exploitation of age, disability, or social/economic vulnerabilities",
            ]
          : [],
        mitigation: isApplicable
          ? [
              "Implement age verification and group-specific safeguards",
              "Remove targeting capabilities based on vulnerability indicators",
              "Add enhanced consent mechanisms for vulnerable users",
              "Design inclusive interfaces that do not exploit cognitive biases",
              "Establish an ethics review board for system decisions affecting vulnerable groups",
            ]
          : [],
      };
    },
  },
  {
    id: "social-scoring",
    name: "Social Scoring by Public Authorities",
    description:
      "AI systems intended for the evaluation or classification of natural persons or groups over a certain period of time based on their social behavior or personal/ personality characteristics, leading to detrimental treatment unrelated to the original context.",
    legalReference: "Art.5(1)(c)",
    evaluate: (systemType, description) => {
      const desc = description.toLowerCase();
      const isApplicable =
        (systemType === "predictive-analytics" ||
          systemType === "decision-support" ||
          systemType === "recommendation") &&
        (desc.includes("social") ||
          desc.includes("scoring") ||
          desc.includes("rating") ||
          desc.includes("behavior") ||
          desc.includes("trust") ||
          desc.includes("reputation") ||
          desc.includes("citizen"));

      return {
        isApplicable,
        riskLevel: isApplicable ? "prohibited" : "low",
        evidence: isApplicable
          ? [
              "System appears to perform social scoring or behavioral classification",
              "May lead to detrimental treatment across unrelated contexts",
              "Art.5(1)(c) specifically prohibits social scoring by public authorities",
            ]
          : [],
        mitigation: isApplicable
          ? [
              "Ensure the system is not used by or for public authorities",
              "Limit scoring to a single, specific, legitimate context",
              "Do not aggregate social behavior data across unrelated domains",
              "Implement purpose limitation and data minimization",
              "Ensure no detrimental treatment results from the scoring",
            ]
          : [],
      };
    },
  },
  {
    id: "realtime-biometric-id",
    name: "Real-time Remote Biometric Identification in Public Spaces",
    description:
      "AI systems intended for real-time remote biometric identification of natural persons in publicly accessible spaces for law enforcement purposes, with narrowly defined exceptions.",
    legalReference: "Art.5(1)(d)",
    evaluate: (systemType, description) => {
      const desc = description.toLowerCase();
      const isApplicable =
        (systemType === "computer-vision" || systemType === "autonomous-systems") &&
        (desc.includes("biometric") ||
          desc.includes("facial recognition") ||
          desc.includes("face detection") ||
          desc.includes("identification") ||
          desc.includes("surveillance") ||
          desc.includes("camera") ||
          desc.includes("public space"));

      return {
        isApplicable,
        riskLevel: isApplicable ? "prohibited" : "low",
        evidence: isApplicable
          ? [
              "System involves biometric identification capabilities",
              "May operate in publicly accessible spaces",
              "Art.5(1)(d) prohibits real-time remote biometric ID in public spaces for law enforcement",
              "Narrow exceptions exist for specific serious crime scenarios",
            ]
          : [],
        mitigation: isApplicable
          => [
              "Do not deploy real-time biometric identification in public spaces",
              "If law enforcement use: ensure strict Art.5(1)(d) exception criteria are met",
              "Obtain prior judicial authorization for any exception-based use",
              "Implement strict data retention limits (immediate deletion)",
              "Ensure use is limited to the prevention, investigation, detection, or prosecution of specific serious criminal offenses",
            ]
          : [],
      };
    },
  },
  {
    id: "individual-risk-profiling",
    name: "Individual Risk Assessments Based Solely on Profiling",
    description:
      "AI systems that assess the risk of a natural person committing a criminal offence based solely on profiling or personality traits, without objective, verifiable facts directly linked to criminal activity.",
    legalReference: "Art.5(1)(d)",
    evaluate: (systemType, description) => {
      const desc = description.toLowerCase();
      const isApplicable =
        (systemType === "predictive-analytics" ||
          systemType === "decision-support") &&
        (desc.includes("risk assessment") ||
          desc.includes("profiling") ||
          desc.includes("criminal") ||
          desc.includes("offense") ||
          desc.includes("reoffend") ||
          desc.includes("recidivism") ||
          desc.includes("personality") ||
          desc.includes("predict"));

      return {
        isApplicable,
        riskLevel: isApplicable ? "prohibited" : "low",
        evidence: isApplicable
          ? [
              "System appears to perform individual risk assessments",
              "May rely on profiling or personality traits rather than objective facts",
              "Art.5(1)(d) prohibits risk assessments based solely on profiling for criminal offenses",
            ]
          : [],
        mitigation: isApplicable
          => [
              "Ensure risk assessments are based on objective, verifiable facts",
              "Do not rely solely on profiling or personality traits",
              "Include direct evidence linked to the specific criminal activity",
              "Implement human oversight for all risk assessment decisions",
              "Document the factual basis for each individual assessment",
            ]
          : [],
      };
    },
  },
  {
    id: "emotion-inference-workplace",
    name: "Emotion Inference in Workplace or Education Settings",
    description:
      "AI systems that infer emotions of natural persons in areas of workplace and education institutions, with exceptions for health/safety purposes or for therapeutic purposes.",
    legalReference: "Art.5(1)(b) / Art.52(3)",
    evaluate: (systemType, description) => {
      const desc = description.toLowerCase();
      const isApplicable =
        (systemType === "computer-vision" ||
          systemType === "nlp" ||
          systemType === "generative-ai") &&
        (desc.includes("emotion") ||
          desc.includes("sentiment") ||
          desc.includes("feeling") ||
          desc.includes("mood") ||
          desc.includes("workplace") ||
          desc.includes("employee") ||
          desc.includes("education") ||
          desc.includes("student") ||
          desc.includes("school"));

      return {
        isApplicable,
        riskLevel: isApplicable ? "restricted" : "low",
        evidence: isApplicable
          ? [
              "System may infer emotions from facial expressions, voice, or text",
              "May be deployed in workplace or educational settings",
              "Art.5(1)(b) restricts emotion inference in workplace/education",
              "Exceptions exist for health, safety, or therapeutic purposes",
            ]
          : [],
        mitigation: isApplicable
          ? [
              "Verify if health/safety or therapeutic exception applies to your use case",
              "If exception applies: document the specific health/safety justification",
              "If no exception: remove emotion inference capabilities from workplace/education contexts",
              "Implement explicit user consent and disclosure mechanisms",
              "Ensure human review of any emotion-based decisions",
            ]
          : [],
      };
    },
  },
  {
    id: "untargeted-facial-scraping",
    name: "Creation of Facial Recognition Databases via Untargeted Scraping",
    description:
      "AI systems that create or expand facial recognition databases through untargeted scraping of facial images from the internet or CCTV footage.",
    legalReference: "Art.5(1)(d)",
    evaluate: (systemType, description) => {
      const desc = description.toLowerCase();
      const isApplicable =
        (systemType === "computer-vision" || systemType === "generative-ai") &&
        (desc.includes("facial") ||
          desc.includes("face") ||
          desc.includes("scraping") ||
          desc.includes("crawl") ||
          desc.includes("dataset") ||
          desc.includes("database") ||
          desc.includes("recognition"));

      return {
        isApplicable,
        riskLevel: isApplicable ? "prohibited" : "low",
        evidence: isApplicable
          ? [
              "System may involve facial recognition capabilities",
              "Potential for creating or expanding facial recognition databases",
              "Art.5(1)(d) prohibits untargeted scraping for facial recognition databases",
            ]
          : [],
        mitigation: isApplicable
          => [
              "Do not scrape facial images from the internet without targeted, lawful basis",
              "Do not use CCTV footage to create facial recognition databases",
              "Ensure all training data for facial recognition is lawfully obtained with consent",
              "Maintain documentation of data sources and legal bases",
              "Consider using synthetic or anonymized data for training",
            ]
          : [],
      };
    },
  {
    id: "predictive-policing",
    name: "Predictive Policing Based Solely on Profiling",
    description:
      "AI systems that make predictions about the occurrence of actual or potential criminal offences based solely on profiling of natural persons or on personality traits, or that assess the risk of a natural person offending or reoffending based solely on profiling.",
    legalReference: "Art.5(1)(d)",
    evaluate: (systemType, description) => {
      const desc = description.toLowerCase();
      const isApplicable =
        (systemType === "predictive-analytics" ||
          systemType === "decision-support") &&
        (desc.includes("predict") ||
          desc.includes("police") ||
          desc.includes("law enforcement") ||
          desc.includes("crime") ||
          desc.includes("offense") ||
          desc.includes("policing") ||
          desc.includes("hotspot") ||
          desc.includes("recidivism"));

      return {
        isApplicable,
        riskLevel: isApplicable ? "prohibited" : "low",
        evidence: isApplicable
          ? [
              "System appears designed for predictive policing or crime prediction",
              "May rely on profiling rather than objective criminal data",
              "Art.5(1)(d) prohibits predictive policing based solely on profiling",
            ]
          : [],
        mitigation: isApplicable
          => [
              "Base crime predictions on objective, verifiable data, not solely profiling",
              "Include human oversight and review in all predictive policing outputs",
              "Ensure predictions do not lead to discriminatory outcomes",
              "Document the data sources and methodology used",
              "Implement bias detection and mitigation measures",
            ]
          : [],
      };
    },
  {
    id: "behavior-manipulation-freewill",
    name: "AI Systems that Manipulate Behavior to Circumvent Free Will",
    description:
      "AI systems that manipulate the behavior of persons or groups of persons to circumvent their free will, leading to or likely to lead to significant harm.",
    legalReference: "Art.5(1)(a)",
    evaluate: (systemType, description) => {
      const desc = description.toLowerCase();
      const isApplicable =
        (systemType === "generative-ai" ||
          systemType === "recommendation" ||
          systemType === "nlp") &&
        (desc.includes("manipulate") ||
          desc.includes("coerce") ||
          desc.includes("circumvent") ||
          desc.includes("free will") ||
          desc.includes("addict") ||
          desc.includes("dark pattern") ||
          desc.includes("persuade"));

      return {
        isApplicable,
        riskLevel: isApplicable ? "prohibited" : "low",
        evidence: isApplicable
          ? [
              "System may employ behavioral manipulation techniques",
              "Potential to circumvent user free will through design patterns",
              "Art.5(1)(a) prohibits manipulation leading to significant harm",
            ]
          : [],
        mitigation: isApplicable
          => [
              "Remove dark patterns and coercive design elements",
              "Ensure users maintain genuine choice and agency",
              "Implement transparent disclosure of all persuasive elements",
              "Add friction mechanisms to prevent impulsive or manipulated decisions",
              "Conduct regular ethical reviews of system design",
            ]
          : [],
      };
    },
};

// ============================================================
// API Route Handlers
// ============================================================

/**
 * GET /api/tools/prohibited-practices
 * Returns recent prohibited practice checks for the authenticated user
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

    // Fetch recent prohibited practice scan results
    const results = await prisma.scanResult.findMany({
      where: {
        scanType: "prohibited-practices",
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
    console.error("[PROHIBITED-PRACTICES API] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch prohibited practice checks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tools/prohibited-practices
 * Accepts system info and practice IDs, evaluates each against Art.5,
 * stores result in ScanResult table, creates audit log
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
    const parseResult = prohibitedPracticesSchema.safeParse(body);
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

    // Evaluate each requested practice
    const practices = input.practices.map((practiceId) => {
      const practice = PROHIBITED_PRACTICES.find((p) => p.id === practiceId);
      if (!practice) {
        return {
          id: practiceId,
          name: "Unknown Practice",
          description: "This practice ID was not recognized.",
          isApplicable: false,
          riskLevel: "low" as const,
          evidence: [],
          mitigation: [],
          legalReference: "N/A",
        };
      }

      const evaluation = practice.evaluate(input.systemType, input.description);

      return {
        id: practice.id,
        name: practice.name,
        description: practice.description,
        isApplicable: evaluation.isApplicable,
        riskLevel: evaluation.riskLevel,
        evidence: evaluation.evidence,
        mitigation: evaluation.mitigation,
        legalReference: practice.legalReference,
      };
    });

    // Calculate overall results
    const prohibitedPractices = practices.filter(
      (p) => p.isApplicable && p.riskLevel === "prohibited"
    );
    const restrictedPractices = practices.filter(
      (p) => p.isApplicable && p.riskLevel === "restricted"
    );
    const isProhibited = prohibitedPractices.length > 0;
    const prohibitedCount = prohibitedPractices.length;
    const totalChecked = practices.length;

    // Generate recommendations
    const recommendations: string[] = [];
    if (isProhibited) {
      recommendations.push(
        `URGENT: ${prohibitedCount} prohibited practice(s) detected. These are banned under EU AI Act Art.5 and cannot be brought into compliance.`
      );
      recommendations.push(
        "Immediately cease development or deployment of the identified prohibited elements."
      );
      recommendations.push(
        "Consult with legal counsel specializing in EU AI Act compliance."
      );
      recommendations.push(
        "Consider fundamental redesign of the AI system to eliminate all prohibited practices."
      );
    }

    if (restrictedPractices.length > 0) {
      recommendations.push(
        `${restrictedPractices.length} restricted practice(s) detected. These require specific safeguards or fall under limited exceptions.`
      );
      recommendations.push(
        "Review the applicable exceptions and ensure all safeguard conditions are met."
      );
    }

    if (!isProhibited && restrictedPractices.length === 0) {
      recommendations.push(
        "No prohibited or restricted practices detected. Your system appears compliant with Art.5."
      );
      recommendations.push(
        "Continue with Art.6 risk classification to determine your full compliance obligations."
      );
    }

    // Calculate risk score (higher = more concerning)
    const riskScore = Math.min(
      100,
      prohibitedCount * 30 + restrictedPractices.length * 15
    );

    // Determine status
    const status = isProhibited ? "fail" : restrictedPractices.length > 0 ? "warning" : "pass";

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
          riskLevel: isProhibited ? "unacceptable" : null,
          status: "draft",
          art6Compliant: !isProhibited,
        },
      });
      systemId = newSystem.id;
    }

    // Store result in ScanResult table
    const scanResult = await prisma.scanResult.create({
      data: {
        systemId,
        scanType: "prohibited-practices",
        score: riskScore,
        status,
        findings: JSON.stringify({
          systemName: input.systemName,
          systemType: input.systemType,
          isProhibited,
          prohibitedCount,
          totalChecked,
          practices,
          recommendations,
        }),
      },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: "tool_prohibited_practices",
      resource: "prohibited-practices",
      details: {
        systemId,
        systemName: input.systemName,
        systemType: input.systemType,
        isProhibited,
        prohibitedCount,
        restrictedCount: restrictedPractices.length,
        totalChecked,
        scanResultId: scanResult.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        systemId,
        scanResultId: scanResult.id,
        isProhibited,
        prohibitedCount,
        totalChecked,
        practices,
        recommendations,
      },
    });
  } catch (error) {
    console.error("[PROHIBITED-PRACTICES API] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to process prohibited practices check" },
      { status: 500 }
    );
  }
}
