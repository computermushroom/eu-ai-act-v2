// Subscription Checkout API
// POST: Creates a checkout URL for the selected tier via the active payment gateway
// The active gateway is read from GlobalConfig table (runtime, no restart needed)
// Default: Paddle (primary); Fallback: Creem (backup, admin-switchable)
// Rate-limited to 10 requests/minute per IP

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createCheckout } from "@/lib/payment";
import type { PaymentTier, BillingCycle } from "@/lib/payment/types";
import { createAuditLog } from "@/lib/audit";
import { createRateLimiter } from "@/lib/rate-limit";

const checkoutSchema = z.object({
  tier: z.enum(["starter", "professional", "business", "enterprise"]),
  billingCycle: z.enum(["monthly", "yearly"]).optional().default("monthly"),
});

const limiter = createRateLimiter("auth");

/**
 * POST /api/subscription/checkout
 * Creates a checkout URL for the selected subscription tier
 * Uses the globally configured active payment gateway
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { tier, billingCycle } = parsed.data;

    const redirectUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard`;

    // Create checkout via PaymentContext (reads active gateway from GlobalConfig)
    const checkoutResult = await createCheckout({
      tier: tier as PaymentTier,
      billingCycle: billingCycle as BillingCycle,
      userEmail: session.user.email,
      userId: session.user.id,
      redirectUrl,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "subscription_created",
      resource: "subscription",
      details: { tier, billingCycle, checkoutUrl: checkoutResult.checkoutUrl },
    });

    return NextResponse.json({ checkoutUrl: checkoutResult.checkoutUrl });
  } catch (error) {
    console.error("[CHECKOUT API] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
