// Compliance Alerts API
// GET: List user's alerts with unread count
// PATCH: Mark alert(s) as read
// DELETE: Dismiss (delete) an alert

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * GET /api/alerts
 * Returns authenticated user's compliance alerts with unread count
 * Query params:
 *   - limit (default 50, max 100)
 *   - offset (default 0)
 *   - unreadOnly (default false)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  try {
    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [alerts, total, unreadCount] = await Promise.all([
      prisma.complianceAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.complianceAlert.count({ where: { userId } }),
      prisma.complianceAlert.count({ where: { userId, isRead: false } }),
    ]);

    return NextResponse.json({
      alerts,
      total,
      unreadCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[ALERTS API] Failed to fetch alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/alerts
 * Mark alert(s) as read
 * Body:
 *   - id: string (single alert id) OR
 *   - all: true (mark all as read)
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { id, all } = body as { id?: string; all?: boolean };

    if (all === true) {
      // Mark all unread alerts as read
      const result = await prisma.complianceAlert.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      await createAuditLog({
        userId,
        action: "alert_resolved",
        resource: "alerts",
        details: { markedAllRead: true, count: result.count },
      });

      return NextResponse.json({
        success: true,
        markedCount: result.count,
      });
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Alert id is required, or set all: true" },
        { status: 400 }
      );
    }

    // Verify the alert belongs to the current user
    const alert = await prisma.complianceAlert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.complianceAlert.update({
      where: { id },
      data: { isRead: true },
    });

    await createAuditLog({
      userId,
      action: "alert_resolved",
      resource: `alert:${id}`,
      details: { alertType: updated.type, severity: updated.severity },
    });

    return NextResponse.json({ success: true, alert: updated });
  } catch (error) {
    console.error("[ALERTS API] Failed to update alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts?id={alertId}
 * Dismiss (delete) a single alert
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Alert id is required" },
      { status: 400 }
    );
  }

  try {
    // Verify ownership before deleting
    const alert = await prisma.complianceAlert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    await prisma.complianceAlert.delete({ where: { id } });

    await createAuditLog({
      userId,
      action: "alert_resolved",
      resource: `alert:${id}`,
      details: { dismissed: true, alertType: alert.type, severity: alert.severity },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ALERTS API] Failed to delete alert:", error);
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}
