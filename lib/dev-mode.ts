// Dev Mode - Subscription Simulation
// Only active when NODE_ENV=development
// Allows local testing of all subscription tiers without real payment

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SUBSCRIPTION_TIERS = ["free", "starter", "professional", "business", "enterprise"] as const;
type SimTier = (typeof SUBSCRIPTION_TIERS)[number];

/**
 * Check if dev mode is active (only in development environment)
 */
export function isDevMode(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Simulate changing a user's subscription tier in dev mode
 * Updates the real database record so all guards and checks work
 */
export async function simulateSubscription(tier: SimTier): Promise<{ success: boolean; tier: string; error?: string }> {
  if (!isDevMode()) {
    return { success: false, tier: "", error: "Dev mode is only available in development environment" };
  }

  if (!SUBSCRIPTION_TIERS.includes(tier)) {
    return { success: false, tier: "", error: `Invalid tier. Must be one of: ${SUBSCRIPTION_TIERS.join(", ")}` };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, tier: "", error: "Authentication required" };
  }

  try {
    // Upsert subscription - create or update
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        tier,
        status: "active",
        gatewaySubscriptionId: `dev_sim_${tier}_${Date.now()}`,
        gatewayCustomerId: `dev_cus_${session.user.id}`,
        gatewayProductId: `dev_pro_${tier}`,
        gatewayOrderId: `dev_ord_${Date.now()}`,
        gateway: "creem",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      update: {
        tier,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        cancelledAt: null,
      },
    });

    // Log audit
    const { createAuditLog } = await import("@/lib/audit");
    await createAuditLog({
      userId: session.user.id,
      action: "subscription_updated",
      resource: "subscription",
      details: { simulated_tier: tier, source: "dev_mode" },
    });

    return { success: true, tier };
  } catch (error) {
    console.error("[DEV MODE] Failed to simulate subscription:", error);
    return { success: false, tier: "", error: String(error) };
  }
}

/**
 * Get current simulated subscription info
 */
export async function getCurrentSimulation(): Promise<{ tier: string; status: string } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { tier: true, status: true },
  });

  return sub ? { tier: sub.tier, status: sub.status } : null;
}