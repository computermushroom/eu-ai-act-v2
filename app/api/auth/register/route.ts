// User Registration API
// Creates a new user with bcrypt-hashed password
// GDPR compliant: creates free subscription, minimal data collection
// Security: rate-limited to 10 requests/minute per IP

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Registration input validation schema
 */
const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});

const limiter = createRateLimiter("auth");

/**
 * POST /api/auth/register
 * Creates a new user account with hashed password
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
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json(
        { error: errors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if email already exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        deletedAt: null,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (cost factor 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and free subscription in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
        },
      });

      // Create free tier subscription
      await tx.subscription.create({
        data: {
          userId: newUser.id,
          status: "inactive",
          tier: "free",
        },
      });

      return newUser;
    });

    // Log user registration audit event
    await createAuditLog({
      userId: user.id,
      action: "user_registered",
      resource: "auth",
      details: { email: user.email, method: "credentials" },
    });

    // Return success (do not expose password)
    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
