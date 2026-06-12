// QMS API - Quality Management System (Art.17)
// GET: Get QMS checklist for an AI system
// PATCH: Update checklist items and auto-calculate completion rate

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * GET /api/qms?systemId=...
 * Returns QMS checklist for a specific AI system
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

    // Verify AI system ownership
    const system = await prisma.aISystem.findUnique({
      where: { id: systemId },
      select: { userId: true, name: true },
    });

    if (!system) {
      return NextResponse.json({ error: "AI system not found" }, { status: 404 });
    }

    if (system.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const checklist = await prisma.qMSChecklist.findUnique({
      where: { systemId },
    });

    if (!checklist) {
      // Return default empty checklist
      return NextResponse.json({
        checklist: {
          systemId,
          riskManagement: false,
          dataGovernance: false,
          technicalDoc: false,
          recordKeeping: false,
          transparency: false,
          humanOversight: false,
          accuracyRobustness: false,
          cybersecurity: false,
          qualityControl: false,
          postMarket: false,
          incidentReporting: false,
          completionRate: 0,
          status: "incomplete",
        },
      });
    }

    return NextResponse.json({ checklist });
  } catch (error) {
    console.error("[QMS API] GET failed:", error);
    return NextResponse.json({ error: "Failed to fetch QMS checklist" }, { status: 500 });
  }
}

/**
 * PATCH /api/qms
 * Update QMS checklist items
 * Body: { systemId: string, [field]: boolean }
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      systemId,
    } = body as {
      systemId: string;
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

    // Build update data
    const updateData: Record<string, boolean | number | string> = {};
    const fields = [
      "riskManagement",
      "dataGovernance",
      "technicalDoc",
      "recordKeeping",
      "transparency",
      "humanOversight",
      "accuracyRobustness",
      "cybersecurity",
      "qualityControl",
      "postMarket",
      "incidentReporting",
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Upsert to get current values for score calculation
    const existing = await prisma.qMSChecklist.findUnique({
      where: { systemId },
    });

    const merged = {
      riskManagement: existing?.riskManagement ?? false,
      dataGovernance: existing?.dataGovernance ?? false,
      technicalDoc: existing?.technicalDoc ?? false,
      recordKeeping: existing?.recordKeeping ?? false,
      transparency: existing?.transparency ?? false,
      humanOversight: existing?.humanOversight ?? false,
      accuracyRobustness: existing?.accuracyRobustness ?? false,
      cybersecurity: existing?.cybersecurity ?? false,
      qualityControl: existing?.qualityControl ?? false,
      postMarket: existing?.postMarket ?? false,
      incidentReporting: existing?.incidentReporting ?? false,
      ...updateData,
    };

    const checkedCount = fields.filter((f) => merged[f as keyof typeof merged]).length;
    const completionRate = Math.round((checkedCount / fields.length) * 100);
    const status = completionRate === 100 ? "complete" : "incomplete";

    const checklist = await prisma.qMSChecklist.upsert({
      where: { systemId },
      create: {
        systemId,
        ...updateData,
        completionRate,
        status,
      },
      update: {
        ...updateData,
        completionRate,
        status,
      },
    });

    // Update AI system Art.17 compliance flag
    await prisma.aISystem.update({
      where: { id: systemId },
      data: { art17Compliant: completionRate >= 80 },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "tool_qms_checklist",
      resource: "qms",
      details: { systemId, completionRate, status },
    });

    return NextResponse.json({ success: true, checklist });
  } catch (error) {
    console.error("[QMS API] PATCH failed:", error);
    return NextResponse.json({ error: "Failed to update QMS checklist" }, { status: 500 });
  }
}
