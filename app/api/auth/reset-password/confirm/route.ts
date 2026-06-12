// Password Reset Confirm API
// POST: Verifies token and updates password
// Uses NextAuth VerificationToken model

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * Reset confirm validation schema
 */
const resetConfirmSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});

/**
 * POST /api/auth/reset-password/confirm
 * Verifies token and sets new password
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = resetConfirmSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { token, password } = parsed.data;

    // Find valid token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    // Check expiration
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Extract user ID from identifier (format: "reset-password:userId")
    const userId = verificationToken.identifier.replace("reset-password:", "");

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and delete token in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Delete all reset tokens for this user (invalidate all pending resets)
      await tx.verificationToken.deleteMany({
        where: {
          identifier: { startsWith: `reset-password:${userId}` },
        },
      });

      // Delete all sessions (force re-login on all devices)
      await tx.session.deleteMany({
        where: { userId },
      });
    });

    // Audit log
    await createAuditLog({
      userId,
      action: "settings_updated",
      resource: "auth",
      details: { type: "password_reset_completed" },
    });

    return NextResponse.json({
      message: "Password has been reset successfully. Please sign in.",
    });
  } catch (error) {
    console.error("[RESET CONFIRM] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
