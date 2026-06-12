// AI Systems CRUD API
// Route: /api/ai-systems
// Methods: GET (list), POST (create)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * GET /api/ai-systems
 * List all AI systems for the authenticated user
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const systems = await prisma.aISystem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        scanResults: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            scanResults: true,
            documents: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: systems });
  } catch (error) {
    console.error("[AI-SYSTEMS] Failed to list systems:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI systems" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-systems
 * Create a new AI system
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const description = body.description?.trim() ?? null;
    const systemType = body.systemType?.trim() ?? "high-risk";
    const industry = body.industry?.trim() ?? null;
    const riskLevel = body.riskLevel?.trim() ?? null;

    const system = await prisma.aISystem.create({
      data: {
        userId: session.user.id,
        name,
        description,
        systemType,
        industry,
        riskLevel,
        status: "draft",
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "document_created",
      resource: `ai-system:${system.id}`,
      details: { name, systemType, industry },
    });

    return NextResponse.json({ success: true, data: system }, { status: 201 });
  } catch (error) {
    console.error("[AI-SYSTEMS] Failed to create system:", error);
    return NextResponse.json(
      { error: "Failed to create AI system" },
      { status: 500 }
    );
  }
}
