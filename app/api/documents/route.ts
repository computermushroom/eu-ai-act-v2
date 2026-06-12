// Compliance Documents API
// Route: /api/documents
// Methods: GET (list), POST (create)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * GET /api/documents?systemId=xxx
 * List all compliance documents for the authenticated user
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const systemId = searchParams.get("systemId");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (systemId) {
      where.systemId = systemId;
    }

    const documents = await prisma.complianceDocument.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        system: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error("[DOCUMENTS] Failed to list documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents
 * Create a new compliance document
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!body.type || typeof body.type !== "string" || body.type.trim().length === 0) {
      return NextResponse.json(
        { error: "Type is required" },
        { status: 400 }
      );
    }

    const title = body.title.trim();
    const type = body.type.trim();
    const content = typeof body.content === "string" ? body.content : "";
    const systemId = body.systemId || null;

    // Validate system ownership if systemId is provided
    if (systemId) {
      const system = await prisma.aISystem.findFirst({
        where: { id: systemId, userId: session.user.id },
      });
      if (!system) {
        return NextResponse.json(
          { error: "AI system not found" },
          { status: 404 }
        );
      }
    }

    const document = await prisma.complianceDocument.create({
      data: {
        userId: session.user.id,
        title,
        type,
        content,
        systemId,
        version: 1,
        status: "draft",
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "document_created",
      resource: `document:${document.id}`,
      details: { title, type, systemId },
    });

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error) {
    console.error("[DOCUMENTS] Failed to create document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
