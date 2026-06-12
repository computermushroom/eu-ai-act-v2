// Dashboard Data API
// GET: Returns real dashboard statistics for the authenticated user

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * URL scan limits per subscription tier
 */
const TIER_URL_LIMIT: Record<string, number | null> = {
  free: 1,
  starter: 5,
  professional: 20,
  business: 100,
  enterprise: null, // unlimited
};

/**
 * GET /api/dashboard
 * Returns aggregated dashboard data for the current user
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Calculate month boundaries (current calendar month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  try {
    // Fetch subscription tier
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { tier: true },
    });
    const tier = subscription?.tier ?? "free";

    // totalAssessments: tool_* actions this month
    const totalAssessments = await prisma.auditLog.count({
      where: {
        userId,
        action: {
          in: [
            "tool_risk_assessment",
            "tool_prohibited_practices",
            "tool_transparency_check",
            "tool_lifecycle_management",
            "tool_data_governance",
            "tool_qms_checklist",
            "tool_fria_assessment",
            "tool_shadow_ai_scan",
            "tool_specialized_checks",
          ] as const,
        },
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    });

    // complianceScore: average of latest ScanResult scores for user's AI systems
    const aiSystems = await prisma.aISystem.findMany({
      where: { userId },
      select: { id: true },
    });
    const systemIds = aiSystems.map((s) => s.id);

    let complianceScore = 0;
    if (systemIds.length > 0) {
      // Get the latest scan result per system using Prisma API (no raw SQL)
      const latestScores: number[] = [];
      for (const sid of systemIds) {
        const latest = await prisma.scanResult.findFirst({
          where: { systemId: sid },
          orderBy: { createdAt: "desc" },
          select: { score: true },
        });
        if (latest) {
          latestScores.push(latest.score);
        }
      }
      if (latestScores.length > 0) {
        const sum = latestScores.reduce((acc, score) => acc + score, 0);
        complianceScore = Math.round(sum / latestScores.length);
      }
    }

    // reportsGenerated: auditLogs with report_generated this month
    const reportsGenerated = await prisma.auditLog.count({
      where: {
        userId,
        action: "report_generated",
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    });

    // urlScansRemaining: based on tier limit minus used this month
    const urlScansUsed = await prisma.auditLog.count({
      where: {
        userId,
        action: "tool_risk_assessment",
        resource: "url-scan",
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    });

    const tierLimit = TIER_URL_LIMIT[tier] ?? TIER_URL_LIMIT.free ?? 1;
    const urlScansRemaining =
      tierLimit === null ? null : Math.max(0, tierLimit - urlScansUsed);

    // recentActivity: latest 5 auditLogs
    const recentActivity = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        action: true,
        resource: true,
        createdAt: true,
      },
    });

    // aiSystemsCount
    const aiSystemsCount = await prisma.aISystem.count({
      where: { userId },
    });

    // alertsCount: unread alerts
    const alertsCount = await prisma.complianceAlert.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({
      totalAssessments,
      complianceScore,
      reportsGenerated,
      urlScansRemaining,
      recentActivity,
      aiSystemsCount,
      alertsCount,
      tier,
    });
  } catch (error) {
    console.error("[DASHBOARD API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
