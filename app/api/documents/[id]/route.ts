// Compliance Document Individual Operations API
// Route: /api/documents/[id]
// Methods: GET (detail), PATCH (update), DELETE (soft delete)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Verify ownership of a document
 */
async function verifyOwnership(userId: string, documentId: string) {
  const document = await prisma.complianceDocument.findFirst({
    where: { id: documentId, userId },
  });
  return document;
}

/**
 * GET /api/documents/[id]
 * Get a single compliance document
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const document = await prisma.complianceDocument.findFirst({
      where: { id, userId: session.user.id },
      include: {
        system: {
          select: { id: true, name: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error("[DOCUMENT] Failed to fetch document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/[id]
 * Update a compliance document (auto-increments version)
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
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Build update data dynamically
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (title.length === 0) {
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 }
        );
      }
      updateData.title = title;
    }

    if (body.content !== undefined) {
      updateData.content = String(body.content);
    }

    if (body.type !== undefined) {
      updateData.type = String(body.type).trim();
    }

    if (body.status !== undefined) {
      const status = String(body.status).trim();
      const validStatuses = ["draft", "review", "approved", "archived"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (body.systemId !== undefined) {
      const systemId = body.systemId || null;
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
      updateData.systemId = systemId;
    }

    // Auto-increment version on any content change
    const hasContentChange =
      updateData.title !== undefined ||
      updateData.content !== undefined ||
      updateData.type !== undefined;

    if (hasContentChange) {
      updateData.version = { increment: 1 };
    }

    const document = await prisma.complianceDocument.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "document_updated",
      resource: `document:${id}`,
      details: { updatedFields: Object.keys(updateData), newVersion: document.version },
    });

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error("[DOCUMENT] Failed to update document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id]
 * Soft delete a compliance document by setting status to "archived"
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
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const document = await prisma.complianceDocument.update({
      where: { id },
      data: {
        status: "archived",
        title: `${existing.title} (deleted)`,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "document_updated",
      resource: `document:${id}`,
      details: { action: "soft_delete", previousTitle: existing.title },
    });

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error("[DOCUMENT] Failed to delete document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
