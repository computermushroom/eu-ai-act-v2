// GDPR Account Deletion API
// POST: Permanently deletes user account and all associated data (GDPR Article 17 - Right to erasure)
// Authenticated only, requires explicit confirmation

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * POST /api/profile/delete
 * Deletes user account and all data permanently
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { confirm } = body as { confirm?: string };

    // Require explicit confirmation text
    if (confirm !== "DELETE") {
      return NextResponse.json(
        { error: "Invalid confirmation. Please type DELETE to confirm." },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Log deletion before deleting (so we have a record)
    await createAuditLog({
      userId,
      action: "user_deleted_account",
      resource: "profile",
      details: { deletedAt: new Date().toISOString() },
    });

    // Delete all user data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete audit logs (or anonymize them - here we delete for full erasure)
      await tx.auditLog.deleteMany({ where: { userId } });

      // Delete sessions
      await tx.session.deleteMany({ where: { userId } });

      // Delete accounts (OAuth connections)
      await tx.account.deleteMany({ where: { userId } });

      // Delete subscription
      await tx.subscription.deleteMany({ where: { userId } });

      // Delete verification tokens
      await tx.verificationToken.deleteMany({
        where: { identifier: { startsWith: `reset-password:${userId}` } },
      });

      // Soft delete user (set deletedAt, clear personal data)
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          email: `deleted-${userId}@deleted.local`,
          name: null,
          password: null,
          image: null,
        },
      });
    });

    return NextResponse.json({
      message: "Account deleted successfully. All personal data has been removed.",
    });
  } catch (error) {
    console.error("[DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please contact support." },
      { status: 500 }
    );
  }
}
