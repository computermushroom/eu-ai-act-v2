// Scan Tasks API
// GET: List user's scan tasks
// POST: Create a new scan task
// DELETE: Cancel / delete a scan task

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { requireTier } from "@/lib/subscription-guard";

/**
 * GET /api/scan-tasks
 * List all scan tasks for the authenticated user
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier('business')({} as NextRequest);
  if (tierCheck) return tierCheck;

  try {
    const tasks = await prisma.scanTask.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("[SCAN TASKS GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scan-tasks
 * Create a new automated scan task
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier('business')(request);
  if (tierCheck) return tierCheck;

  try {
    const body = await request.json();
    const { name, targetUrl, scanType, frequency } = body as {
      name?: string;
      targetUrl?: string;
      scanType?: string;
      frequency?: string;
    };

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Task name is required" },
        { status: 400 }
      );
    }

    if (!scanType || !scanType.trim()) {
      return NextResponse.json(
        { error: "Scan type is required" },
        { status: 400 }
      );
    }

    const validFrequencies = ["once", "daily", "weekly", "monthly"];
    const taskFrequency = validFrequencies.includes(frequency ?? "")
      ? frequency!
      : "once";

    // Calculate next run time
    const now = new Date();
    let nextRunAt: Date | null = null;

    if (taskFrequency === "daily") {
      nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (taskFrequency === "weekly") {
      nextRunAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (taskFrequency === "monthly") {
      nextRunAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    // "once" tasks have no nextRunAt until manually triggered

    const task = await prisma.scanTask.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        targetUrl: targetUrl?.trim() || null,
        scanType: scanType.trim(),
        frequency: taskFrequency,
        status: "pending",
        nextRunAt,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "scan-tasks",
      details: {
        taskId: task.id,
        name: task.name,
        scanType: task.scanType,
        frequency: task.frequency,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("[SCAN TASKS POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create scan task" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scan-tasks?id=xxx
 * Delete / cancel a scan task
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier('business')(request);
  if (tierCheck) return tierCheck;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.scanTask.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    await prisma.scanTask.delete({
      where: { id },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "scan-tasks",
      details: {
        taskId: id,
        name: existing.name,
        action: "deleted",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SCAN TASKS DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete scan task" },
      { status: 500 }
    );
  }
}
