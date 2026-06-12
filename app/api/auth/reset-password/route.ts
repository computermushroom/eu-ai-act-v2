// Password Reset Request API
// POST: Sends a password reset email with a verification token
// Uses NextAuth VerificationToken model + nodemailer
// Security: Always returns success to prevent email enumeration
// Rate-limited to 5 requests/minute per IP

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/email";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Reset request validation schema
 */
const resetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const limiter = createRateLimiter("auth");

/**
 * POST /api/auth/reset-password
 * Sends password reset email if account exists
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit check
  const rateLimit = limiter(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = resetRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Find user (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        deletedAt: null,
      },
    });

    if (user && user.password) {
      // Generate a secure random token
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

      // Store token in VerificationToken table
      await prisma.verificationToken.create({
        data: {
          identifier: `reset-password:${user.id}`,
          token,
          expires,
        },
      });

      // Send reset email (fire and forget - don't block response)
      const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
      sendPasswordResetEmail(user.email, resetUrl).catch((emailError) => {
        console.error("[RESET] Failed to send reset email:", emailError);
      });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: "settings_updated",
        resource: "auth",
        details: { type: "password_reset_requested" },
      });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message:
        "If an account exists with this email, you will receive reset instructions.",
    });
  } catch (error) {
    console.error("[RESET] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
