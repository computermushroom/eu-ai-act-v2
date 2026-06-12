// FRIA API - Fundamental Rights Impact Assessment (Art.27)
// GET: List FRIA assessments for user's AI systems
// POST: Create/update FRIA assessment with sections 1-6

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * GET /api/fria?systemId=...
 * Returns FRIA assessment for a specific AI system, or list all for user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    // Calculate overall score based on filled sections
    const sections = [section1, section2, section3, section4, section5, section6];
    const filledCount = sections.filter((s) => s && s.trim().length > 0).length;
    const overallScore = Math.round((filledCount / 6) * 100);

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
        status: status ?? "draft",
        overallScore,
      },
      update: {
        section1: section1 !== undefined ? section1 : undefined,
        section2: section2 !== undefined ? section2 : undefined,
        section3: section3 !== undefined ? section3 : undefined,
        section4: section4 !== undefined ? section4 : undefined,
        section5: section5 !== undefined ? section5 : undefined,
        section6: section6 !== undefined ? section6 : undefined,
        status: status !== undefined ? status : undefined,
        overallScore,
        submittedAt: status === "submitted" ? new Date() : undefined,
      },
    });

    // Update AI system Art.27 compliance flag
    await prisma.aISystem.update({
      where: { id: systemId },
      data: { art27Compliant: overallScore >= 80 },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "tool_fria_assessment",
      resource: "fria",
      details: { systemId, status: assessment.status, score: overallScore },
    });

    return NextResponse.json({ success: true, assessment });
  } catch (error) {
    console.error("[FRIA API] POST failed:", error);
    return NextResponse.json({ error: "Failed to save FRIA assessment" }, { status: 500 });
  }
}
