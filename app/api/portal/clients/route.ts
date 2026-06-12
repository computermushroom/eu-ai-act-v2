// White-Label Portal Clients API
// Route: /api/portal/clients
// Methods: GET (list), POST (add), PATCH (update), DELETE (remove)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * GET /api/portal/clients?portalId=xxx
 * Lists all clients for the user's portal
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const portalId = searchParams.get("portalId");

    if (!portalId) {
      return NextResponse.json(
        { error: "portalId is required" },
        { status: 400 }
      );
    }

    // Verify the portal belongs to the current user
    const portal = await prisma.clientPortal.findUnique({
      where: { id: portalId },
    });

    if (!portal || portal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Portal not found" },
        { status: 404 }
      );
    }

    const clients = await prisma.client.findMany({
      where: { portalId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    console.error("[PORTAL/CLIENTS] Failed to list clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/clients
 * Adds a new client to the portal
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { portalId, name, email, company, industry } = body as {
      portalId?: string;
      name?: string;
      email?: string;
      company?: string | null;
      industry?: string | null;
    };

    if (!portalId || typeof portalId !== "string") {
      return NextResponse.json(
        { error: "portalId is required" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json(
        { error: "Client email is required" },
        { status: 400 }
      );
    }

    // Verify the portal belongs to the current user
    const portal = await prisma.clientPortal.findUnique({
      where: { id: portalId },
    });

    if (!portal || portal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Portal not found" },
        { status: 404 }
      );
    }

    // Check for duplicate email within the same portal
    const existingClient = await prisma.client.findFirst({
      where: {
        portalId,
        email: { equals: email.trim(), mode: "insensitive" },
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "A client with this email already exists in this portal" },
        { status: 409 }
      );
    }

    const client = await prisma.client.create({
      data: {
        portalId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company?.trim() ?? null,
        industry: industry?.trim() ?? null,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "portal_client",
      details: { portalId, clientId: client.id, name: client.name, email: client.email },
    });

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    console.error("[PORTAL/CLIENTS] Failed to add client:", error);
    return NextResponse.json(
      { error: "Failed to add client" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/portal/clients
 * Updates a client
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, email, company, industry, status } = body as {
      id?: string;
      name?: string;
      email?: string;
      company?: string | null;
      industry?: string | null;
      status?: string;
    };

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Validate status if provided
    const VALID_STATUSES = ["active", "inactive", "suspended"];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: active, inactive, suspended" },
        { status: 400 }
      );
    }

    // Find the client and verify ownership through the portal
    const client = await prisma.client.findUnique({
      where: { id },
      include: { portal: true },
    });

    if (!client || client.portal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Check for email uniqueness if email is being updated
    if (email && email.trim() !== client.email) {
      const emailConflict = await prisma.client.findFirst({
        where: {
          portalId: client.portalId,
          email: { equals: email.trim(), mode: "insensitive" },
          id: { not: id },
        },
      });

      if (emailConflict) {
        return NextResponse.json(
          { error: "A client with this email already exists in this portal" },
          { status: 409 }
        );
      }
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(email ? { email: email.trim().toLowerCase() } : {}),
        ...(company !== undefined ? { company: company?.trim() ?? null } : {}),
        ...(industry !== undefined ? { industry: industry?.trim() ?? null } : {}),
        ...(status ? { status } : {}),
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "portal_client",
      details: { clientId: id, changes: { name, email, company, industry, status } },
    });

    return NextResponse.json({ success: true, data: updatedClient });
  } catch (error) {
    console.error("[PORTAL/CLIENTS] Failed to update client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portal/clients?id=xxx
 * Removes a client from the portal
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Find the client and verify ownership through the portal
    const client = await prisma.client.findUnique({
      where: { id },
      include: { portal: true },
    });

    if (!client || client.portal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    await prisma.client.delete({
      where: { id },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "portal_client",
      details: { clientId: id, action: "deleted", name: client.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PORTAL/CLIENTS] Failed to remove client:", error);
    return NextResponse.json(
      { error: "Failed to remove client" },
      { status: 500 }
    );
  }
}
