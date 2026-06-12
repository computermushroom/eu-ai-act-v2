// AI System Individual Operations API
// Route: /api/ai-systems/[id]
// Methods: GET (detail), PATCH (update), DELETE (soft delete)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Verify ownership of an AI system
 */
async function verifyOwnership(userId: string, systemId: string) {
  const system = await prisma.aISystem.findFirst({
    where: { id: systemId, userId },
  });
  return system;
}

/**
 * GET /api/ai-systems/[id]
 * Get a single AI system with related data
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const system = await prisma.aISystem.findFirst({
      where: { id, userId: session.user.id },
      include: {
        scanResults: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        documents: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        fria: true,
        qms: true,
        _count: {
          select: {
            scanResults: true,
            documents: true,
          },
        },
      },
    });

    if (!system) {
      return NextResponse.json(
        { error: "AI system not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: system });
  } catch (error) {
    console.error("[AI-SYSTEM] Failed to fetch system:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI system" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai-systems/[id]
 * Update an AI system
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await verifyOwnership(session.user.id, id);
    if (!existing) {
      return NextResponse.json(
        { error: "AI system not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Build update data dynamically
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length === 0) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name;
    }

    if (body.description !== undefined) {
      updateData.description = body.description === null ? null : String(body.description).trim();
    }

    if (body.systemType !== undefined) {
      updateData.systemType = String(body.systemType).trim();
    }

    if (body.industry !== undefined) {
      updateData.industry = body.industry === null ? null : String(body.industry).trim();
    }

    if (body.riskLevel !== undefined) {
      updateData.riskLevel = body.riskLevel === null ? null : String(body.riskLevel).trim();
    }

    if (body.status !== undefined) {
      updateData.status = String(body.status).trim();
    }

    // Article compliance booleans
    const complianceFields = [
      "art6Compliant",
      "art9Compliant",
      "art10Compliant",
      "art12Compliant",
      "art13Compliant",
      "art14Compliant",
      "art15Compliant",
      "art17Compliant",
      "art27Compliant",
    ] as const;

    for (const field of complianceFields) {
      if (body[field] !== undefined) {
        updateData[field] = Boolean(body[field]);
      }
    }

    if (body.deployedAt !== undefined) {
      updateData.deployedAt = body.deployedAt ? new Date(body.deployedAt) : null;
    }

    if (body.nextReviewAt !== undefined) {
      updateData.nextReviewAt = body.nextReviewAt ? new Date(body.nextReviewAt) : null;
    }

    const system = await prisma.aISystem.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "document_updated",
      resource: `ai-system:${id}`,
      details: { updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json({ success: true, data: system });
  } catch (error) {
    console.error("[AI-SYSTEM] Failed to update system:", error);
    return NextResponse.json(
      { error: "Failed to update AI system" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai-systems/[id]
 * Soft delete an AI system by setting status to "removed"
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await verifyOwnership(session.user.id, id);
    if (!existing) {
      return NextResponse.json(
        { error: "AI system not found" },
        { status: 404 }
      );
    }

    const system = await prisma.aISystem.update({
      where: { id },
      data: {
        status: "removed",
        name: `${existing.name} (deleted)`,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "document_updated",
      resource: `ai-system:${id}`,
      details: { action: "soft_delete", previousName: existing.name },
    });

    return NextResponse.json({ success: true, data: system });
  } catch (error) {
    console.error("[AI-SYSTEM] Failed to delete system:", error);
    return NextResponse.json(
      { error: "Failed to delete AI system" },
      { status: 500 }
    );
  }
}
