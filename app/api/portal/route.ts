// White-Label Client Portal API
// Route: /api/portal
// Methods: GET (fetch config), POST (create/update), DELETE (remove)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * GET /api/portal
 * Returns the current user's portal config (or null if not created)
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const portal = await prisma.clientPortal.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true, data: portal });
  } catch (error) {
    console.error("[PORTAL] Failed to fetch portal config:", error);
    return NextResponse.json(
      { error: "Failed to fetch portal configuration" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal
 * Creates or updates a portal config
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      slug,
      logoUrl,
      primaryColor,
      accentColor,
      welcomeTitle,
      welcomeMessage,
      footerText,
      contactEmail,
      showPricing,
      showTraining,
      showDocuments,
      showTeam,
      showAlerts,
      showReports,
      isPublic,
    } = body as {
      name?: string;
      slug?: string;
      logoUrl?: string | null;
      primaryColor?: string | null;
      accentColor?: string | null;
      welcomeTitle?: string | null;
      welcomeMessage?: string | null;
      footerText?: string | null;
      contactEmail?: string | null;
      showPricing?: boolean;
      showTraining?: boolean;
      showDocuments?: boolean;
      showTeam?: boolean;
      showAlerts?: boolean;
      showReports?: boolean;
      isPublic?: boolean;
    };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Portal name is required" },
        { status: 400 }
      );
    }

    if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
      return NextResponse.json(
        { error: "Portal slug is required" },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase alphanumeric and hyphens only)
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(slug.trim())) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    const normalizedSlug = slug.trim().toLowerCase();

    // Check for slug uniqueness (excluding the current user's portal)
    const existingSlug = await prisma.clientPortal.findFirst({
      where: {
        slug: normalizedSlug,
        userId: { not: session.user.id },
      },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "This slug is already taken. Please choose a different one." },
        { status: 409 }
      );
    }

    // Upsert: create or update
    const portal = await prisma.clientPortal.upsert({
      where: { userId: session.user.id },
      update: {
        name: name.trim(),
        slug: normalizedSlug,
        logoUrl: logoUrl ?? null,
        primaryColor: primaryColor ?? null,
        accentColor: accentColor ?? null,
        welcomeTitle: welcomeTitle ?? null,
        welcomeMessage: welcomeMessage ?? null,
        footerText: footerText ?? null,
        contactEmail: contactEmail ?? null,
        showPricing: showPricing ?? false,
        showTraining: showTraining ?? true,
        showDocuments: showDocuments ?? true,
        showTeam: showTeam ?? true,
        showAlerts: showAlerts ?? true,
        showReports: showReports ?? true,
        isPublic: isPublic ?? false,
      },
      create: {
        userId: session.user.id,
        name: name.trim(),
        slug: normalizedSlug,
        logoUrl: logoUrl ?? null,
        primaryColor: primaryColor ?? null,
        accentColor: accentColor ?? null,
        welcomeTitle: welcomeTitle ?? null,
        welcomeMessage: welcomeMessage ?? null,
        footerText: footerText ?? null,
        contactEmail: contactEmail ?? null,
        showPricing: showPricing ?? false,
        showTraining: showTraining ?? true,
        showDocuments: showDocuments ?? true,
        showTeam: showTeam ?? true,
        showAlerts: showAlerts ?? true,
        showReports: showReports ?? true,
        isPublic: isPublic ?? false,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "portal",
      details: { portalId: portal.id, name: portal.name, slug: portal.slug },
    });

    return NextResponse.json({ success: true, data: portal });
  } catch (error) {
    console.error("[PORTAL] Failed to save portal config:", error);
    return NextResponse.json(
      { error: "Failed to save portal configuration" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portal
 * Deletes the portal config and all associated clients
 */
export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.clientPortal.findUnique({
      where: { userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "No portal configuration found" },
        { status: 404 }
      );
    }

    await prisma.clientPortal.delete({
      where: { userId: session.user.id },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_updated",
      resource: "portal",
      details: { portalId: existing.id, action: "deleted" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PORTAL] Failed to delete portal config:", error);
    return NextResponse.json(
      { error: "Failed to delete portal configuration" },
      { status: 500 }
    );
  }
}
