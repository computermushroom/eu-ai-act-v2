// Subscription Guard Utility
// Server-side subscription tier enforcement for protected API routes
// Validates user subscription status, tier level, and usage limits

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================================
// Tier Level Mapping
// ============================================================

/**
 * Maps subscription tier names to numeric levels for comparison.
 * Higher number = higher tier.
 */
export function getTierLevel(tier: string): number {
  const levels: Record<string, number> = {
    free: 0,
    starter: 1,
    professional: 2,
    business: 3,
    enterprise: 4,
  };
  return levels[tier] ?? -1;
}

// ============================================================
// Tier Limits Configuration
// ============================================================

export const TIER_LIMITS = {
  free: {
    maxAiSystems: 2,
    maxScansPerMonth: 3,
    maxDocuments: 5,
    maxTeamMembers: 1,
  },
  starter: {
    maxAiSystems: 5,
    maxScansPerMonth: 10,
    maxDocuments: 20,
    maxTeamMembers: 3,
  },
  professional: {
    maxAiSystems: 15,
    maxScansPerMonth: 30,
    maxDocuments: 100,
    maxTeamMembers: 10,
  },
  business: {
    maxAiSystems: 50,
    maxScansPerMonth: 100,
    maxDocuments: 500,
    maxTeamMembers: 25,
  },
  enterprise: {
    maxAiSystems: Infinity,
    maxScansPerMonth: Infinity,
    maxDocuments: Infinity,
    maxTeamMembers: Infinity,
  },
} as const;

export type TierName = keyof typeof TIER_LIMITS;
export type LimitType = keyof typeof TIER_LIMITS.free;

// ============================================================
// Subscription Guard Middleware
// ============================================================

/**
 * Creates a middleware function that enforces a minimum subscription tier.
 *
 * Usage in API route handlers:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const guard = await requireTier("professional")(request);
 *   if (guard) return guard;
 *   // ... proceed with handler logic
 * }
 * ```
 *
 * @param minTier - The minimum required subscription tier
 * @returns A middleware function that returns a NextResponse on failure, or null on success
 */
export function requireTier(minTier: string) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // 1. Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Fetch the user's subscription from the database
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    // If no subscription record exists, treat as free tier with inactive status
    const userTier = subscription?.tier ?? "free";
    const subscriptionStatus = subscription?.status ?? "inactive";

    // 3. Handle edge cases: expired, cancelled, or otherwise inactive subscriptions
    if (subscriptionStatus !== "active") {
      // Allow free-tier access even if subscription is inactive
      // (new users get a free subscription with status "inactive")
      if (userTier !== "free") {
        return NextResponse.json(
          {
            error: "Subscription is not active",
            requiredTier: minTier,
            currentTier: userTier,
            subscriptionStatus,
          },
          { status: 403 }
        );
      }
    }

    // 4. Compare tier levels
    const requiredLevel = getTierLevel(minTier);
    const currentLevel = getTierLevel(userTier);

    if (currentLevel < requiredLevel) {
      return NextResponse.json(
        {
          error: "Upgrade required",
          requiredTier: minTier,
          currentTier: userTier,
        },
        { status: 403 }
      );
    }

    // 5. Tier is sufficient - pass through
    return null;
  };
}

// ============================================================
// Usage Limit Checker
// ============================================================

/**
 * Checks the current month's usage for a given limit type against the user's tier limits.
 *
 * Supported limitType values:
 * - "maxAiSystems"     - counts AISystem records for the user
 * - "maxScansPerMonth"  - counts ScanTask records completed this month
 * - "maxDocuments"      - counts ComplianceDocument records for the user
 * - "maxTeamMembers"    - counts TeamMember records for the user
 *
 * @param userId   - The user's ID
 * @param limitType - The type of limit to check (must be a key of TIER_LIMITS)
 * @returns An object with:
 *     - allowed: boolean (whether the user is within limits)
 *     - current: number (current usage count)
 *     - limit: number (the tier's limit for this type)
 *   - tier: string (the user's current tier)
 */
export async function checkUsageLimit(
  userId: string,
  limitType: string
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  tier: string;
}> {
  // 1. Get the user's subscription tier
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const tier = subscription?.tier ?? "free";
  const tierLimits = TIER_LIMITS[tier as TierName] ?? TIER_LIMITS.free;
  const limit = tierLimits[limitType as LimitType] ?? 0;

  // Enterprise tier has no limits
  if (limit === Infinity) {
    return { allowed: true, current: 0, limit: Infinity, tier };
  }

  // 2. Calculate current usage based on limit type
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  let current = 0;

  switch (limitType) {
    case "maxAiSystems": {
      const count = await prisma.aISystem.count({
        where: { userId },
      });
      current = count;
      break;
    }

    case "maxScansPerMonth": {
      const count = await prisma.scanTask.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
      });
      current = count;
      break;
    }

    case "maxDocuments": {
      const count = await prisma.complianceDocument.count({
        where: { userId },
      });
      current = count;
      break;
    }

    case "maxTeamMembers": {
      const count = await prisma.teamMember.count({
        where: { userId },
      });
      current = count;
      break;
    }

    default:
      throw new Error(`Unknown limit type: ${limitType}`);
  }

  return {
    allowed: current < limit,
    current,
    limit,
    tier,
  };
}
