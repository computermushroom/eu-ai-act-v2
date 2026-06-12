// Art.10 Data Governance Assessment API
// GET: Returns assessment history for a user's AI systems
// POST: Submits answers, calculates score 0-100 and risk level, updates art10Compliant

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * Data governance question definition
 */
export interface DataGovernanceQuestion {
  id: number;
  question: string;
  explanation: string;
}

/**
 * The 8 Art.10 data governance questions
 */
export const QUESTIONS: DataGovernanceQuestion[] = [
  {
    id: 1,
    question: "Do you have documented data collection procedures?",
    explanation:
      "You have clear written procedures describing how training, validation, and testing data is collected, including sources and methods.",
  },
  {
    id: 2,
    question: "Have you checked your data for relevance and representativeness?",
    explanation:
      "Your datasets match the intended use of the AI system and cover the populations, scenarios, and edge cases the system will encounter.",
  },
  {
    id: 3,
    question: "Do you perform bias detection on training data?",
    explanation:
      "You run systematic checks to identify unfair biases related to gender, age, ethnicity, or other protected characteristics before training.",
  },
  {
    id: 4,
    question: "Have you documented any known data gaps or limitations?",
    explanation:
      "You maintain a record of missing data, underrepresented groups, or situations where the data may be unreliable.",
  },
  {
    id: 5,
    question: "Do you apply data quality checks before model training?",
    explanation:
      "You validate data accuracy, completeness, and consistency, and have procedures to correct or remove bad data.",
  },
  {
    id: 6,
    question: "Is your training data legally obtained and properly licensed?",
    explanation:
      "You have the legal right to use all data for training, including proper licenses, consent, or other lawful bases under GDPR and copyright law.",
  },
  {
    id: 7,
    question: "Do you maintain version control and lineage for datasets?",
    explanation:
      "You can trace which dataset version was used for each model version, and you keep a history of changes.",
  },
  {
    id: 8,
    question: "Have you established procedures for ongoing data monitoring?",
    explanation:
      "After deployment, you continue to monitor data drift and model performance, with plans to retrain or update when needed.",
  },
];

/**
 * Calculate score and risk level from answers
 */
function calculateScore(answers: Record<number, boolean>): {
  score: number;
  riskLevel: "low" | "medium" | "high";
} {
  const yesCount = Object.values(answers).filter(Boolean).length;
  const total = QUESTIONS.length;
  const score = Math.round((yesCount / total) * 100);

  let riskLevel: "low" | "medium" | "high";
  if (score >= 80) {
    riskLevel = "low";
  } else if (score >= 50) {
    riskLevel = "medium";
  } else {
    riskLevel = "high";
  }

  return { score, riskLevel };
}

/**
 * GET /api/tools/data-governance?systemId=...
 * Returns assessment history for a specific AI system
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const systemId = searchParams.get("systemId");

    if (!systemId) {
      return NextResponse.json({ error: "systemId is required" }, { status: 400 });
    }

    const system = await prisma.aISystem.findUnique({
      where: { id: systemId },
      select: { userId: true, name: true, art10Compliant: true },
    });

    if (!system) {
      return NextResponse.json({ error: "AI system not found" }, { status: 404 });
    }

    if (system.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch scan results of type data-governance as assessment history
    const history = await prisma.scanResult.findMany({
      where: { systemId, scanType: "data-governance" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: {
        systemId,
        systemName: system.name,
        art10Compliant: system.art10Compliant,
        questions: QUESTIONS,
        history: history.map((h) => ({
          id: h.id,
          score: h.score,
          status: h.status,
          findings: h.findings,
          createdAt: h.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("[DATA-GOVERNANCE API] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment history" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tools/data-governance
 * Body: { systemId: string, answers: Record<number, boolean> }
 * Calculates score, stores result, optionally updates art10Compliant
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { systemId, answers, saveToSystem } = body as {
      systemId?: string;
      answers?: Record<number, boolean>;
      saveToSystem?: boolean;
    };

    if (!systemId || typeof systemId !== "string") {
      return NextResponse.json({ error: "systemId is required" }, { status: 400 });
    }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "answers is required" }, { status: 400 });
    }

    // Validate all 8 questions are answered
    for (let i = 1; i <= QUESTIONS.length; i++) {
      if (typeof answers[i] !== "boolean") {
        return NextResponse.json(
          { error: `Answer for question ${i} is missing or not a boolean` },
          { status: 400 }
        );
      }
    }

    // Verify ownership
    const system = await prisma.aISystem.findUnique({
      where: { id: systemId },
      select: { userId: true, name: true, systemType: true, riskLevel: true },
    });

    if (!system) {
      return NextResponse.json({ error: "AI system not found" }, { status: 404 });
    }

    if (system.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { score, riskLevel } = calculateScore(answers);

    // Determine status
    const status = score >= 80 ? "pass" : score >= 50 ? "warning" : "fail";

    // Build findings
    const findings = JSON.stringify({
      answers,
      riskLevel,
      missedQuestions: QUESTIONS.filter((q) => !answers[q.id]).map((q) => q.question),
    });

    // Store as scan result for history
    const scanResult = await prisma.scanResult.create({
      data: {
        systemId,
        scanType: "data-governance",
        score,
        status,
        findings,
      },
    });

    // Optionally update AI system compliance flag
    if (saveToSystem === true) {
      await prisma.aISystem.update({
        where: { id: systemId },
        data: { art10Compliant: score >= 80 },
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: "tool_data_governance",
      resource: "data-governance",
      details: {
        systemId,
        systemName: system.name,
        score,
        riskLevel,
        status,
        saved: saveToSystem === true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        systemId,
        systemName: system.name,
        score,
        riskLevel,
        status,
        answers,
        scanResultId: scanResult.id,
        art10Compliant: saveToSystem === true ? score >= 80 : undefined,
      },
    });
  } catch (error) {
    console.error("[DATA-GOVERNANCE API] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to process data governance assessment" },
      { status: 500 }
    );
  }
}
