// Profile API
// GET: Retrieve current user's profile (authenticated)
// PATCH: Update current user's profile (authenticated)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * GET /api/profile
 * Returns authenticated user's profile with subscription
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id, deletedAt: null },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        subscription: user.subscription
          ? {
              status: user.subscription.status,
              tier: user.subscription.tier,
              currentPeriodEnd: user.subscription.currentPeriodEnd,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[PROFILE GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/**
 * Update profile validation schema
 */
const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
});

/**
 * PATCH /api/profile
 * Updates authenticated user's profile
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { name } = parsed.data;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name ?? undefined },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "user_updated_profile",
      resource: "profile",
      details: { name },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[PROFILE PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
