// Plan ID Mapping Configuration
// Centralized mapping of subscription tiers to gateway-specific product/price IDs
// All plan IDs are read from environment variables
// Ensures pricing, billing cycle, and feature parity across gateways

import type { PaymentTier, PaymentGatewayType } from "./types";

/**
 * Plan mapping entry for a single tier
 */
export interface PlanMapping {
  /** Tier identifier */
  tier: PaymentTier;
  /** Display name */
  name: string;
  /** Monthly price in EUR */
  monthlyPrice: number;
  /** Yearly price in EUR (null if not available) */
  yearlyPrice: number | null;
  /** Paddle price ID (from PADDLE_STARTER_PRICE_ID etc.) */
  paddlePriceId: string;
  /** Creem product ID (from CREEM_STARTER_PRODUCT_ID etc.) */
  creemProductId: string;
}

/**
 * Complete plan mapping configuration
 * Maintained in a single location for consistency
 */
export const PLAN_MAP: PlanMapping[] = [
  {
    tier: "starter",
    name: "Starter",
    monthlyPrice: 39,
    yearlyPrice: null,
    paddlePriceId: process.env.PADDLE_STARTER_PRICE_ID ?? "",
    creemProductId: process.env.CREEM_STARTER_PRODUCT_ID ?? "",
  },
  {
    tier: "professional",
    name: "Professional",
    monthlyPrice: 89,
    yearlyPrice: null,
    paddlePriceId: process.env.PADDLE_PROFESSIONAL_PRICE_ID ?? "",
    creemProductId: process.env.CREEM_PROFESSIONAL_PRODUCT_ID ?? "",
  },
  {
    tier: "business",
    name: "Business",
    monthlyPrice: 159,
    yearlyPrice: null,
    paddlePriceId: process.env.PADDLE_BUSINESS_PRICE_ID ?? "",
    creemProductId: process.env.CREEM_BUSINESS_PRODUCT_ID ?? "",
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    monthlyPrice: 249,
    yearlyPrice: null,
    paddlePriceId: process.env.PADDLE_ENTERPRISE_PRICE_ID ?? "",
    creemProductId: process.env.CREEM_ENTERPRISE_PRODUCT_ID ?? "",
  },
];

/**
 * Get the gateway-specific plan/price ID for a given tier
 * @param tier - Subscription tier
 * @param gateway - Payment gateway type
 * @returns The plan/price ID string, or empty string if not configured
 */
export function getPlanId(
  tier: PaymentTier,
  gateway: PaymentGatewayType
): string {
  const plan = PLAN_MAP.find((p) => p.tier === tier);
  if (!plan) return "";

  switch (gateway) {
    case "paddle":
      return plan.paddlePriceId;
    case "creem":
      return plan.creemProductId;
    default:
      return "";
  }
}

/**
 * Get the full plan mapping for a given tier
 * @param tier - Subscription tier
 * @returns Plan mapping entry or undefined
 */
export function getPlanMapping(tier: PaymentTier): PlanMapping | undefined {
  return PLAN_MAP.find((p) => p.tier === tier);
}
