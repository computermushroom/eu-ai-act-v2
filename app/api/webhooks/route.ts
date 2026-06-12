// Webhook Configuration API
// Route: /api/webhooks
// Methods: GET (list), POST (create), PATCH (toggle active), DELETE (remove)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const VALID_EVENTS = [
  "compliance.alert",
  "scan.completed",
  "document.updated",
  "report.generated",
] as const;

/**
 * Generate a random secret for webhook HMAC verification
 */
function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `whsec_${result}`;
}

/**
 * GET /api/webhooks
 * List all webhook configs for the authenticated user
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const webhooks = await prisma.webhookConfig.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: webhooks });
  } catch (error) {
    console.error("[WEBHOOKS] Failed to list webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * Create a new webhook configuration
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, url, events } = body as {
      name?: string;
      url?: string;
      events?: string[];
    };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Basic URL validation
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "URL must start with http:// or https://" },
        { status: 400 }
      );
    }

    // Validate events
    const eventList = Array.isArray(events) ? events : [];
    const validEventList = eventList.filter((e) =>
      VALID_EVENTS.includes(e as (typeof VALID_EVENTS)[number])
    );

    const webhook = await prisma.webhookConfig.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        url: normalizedUrl,
        secret: generateSecret(),
        events: validEventList,
        isActive: true,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "webhooks",
      details: { webhookId: webhook.id, name: webhook.name, events: validEventList },
    });

    return NextResponse.json({ success: true, data: webhook }, { status: 201 });
  } catch (error) {
    console.error("[WEBHOOKS] Failed to create webhook:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/webhooks
 * Toggle webhook active status
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, isActive } = body as { id?: string; isActive?: boolean };

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Webhook ID is required" },
        { status: 400 }
      );
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.webhookConfig.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    const webhook = await prisma.webhookConfig.update({
      where: { id },
      data: { isActive },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "webhooks",
      details: { webhookId: id, isActive },
    });

    return NextResponse.json({ success: true, data: webhook });
  } catch (error) {
    console.error("[WEBHOOKS] Failed to update webhook:", error);
    return NextResponse.json(
      { error: "Failed to update webhook" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks?id=xxx
 * Remove a webhook configuration
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
        { error: "Webhook ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.webhookConfig.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    await prisma.webhookConfig.delete({
      where: { id },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "webhooks",
      details: { webhookId: id, action: "deleted" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WEBHOOKS] Failed to delete webhook:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    );
  }
}
