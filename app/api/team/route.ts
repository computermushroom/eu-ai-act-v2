// Team Collaboration API
// Route: /api/team
// Methods: GET (list), POST (invite), PATCH (update role), DELETE (remove)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { requireTier } from "@/lib/subscription-guard";

const VALID_ROLES = ["owner", "admin", "member", "viewer"] as const;

/**
 * GET /api/team
 * List all team members for the current user's team
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier('enterprise')({} as NextRequest);
  if (tierCheck) return tierCheck;

  try {
    // Use user's own ID as team identifier (each user is their own team owner initially)
    const teamId = session.user.id;

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      orderBy: { joinedAt: "desc" },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error("[TEAM] Failed to list members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team
 * Invite a new team member by email
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier('enterprise')(request);
  if (tierCheck) return tierCheck;

  try {
    const body = await request.json();
    const { email, role } = body as { email?: string; role?: string };

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedRole = (role ?? "member").trim().toLowerCase();
    if (!VALID_ROLES.includes(normalizedRole as (typeof VALID_ROLES)[number])) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const teamId = session.user.id;

    // Find user by email
    const invitedUser = await prisma.user.findFirst({
      where: {
        email: { equals: email.trim(), mode: "insensitive" },
        deletedAt: null,
      },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "User not found. They must have an account first." },
        { status: 404 }
      );
    }

    // Prevent self-invite
    if (invitedUser.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot invite yourself" },
        { status: 400 }
      );
    }

    // Check if already a member
    const existing = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: invitedUser.id,
          teamId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 409 }
      );
    }

    const member = await prisma.teamMember.create({
      data: {
        userId: invitedUser.id,
        teamId,
        role: normalizedRole,
        permissions: [],
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "team",
      details: { invitedUserId: invitedUser.id, email: invitedUser.email, role: normalizedRole },
    });

    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error) {
    console.error("[TEAM] Failed to invite member:", error);
    return NextResponse.json(
      { error: "Failed to invite team member" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/team
 * Update a team member's role
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier('enterprise')(request);
  if (tierCheck) return tierCheck;

  try {
    const body = await request.json();
    const { userId, role } = body as { userId?: string; role?: string };

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const normalizedRole = (role ?? "member").trim().toLowerCase();
    if (!VALID_ROLES.includes(normalizedRole as (typeof VALID_ROLES)[number])) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const teamId = session.user.id;

    const existing = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    const member = await prisma.teamMember.update({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      data: { role: normalizedRole },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "team",
      details: { updatedUserId: userId, newRole: normalizedRole },
    });

    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error("[TEAM] Failed to update member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team?userId=xxx
 * Remove a team member
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier('enterprise')(request);
  if (tierCheck) return tierCheck;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const teamId = session.user.id;

    const existing = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "team",
      details: { removedUserId: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TEAM] Failed to remove member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
