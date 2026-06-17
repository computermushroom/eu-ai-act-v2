// Dev Mode API - Simulate Subscription
// POST: Set subscription tier (development only)
// GET: Get current simulated tier

import { NextRequest, NextResponse } from "next/server";
import { simulateSubscription, getCurrentSimulation, isDevMode } from "@/lib/dev-mode";
import { z } from "zod";

const tiers = ["free", "starter", "professional", "business", "enterprise"] as const;

const simulateSchema = z.object({
  tier: z.enum(tiers),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isDevMode()) {
    return NextResponse.json(
      { error: "Dev mode is only available in development environment" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = simulateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid tier. Must be one of: " + tiers.join(", ") },
        { status: 400 }
      );
    }

    const result = await simulateSubscription(parsed.data.tier);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      message: `Subscription simulated to: ${result.tier}`,
      tier: result.tier,
    });
  } catch (error) {
    console.error("[DEV API] Error:", error);
    return NextResponse.json(
      { error: "Failed to simulate subscription" },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  if (!isDevMode()) {
    return NextResponse.json(
      { error: "Dev mode is only available in development environment" },
      { status: 403 }
    );
  }

  const current = await getCurrentSimulation();
  return NextResponse.json({ devMode: true, subscription: current });
}