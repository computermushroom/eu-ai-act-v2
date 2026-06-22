// Admin Payment Gateway Configuration API
// GET:  Returns current active payment gateway and available options
// POST: Updates the active payment gateway (admin only)
//
// Security: Only users listed in ADMIN_EMAILS env var can access this endpoint
// Effect: Changes take effect immediately (reads from GlobalConfig table, no restart)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import {
  getActiveProvider,
  setActiveProvider,
} from "@/lib/payment";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import type { PaymentGatewayType } from "@/lib/payment/types";

/** Validation schema for POST body */
const updateGatewaySchema = z.object({
  gateway: z.enum(["paddle", "creem"]),
});

/**
 * GET /api/admin/config/payment-gateway
 * Returns current active gateway and recent 7-day order stats per provider
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse> {
  const guard = await requireAdmin(_request);
  if (guard) return guard;

  try {
    const activeProvider = await getActiveProvider();

    // Fetch recent 7-day subscription stats per payment provider
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = await prisma.subscription.groupBy({
      by: ["paymentProvider"],
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { in: ["active", "past_due"] },
      },
      _count: {
        id: true,
      },
    });

    const providerStats = stats.map((s) => ({
      provider: s.paymentProvider,
      count: s._count.id,
    }));

    return NextResponse.json({
      activeGateway: activeProvider,
      availableGateways: ["paddle", "creem"],
      recentStats: providerStats,
    });
  } catch (error) {
    console.error("[ADMIN CONFIG GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment gateway config" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/config/payment-gateway
 * Updates the active payment gateway
 * Body: { gateway: "paddle" | "creem" }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  const guard = await requireAdmin(request);
  if (guard) return guard;

  try {
    const body = await request.json();
    const parsed = updateGatewaySchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const previousProvider = await getActiveProvider();
    const newGateway: PaymentGatewayType = parsed.data.gateway;

    // Update the active provider in GlobalConfig table
    await setActiveProvider(newGateway);

    // Log the configuration change for audit trail
    const session = await (await import("@/lib/auth")).auth();
    await createAuditLog({
      userId: session?.user?.id ?? "system",
      action: "settings_updated",
      resource: "payment-gateway-config",
      details: {
        previousProvider,
        newProvider: newGateway,
        changedBy: session?.user?.email ?? "unknown",
      },
    });

    console.log(
      `[ADMIN CONFIG] Payment gateway changed: ${previousProvider} → ${newGateway} ` +
      `by ${session?.user?.email ?? "unknown"}`
    );

    return NextResponse.json({
      success: true,
      message: `Payment gateway updated to ${newGateway}`,
      activeGateway: newGateway,
      previousGateway: previousProvider,
    });
  } catch (error) {
    console.error("[ADMIN CONFIG POST] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update payment gateway";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
