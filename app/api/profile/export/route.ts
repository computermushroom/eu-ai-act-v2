// GDPR Data Export API
// GET: Exports all user data as JSON (GDPR Article 20 - Right to data portability)
// Authenticated only

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * GET /api/profile/export
 * Exports all user data in machine-readable JSON format
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all user-related data
    const [user, subscription, auditLogs, accounts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id, deletedAt: null },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: {
          status: true,
          tier: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.auditLog.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: {
          action: true,
          resource: true,
          details: true,
          createdAt: true,
        },
      }),
      prisma.account.findMany({
        where: { userId: session.user.id },
        select: {
          provider: true,
          type: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      exportFormat: "JSON",
      legalBasis: "GDPR Article 20 - Right to data portability",
      user,
      subscription,
      auditLogs,
      connectedAccounts: accounts,
    };

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "user_exported_data",
      resource: "profile",
      details: { exportDate: exportData.exportDate },
    });

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="gdpr-export-${user.id}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("[EXPORT] Error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
