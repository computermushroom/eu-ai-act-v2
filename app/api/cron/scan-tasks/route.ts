// Cron Job: Process Pending Scan Tasks
// GET /api/cron/scan-tasks
// Protected by CRON_SECRET - only Vercel Cron can invoke
//
// This route:
// 1. Finds scan tasks where nextRunAt <= now AND status = 'pending' or 'scheduled'
// 2. Executes the scan (URL scan or shadow AI scan)
// 3. Updates task status, lastRunAt, nextRunAt
// 4. Creates alerts if issues found
// 5. Creates audit logs

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scanUrl } from "@/lib/url-scanner";
import { scanShadowAI } from "@/lib/shadow-ai-scanner";
import { createAuditLog } from "@/lib/audit";

/**
 * Calculate next run date based on frequency
 */
function calculateNextRun(frequency: string, from: Date): Date | null {
  const next = new Date(from);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      return next;
    case "weekly":
      next.setDate(next.getDate() + 7);
      return next;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      return next;
    case "once":
      return null;
    default:
      return null;
  }
}

/**
 * Execute a single scan task
 */
async function executeScanTask(task: {
  id: string;
  userId: string;
  name: string;
  targetUrl: string | null;
  scanType: string;
  frequency: string;
}) {
  const now = new Date();
  let result: Record<string, unknown> | null = null;
  let status: "completed" | "failed" = "completed";
  let errorMessage: string | null = null;
  let alertSeverity: "info" | "warning" | "critical" | null = null;
  let alertTitle: string | null = null;
  let alertMessage: string | null = null;

  try {
    if (task.scanType === "url-scan" && task.targetUrl) {
      const scanResult = await scanUrl(task.targetUrl);
      result = {
        type: "url-scan",
        url: scanResult.url,
        overallScore: scanResult.overallScore,
        checks: scanResult.checks,
        summary: scanResult.summary,
      };

      if (scanResult.overallScore < 30) {
        alertSeverity = "critical";
        alertTitle = `URL Scan Critical: ${task.name}`;
        alertMessage = `Automated scan for "${task.name}" scored ${scanResult.overallScore}/100. Immediate review required.`;
      } else if (scanResult.overallScore < 60) {
        alertSeverity = "warning";
        alertTitle = `URL Scan Warning: ${task.name}`;
        alertMessage = `Automated scan for "${task.name}" scored ${scanResult.overallScore}/100. Review recommended.`;
      }
    } else if (task.scanType === "shadow-ai") {
      const scanResult = await scanShadowAI(
        task.name,
        task.targetUrl ?? undefined
      );
      result = {
        type: "shadow-ai",
        riskScore: scanResult.riskScore,
        detectedTools: scanResult.detectedTools,
        summary: scanResult.summary,
        remediationSteps: scanResult.remediationSteps,
      };

      if (scanResult.riskScore >= 70) {
        alertSeverity = "critical";
        alertTitle = `Shadow AI Critical: ${task.name}`;
        alertMessage = `Automated shadow AI scan for "${task.name}" detected high risk (score: ${scanResult.riskScore}). ${scanResult.detectedTools.length} tool(s) found.`;
      } else if (scanResult.riskScore >= 40) {
        alertSeverity = "warning";
        alertTitle = `Shadow AI Warning: ${task.name}`;
        alertMessage = `Automated shadow AI scan for "${task.name}" detected moderate risk (score: ${scanResult.riskScore}). Review recommended.`;
      }
    } else if (task.scanType === "compliance-check") {
      // Compliance check is a placeholder for custom logic
      result = {
        type: "compliance-check",
        message: "Compliance check executed. No automated scoring available.",
      };
    } else {
      throw new Error(`Unsupported scan type: ${task.scanType}`);
    }
  } catch (execError) {
    status = "failed";
    errorMessage = execError instanceof Error ? execError.message : "Execution failed";
    console.error(`[CRON SCAN] Task ${task.id} failed:`, errorMessage);
  }

  // Update task
  const nextRunAt = calculateNextRun(task.frequency, now);
  await prisma.scanTask.update({
    where: { id: task.id },
    data: {
      status,
      lastRunAt: now,
      nextRunAt,
      results: result ? JSON.stringify(result) : undefined,
    },
  });

  // Create alert if needed
  if (alertSeverity && alertTitle && alertMessage) {
    try {
      await prisma.complianceAlert.create({
        data: {
          userId: task.userId,
          type: "scan-failure",
          severity: alertSeverity,
          title: alertTitle,
          message: alertMessage,
          articleRef: task.scanType === "url-scan" ? "Art.50" : "Art.5",
        },
      });
    } catch (alertError) {
      console.error(`[CRON SCAN] Failed to create alert for task ${task.id}:`, alertError);
    }
  }

  // Audit log
  await createAuditLog({
    userId: task.userId,
    action: "tool_shadow_ai_scan",
    resource: "cron-scan-tasks",
    details: {
      taskId: task.id,
      name: task.name,
      scanType: task.scanType,
      status,
      error: errorMessage,
      alertSeverity,
    },
  });

  return { taskId: task.id, status, error: errorMessage };
}

/**
 * GET /api/cron/scan-tasks
 * Vercel Cron entrypoint
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // CRON_SECRET protection
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    const expected = `Bearer ${cronSecret}`;
    if (!authHeader || authHeader !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    // Fallback: verify User-Agent contains Vercel or x-vercel-signature
    const userAgent = request.headers.get("user-agent") ?? "";
    const vercelSignature = request.headers.get("x-vercel-signature");
    if (!userAgent.includes("Vercel") && !vercelSignature) {
      console.warn("[CRON SCAN] Cron endpoint accessed without CRON_SECRET or Vercel headers");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  try {
    // Find pending/scheduled tasks where nextRunAt <= now
    const tasks = await prisma.scanTask.findMany({
      where: {
        status: { in: ["pending", "scheduled"] },
        nextRunAt: { lte: now },
      },
      orderBy: { createdAt: "asc" },
      take: 50, // Process in batches
    });

    const results: Array<{ taskId: string; status: string; error: string | null }> = [];

    for (const task of tasks) {
      // Mark as running to prevent duplicate execution
      await prisma.scanTask.update({
        where: { id: task.id },
        data: { status: "running" },
      });

      const execResult = await executeScanTask(task);
      results.push(execResult);
    }

    return NextResponse.json({
      success: true,
      processedAt: now.toISOString(),
      processedCount: tasks.length,
      results,
    });
  } catch (error) {
    console.error("[CRON SCAN] Fatal error:", error);
    const message = error instanceof Error ? error.message : "Cron execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
