// Audit Log API
// GET: Retrieve user's audit logs (authenticated)
// POST: Create audit log entry (internal use)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAuditLog, getUserAuditLogs } from "@/lib/audit";
import type { AuditAction } from "@prisma/client";

/**
 * GET /api/audit
 * Returns authenticated user's audit logs with pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

    const { logs, total } = await getUserAuditLogs(session.user.id, limit, offset);

    return NextResponse.json({ logs, total, limit, offset });
  } catch (error) {
    console.error("[AUDIT API] Failed to fetch audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit
 * Creates an audit log entry for the authenticated user
 * Body: { action: AuditAction, resource?: string, details?: object }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action, resource, details } = body as {
      action: AuditAction;
      resource?: string;
      details?: Record<string, unknown>;
    };

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    await createAuditLog({
      userId: session.user.id,
      action,
      resource,
      details,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[AUDIT API] Failed to create audit log:", error);
    return NextResponse.json(
      { error: "Failed to create audit log" },
      { status: 500 }
    );
  }
}
