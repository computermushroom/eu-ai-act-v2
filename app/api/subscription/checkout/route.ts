// Subscription Checkout API
// POST: Creates a Lemon Squeezy checkout URL for the selected tier
// Rate-limited to 10 requests/minute per IP

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createSubscriptionCheckout } from "@/lib/lemonsqueezy";
import { createAuditLog } from "@/lib/audit";
import { createRateLimiter } from "@/lib/rate-limit";

const checkoutSchema = z.object({
  tier: z.enum(["starter", "professional", "business", "enterprise"]),
});

const limiter = createRateLimiter("auth");

/**
 * POST /api/subscription/checkout
 * Creates a checkout URL for the selected subscription tier
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

    const { tier } = parsed.data;

    const redirectUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard`;

    const checkoutUrl = await createSubscriptionCheckout(
      tier,
      session.user.email,
      redirectUrl
    );

    await createAuditLog({
      userId: session.user.id,
      action: "subscription_created",
      resource: "subscription",
      details: { tier, checkoutUrl },
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("[CHECKOUT API] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
